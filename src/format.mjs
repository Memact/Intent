export function formatIntentReport(result) {
  const lines = [];
  lines.push('Memact Intent Report');
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(`Input activities: ${result.source.activity_count}`);
  lines.push(`Predicted intents: ${result.predicted_intents.length}`);
  lines.push('');

  for (let i = 0; i < result.predicted_intents.length; i++) {
    const intent = result.predicted_intents[i];
    lines.push(`${i + 1}. ${intent.label}`);
    lines.push(`   Confidence: ${intent.confidence} ${intent.confidence_level}`);

    if (intent.evidence && intent.evidence.length > 0) {
      lines.push('   Evidence:');
      for (const ev of intent.evidence) {
        lines.push(`   - ${ev.label}`);
      }
    }

    if (intent.alternative_intents && intent.alternative_intents.length > 0) {
      lines.push('   Alternatives:');
      for (const alt of intent.alternative_intents) {
        lines.push(`   - ${alt.label}`);
      }
    }

    if (intent.allowed_actions && intent.allowed_actions.length > 0) {
      lines.push('   Safe next actions:');
      for (const action of intent.allowed_actions) {
        lines.push(`   - ${action}`);
      }
    }

    if (intent.blocked_actions && intent.blocked_actions.length > 0) {
      lines.push('   Blocked actions:');
      for (const action of intent.blocked_actions) {
        lines.push(`   - ${action}`);
      }
    }

    lines.push('');
  }

  if (result.unresolved_signals && result.unresolved_signals.length > 0) {
    lines.push('Unresolved signals:');
    for (const s of result.unresolved_signals) {
      lines.push(`- ${s.reason} (${s.keyword})`);
    }
    lines.push('');
  }

  lines.push('Safety:');
  lines.push(`- User confirmation required: ${result.safety.user_confirmation_required}`);
  lines.push(`- Raw capture exposed: ${result.safety.raw_capture_exposed}`);
  lines.push(`- Sensitive inference blocked: ${result.safety.sensitive_inference_blocked}`);

  return lines.join('\n');
}
