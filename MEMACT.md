# Memact description

**Permissioned intent infrastructure for apps.**

```text
Understand what users are trying to do.
```

Memact is infrastructure that helps apps predict user intent from approved digital activity, without giving them raw access to a user's private data.

This repo is the Intent layer. It turns approved activity into evidence-backed intent hypotheses with confidence, alternatives, allowed actions, and blocked actions.

## System position

```text
Access -> Capture -> Inference -> Schema -> Memory -> Intent
```

Intent predicts what the user is likely trying to do from approved evidence. It does not expose raw capture, claim certainty, infer sensitive traits, or act automatically for an app.

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
