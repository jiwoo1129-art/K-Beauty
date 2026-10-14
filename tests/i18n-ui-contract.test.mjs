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

test('write workflow reads locale without keying or remounting its root', () => {
  const writing = source('src/writer/WritingWorkspace.jsx');
  assert.match(writing, /useLanguage\(\)/);
  assert.doesNotMatch(writing, /key=\{language\}/);
});

test('write workflow resolves controls and statuses from the dictionary', () => {
  for (const file of ['WritingWorkspace.jsx', 'ProductChoiceField.jsx', 'ListingDraft.jsx']) {
    const contents = source(`src/writer/${file}`);
    assert.match(contents, /useLanguage\(\)/, file);
    assert.doesNotMatch(contents, /제품을 알려주세요|선택하세요|입력 대기|검증 통과|TXT 다운로드/, file);
  }
});
