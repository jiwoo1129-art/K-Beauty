import { useLanguage } from './LanguageContext.jsx';

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="language-toggle" role="group" aria-label={t('language.label')}>
      <button type="button" aria-pressed={language === 'ko'} onClick={() => setLanguage('ko')}>한국어</button>
      <span aria-hidden="true">/</span>
      <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
    </div>
  );
}
