export default function ThemeToggle({ theme, onChange }) {
  const dark = theme === 'dark';
  return (
    <button className="theme-toggle" type="button" aria-pressed={dark} onClick={() => onChange(dark ? 'light' : 'dark')}>
      <span aria-hidden="true">{dark ? '☀' : '◐'}</span>
      {dark ? '라이트 모드' : '다크 모드'}
    </button>
  );
}
