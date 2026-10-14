import AgentWorkspace from './writer/AgentWorkspace.jsx';
import LanguageToggle from './LanguageToggle.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { useLanguage } from './LanguageContext.jsx';
import './solution.css';

const content = {
  write: { kicker: 'solution.writeKicker', title: 'solution.writeTitle', description: 'solution.writeDescription' },
  validate: { kicker: 'solution.validateKicker', title: 'solution.validateTitle', description: 'solution.validateDescription' },
};

export default function SolutionPage({ solution, theme, onThemeChange, onNavigate }) {
  const { t } = useLanguage();
  const page = content[solution];
  function link(event, route) { event.preventDefault(); onNavigate(route); }
  return <main className="solution-page" id="studio">
    <aside className="solution-sidebar">
      <a className="solution-brand" href="/" onClick={(event) => link(event, '/')}>COMPLY<span>.</span>AI</a>
      <p>{t('solution.workspaceLabel')}</p>
      <nav aria-label={t('solution.menuAria')}>
        <a href="/" onClick={(event) => link(event, '/')}>⌂ <span>{t('solution.home')}</span></a>
        <a href="/write" aria-current={solution === 'write' ? 'page' : undefined} onClick={(event) => link(event, '/write')}>✎ <span>{t('nav.write')}</span></a>
        <a href="/validate" aria-current={solution === 'validate' ? 'page' : undefined} onClick={(event) => link(event, '/validate')}>▣ <span>{t('nav.validate')}</span></a>
      </nav>
      <div className="solution-sidebar__note"><b>{t('solution.noteTitle')}</b><span>{t('solution.noteBody')}</span></div>
      <ThemeToggle theme={theme} onChange={onThemeChange} />
    </aside>
    <div className="solution-body">
      <div className="solution-crumb"><span>{t('solution.workspace')}</span><i>/</i><b>{t(solution === 'write' ? 'solution.writeCrumb' : 'solution.validateCrumb')}</b><div className="solution-crumb__actions"><LanguageToggle /><a href="/" onClick={(event) => link(event, '/')}>{t('solution.backHome')}</a></div></div>
      <div className="solution-content">
        <header className="solution-heading"><div><small>{t(page.kicker)}</small><span>Amazon US · Beauty</span></div><h1>{t(page.title)}</h1><p>{t(page.description)}</p></header>
        <AgentWorkspace solution={solution} />
      </div>
    </div>
  </main>;
}
