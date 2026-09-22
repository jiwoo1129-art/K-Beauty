import AgentWorkspace from './writer/AgentWorkspace.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import './solution.css';

const content = {
  write: { kicker: 'LISTING STUDIO', title: '새 Listing 만들기', description: '제품 정보와 브랜드 톤을 바탕으로 정책에 맞는 Listing을 작성합니다.' },
  validate: { kicker: 'POLICY REVIEW', title: '기존 Listing 검사하기', description: '상세페이지 초안을 업로드하면 원문 안에서 정책 위반 위치와 근거를 표시합니다.' },
};

export default function SolutionPage({ solution, theme, onThemeChange, onNavigate }) {
  const page = content[solution];
  function link(event, route) { event.preventDefault(); onNavigate(route); }
  return <main className="solution-page" id="studio">
    <aside className="solution-sidebar">
      <a className="solution-brand" href="/" onClick={(event) => link(event, '/')}>COMPLY<span>.</span>AI</a>
      <p>K-BEAUTY WORKSPACE</p>
      <nav aria-label="작업 메뉴">
        <a href="/" onClick={(event) => link(event, '/')}>⌂ <span>워크스페이스 홈</span></a>
        <a href="/write" aria-current={solution === 'write' ? 'page' : undefined} onClick={(event) => link(event, '/write')}>✎ <span>Listing 작성</span></a>
        <a href="/validate" aria-current={solution === 'validate' ? 'page' : undefined} onClick={(event) => link(event, '/validate')}>▣ <span>Listing 검증</span></a>
      </nav>
      <div className="solution-sidebar__note"><b>확인된 정보에서 시작하세요.</b><span>제품의 실제 특성과 근거를 바탕으로 상세페이지를 작성합니다.</span></div>
      <ThemeToggle theme={theme} onChange={onThemeChange} />
    </aside>
    <div className="solution-body">
      <div className="solution-crumb"><span>워크스페이스</span><i>/</i><b>Listing {solution === 'write' ? '작성' : '검증'}</b><a href="/" onClick={(event) => link(event, '/')}>← 홈으로</a></div>
      <div className="solution-content">
        <header className="solution-heading"><div><small>{page.kicker}</small><span>Amazon US · Beauty</span></div><h1>{page.title}</h1><p>{page.description}</p></header>
        <AgentWorkspace solution={solution} />
      </div>
    </div>
  </main>;
}
