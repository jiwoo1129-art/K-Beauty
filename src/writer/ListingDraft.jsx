import { useEffect, useMemo, useState } from 'react';
import { buildListingFilename, buildListingText, buildRevisedListingText, revealTextParts } from './listingText.js';
import { FileText, ArrowDown, ShieldCheck } from './studioIcons.jsx';
import { useLanguage } from '../LanguageContext.jsx';

const TYPE_INTERVAL_MS = 6;

function CopyButton({ text, label, disabled = false }) {
  const { t } = useLanguage();
  return <button className="copy-action" type="button" disabled={disabled} onClick={() => navigator.clipboard?.writeText(text)}>{label || t('common.copy')}</button>;
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
  const { t } = useLanguage();
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
      <section className="listing-paper" aria-label={t('draft.revisedAria')}>
        <div className="listing-paper__top">
          <div><span className="paper-kicker">{t('draft.targetedRevision')}</span><h3>{t('draft.flaggedRevised')}</h3></div>
          <span className="policy-stamp policy-stamp--pass">{t('draft.recheckReady')}</span>
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
          <button className="download-action" type="button" onClick={() => downloadText(buildRevisedListingText(originalListing, revisedItems), 'amazon-listing-revised.txt')}>{t('draft.revisedDownload')}</button>
        </div>
      </section>
    );
  }

  if (!draft || draft.status !== 'READY') {
    return (
      <section className="listing-paper listing-paper--empty">
        <div className="listing-paper__top"><div><span className="paper-kicker">{t('draft.step')}</span><h3>{t('draft.preview')}</h3></div><span className="studio-waiting">{t('draft.waiting')}</span></div>
        <div className="studio-empty-intro"><div className="studio-document-icon"><FileText size={27} strokeWidth={1.6} /></div><h3>{t('draft.emptyTitle1')}<br />{t('draft.emptyTitle2')}</h3><p>{t('draft.emptyBody1')}<br />{t('draft.emptyBody2')}</p></div>
        <div className="studio-output-outline" aria-label={t('draft.outlineAria')}>
          <div><span>{t('draft.productTitle')}</span><small>Product Title</small></div>
          <div><span>{t('draft.bullets')}</span><small>Bullet Points</small></div>
          <div><span>{t('draft.description')}</span><small>Product Description</small></div>
          <div><span>{t('draft.searchTerms')}</span><small>Backend Search Terms</small></div>
        </div>
        <div className="studio-output-foot"><ArrowDown size={15} /><span>{t('draft.afterAction')}</span></div>
        <div className="studio-policy-note"><ShieldCheck size={17} /><p>{t('draft.afterPolicy')}</p></div>
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
    <section className="listing-paper" aria-label={t('draft.generatedAria')}>
      <div className="listing-paper__top">
        <div><span className="paper-kicker">{t('draft.step')}</span><h3>{t('draft.title')}</h3></div>
        <span className={`policy-stamp policy-stamp--${verdict.toLowerCase()}`}>{isTyping ? t('draft.writing') : ({ PASS: t('draft.pass'), BLOCKED: t('draft.blocked'), CHECKING: t('draft.checking'), ERROR: t('draft.error'), NEEDS_EVIDENCE: t('draft.needsEvidence') })[verdict] || verdict}</span>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>{t('draft.productTitleLabel')}</span><small>{draft.title.text.length} / 200</small></div>
        <p className={typingClass(0, 'listing-title')}>{visibleParts[0]}</p>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>{t('draft.bulletLabel')}</span><small>{t('draft.itemCount')}</small></div>
        <ul>{draft.bullets.map((item, index) => <li className={typingClass(bulletStart + index)} key={item.sentence_id}><b>{item.sentence_id}</b>{visibleParts[bulletStart + index]}</li>)}</ul>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>{t('draft.descriptionLabel')}</span><small>D01</small></div>
        <div className="listing-paragraphs">{draft.description.paragraphs.map((paragraph, index) => <p className={typingClass(descriptionStart + index)} key={index}>{visibleParts[descriptionStart + index]}</p>)}</div>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>{t('draft.howToUseLabel')}</span></div>
        <p className={typingClass(howToUseIndex)}>{visibleParts[howToUseIndex]}</p>
      </div>
      <div className="listing-section">
        <div className="listing-label"><span>{t('draft.cautionLabel')}</span></div>
        <p className={typingClass(cautionIndex)}>{visibleParts[cautionIndex]}</p>
      </div>
      <div className="listing-section listing-section--search">
        <div className="listing-label"><span>{t('draft.searchLabel')}</span></div>
        <code className={typingClass(searchIndex)}>{visibleParts[searchIndex]}</code>
      </div>
      {!isTyping && draft.claimNotice && <p className="claim-notice">{t('draft.claimNotice')}</p>}
      <div className="listing-actions">
        <CopyButton text={fullText} label={t('draft.copyAll')} disabled={isTyping} />
        <button className="download-action" type="button" disabled={isTyping} onClick={() => downloadText(fullText, buildListingFilename(draft))}>{t('common.downloadTxt')}</button>
      </div>
    </section>
  );
}
