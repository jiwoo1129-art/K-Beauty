import { useState } from 'react';
import { countUtf8Bytes, formatListingText } from './listingGenerator.js';

function EditableField({ label, value, onChange, metric = 'chars', multiline = false, onReview }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }
  const count = metric === 'bytes' ? countUtf8Bytes(value) : value.length;
  const Input = multiline ? 'textarea' : 'input';
  return (
    <section className="editor-field">
      <div className="editor-field__head"><label htmlFor={`field-${label}`}>{label}</label><span>{count} {metric === 'bytes' ? 'bytes' : '자'}</span></div>
      <Input id={`field-${label}`} value={value} rows={multiline ? 5 : undefined} onChange={(event) => onChange(event.target.value)} />
      <div className="editor-field__actions"><button type="button" onClick={copy}>{copied ? '복사됨 ✓' : '복사'}</button><button type="button" onClick={onReview}>재검토</button></div>
    </section>
  );
}

export default function ListingEditor({ listing, onChange, onReview, onReviewAll }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const update = (key, value) => onChange({ ...listing, [key]: value });
  const text = formatListingText(listing);
  async function copyAll() {
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 2000);
  }
  function download() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'amazon-beauty-listing.txt';
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="listing-editor">
      <div className="listing-actions"><button type="button" onClick={copyAll}>{copiedAll ? '전체 복사됨 ✓' : '전체 복사'}</button><button type="button" onClick={download}>TXT 다운로드</button><button type="button" onClick={() => onReviewAll(text)}>전체 정책 검토</button></div>
      <EditableField label="Title" value={listing.title || ''} onChange={(value) => update('title', value)} onReview={() => onReview(listing.title || '')} />
      {(listing.bullets || []).map((bullet, index) => <EditableField key={index} label={`Bullet ${index + 1}`} value={bullet} onChange={(value) => update('bullets', listing.bullets.map((item, itemIndex) => itemIndex === index ? value : item))} onReview={() => onReview(bullet)} multiline />)}
      <EditableField label="Description" value={listing.description || ''} onChange={(value) => update('description', value)} onReview={() => onReview(listing.description || '')} multiline />
      <EditableField label="Search Terms" value={listing.searchTerms || ''} onChange={(value) => update('searchTerms', value)} onReview={() => onReview(listing.searchTerms || '')} metric="bytes" multiline />
      <p className={`byte-note ${countUtf8Bytes(listing.searchTerms || '') >= 250 ? 'byte-note--warn' : ''}`}>Search Terms는 UTF-8 기준으로 계산합니다. 250 bytes에 가까워지면 Seller Central의 최신 제한을 다시 확인하세요.</p>
    </div>
  );
}
