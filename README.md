# Memact Intent

Permissioned intent prediction from approved digital activity.

```text
Understand what users are trying to do.
```

## Overview

Memact Intent is a deterministic, rule-based engine for turning approved digital
activity into intent hypotheses.

Each prediction carries the evidence behind it: matched rules, supporting
activity, alternative intents, safe next actions, and blocked actions. Apps get
a narrow intent signal instead of raw private data.

Intent predictions are hypotheses, not facts. They are meant to guide
user-confirmed actions, not replace user choice.

## How it fits into Memact

```text
Website manages -> Access gates -> Capture records -> Inference understands -> Schema groups -> Intent predicts -> Memory stores -> Apps consume
```

Access checks app permission, consent, scopes, and categories. Capture records
approved evidence locally. Inference turns that evidence into semantic records.
Schema groups repeated patterns. Intent predicts what the user is likely trying
to do from recent semantic evidence, schema packets, recent approved activity,
and optional memory context. Memory stores the final intent result.

Intent can consume Inference records, Schema packets, recent approved activity,
optional Memory context, or simple activity arrays. Sensitive activity is
skipped before scoring.

## What This Repo Owns

- `memact.intent.v0` intent hypotheses.
- Evidence, confidence, alternatives, allowed actions, and blocked actions.
- Sensitive-signal skipping before scoring.
- Deterministic rule-based v0 prediction.

## What This Repo Does Not Own

- Browser/page capture.
- Semantic evidence extraction.
- Schema formation.
- Durable memory writes.
- Permission or consent verification.

## Install

```bash
cd Intent
npm install
```

No external dependencies required. Uses only Node.js 20+ built-in modules.

## Run samples

```bash
# Human-readable report
npm run sample

# JSON output
npm run intent -- --input samples/dev-integration-activity.json --format json

# Permission review sample
npm run intent -- --input samples/permission-review-activity.json --format report

# Shopping comparison
npm run intent -- --input samples/shopping-comparison-activity.json --format json

# Research/learning
npm run intent -- --input samples/research-learning-activity.json --format report

# Low-signal (generic homepage visits, short dwell, no meaningful text)
npm run intent -- --input samples/low-signal-activity.json --format report

# Run tests
npm run check
```

## Output schema

```json
{
  "schema_version": "memact.intent.v0",
  "generated_at": "2026-05-17T12:00:00.000Z",
  "source": {
    "activity_count": 6,
    "approved_activity_count": 5,
    "skipped_sensitive_activity_count": 1,
    "evidence_count": 5,
    "input_schema": "memact.activity_set"
  },
  "predicted_intents": [
    {
      "id": "intent:dev_integration",
      "label": "User is likely integrating Memact into an app",
      "category": "dev:code",
      "confidence": 0.78,
      "confidence_level": "high",
      "confidence_basis": {
        "matched_rules": 0.36,
        "evidence_strength": 0.22,
        "sequence_strength": 0.12,
        "recency_strength": 0.08
      },
      "evidence": [
        {
          "type": "activity",
          "label": "Created API key",
          "source_id": "act_api_key",
          "timestamp": "2026-05-17T10:00:00.000Z",
          "weight": 0.22,
          "reason": "type: api_key_created; keyword: api"
        }
      ],
      "alternative_intents": [
        { "id": "intent:dashboard_testing", "label": "Testing dashboard UX", "confidence": 0.42 }
      ],
      "allowed_actions": [
        "Show API verification command",
        "Offer integration checklist"
      ],
      "blocked_actions": [
        "Auto-enable permissions",
        "Expose raw graph"
      ],
      "notes": [
        "Intent is a hypothesis, not a fact.",
        "User confirmation is recommended before acting."
      ]
    }
  ],
  "unresolved_signals": [],
  "safety": {
    "user_confirmation_required": true,
    "raw_capture_exposed": false,
    "sensitive_inference_blocked": true
  }
}
```

## Safety rules

- Intent predictions are always hypotheses, never facts.
- Confidence is capped at 0.95.
- Every prediction includes alternative intents.
- Sensitive activity is detected, listed in `unresolved_signals`, and excluded from rule matching and scoring.
- User confirmation is required before acting on any prediction.
- Raw captures are never exposed in output.
- Blocked actions list what an app must not do, even at high confidence.

## Design choices

The first version uses deterministic rules because intent infrastructure needs
clear evidence trails.

- **Auditability** - every prediction traces back to rules and evidence.
- **Privacy** - scoring runs locally without sending activity to external APIs.
- **Predictability** - the same input can produce the same output when a fixed `now` value is provided.
- **Small surface area** - the engine stays easy to review, test, and extend.

Optional model-based scoring can be added later as a secondary signal. The core
engine should stay auditable.

## Future extension points

- Additional intent rules via plugins or configuration.
- Optional model-based scoring as a secondary signal.
- Time-window analysis for session-level intent.
- Cross-session pattern detection.
- User feedback loop for confidence calibration.
- Reading prior Memory context before prediction while leaving durable writes to Memory.

## Project structure

```text
Intent/
|-- README.md
|-- package.json
|-- src/
|   |-- cli.mjs          # Command-line interface
|   |-- engine.mjs       # Core prediction engine
|   |-- intent-rules.mjs # Intent rules and sensitive signal detection
|   |-- schema.mjs       # Data normalization, safety, confidence utilities
|   `-- format.mjs       # Human-readable report formatter
|-- samples/             # Example activity inputs
`-- test/
    `-- intent.test.mjs  # Test suite (Node.js built-in test runner)
```
