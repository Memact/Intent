import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { predictIntent } from '../src/engine.mjs';
import { normalizeInput, clampConfidence, confidenceLevel, createSafetyObject, createLowSignalIntent, detectInputSchema, INTENT_SCHEMA_VERSION } from '../src/schema.mjs';
import { findSensitiveSignals, SENSITIVE_KEYWORDS } from '../src/intent-rules.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const samplesDir = resolve(__dirname, '..', 'samples');

function loadSample(name) {
  return JSON.parse(readFileSync(resolve(samplesDir, name), 'utf-8'));
}

describe('Memact Intent Engine', () => {

  it('predicts dev_integration from dev sample', () => {
    const input = loadSample('dev-integration-activity.json');
    const result = predictIntent(input);
    const ids = result.predicted_intents.map(i => i.id);
    assert.ok(ids.includes('intent:dev_integration'), `Expected intent:dev_integration, got ${ids}`);
  });

  it('predicts permission_review from permission review sample', () => {
    const input = loadSample('permission-review-activity.json');
    const result = predictIntent(input);
    const ids = result.predicted_intents.map(i => i.id);
    assert.ok(ids.includes('intent:permission_review'), `Expected intent:permission_review, got ${ids}`);
  });

  it('predicts shopping_comparison from shopping sample', () => {
    const input = loadSample('shopping-comparison-activity.json');
    const result = predictIntent(input);
    const ids = result.predicted_intents.map(i => i.id);
    assert.ok(ids.includes('intent:shopping_comparison'), `Expected intent:shopping_comparison, got ${ids}`);
  });

  it('predicts research_learning from research sample', () => {
    const input = loadSample('research-learning-activity.json');
    const result = predictIntent(input);
    const ids = result.predicted_intents.map(i => i.id);
    assert.ok(ids.includes('intent:research_learning'), `Expected intent:research_learning, got ${ids}`);
  });

  it('returns low_signal for low-signal input', () => {
    const input = loadSample('low-signal-activity.json');
    const result = predictIntent(input);
    const ids = result.predicted_intents.map(i => i.id);
    assert.ok(ids.includes('intent:low_signal'), `Expected intent:low_signal, got ${ids}`);
  });

  it('never outputs confidence > 0.95', () => {
    const input = loadSample('dev-integration-activity.json');
    const result = predictIntent(input);
    for (const intent of result.predicted_intents) {
      assert.ok(intent.confidence <= 0.95, `Confidence ${intent.confidence} exceeds 0.95 for ${intent.id}`);
    }
  });

  it('output always includes safety object', () => {
    const input = loadSample('dev-integration-activity.json');
    const result = predictIntent(input);
    assert.ok(result.safety, 'Missing safety object');
    assert.equal(result.safety.user_confirmation_required, true);
    assert.equal(result.safety.raw_capture_exposed, false);
    assert.equal(result.safety.sensitive_inference_blocked, true);
  });

  it('sensitive signals are skipped, not inferred', () => {
    const activities = normalizeInput({
      activities: [
        { id: 's1', label: 'Read about depression treatment', type: 'page_visit', category: 'health' }
      ]
    });
    const signals = findSensitiveSignals(activities);
    assert.ok(signals.length > 0, 'Expected sensitive signals to be detected');
    assert.equal(signals[0].type, 'sensitive_signal_skipped');
  });

  it('intent predictions include evidence items', () => {
    const input = loadSample('dev-integration-activity.json');
    const result = predictIntent(input);
    for (const intent of result.predicted_intents) {
      if (intent.id === 'intent:low_signal') continue;
      assert.ok(intent.evidence.length > 0, `Expected evidence for ${intent.id}`);
    }
  });

  it('intent predictions include alternative intents', () => {
    const input = loadSample('dev-integration-activity.json');
    const result = predictIntent(input);
    for (const intent of result.predicted_intents) {
      if (intent.id === 'intent:low_signal') continue;
      assert.ok(intent.alternative_intents.length > 0, `Expected alternatives for ${intent.id}`);
    }
  });

  it('predicted intents are sorted by confidence descending', () => {
    const input = loadSample('dev-integration-activity.json');
    const result = predictIntent(input);
    for (let i = 1; i < result.predicted_intents.length; i++) {
      assert.ok(
        result.predicted_intents[i - 1].confidence >= result.predicted_intents[i].confidence,
        'Intents not sorted by confidence descending'
      );
    }
  });

  it('confidenceLevel returns correct levels', () => {
    assert.equal(confidenceLevel(0.80), 'high');
    assert.equal(confidenceLevel(0.60), 'medium');
    assert.equal(confidenceLevel(0.30), 'low');
    assert.equal(confidenceLevel(0.10), 'weak');
    assert.equal(confidenceLevel(0.75), 'high');
    assert.equal(confidenceLevel(0.50), 'medium');
    assert.equal(confidenceLevel(0.25), 'low');
  });

  it('clampConfidence never exceeds 0.95', () => {
    assert.equal(clampConfidence(1.5), 0.95);
    assert.equal(clampConfidence(-1), 0);
    assert.equal(clampConfidence(0.5), 0.5);
  });

  it('detectInputSchema identifies input shapes', () => {
    assert.equal(detectInputSchema({ system: 'capture', events: [], activities: [] }), 'memact.capture.v0');
    assert.equal(detectInputSchema({ schema_version: 'memact.inference.v0', records: [] }), 'memact.inference.v0');
    assert.equal(detectInputSchema({ activities: [] }), 'memact.activity_set');
    assert.equal(detectInputSchema(null), 'unknown');
  });

  it('normalizeInput handles array input', () => {
    const result = normalizeInput([{ id: 'a1', label: 'Test', type: 'test' }]);
    assert.equal(result.length, 1);
    assert.equal(result[0].label, 'Test');
  });

  it('normalizeInput handles null gracefully', () => {
    const result = normalizeInput(null);
    assert.deepEqual(result, []);
  });

});
