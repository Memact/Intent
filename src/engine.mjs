import { normalizeInput, clampConfidence, confidenceLevel, createSafetyObject, createLowSignalIntent, detectInputSchema, INTENT_SCHEMA_VERSION } from './schema.mjs';
import { INTENT_RULES, findSensitiveSignals } from './intent-rules.mjs';

function matchesSequence(seq, types) {
  let pos = 0;
  for (const type of seq) {
    const idx = types.indexOf(type, pos);
    if (idx === -1) return false;
    pos = idx + 1;
  }
  return true;
}

function computeEvidenceWeight(reasons) {
  let weight = 0.05;
  if (reasons.some(r => r.startsWith('type'))) weight += 0.07;
  if (reasons.some(r => r.startsWith('keyword'))) weight += 0.05;
  if (reasons.some(r => r.startsWith('url'))) weight += 0.03;
  if (reasons.some(r => r.startsWith('domain'))) weight += 0.02;
  if (reasons.some(r => r.startsWith('category'))) weight += 0.03;
  return Math.round(Math.min(weight, 0.22) * 100) / 100;
}

function matchRule(rule, activities) {
  const matches = [];
  const seenKeys = new Set();
  const matchedKeywords = new Set();

  for (const activity of activities) {
    const text = [activity.label, activity.text, activity.type, activity.category].filter(Boolean).join(' ').toLowerCase();
    const url = (activity.url || '').toLowerCase();
    const domain = (activity.domain || '').toLowerCase();
    const reasons = [];

    for (const keyword of (rule.signals.keywords || [])) {
      if (!matchedKeywords.has(keyword) && text.includes(keyword.toLowerCase())) {
        matchedKeywords.add(keyword);
        reasons.push(`keyword: ${keyword}`);
      }
    }

    if (rule.signals.typeMatches && activity.type && rule.signals.typeMatches.includes(activity.type)) {
      reasons.push(`type: ${activity.type}`);
    }

    if (rule.signals.categoryMatches && activity.category && rule.signals.categoryMatches.includes(activity.category)) {
      reasons.push(`category: ${activity.category}`);
    }

    for (const pattern of (rule.signals.urlPatterns || [])) {
      if (url.includes(pattern.toLowerCase())) {
        reasons.push(`url: ${pattern}`);
      }
    }

    if (rule.signals.domainMatches && domain && rule.signals.domainMatches.includes(domain)) {
      reasons.push(`domain: ${domain}`);
    }

    if (reasons.length > 0) {
      const key = activity.id || `${activity.label}_${matches.length}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        matches.push({ activity, reasons, weight: computeEvidenceWeight(reasons) });
      }
    }
  }

  return { matches, matchedKeywords };
}

function resolveNow(options = {}) {
  if (!options.now) return Date.now();
  const time = new Date(options.now).getTime();
  return Number.isNaN(time) ? Date.now() : time;
}

function calculateScore(rule, activities, matches, matchedKeywords, options = {}) {
  const keywordCount = matchedKeywords.size;
  const totalKeywords = rule.signals.keywords?.length || 1;
  const keywordCoverage = keywordCount / totalKeywords;

  const matchedTypes = new Set(matches.filter(m => m.reasons.some(r => r.startsWith('type'))).map(m => m.activity.type));
  const totalTypes = rule.signals.typeMatches?.length || 1;
  const typeCoverage = Math.min(matchedTypes.size / Math.min(totalTypes, 6), 1);

  const matched_rules = Math.min(0.20 * keywordCoverage + 0.15 * typeCoverage, 0.35);

  let totalQuality = 0;
  for (const { activity } of matches) {
    let q = 0;
    if (activity.label) q += 0.3;
    if (activity.text) q += 0.3;
    if (activity.url) q += 0.2;
    if (activity.timestamp) q += 0.2;
    totalQuality += q;
  }
  const avgQuality = matches.length > 0 ? totalQuality / matches.length : 0;
  const evidence_strength = 0.25 * avgQuality;

  const matchedSequenceTypes = matches.map(m => m.activity.type).filter(Boolean);
  let seqMatches = 0;
  for (const seq of (rule.sequences || [])) {
    if (matchesSequence(seq, matchedSequenceTypes)) {
      seqMatches++;
    }
  }
  const sequence_strength = 0.15 * (seqMatches / Math.max(rule.sequences?.length || 1, 1));

  const now = resolveNow(options);
  const timestamps = matches
    .map(m => m.activity.timestamp)
    .filter(Boolean)
    .map(t => new Date(t).getTime())
    .filter(t => !isNaN(t));
  let recency_strength = 0;
  if (timestamps.length > 0) {
    const avgAge = timestamps.reduce((sum, t) => sum + (now - t) / (24 * 60 * 60 * 1000), 0) / timestamps.length;
    recency_strength = 0.10 * Math.max(0, 1 - avgAge / 7);
  }

  const categories = new Set(matches.map(m => m.activity.category).filter(Boolean));
  const ambiguity_penalty = categories.size > 2 ? 0.03 * (categories.size - 2) : 0;

  const confidence = clampConfidence(
    rule.baseConfidence + matched_rules + evidence_strength + sequence_strength + recency_strength - ambiguity_penalty
  );

  return {
    confidence,
    confidence_basis: {
      matched_rules: Math.round(matched_rules * 100) / 100,
      evidence_strength: Math.round(evidence_strength * 100) / 100,
      sequence_strength: Math.round(sequence_strength * 100) / 100,
      recency_strength: Math.round(recency_strength * 100) / 100
    }
  };
}

function buildIntentResult(rule, score, matches) {
  const evidence = matches.map(m => ({
    type: 'activity',
    label: m.activity.label || m.activity.id,
    source_id: m.activity.id,
    timestamp: m.activity.timestamp || '',
    weight: m.weight,
    reason: m.reasons.join('; ')
  }));

  const roundedConfidence = Math.round(score.confidence * 100) / 100;

  return {
    id: rule.id,
    label: rule.label,
    category: rule.category,
    confidence: roundedConfidence,
    confidence_level: confidenceLevel(roundedConfidence),
    confidence_basis: score.confidence_basis,
    evidence,
    alternative_intents: (rule.alternativeIntents || []).map(a => ({ ...a })),
    allowed_actions: [...(rule.allowedActions || [])],
    blocked_actions: [...(rule.blockedActions || [])],
    notes: [
      'Intent is a hypothesis, not a fact.',
      'User confirmation is recommended before acting.'
    ]
  };
}

function activityKey(activity, index) {
  return activity.id || `activity:${index}`;
}

function removeSensitiveActivities(activities, sensitiveSignals) {
  const sensitiveSourceIds = new Set(sensitiveSignals.map(signal => signal.source_id).filter(Boolean));
  return activities.filter((activity, index) => !sensitiveSourceIds.has(activityKey(activity, index)));
}

export function normalizeActivities(input) {
  return normalizeInput(input);
}

export function scoreRule(rule, activities, options = {}) {
  const safeActivities = removeSensitiveActivities(activities, findSensitiveSignals(activities));
  const { matches, matchedKeywords } = matchRule(rule, safeActivities);
  if (matches.length === 0) return null;
  return calculateScore(rule, safeActivities, matches, matchedKeywords, options);
}

export function predictIntent(input, options = {}) {
  const activities = normalizeActivities(input);
  const inputSchema = detectInputSchema(input);
  const sensitiveSignals = findSensitiveSignals(activities);
  const safeActivities = removeSensitiveActivities(activities, sensitiveSignals);

  const scoredIntents = [];

  for (const rule of INTENT_RULES) {
    const { matches, matchedKeywords } = matchRule(rule, safeActivities);
    if (matches.length === 0) continue;

    const score = calculateScore(rule, safeActivities, matches, matchedKeywords, options);
    const intent = buildIntentResult(rule, score, matches);

    scoredIntents.push(intent);
  }

  scoredIntents.sort((a, b) => b.confidence - a.confidence);

  const hasUsableIntent = scoredIntents.length > 0 && scoredIntents[0].confidence >= 0.25;
  const predictedIntents = hasUsableIntent
    ? scoredIntents
    : [createLowSignalIntent(scoredIntents.length === 0
      ? 'No intent rules matched any approved activity.'
      : 'Matched rules did not reach sufficient confidence threshold.')];

  const result = {
    schema_version: INTENT_SCHEMA_VERSION,
    generated_at: options.generatedAt || new Date(resolveNow(options)).toISOString(),
    source: {
      activity_count: activities.length,
      approved_activity_count: safeActivities.length,
      skipped_sensitive_activity_count: activities.length - safeActivities.length,
      evidence_count: predictedIntents.reduce((sum, i) => sum + (i.evidence ? i.evidence.length : 0), 0),
      input_schema: inputSchema
    },
    predicted_intents: predictedIntents,
    unresolved_signals: sensitiveSignals,
    safety: createSafetyObject()
  };

  return result;
}
