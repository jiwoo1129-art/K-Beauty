import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

test('copy project preserves the product experience and independent build', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts.build, 'vite build');
  assert.equal(pkg.scripts.test, 'node --test --test-isolation=none tests/*.test.mjs');
  const desktop = await readFile(new URL('../src/DesktopExperience.jsx', import.meta.url), 'utf8');
  assert.match(desktop, /comply-serum-white\.glb/);
  const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');
  assert.match(viteConfig, /@vitejs\/plugin-react/);
  assert.match(viteConfig, /plugins:\s*\[react\(\)\]/);
  const ignore = await readFile(new URL('../.gitignore', import.meta.url), 'utf8');
  assert.match(ignore, /node_modules/);
  assert.match(ignore, /dist/);
  assert.ok((await stat(new URL('../public/assets/comply-serum-white.glb', import.meta.url))).size > 1_000_000);
});
