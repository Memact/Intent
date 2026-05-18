# Memact description

**Permissioned intent infrastructure for apps.**

```text
Understand what users are trying to do.
```

Memact is infrastructure that helps apps predict user intent from approved digital activity, without giving them raw access to a user's private data.

This repo is the Intent layer. It predicts what the user is probably trying to do from recent semantic evidence, schema packets, recent activity, and optional memory context.

## System position

```text
Website manages -> Access gates -> Capture records -> Inference understands -> Schema groups -> Intent predicts -> Memory stores -> Apps consume
```

Intent predicts what the user is likely trying to do from approved evidence. It does not expose raw capture, claim certainty, infer sensitive traits, write durable memory itself, or act automatically for an app. Memory stores the final intent result.

## What this repo owns

- `memact.intent.v0` intent hypotheses
- evidence, confidence, alternatives, allowed actions, and blocked actions
- sensitive-signal skipping before scoring
- deterministic rule-based v0 prediction

## What this repo does not own

- browser/page capture
- semantic evidence extraction
- schema formation
- durable memory writes
- permission or consent verification

## Copy rules

Use:

- "Permissioned intent infrastructure for apps."
- "Understand what users are trying to do."
- "approved digital activity"
- "intent predictions are hypotheses, not facts"
- "apps receive intent signals, not raw-data exports"

Avoid:

- generic AI wrapper language
- vague memory-plugin language
- raw-data export framing
- claims that apps get the whole memory graph
- claims that intent is fact or certainty
- open-source wording unless the repo license explicitly says so
