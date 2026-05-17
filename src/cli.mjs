import { readFileSync, existsSync } from 'node:fs';
import { predictIntent } from './engine.mjs';
import { formatIntentReport } from './format.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && i + 1 < args.length) {
      parsed.input = args[++i];
    } else if (args[i] === '--format' && i + 1 < args.length) {
      parsed.format = args[++i];
    }
  }
  return parsed;
}

function main() {
  const args = parseArgs();

  if (!args.input) {
    console.error('Usage: node src/cli.mjs --input <file> [--format json|report]');
    process.exit(1);
  }

  if (!existsSync(args.input)) {
    console.error(`Error: File not found: ${args.input}`);
    process.exit(1);
  }

  let input;
  try {
    const content = readFileSync(args.input, 'utf-8');
    input = JSON.parse(content);
  } catch (err) {
    console.error(`Error: Invalid JSON in ${args.input}: ${err.message}`);
    process.exit(1);
  }

  const format = args.format || 'json';
  const result = predictIntent(input);

  if (format === 'report') {
    console.log(formatIntentReport(result));
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
