import { useEffect, useState } from 'react';
import { Package, ShieldCheck, SlidersHorizontal, ArrowRight, Check, LoaderCircle, FileUp } from './studioIcons.jsx';
import ListingDraft from './ListingDraft.jsx';
import { buildListingDraft, rewriteFlaggedSentence, toValidationSegments } from './writerAgent.js';
import { KEY_INGREDIENTS, KEYWORDS, PRODUCT_TYPES, TARGET_CUSTOMERS, TEXTURES, extractProductFields } from './productInput.js';
import { MultiChoiceField, SingleChoiceField } from './ProductChoiceField.jsx';
import { extractPdfText } from '../productPdf.js';
import { validateSegments } from './validationAgent.js';

const EMPTY_FORM = {
  brandName: '', productName: '', productType: '', netContents: '', countryOfOrigin: '',
  keyIngredients: '', keyFeatures: '', texture: '', targetCustomer: '', howToUse: '',
  brandTone: '', primaryKeyword: '', secondaryKeywords: '', approvedClaims: '', evidenceSummary: '',
  caution: '',
};

const fields = [
  ['brandName', 'Brand name', 'e.g. Mizu Lab', true],
  ['productName', 'Product name', 'e.g. Barrier Drop Serum', true],
  ['productType', 'Product type', 'e.g. Facial serum', true],
  ['netContents', 'Net contents', 'e.g. 30 mL / 1.01 fl oz', true],
  ['countryOfOrigin', 'Country of origin', 'e.g. Made in Korea', true],
  ['keyIngredients', 'Key ingredients', 'Verified ingredients only', false],
  ['keyFeatures', 'Key features', 'Facts the product can support', false],
  ['texture', 'Texture', 'e.g. Lightweight, non-sticky', false],
  ['targetCustomer', 'Target customer', 'e.g. Dry and combination skin', false],
  ['howToUse', 'How to use', 'Verified directions from the package', false],
  ['caution', 'Caution', 'Verified package warnings only', false],
  ['brandTone', 'Brand tone', 'e.g. Clinical, calm, minimal', false],
  ['primaryKeyword', 'Primary keyword', 'One relevant shopper term', false],
  ['secondaryKeywords', 'Secondary keywords', 'Comma-separated terms', false],
  ['approvedClaims', 'Approved claims', 'Use only claims supported by evidence', false],
  ['evidenceSummary', 'Evidence summary', 'Source or test summary for approved claims', false],
];

const koreanLabels = { brandName: '브랜드명', productName: '제품명', productType: '제품 유형', netContents: '용량', countryOfOrigin: '원산지', keyIngredients: '주요 성분', keyFeatures: '주요 특징', texture: '제형 및 사용감', targetCustomer: '주요 고객', howToUse: '사용 방법', caution: '주의 사항', brandTone: '브랜드 톤', primaryKeyword: '핵심 키워드', secondaryKeywords: '추가 키워드', approvedClaims: '근거가 있는 효능 표현', evidenceSummary: '효능 표현의 근거' };
const fieldGroups = [
  { title: '제품 기본 정보', hint: '제품명과 확인된 특징을 입력하세요.', icon: Package, names: ['brandName', 'productName', 'productType', 'netContents', 'countryOfOrigin', 'keyIngredients', 'keyFeatures'] },
  { title: '사용 경험과 브랜드', hint: '상품에 맞는 설명과 검색어를 더하세요.', icon: SlidersHorizontal, names: ['texture', 'targetCustomer', 'howToUse', 'caution', 'brandTone', 'primaryKeyword', 'secondaryKeywords'] },
  { title: '효능 표현과 근거', hint: '시험 결과나 확인 가능한 자료가 있다면 입력하세요.', icon: ShieldCheck, names: ['approvedClaims', 'evidenceSummary'] },
];
const choiceConfig = {
  productType: [SingleChoiceField, PRODUCT_TYPES],
  keyIngredients: [MultiChoiceField, KEY_INGREDIENTS],
  texture: [MultiChoiceField, TEXTURES],
  targetCustomer: [MultiChoiceField, TARGET_CUSTOMERS],
  primaryKeyword: [SingleChoiceField, KEYWORDS],
  secondaryKeywords: [MultiChoiceField, KEYWORDS],
};

