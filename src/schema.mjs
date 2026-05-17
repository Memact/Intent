export const INTENT_SCHEMA_VERSION = 'memact.intent.v0';

export function confidenceLevel(confidence) {
  if (confidence >= 0.75) return 'high';
  if (confidence >= 0.50) return 'medium';
  if (confidence >= 0.25) return 'low';
  return 'weak';
}

export function clampConfidence(value) {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 0.95);
}

export function createSafetyObject() {
  return {
    user_confirmation_required: true,
    raw_capture_exposed: false,
    sensitive_inference_blocked: true
  };
}

function extractDomain(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function gatherText(item) {
  if (!item || typeof item !== 'object') return '';
  const candidates = [
    item.label, item.title, item.name,
    item.text, item.content_text, item.full_text, item.display_full_text,
    item.source_label,
    item.type, item.category,
    item.evidence?.title,
    item.evidence?.text_excerpt
  ];
  if (Array.isArray(item.canonical_themes)) {
    candidates.push(...item.canonical_themes);
  }
  return candidates.filter(c => c && typeof c === 'string').join(' ').trim();
}

function normalizeActivity(item) {
  if (!item || typeof item !== 'object') {
    return { id: '', label: '', type: '', category: '', timestamp: '', url: '', domain: '', text: '', source: {} };
  }
  const url = item.url || item.source_url || '';
  return {
    id: item.id || item.activity_id || '',
    label: item.label || item.title || item.name || '',
    type: item.type || item.activity_type || '',
    category: item.category || item.activity_category || '',
    timestamp: item.timestamp || item.created_at || item.recorded_at || '',
    url: url,
    domain: extractDomain(url),
    text: gatherText(item),
    source: item.source || {}
  };
}

function normalizeInferenceRecord(item) {
  if (!item || typeof item !== 'object') {
    return { id: '', label: '', type: '', category: '', timestamp: '', url: '', domain: '', text: '', source: {} };
  }
  const url = item.evidence?.url || '';
  const themes = Array.isArray(item.canonical_themes) ? item.canonical_themes : [];
  const textParts = [item.source_label, ...themes, item.evidence?.title, item.evidence?.text_excerpt].filter(Boolean);
  return {
    id: item.id || '',
    label: item.source_label || item.label || '',
    type: '',
    category: '',
    timestamp: '',
    url: url,
    domain: extractDomain(url),
    text: textParts.join(' ').trim(),
    source: { ...item.evidence, ...item.source }
  };
}

export function normalizeInput(input) {
  if (!input || typeof input !== 'object') return [];

  if (Array.isArray(input)) {
    return input.map(normalizeActivity).filter(a => a.label || a.id);
  }

  if (input.system === 'capture') {
    const results = [];
    if (Array.isArray(input.events)) results.push(...input.events.map(normalizeActivity));
    if (Array.isArray(input.sessions)) results.push(...input.sessions.map(normalizeActivity));
    if (Array.isArray(input.activities)) results.push(...input.activities.map(normalizeActivity));
    if (Array.isArray(input.content_units)) results.push(...input.content_units.map(normalizeActivity));
    if (Array.isArray(input.graph_packets)) results.push(...input.graph_packets.map(normalizeActivity));
    return results.filter(a => a.label || a.id);
  }

  if (Array.isArray(input.records)) {
    return input.records.map(normalizeInferenceRecord).filter(a => a.label || a.id);
  }

  if (Array.isArray(input.activities)) {
    return input.activities.map(normalizeActivity).filter(a => a.label || a.id);
  }

  return [];
}

export function createLowSignalIntent(reason) {
  return {
    id: 'intent:low_signal',
    label: 'Not enough evidence to predict intent clearly',
    category: 'unknown',
    confidence: 0.15,
    confidence_level: 'weak',
    confidence_basis: {
      matched_rules: 0,
      evidence_strength: 0,
      sequence_strength: 0,
      recency_strength: 0
    },
    evidence: [],
    alternative_intents: [],
    allowed_actions: ['Ask user to clarify', 'Collect more approved evidence'],
    blocked_actions: ['Guess confidently', 'Act automatically', 'Expose raw data'],
    notes: [
      'Intent is a hypothesis, not a fact.',
      'User confirmation is recommended before acting.',
      reason || 'No intent rules matched with sufficient confidence.'
    ]
  };
}

export function detectInputSchema(input) {
  if (!input || typeof input !== 'object') return 'unknown';
  if (Array.isArray(input)) return 'array';
  if (input.system === 'capture') return 'memact.capture.v0';
  if (input.schema_version === 'memact.inference.v0') return 'memact.inference.v0';
  if (Array.isArray(input.activities)) return 'memact.activity_set';
  if (Array.isArray(input.records)) return 'memact.inference_records';
  return 'unknown';
}
