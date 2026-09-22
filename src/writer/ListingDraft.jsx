import { useEffect, useMemo, useState } from 'react';
import { buildListingFilename, buildListingText, buildRevisedListingText, revealTextParts } from './listingText.js';
import { FileText, ArrowDown, ShieldCheck } from './studioIcons.jsx';

const TYPE_INTERVAL_MS = 6;

function CopyButton({ text, label = '복사', disabled = false }) {
  return <button className="copy-action" type="button" disabled={disabled} onClick={() => navigator.clipboard?.writeText(text)}>{label}</button>;
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ListingDraft({ draft, validation, revisedItems = [], originalListing = '' }) {
  const readyDraft = draft?.status === 'READY' ? draft : null;
  const textParts = useMemo(() => readyDraft ? [
    readyDraft.title.text,
    ...readyDraft.bullets.map((item) => item.text),
    ...readyDraft.description.paragraphs,
    readyDraft.howToUse || 'Follow the directions printed on the product package.',
    readyDraft.caution || 'Use only as directed. Refer to the product package for verified warnings.',
    readyDraft.searchTerms || 'No search terms provided',
  ] : [], [readyDraft]);
  const totalCharacters = textParts.reduce((total, text) => total + text.length, 0);
  const [visibleCharacters, setVisibleCharacters] = useState(0);

  useEffect(() => {
    if (!readyDraft) return setVisibleCharacters(0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setVisibleCharacters(totalCharacters);
    setVisibleCharacters(0);
    const timer = window.setInterval(() => setVisibleCharacters((current) => {
      const next = Math.min(current + 1, totalCharacters);
      if (next === totalCharacters) window.clearInterval(timer);
      return next;
    }), TYPE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [readyDraft, totalCharacters]);

  if (revisedItems.length) {
    return (
      <section className="listing-paper" aria-label="수정된 Listing 문구">
        <div className="listing-paper__top">
          <div><span className="paper-kicker">TARGETED REVISION</span><h3>Flagged text revised</h3></div>
          <span className="policy-stamp policy-stamp--pass">RECHECK READY</span>
        </div>
        {revisedItems.map((item) => (
          <article className="revision-card" key={item.sentence_id}>
            <span>{item.sentence_id}</span>
            <del>{item.original_text}</del>
            <p>{item.text}</p>
            <CopyButton text={item.text} />
          </article>
        ))}
        <div className="listing-actions">
          <button className="download-action" type="button" onClick={() => downloadText(buildRevisedListingText(originalListing, revisedItems), 'amazon-listing-revised.txt')}>수정 반영본 TXT 다운로드</button>
        </div>
      </section>
    );
  }

  if (!draft || draft.status !== 'READY') {
    return (
      <section className="listing-paper listing-paper--empty">
        <div className="listing-paper__top"><div><span className="paper-kicker">02 / 작성 결과</span><h3>Listing 미리보기</h3></div><span className="studio-waiting">입력 대기</span></div>
        <div className="studio-empty-intro"><div className="studio-document-icon"><FileText size={27} strokeWidth={1.6} /></div><h3>제품 정보가<br />상세페이지의 시작입니다.</h3><p>왼쪽에 필수 정보 5개를 입력하면<br />상품 소개와 검색어를 작성할 수 있습니다.</p></div>
        <div className="studio-output-outline" aria-label="생성되는 항목">
          <div><span>상품 제목</span><small>Product Title</small></div>
          <div><span>핵심 특징 5개</span><small>Bullet Points</small></div>
          <div><span>상세 설명 · 사용법 · 주의 사항</span><small>Product Description</small></div>
          <div><span>검색 키워드</span><small>Backend Search Terms</small></div>
        </div>
        <div className="studio-output-foot"><ArrowDown size={15} /><span>작성 후 전체 복사 또는 TXT 다운로드</span></div>
        <div className="studio-policy-note"><ShieldCheck size={17} /><p>초안 생성 후 정책 검증 결과가 표시됩니다.</p></div>
      </section>
    );
  }

  const fullText = buildListingText(draft);
  const visibleParts = revealTextParts(textParts, visibleCharacters);
  const isTyping = visibleCharacters < totalCharacters;
  const activePart = isTyping ? visibleParts.findIndex((text, index) => text.length < textParts[index].length) : -1;
  const bulletStart = 1;
  const descriptionStart = bulletStart + draft.bullets.length;
  const howToUseIndex = descriptionStart + draft.description.paragraphs.length;
  const cautionIndex = howToUseIndex + 1;
  const searchIndex = cautionIndex + 1;
  const verdict = isTyping ? 'CHECKING' : validation?.verdict || 'CHECKING';
  const typingClass = (index, base = '') => `${base} ${activePart === index ? 'listing-typing' : ''}`.trim();
  return (
    <section className="listing-paper" aria-label="생성된 Amazon Listing">
      <div className="listing-paper__top">
        <div><span className="paper-kicker">02 / 작성 결과</span><h3>Listing 초안</h3></div>
        <span className={`policy-stamp policy-stamp--${verdict.toLowerCase()}`}>{isTyping ? '작성 중' : ({ PASS: '검증 통과', BLOCKED: '수정 필요', CHECKING: '검증 중', ERROR: '검증 실패', NEEDS_EVIDENCE: '근거 확인 필요' })[verdict] || verdict}</span>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>Product Title</span><small>{draft.title.text.length} / 200</small></div>
        <p className={typingClass(0, 'listing-title')}>{visibleParts[0]}</p>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>Bullet Points</span><small>5 items</small></div>
        <ul>{draft.bullets.map((item, index) => <li className={typingClass(bulletStart + index)} key={item.sentence_id}><b>{item.sentence_id}</b>{visibleParts[bulletStart + index]}</li>)}</ul>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>Product Description</span><small>D01</small></div>
        <div className="listing-paragraphs">{draft.description.paragraphs.map((paragraph, index) => <p className={typingClass(descriptionStart + index)} key={index}>{visibleParts[descriptionStart + index]}</p>)}</div>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>How to Use</span></div>
        <p className={typingClass(howToUseIndex)}>{visibleParts[howToUseIndex]}</p>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>Caution</span></div>
        <p className={typingClass(cautionIndex)}>{visibleParts[cautionIndex]}</p>
      </div>
      <div className="listing-section listing-section--search">
        <div className="listing-label"><span>Backend Search Terms</span></div>
        <code className={typingClass(searchIndex)}>{visibleParts[searchIndex]}</code>
      </div>
      {!isTyping && draft.claimNotice && <p className="claim-notice">{draft.claimNotice}</p>}
      <div className="listing-actions">
        <CopyButton text={fullText} label="전체 Listing 복사" disabled={isTyping} />
        <button className="download-action" type="button" disabled={isTyping} onClick={() => downloadText(fullText, buildListingFilename(draft))}>TXT 다운로드</button>
      </div>
    </section>
  );
}
