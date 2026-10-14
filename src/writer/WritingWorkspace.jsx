import { useEffect, useState } from 'react';
import { Package, ShieldCheck, SlidersHorizontal, ArrowRight, Check, LoaderCircle, FileUp } from './studioIcons.jsx';
import ListingDraft from './ListingDraft.jsx';
import { buildListingDraft, rewriteFlaggedSentence, toValidationSegments } from './writerAgent.js';
import { KEY_INGREDIENTS, KEYWORDS, PRODUCT_TYPES, TARGET_CUSTOMERS, TEXTURES, extractProductFields } from './productInput.js';
import { MultiChoiceField, SingleChoiceField } from './ProductChoiceField.jsx';
import { extractPdfText } from '../productPdf.js';
import { validateSegments } from './validationAgent.js';
import { useLanguage } from '../LanguageContext.jsx';

const EMPTY_FORM = {
  brandName: '', productName: '', productType: '', netContents: '', countryOfOrigin: '',
  keyIngredients: '', keyFeatures: '', texture: '', targetCustomer: '', howToUse: '',
  brandTone: '', primaryKeyword: '', secondaryKeywords: '', approvedClaims: '', evidenceSummary: '',
  caution: '',
};

const fields = [
  ['brandName', true], ['productName', true], ['productType', true], ['netContents', true], ['countryOfOrigin', true],
  ['keyIngredients', false], ['keyFeatures', false], ['texture', false], ['targetCustomer', false], ['howToUse', false],
  ['caution', false], ['brandTone', false], ['primaryKeyword', false], ['secondaryKeywords', false], ['approvedClaims', false], ['evidenceSummary', false],
];

const fieldGroups = [
  { key: 'Basics', icon: Package, names: ['brandName', 'productName', 'productType', 'netContents', 'countryOfOrigin', 'keyIngredients', 'keyFeatures'] },
  { key: 'Experience', icon: SlidersHorizontal, names: ['texture', 'targetCustomer', 'howToUse', 'caution', 'brandTone', 'primaryKeyword', 'secondaryKeywords'] },
  { key: 'Claims', icon: ShieldCheck, names: ['approvedClaims', 'evidenceSummary'] },
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
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_FORM);
  const [draft, setDraft] = useState(null);
  const [validation, setValidation] = useState(null);
  const [handoff, setHandoff] = useState(null);
  const [revisedItems, setRevisedItems] = useState([]);
  const [error, setError] = useState('');
  const [pdfStatus, setPdfStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const requiredCount = fields.filter(([name, required]) => required && form[name].trim()).length;
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
    setPdfStatus({ text: t('write.pdfReading'), error: false });
    try {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error(t('write.pdfOnly'));
      if (file.size > 15 * 1024 * 1024) throw new Error(t('write.pdfSize'));
      const text = await extractPdfText(file);
      if (!text.trim()) throw new Error(t('write.pdfNoText'));
      const next = extractProductFields(text, form);
      const count = Object.keys(next).filter((key) => !form[key] && next[key]).length;
      setForm(next);
      setPdfStatus({ text: t('write.pdfImported', { count }), error: false });
    } catch (caught) {
      setPdfStatus({ text: caught.message || t('write.pdfError'), error: true });
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
      setError(t('write.requiredError', { fields: nextDraft.missing.map((name) => t(`field.${name}.label`)).join(', ') }));
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
          <span className="writer-step">{t('write.revisionStep', { count: handoff.revision_tasks.length })}</span>
          <h2>{t('write.revisionTitle')}</h2>
          <p>{t('write.revisionBody')}</p>
          <div className="handoff-list">{handoff.revision_tasks.map((task) => <div key={task.sentence_id}><b>{task.sentence_id}</b><span>{task.source_text}</span></div>)}</div>
          <button className="writer-submit" type="button" onClick={reviseHandoff}>{t('write.revisionAction')} <span>→</span></button>
        </section>
        <ListingDraft revisedItems={revisedItems} originalListing={handoff.original_listing} />
      </div>
    );
  }

  return (
    <div className="writer-desk">
      <section className="writer-form-panel">
        <div className="writer-form-heading"><div><span className="writer-step">{t('write.step')}</span><h2>{t('write.title')}</h2></div><span className="fact-badge"><ShieldCheck size={14} />{t('write.factBased')}</span></div>
        <div className="studio-completion"><span>{t('write.requiredProgress')} <b>{requiredCount} / 5</b></span><div role="progressbar" aria-label={t('write.requiredAria')} aria-valuemin={0} aria-valuemax={5} aria-valuenow={requiredCount}><i style={{ width: `${requiredCount * 20}%` }} /></div></div>
        <form className="writer-form" onSubmit={generateListing} aria-busy={isGenerating}>
          <label className="pdf-import">
            <FileUp size={20} />
            <span><b>{t('write.pdfTitle')}</b><small>{t('write.pdfHint')}</small></span>
            <input type="file" accept="application/pdf,.pdf" onChange={importPdf} />
          </label>
          {pdfStatus && <p className={`pdf-status${pdfStatus.error ? ' pdf-status--error' : ''}`} role={pdfStatus.error ? 'alert' : 'status'}>{pdfStatus.text}</p>}
          {fieldGroups.map(({ key, icon: Icon, names }) => <fieldset className="studio-field-group" key={key}>
            <legend><Icon size={17} />{t(`write.group${key}Title`)}</legend><p>{t(`write.group${key}Hint`)}</p>
            <div className="studio-fields">{names.map((fieldName) => fields.find(([name]) => name === fieldName)).map(([name, required]) => {
              const [ChoiceField, options] = choiceConfig[name] || [];
              if (ChoiceField) return <ChoiceField key={name} name={name} label={t(`field.${name}.label`)} title={t(`field.${name}.title`)} value={form[name]} options={options} required={required} onChange={setField} />;
              return <label className={['keyFeatures', 'howToUse', 'caution', 'approvedClaims', 'evidenceSummary'].includes(name) ? 'field-wide' : ''} key={name}>
                <span title={t(`field.${name}.title`)}>{t(`field.${name}.label`)}{required && <em>{t('write.required')}</em>}</span>
                {['keyFeatures', 'howToUse', 'caution', 'approvedClaims', 'evidenceSummary'].includes(name)
                  ? <textarea name={name} required={required} value={form[name]} placeholder={t(`field.${name}.placeholder`)} onChange={updateField} />
                  : <input name={name} required={required} value={form[name]} placeholder={t(`field.${name}.placeholder`)} onChange={updateField} />}
              </label>;
            })}</div></fieldset>)}
          <div className="studio-form-footer"><p><Check size={14} />{t('write.omissionNotice')}</p><button className="writer-submit field-wide" type="submit" disabled={isGenerating}>{isGenerating ? <><LoaderCircle size={18} className="studio-spinner" />{t('write.generating')}</> : <>{t('write.generate')}<ArrowRight size={18} /></>}</button></div>
        </form>
        {error && <p className="writer-error" role="alert">{error}</p>}
      </section>
      <ListingDraft draft={draft} validation={validation} />
    </div>
  );
}
