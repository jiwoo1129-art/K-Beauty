import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('preserves white orange product and scanning experience', async () => {
  const hero = await readFile(new URL('../src/Hero.jsx', import.meta.url), 'utf8');
  const i18n = await readFile(new URL('../src/i18n.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(hero, /hero\.eyebrow/);
  assert.match(hero, /hero\.titleLine1/);
  assert.match(i18n, /BEAUTY LISTING STUDIO/);
  assert.match(i18n, /화장품 상세페이지/);
  assert.match(i18n, /감이 아니라 근거로/);
  assert.doesNotMatch(i18n, /아름다운 문장에/);
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
  const i18n = await readFile(new URL('../src/i18n.js', import.meta.url), 'utf8');
  assert.match(toggle, /aria-pressed/);
  assert.match(toggle, /theme\.light/);
  assert.match(toggle, /theme\.dark/);
  assert.match(i18n, /라이트 모드/);
  assert.match(i18n, /다크 모드/);
});

test('styles route workspaces with the existing visual system', async () => {
  const css = await readFile(new URL('../src/solution.css', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(css, /\.solution-sidebar/);
  assert.match(css, /\.writer-desk/);
  assert.match(css, /\.workspace-panel/);
  assert.match(css, /var\(--orange\)/);
  assert.match(css, /\.listing-actions/);
  assert.match(css, /@media\s*\(max-width:/);
  assert.match(app, /className="solution-nav"/);
  assert.match(app, /<SolutionPage solution=\{route\}/);
});