export default function WritingWorkspace() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [draft, setDraft] = useState(null);
  const [validation, setValidation] = useState(null);
  const [handoff, setHandoff] = useState(null);
  const [revisedItems, setRevisedItems] = useState([]);
  const [error, setError] = useState('');
  const [pdfStatus, setPdfStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const requiredCount = fields.filter(([name, , , required]) => required && form[name].trim()).length;
  const mode = handoff ? 'revision' : 'create';

  useEffect(() => {
    const raw = localStorage.getItem('comply.writerHandoff');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw);
      if (payload?.target_agent === 'amazon-listing-writer' && payload.revision_tasks?.length) setHandoff(payload);
    } catch {
      localStorage.removeItem('comply.writerHandoff');
    }
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function importPdf(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPdfStatus({ text: 'PDF를 읽는 중입니다…', error: false });
    try {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('PDF 파일만 업로드할 수 있습니다.');
      if (file.size > 15 * 1024 * 1024) throw new Error('PDF는 15MB 이하만 업로드할 수 있습니다.');
      const text = await extractPdfText(file);
      if (!text.trim()) throw new Error('텍스트를 찾지 못했습니다. 스캔 PDF는 지원하지 않습니다.');
      const next = extractProductFields(text, form);
      const count = Object.keys(next).filter((key) => !form[key] && next[key]).length;
      setForm(next);
      setPdfStatus({ text: `${count}개 항목을 자동 입력했습니다. 값을 확인한 뒤 수정할 수 있습니다.`, error: false });
    } catch (caught) {
      setPdfStatus({ text: caught.message || 'PDF를 읽지 못했습니다.', error: true });
    } finally {
      event.target.value = '';
    }
  }

  async function validateDraft(nextDraft) {
    setValidation(validateSegments(toValidationSegments(nextDraft)));
  }

  async function generateListing(event) {
    event.preventDefault();
    if (isGenerating) return;
    setError('');
    setValidation(null);
    const nextDraft = buildListingDraft(form);
    setDraft(nextDraft);
    if (nextDraft.status !== 'READY') {
      setError(`필수 정보를 입력해 주세요: ${nextDraft.missing.join(', ')}`);
      return;
    }
    setIsGenerating(true);
    try { await validateDraft(nextDraft); } catch (caught) { setError(caught.message); setValidation({ verdict: 'ERROR' }); }
    finally { setIsGenerating(false); }
  }

  function reviseHandoff() {
    const items = handoff.revision_tasks.map((task) => ({
      ...task,
      ...rewriteFlaggedSentence(task),
      original_text: task.source_text,
    }));
    setRevisedItems(items);
    localStorage.removeItem('comply.writerHandoff');
  }

  if (mode === 'revision') {
    return (
      <div className="writer-desk writer-desk--revision">
        <section className="writer-form-panel">
          <span className="writer-step">VALIDATOR HANDOFF · {handoff.revision_tasks.length} FLAGGED</span>
          <h2>지적된 문구만 다시 씁니다.</h2>
          <p>검증을 통과한 나머지 Listing은 변경하지 않습니다.</p>
          <div className="handoff-list">{handoff.revision_tasks.map((task) => <div key={task.sentence_id}><b>{task.sentence_id}</b><span>{task.source_text}</span></div>)}</div>
          <button className="writer-submit" type="button" onClick={reviseHandoff}>위반 문구 안전하게 재작성 <span>→</span></button>
        </section>
        <ListingDraft revisedItems={revisedItems} originalListing={handoff.original_listing} />
      </div>
    );
  }

  return (
    <div className="writer-desk">
      <section className="writer-form-panel">
        <div className="writer-form-heading"><div><span className="writer-step">01 / 상품 정보</span><h2>제품을 알려주세요.</h2></div><span className="fact-badge"><ShieldCheck size={14} />사실 기반 작성</span></div>
        <div className="studio-completion"><span>필수 정보 <b>{requiredCount} / 5</b></span><div role="progressbar" aria-label="필수 정보 입력" aria-valuemin={0} aria-valuemax={5} aria-valuenow={requiredCount}><i style={{ width: `${requiredCount * 20}%` }} /></div></div>
        <form className="writer-form" onSubmit={generateListing} aria-busy={isGenerating}>
          <label className="pdf-import">
            <FileUp size={20} />
            <span><b>PDF에서 제품 정보 자동 입력</b><small>텍스트 선택이 가능한 PDF · 최대 15MB</small></span>
            <input type="file" accept="application/pdf,.pdf" onChange={importPdf} />
          </label>
          {pdfStatus && <p className={`pdf-status${pdfStatus.error ? ' pdf-status--error' : ''}`} role={pdfStatus.error ? 'alert' : 'status'}>{pdfStatus.text}</p>}
          {fieldGroups.map(({ title, hint, icon: Icon, names }) => <fieldset className="studio-field-group" key={title}>
            <legend><Icon size={17} />{title}</legend><p>{hint}</p>
            <div className="studio-fields">{names.map((fieldName) => fields.find(([name]) => name === fieldName)).map(([name, label, placeholder, required]) => {
              const [ChoiceField, options] = choiceConfig[name] || [];
              if (ChoiceField) return <ChoiceField key={name} name={name} label={koreanLabels[name]} title={label} value={form[name]} options={options} required={required} onChange={setField} />;
              return <label className={['keyFeatures', 'howToUse', 'caution', 'approvedClaims', 'evidenceSummary'].includes(name) ? 'field-wide' : ''} key={name}>
                <span title={label}>{koreanLabels[name]}{required && <em>필수</em>}</span>
                {['keyFeatures', 'howToUse', 'caution', 'approvedClaims', 'evidenceSummary'].includes(name)
                  ? <textarea name={name} required={required} value={form[name]} placeholder={placeholder} onChange={updateField} />
                  : <input name={name} required={required} value={form[name]} placeholder={placeholder} onChange={updateField} />}
              </label>;
            })}</div></fieldset>)}
          <div className="studio-form-footer"><p><Check size={14} />입력하지 않은 효능이나 인증은 추가하지 않습니다.</p><button className="writer-submit field-wide" type="submit" disabled={isGenerating}>{isGenerating ? <><LoaderCircle size={18} className="studio-spinner" />작성 및 검증 중</> : <>Listing 초안 생성<ArrowRight size={18} /></>}</button></div>
        </form>
        {error && <p className="writer-error" role="alert">{error}</p>}
      </section>
      <ListingDraft draft={draft} validation={validation} />
    </div>
  );
}
