import { useState } from 'react';
import { countUtf8Bytes } from './listingGenerator.js';

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

export default function ListingEditor({ listing, onChange, onReview }) {
  const update = (key, value) => onChange({ ...listing, [key]: value });
  return (
    <div className="listing-editor">
      <EditableField label="Title" value={listing.title || ''} onChange={(value) => update('title', value)} onReview={() => onReview(listing.title || '')} />
      {(listing.bullets || []).map((bullet, index) => <EditableField key={index} label={`Bullet ${index + 1}`} value={bullet} onChange={(value) => update('bullets', listing.bullets.map((item, itemIndex) => itemIndex === index ? value : item))} onReview={() => onReview(bullet)} multiline />)}
      <EditableField label="Description" value={listing.description || ''} onChange={(value) => update('description', value)} onReview={() => onReview(listing.description || '')} multiline />
      <EditableField label="Search Terms" value={listing.searchTerms || ''} onChange={(value) => update('searchTerms', value)} onReview={() => onReview(listing.searchTerms || '')} metric="bytes" multiline />
      <p className={`byte-note ${countUtf8Bytes(listing.searchTerms || '') >= 250 ? 'byte-note--warn' : ''}`}>Search Terms는 UTF-8 기준으로 계산합니다. 250 bytes에 가까워지면 Seller Central의 최신 제한을 다시 확인하세요.</p>
    </div>
  );
}
