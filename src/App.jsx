import { useEffect, useState } from 'react';
import Hero from './Hero.jsx';
import SolutionPage from './SolutionPage.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { navigateTo, normalizeRoute } from './routeState.js';

export default function App() {
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
      <a className="skip-link" href={route === 'home' ? '#hero' : '#studio'}>{route === 'home' ? '소개로 바로가기' : '작업실로 바로가기'}</a>
      {route === 'home' && <header className="topbar"><a className="brand" href="/" onClick={(event) => follow(event, '/')} aria-label="COMPLY.AI Beauty Listing Studio 홈"><span className="brand__mark"><i /></span><b>COMPLY<span>.</span>AI</b><small>BEAUTY LISTING STUDIO</small></a><nav className="solution-nav" aria-label="주요 메뉴"><a href="/" onClick={(event) => follow(event, '/')}>소개</a><a href="/write" onClick={(event) => follow(event, '/write')}>Listing 작성</a><a href="/validate" onClick={(event) => follow(event, '/validate')}>Listing 검증</a><ThemeToggle theme={theme} onChange={setTheme} /><button type="button" onClick={() => go('/validate')}>무료 검토 시작 ↗</button></nav></header>}
      {route === 'home' && <Hero onSelect={(mode) => go(`/${mode}`)} />}
      {route !== 'home' && <SolutionPage solution={route} theme={theme} onThemeChange={setTheme} onNavigate={go} />}
      {route === 'home' && <footer className="footer"><b>COMPLY.AI</b><span>Beauty listing decisions, with evidence.</span><small>자동 결과는 정책 준수를 보증하지 않습니다.</small></footer>}
    </div>
  );
}
