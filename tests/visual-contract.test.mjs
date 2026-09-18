import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('preserves white orange product and scanning experience', async () => {
  const hero = await readFile(new URL('../src/Hero.jsx', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(hero, /Beauty Listing Studio/i);
  assert.match(hero, /DesktopExperience/);
  assert.match(hero, /claim-scan/);
  assert.match(hero, /getBrowserExperienceMode/);
  assert.match(css, /--orange:\s*#ff9900/i);
  assert.match(css, /--surface:\s*#ffffff/i);
  assert.match(css, /@keyframes\s+claim-scan/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});

test('supports an accessible persisted theme toggle', async () => {
  const toggle = await readFile(new URL('../src/ThemeToggle.jsx', import.meta.url), 'utf8');
  assert.match(toggle, /aria-pressed/);
  assert.match(toggle, /라이트 모드|다크 모드/);
});
