import { useLanguage } from './LanguageContext.jsx';

export default function ThemeToggle({ theme, onChange }) {
  const { t } = useLanguage();
  const dark = theme === 'dark';
  return (
    <button className="theme-toggle" type="button" aria-pressed={dark} onClick={() => onChange(dark ? 'light' : 'dark')}>
      <span aria-hidden="true">{dark ? '☀' : '◐'}</span>
      {t(dark ? 'theme.light' : 'theme.dark')}
    </button>
  );
}
