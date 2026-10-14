import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('language controls are available on home and workflow pages', () => {
  assert.match(source('src/App.jsx'), /<LanguageToggle/);
  assert.match(source('src/SolutionPage.jsx'), /<LanguageToggle/);
});

test('application is wrapped once so locale changes do not remount workflows', () => {
  assert.match(source('src/main.jsx'), /<LanguageProvider>[\s\S]*<App \/>[\s\S]*<\/LanguageProvider>/);
});

test('landing and solution components resolve interface copy through the locale context', () => {
  for (const file of ['src/App.jsx', 'src/Hero.jsx', 'src/SolutionPage.jsx', 'src/ThemeToggle.jsx']) {
    assert.match(source(file), /useLanguage\(\)/, file);
  }
});
