import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Pages workflow builds with the repository base path on Node 24', async () => {
  const workflow = await readFile(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8');

  assert.match(workflow, /node-version:\s*24/);
  assert.match(workflow, /pnpm exec vite build --base=\/K-Beauty\//);
  assert.doesNotMatch(workflow, /pnpm build -- --base=/);
});
