import { lazy, Suspense, useEffect, useState } from 'react';
import MobileBloom from './MobileBloom.jsx';
import { getBrowserExperienceMode } from './experienceMode.js';

const DesktopExperience = lazy(() => import('./DesktopExperience.jsx'));

function ScanCard() {
  return (
    <article className="scan-card" aria-label="문장별 정책 검토 예시">
      <header><span>AMAZON BEAUTY / LIVE REVIEW</span><i>SCANNING</i></header>
      <div className="scan-card__product"><div className="scan-card__thumb"><MobileBloom compact /></div><div><small>COMPLY LAB</small><strong>Evidence Barrier™<br />Hydrating Serum</strong><span>★★★★★ 4.8</span></div></div>
      <div className="claim-scan" aria-hidden="true" />
      <div className="scan-card__claim scan-card__claim--risk"><b>HIGH</b><del>Clinically proven to heal acne</del></div>
      <div className="scan-card__claim scan-card__claim--safe"><b>SAFE</b><span>Helps improve the look of blemishes</span></div>
      <footer><span>FDA CLAIMS</span><strong>01 REVISION READY</strong></footer>
    </article>
  );
}

export default function Hero({ onSelect }) {
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
        <p className="eyebrow"><span /> BEAUTY LISTING STUDIO</p>
        <h1>화장품 상세페이지,<br /><em>감이 아니라 근거로.</em></h1>
        <p className="hero__lead">제품의 매력은 그대로 살리고 위험한 표현만 정확하게 다듬습니다. 생성부터 문장별 정책 검토까지 한 작업 공간에서 이어가세요.</p>
        <div className="hero__actions" aria-label="작업 선택">
          <button className="hero-button hero-button--primary" type="button" onClick={() => onSelect('write')}><small>제품 정보가 있다면</small><span>새 리스팅 만들기</span><b>＋</b></button>
          <button className="hero-button" type="button" onClick={() => onSelect('validate')}><small>초안이 있다면</small><span>기존 문구 검증하기</span><b>→</b></button>
        </div>
        <ul className="hero__facts"><li><b>LOCAL</b> 파일은 브라우저에서 처리</li><li><b>03</b> 위험도 단계</li><li><b>LIVE</b> 수정안 적용</li></ul>
      </section>
      <section className="hero__visual" aria-label="투명 세럼과 정책 검토 화면">
        <div className="hero__ring" aria-hidden="true" />
        <div className="hero__model" aria-hidden="true">{mode === 'desktop-3d' ? <Suspense fallback={<MobileBloom compact />}><DesktopExperience /></Suspense> : <MobileBloom compact />}</div>
        <ScanCard />
        <div className="hero__stamp" aria-hidden="true"><span>✓</span><b>CLAIM<br />CHECKED</b></div>
      </section>
      <div className="hero__workflow"><strong>INPUT QUALITY</strong><i>→</i><span>GENERATE</span><i>→</i><span>SCAN CLAIMS</span><i>→</i><span>APPLY REVISION</span><i>→</i><b>LISTING READY</b></div>
    </main>
  );
}
