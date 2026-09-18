import { useEffect, useState } from 'react';
import Hero from './Hero.jsx';
import StudioWorkspace from './StudioWorkspace.jsx';
import ThemeToggle from './ThemeToggle.jsx';

export default function App() {
  const [mode, setMode] = useState('write');
  const [theme, setTheme] = useState(() => localStorage.getItem('comply.ai.theme') || 'light');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('comply.ai.theme', theme); }, [theme]);
  function selectMode(next) { setMode(next); window.requestAnimationFrame(() => document.querySelector('#studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }
  return (
    <div className="site-shell">
      <a className="skip-link" href="#studio">작업실로 바로가기</a>
      <header className="topbar"><a className="brand" href="#hero" aria-label="COMPLY.AI Beauty Listing Studio 홈"><span className="brand__mark"><i /></span><b>COMPLY<span>.</span>AI</b><small>BEAUTY LISTING STUDIO</small></a><nav aria-label="주요 메뉴"><a href="#hero">소개</a><a href="#studio">작업실</a><ThemeToggle theme={theme} onChange={setTheme} /><button type="button" onClick={() => selectMode('validate')}>무료 검토 시작 ↗</button></nav></header>
      <Hero onSelect={selectMode} />
      <StudioWorkspace initialMode={mode} />
      <footer className="footer"><b>COMPLY.AI</b><span>Beauty listing decisions, with evidence.</span><small>자동 결과는 정책 준수를 보증하지 않습니다.</small></footer>
    </div>
  );
}
