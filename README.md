# Memact Intent

Permissioned intent prediction from approved digital activity.

```text
Understand what users are trying to do.
```

## What it is

Memact Intent is a deterministic, rule-based engine that helps apps predict user intent from approved digital activity, without giving them raw access to a user's private data.

It is part of the Memact infrastructure. It consumes approved activity records from upstream layers and returns evidence-backed intent hypotheses that apps can use safely.

Intent predictions are hypotheses, not facts. Every prediction includes:

- which rules matched and why
- evidence items supporting the prediction
- alternative possible intents
- safe suggested actions
- blocked actions the app must not take

## What it is not

- Not an AI/ML model
- Not a ChatGPT wrapper
- Not an LLM-powered intent classifier
- Not a frontend application
- Not a recommendation engine
- Not a surveillance tool

## How it fits into Memact

```text
Access → Capture → Inference → Schema → Memory → Intent
```

Access decides what an app is allowed to ask for. Capture records approved evidence locally. Inference filters meaningful activity. Schema groups repeated patterns. Memory stores what survives. Intent predicts what the user is likely trying to do from approved evidence.

Intent can consume Capture events, Inference records, Schema packets, Memory-shaped activity, or simple activity arrays. It returns structured intent predictions without guessing user identity or sensitive traits.

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
- Confidence is capped at 0.95 — the engine never claims certainty.
- Every prediction includes alternative intents.
- Sensitive activity is detected, listed in `unresolved_signals`, and excluded from rule matching and scoring.
- User confirmation is required before acting on any prediction.
- Raw captures are never exposed in output.
- Blocked actions list what an app must not do, even at high confidence.

## Why rule-based instead of LLM-based

This engine starts deterministic and rule-based for several reasons:

1. **Auditability** — every prediction can be traced to specific rules and evidence. There is no black box.
2. **Privacy** — no data leaves the user's machine. No API calls. No prompt injection surface.
3. **Predictability** — the same input can produce the same output when a fixed `now` value is provided.
4. **Simplicity** — a small focused codebase that is easy to review, test, and extend.

LLM-based intent classification may be added later as an optional extension, but the core engine must always remain deterministic and auditable.

## Future extension points

- Additional intent rules via plugins or configuration
- Optional LLM-based scoring as a secondary signal
- Time-window analysis for session-level intent
- Cross-session pattern detection
- User feedback loop for confidence calibration

## Project structure

```text
Intent/
├── README.md
├── package.json
├── src/
│   ├── cli.mjs          # Command-line interface
│   ├── engine.mjs       # Core prediction engine
│   ├── intent-rules.mjs # Intent rules and sensitive signal detection
│   ├── schema.mjs       # Data normalization, safety, confidence utilities
│   └── format.mjs       # Human-readable report formatter
├── samples/             # Example activity inputs
└── test/
    └── intent.test.mjs  # Test suite (Node.js built-in test runner)
```
