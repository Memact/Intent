# Memact Intent

Evidence-backed user intent prediction from approved digital activity.

## What it is

Memact Intent is a deterministic, rule-based engine that turns meaningful digital activity into evidence-backed intent predictions. It is part of the [Memact](https://memact.com) infrastructure, sitting between the Inference layer (which produces meaningful activity records) and any application that needs to understand what a user is likely trying to do.

Intent predictions are evidence-backed hypotheses, not facts. Every prediction includes:
- Which rules matched and why
- Evidence items supporting the prediction
- Alternative possible intents
- Safe suggested actions and explicitly blocked actions

## What it is not

- Not an AI/ML model
- Not a ChatGPT wrapper
- Not an LLM-powered intent classifier
- Not a frontend application
- Not a recommendation engine
- Not a surveillance tool

## How it fits into Memact

```
Capture → Inference → Schema → Memory → Access → Intent (this)
```

Intent consumes records from upstream Memact layers (Capture events, Inference records, Schema packets) or simple activity arrays. It produces structured intent predictions that applications can use to offer helpful suggestions — without guessing user identity or sensitive traits.

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
          "reason": "API key creation is a strong integration signal."
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
- Sensitive keywords (religion, sexuality, medical, political, financial, mental health) are detected and skipped. The engine notes them in `unresolved_signals` and does not use them for prediction.
- User confirmation is required before acting on any prediction.
- Raw captures are never exposed in output.
- Blocked actions list what an app must not do, even at high confidence.

## Why rule-based instead of LLM-based

This engine starts deterministic and rule-based for several reasons:

1. **Auditability** — every prediction can be traced to specific rules and evidence. There is no black box.
2. **Privacy** — no data leaves the user's machine. No API calls. No prompt injection surface.
3. **Predictability** — the same input always produces the same output. No drift, no hallucinations.
4. **Simplicity** — a small focused codebase that is easy to review, test, and extend.

LLM-based intent classification may be added later as an optional extension, but the core engine must always remain deterministic and auditable.

## Future extension points

- Additional intent rules via plugins or configuration
- Optional LLM-based scoring as a secondary signal
- Time-window analysis for session-level intent
- Cross-session pattern detection
- User feedback loop for confidence calibration

## Project structure

```
Intent/
├── README.md
├── package.json
├── src/
│   ├── cli.mjs          # Command-line interface
│   ├── engine.mjs        # Core prediction engine
│   ├── intent-rules.mjs  # Intent rule definitions and sensitive keyword list
│   ├── schema.mjs        # Data normalization, safety, confidence utilities
│   └── format.mjs        # Human-readable report formatter
├── samples/              # Example activity inputs
└── test/
    └── intent.test.mjs   # Test suite (Node.js built-in test runner)
```
