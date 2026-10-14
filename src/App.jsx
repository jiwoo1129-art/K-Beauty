import { useEffect, useState } from 'react';
import Hero from './Hero.jsx';
import LanguageToggle from './LanguageToggle.jsx';
import SolutionPage from './SolutionPage.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useLanguage } from './LanguageContext.jsx';
import { navigateTo, normalizeRoute } from './routeState.js';

export default function App() {
  const { t } = useLanguage();
  const [route, setRoute] = useState(() => normalizeRoute(window.location.pathname));
  const [theme, setTheme] = useState(() => localStorage.getItem('comply.ai.theme') || 'light');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('comply.ai.theme', theme); }, [theme]);
  useEffect(() => {
    const update = () => { setRoute(normalizeRoute(window.location.pathname)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  function go(path) { navigateTo(path); }
  function follow(event, path) { event.preventDefault(); go(path); }
  return (
    <div className="site-shell">
      <a className="skip-link" href={route === 'home' ? '#hero' : '#studio'}>{t(route === 'home' ? 'app.skipHome' : 'app.skipStudio')}</a>
      {route === 'home' && <header className="topbar"><a className="brand" href="/" onClick={(event) => follow(event, '/')} aria-label={t('app.homeLabel')}><span className="brand__mark"><i /></span><b>COMPLY<span>.</span>AI</b><small>BEAUTY LISTING STUDIO</small></a><nav className="solution-nav" aria-label={t('app.mainMenu')}><a href="/" onClick={(event) => follow(event, '/')}>{t('nav.about')}</a><a href="/write" onClick={(event) => follow(event, '/write')}>{t('nav.write')}</a><a href="/validate" onClick={(event) => follow(event, '/validate')}>{t('nav.validate')}</a><LanguageToggle /><ThemeToggle theme={theme} onChange={setTheme} /><button type="button" onClick={() => go('/validate')}>{t('nav.freeReview')}</button></nav></header>}
      {route === 'home' && <Hero onSelect={(mode) => go(`/${mode}`)} />}
      {route !== 'home' && <SolutionPage solution={route} theme={theme} onThemeChange={setTheme} onNavigate={go} />}
      {route === 'home' && <footer className="footer"><b>COMPLY.AI</b><span>{t('footer.tagline')}</span><small>{t('footer.disclaimer')}</small></footer>}
    </div>
  );
}
