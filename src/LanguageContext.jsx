import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { readStoredLanguage, translate, writeStoredLanguage } from './i18n.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => readStoredLanguage(window.localStorage));

  function setLanguage(nextLanguage) {
    setLanguageState(writeStoredLanguage(window.localStorage, nextLanguage));
  }

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (key, values) => translate(language, key, values),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
