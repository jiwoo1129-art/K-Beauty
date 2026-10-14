import { lazy, Suspense, useEffect, useState } from 'react';
import MobileBloom from './MobileBloom.jsx';
import { useLanguage } from './LanguageContext.jsx';
import { getBrowserExperienceMode } from './experienceMode.js';

const DesktopExperience = lazy(() => import('./DesktopExperience.jsx'));

function ScanCard() {
  const { t } = useLanguage();
  return (
    <article className="scan-card" aria-label={t('hero.scanAria')}>
      <header><span>{t('hero.liveReview')}</span><i>{t('hero.scanning')}</i></header>
      <div className="scan-card__product"><div className="scan-card__thumb"><MobileBloom compact /></div><div><small>COMPLY LAB</small><strong>Evidence Barrier™<br />Hydrating Serum</strong><span>★★★★★ 4.8</span></div></div>
      <div className="claim-scan" aria-hidden="true" />
      <div className="scan-card__claim scan-card__claim--risk"><b>{t('hero.high')}</b><del>Clinically proven to heal acne</del></div>
      <div className="scan-card__claim scan-card__claim--safe"><b>{t('hero.safe')}</b><span>Helps improve the look of blemishes</span></div>
      <footer><span>{t('hero.fdaClaims')}</span><strong>{t('hero.revisionReady')}</strong></footer>
    </article>
  );
}

export default function Hero({ onSelect }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('mobile-2d');
  useEffect(() => {
    const update = () => setMode(getBrowserExperienceMode());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <main className="hero" id="hero">
      <section className="hero__copy">
        <p className="eyebrow"><span /> {t('hero.eyebrow')}</p>
        <h1>{t('hero.titleLine1')}<br /><em>{t('hero.titleLine2')}</em></h1>
        <p className="hero__lead">{t('hero.lead')}</p>
        <div className="hero__actions" aria-label={t('hero.actionsAria')}>
          <button className="hero-button hero-button--primary" type="button" onClick={() => onSelect('write')}><small>{t('hero.writeHint')}</small><span>{t('hero.writeAction')}</span><b>＋</b></button>
          <button className="hero-button" type="button" onClick={() => onSelect('validate')}><small>{t('hero.validateHint')}</small><span>{t('hero.validateAction')}</span><b>→</b></button>
        </div>
        <ul className="hero__facts"><li><b>LOCAL</b> {t('hero.localFact')}</li><li><b>03</b> {t('hero.riskFact')}</li><li><b>LIVE</b> {t('hero.revisionFact')}</li></ul>
      </section>
      <section className="hero__visual" aria-label={t('hero.visualAria')}>
        <div className="hero__ring" aria-hidden="true" />
        <div className="hero__model" aria-hidden="true">{mode === 'desktop-3d' ? <Suspense fallback={<MobileBloom compact />}><DesktopExperience /></Suspense> : <MobileBloom compact />}</div>
        <ScanCard />
        <div className="hero__stamp" aria-hidden="true"><span>✓</span><b>{t('hero.claimChecked')}</b></div>
      </section>
      <div className="hero__workflow"><strong>{t('hero.workflowInput')}</strong><i>→</i><span>{t('hero.workflowGenerate')}</span><i>→</i><span>{t('hero.workflowScan')}</span><i>→</i><span>{t('hero.workflowApply')}</span><i>→</i><b>{t('hero.workflowReady')}</b></div>
    </main>
  );
}
