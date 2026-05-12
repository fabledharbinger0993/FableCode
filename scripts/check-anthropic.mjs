/**
 * Verifies that ANTHROPIC_API_KEY is set and the Anthropic API is reachable.
 * Run with: node scripts/check-anthropic.mjs
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manually parse .env so this script has no runtime dependencies
const envPath = path.resolve(__dirname, '../.env');
try {
  const envFile = readFileSync(envPath, 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq < 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} catch {
  // .env not found — fall through to system env check
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY is not set. Add it to Scaffold/.env or export it in your shell.');
  process.exitCode = 1;
} else {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const models = (data.data ?? []).map((m) => m.id);
    console.log(`Anthropic API reachable. ${models.length} model(s) available:`);
    console.log(models.slice(0, 10).map((id) => `  - ${id}`).join('\n'));
  } catch (error) {
    console.error('Anthropic API is not reachable:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
