export const LANGUAGE_STORAGE_KEY = 'comply.ai.language';

export const translations = {
  ko: {
    'validation.itemsFound': '{count}개의 검토 항목을 찾았습니다.',
  },
  en: {
    'validation.itemsFound': '{count} review items found.',
  },
};

export function normalizeLanguage(value) {
  return value === 'en' ? 'en' : 'ko';
}

export function readStoredLanguage(storage) {
  try {
    return normalizeLanguage(storage?.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return 'ko';
  }
}

export function writeStoredLanguage(storage, language) {
  const normalized = normalizeLanguage(language);
  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, normalized);
  } catch {
    // Keep the selected language in React state when browser storage is unavailable.
  }
  return normalized;
}

export function translate(language, key, values = {}) {
  const template = translations[normalizeLanguage(language)][key];
  if (template === undefined) throw new Error(`Missing translation: ${key}`);
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}
