import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('pnpm lockfile importer covers every package dependency', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const lockfile = await readFile(new URL('../pnpm-lock.yaml', import.meta.url), 'utf8');
  const importer = lockfile.slice(0, lockfile.indexOf('\npackages:'));
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };

  for (const name of Object.keys(dependencies)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(importer, new RegExp(`\\n      '?${escaped}'?:\\r?\\n        specifier:`), `${name} is missing from the lockfile importer`);
  }
});
