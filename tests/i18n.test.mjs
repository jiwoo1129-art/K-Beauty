import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  readStoredLanguage,
  translate,
  translations,
  writeStoredLanguage,
} from '../src/i18n.js';

test('defaults missing and invalid language values to Korean', () => {
  assert.equal(normalizeLanguage(), 'ko');
  assert.equal(normalizeLanguage('fr'), 'ko');
  assert.equal(normalizeLanguage('ko'), 'ko');
  assert.equal(normalizeLanguage('en'), 'en');
});

test('Korean and English dictionaries expose identical keys', () => {
  assert.deepEqual(Object.keys(translations.ko).sort(), Object.keys(translations.en).sort());
});

test('stored language is restored and persisted safely', () => {
  const data = new Map([[LANGUAGE_STORAGE_KEY, 'en']]);
  const storage = {
    getItem: (key) => data.get(key),
    setItem: (key, value) => data.set(key, value),
  };
  assert.equal(readStoredLanguage(storage), 'en');
  assert.equal(writeStoredLanguage(storage, 'ko'), 'ko');
  assert.equal(data.get(LANGUAGE_STORAGE_KEY), 'ko');
});

test('storage failures fall back without interrupting the session', () => {
  const storage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  };
  assert.equal(readStoredLanguage(storage), 'ko');
  assert.equal(writeStoredLanguage(storage, 'en'), 'en');
});

test('translations interpolate named values', () => {
  assert.equal(translate('en', 'validation.itemsFound', { count: 3 }), '3 review items found.');
  assert.equal(translate('ko', 'validation.itemsFound', { count: 3 }), '3개의 검토 항목을 찾았습니다.');
});
