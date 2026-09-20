import { useEffect, useMemo, useRef, useState } from 'react';
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS, analyzeListing, sanitizeImportedText } from './complianceEngine.js';
import { REQUIRED_FIELDS, generateListing, scoreProductFacts } from './listingGenerator.js';
import { createWorkspaceStore } from './workspaceStore.js';
import { extractPdfText, inferProductFacts } from './productPdf.js';
import ListingEditor from './ListingEditor.jsx';
import RiskReview from './RiskReview.jsx';

const EMPTY_FACTS = { brand: '', productName: '', category: '', netContents: '', origin: '', ingredients: '', benefits: '', texture: '', audience: '', directions: '', warnings: '', brandTone: '', primaryKeyword: '', keywords: '', evidence: '', certifications: '' };
const FIELD_LABELS = { brand: '브랜드명', productName: '제품명', category: '제품 유형', netContents: '용량', origin: '원산지', ingredients: '주요 성분', benefits: '주요 특징', texture: '제형 및 사용감', audience: '주요 고객', directions: '사용 방법', warnings: '주의 사항', brandTone: '브랜드 톤', primaryKeyword: '핵심 키워드', keywords: '추가 키워드', evidence: '효능 표현의 근거' };
const TEXTAREA_FIELDS = new Set(['ingredients', 'benefits', 'directions', 'warnings', 'evidence']);
const PRODUCT_TYPES = ['Makeup - Body', 'Makeup - Eyes', 'Makeup - Face', 'Makeup - Lips', 'Makeup Palette', 'Makeup Remover', 'Skin Care - Body', 'Skin Care - Eyes', 'Skin Care - Face', 'Skin Care - Lip Care', 'Skin Care - Sunscreen', 'Hair Care - Shampoo & Conditioner', 'Hair Care - Styling', 'Hair Care - Treatment', 'Hair Care - Scalp', 'Fragrance - Women\'s', 'Fragrance - Men\'s', 'Foot, Hand & Nail Care', 'Personal Care - Bath & Body', 'Personal Care - Deodorant', 'Personal Care - Oral Care', 'Men\'s Grooming - Shave', 'Men\'s Grooming - Skin Care'];
const PDF_LIMIT = 15 * 1024 * 1024;

function makeWorkspace(mode = 'write') {
  return { name: `새 Beauty 작업 ${new Date().toLocaleDateString('ko-KR')}`, mode, facts: EMPTY_FACTS, sourceText: '', listing: null, findings: [], ignored: [] };
}

export default function StudioWorkspace({ initialMode = 'write', lockedMode = false, onNavigate = () => {} }) {
  const store = useMemo(() => createWorkspaceStore(), []);
  const [workspaces, setWorkspaces] = useState(() => store.list());
  const [current, setCurrent] = useState(() => workspaces[0] || makeWorkspace(initialMode));
  const [mode, setMode] = useState(initialMode);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('저장 준비');
  const [announcement, setAnnouncement] = useState('');
  const [snapshots, setSnapshots] = useState(current.snapshots || []);
  const resultRef = useRef(null);

  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = store.save({ ...current, mode });
      setCurrent((value) => value.id ? value : { ...value, id: saved.id });
      setWorkspaces(store.list());
      setSnapshots(saved.snapshots || []);
      setStatus('자동 저장됨');
    }, 400);
    return () => window.clearTimeout(timer);
  }, [current.name, current.facts, current.sourceText, current.listing, current.findings, current.ignored, mode, store]);

  function jumpToResult(message) {
    setAnnouncement(message);
    window.requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function submitGeneration(event) {
    event.preventDefault();
    const quality = scoreProductFacts(current.facts);
    const missingCore = quality.missing.filter((key) => REQUIRED_FIELDS.includes(key));
    if (missingCore.length) {
      setErrors(Object.fromEntries(missingCore.map((key) => [key, `${FIELD_LABELS[key]} 입력이 필요합니다.`])));
      setAnnouncement('필수 제품 정보를 확인해 주세요.');
      document.getElementById(`fact-${missingCore[0]}`)?.focus();
      return;
    }
    setErrors({});
    const listing = generateListing(current.facts);
    setCurrent((value) => ({ ...value, listing }));
    jumpToResult('리스팅 초안이 생성되었습니다. 결과를 편집하거나 재검토할 수 있습니다.');
  }

  function validateText(text = current.sourceText) {
    if (!text.trim()) { setErrors({ sourceText: '검토할 문구를 입력하거나 파일을 선택해 주세요.' }); return; }
    const findings = analyzeListing(text);
    setErrors({});
    setCurrent((value) => ({ ...value, sourceText: text, findings, ignored: [] }));
    jumpToResult(`${findings.length}개의 검토 항목을 찾았습니다.`);
  }

  async function importListingFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    if (!SUPPORTED_EXTENSIONS.includes(extension)) { setErrors({ file: 'TXT, HTML, MD, CSV 파일만 사용할 수 있습니다.' }); return; }
    if (file.size > MAX_FILE_SIZE) { setErrors({ file: '파일이 2MB를 초과했습니다. 더 작은 파일을 선택해 주세요.' }); return; }
    const text = sanitizeImportedText(await file.text(), extension);
    setCurrent((value) => ({ ...value, sourceText: text }));
    setErrors({});
    setAnnouncement(`${file.name}을 브라우저에서 읽었습니다. 원본 파일은 서버로 전송하지 않았습니다.`);
  }

  async function importProductPdf(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type !== 'application/pdf')) { setErrors({ pdf: 'PDF 파일만 사용할 수 있습니다.' }); return; }
    if (file.size > PDF_LIMIT) { setErrors({ pdf: 'PDF가 15MB를 초과했습니다.' }); return; }
    try {
      const facts = inferProductFacts(await extractPdfText(file));
      if (!Object.keys(facts).length) throw new Error('제품 정보를 찾지 못했습니다.');
      setCurrent((value) => ({ ...value, facts: { ...EMPTY_FACTS, ...value.facts, ...facts } }));
      setErrors({});
      setAnnouncement(`${file.name}에서 제품 정보를 자동 입력했습니다. 원본 파일은 서버로 전송하지 않았습니다.`);
    } catch (error) {
      setErrors({ pdf: `PDF 텍스트를 읽지 못했습니다. ${error.message}` });
    }
  }

  function applyFinding(finding) {
    const text = current.sourceText;
    const next = `${text.slice(0, finding.start)}${finding.suggestion}${text.slice(finding.end)}`;
    setCurrent((value) => ({ ...value, sourceText: next, findings: analyzeListing(next), ignored: [] }));
    setAnnouncement('수정안을 원문에 적용하고 다시 검토했습니다.');
  }

  function reviewListingPart(text) {
    setMode('validate');
    setCurrent((value) => ({ ...value, sourceText: text, findings: analyzeListing(text), ignored: [] }));
    jumpToResult('선택한 항목을 다시 검토했습니다.');
  }

  function addWorkspace() {
    const saved = store.save(makeWorkspace(mode));
    setCurrent(saved); setWorkspaces(store.list()); setStatus('새 작업 생성됨');
  }
  function duplicateWorkspace() {
    const saved = current.id ? store.duplicate(current.id) : store.save({ ...current, name: `${current.name} 사본` });
    setCurrent(saved); setWorkspaces(store.list()); setAnnouncement('작업 복제가 완료되었습니다.');
  }
  function deleteWorkspace() {
    if (!current.id || !window.confirm('현재 작업을 삭제할까요?')) return;
    const remaining = store.remove(current.id);
    const next = remaining[0] || store.save(makeWorkspace(mode));
    setWorkspaces(store.list()); setCurrent(next); setAnnouncement('작업을 삭제했습니다.');
  }
  function saveSnapshot() {
    if (!current.id) return;
    const snap = store.snapshot(current.id);
    const refreshed = store.list().find((item) => item.id === current.id);
    setCurrent(refreshed); setSnapshots(refreshed.snapshots || []); setAnnouncement(`버전 저장 완료: ${new Date(snap.createdAt).toLocaleString('ko-KR')}`);
  }
  function restoreLastSnapshot() {
    const snap = snapshots.at(-1);
    if (!current.id || !snap) { setAnnouncement('복원할 저장 버전이 없습니다.'); return; }
    const restored = store.restore(current.id, snap.id);
    setCurrent(restored); setMode(restored.mode || mode); setAnnouncement('마지막 저장 버전으로 복원했습니다.');
  }
  function exportBackup() {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'comply-ai-beauty-studio-backup.json'; link.click(); URL.revokeObjectURL(url);
    setAnnouncement('JSON 백업 파일을 만들었습니다.');
  }
  async function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = store.importJson(await file.text());
      setWorkspaces(imported); setCurrent(imported[0] || makeWorkspace(mode)); setAnnouncement('JSON 가져오기를 완료했습니다.');
    } catch (error) { setAnnouncement(error.message); }
  }

  const quality = scoreProductFacts(current.facts || EMPTY_FACTS);
  const setFact = (key, value) => setCurrent((workspace) => ({ ...workspace, facts: { ...EMPTY_FACTS, ...workspace.facts, [key]: value } }));

  return (
    <section className="studio" id="studio" aria-labelledby="studio-title">
      <div className="sr-status" aria-live="polite">{announcement}</div>
      <header className="studio__header">
        <div><p className="eyebrow"><span /> WORKSPACE</p><h2 id="studio-title">Beauty Listing 작업실</h2><p>생성하고, 근거를 확인하고, 안전한 문장으로 바로 다듬으세요.</p></div>
        <div className="save-state"><i /> {status}</div>
      </header>

      <div className="workspace-manager">
        <label htmlFor="workspace-name">작업명</label>
        <input id="workspace-name" value={current.name || ''} onChange={(event) => setCurrent((value) => ({ ...value, name: event.target.value }))} />
        <select aria-label="저장된 작업 선택" value={current.id || ''} onChange={(event) => { const next = workspaces.find((item) => item.id === event.target.value); if (next) { setCurrent(next); setMode(next.mode || mode); } }}><option value="">현재 작업</option>{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <button type="button" onClick={addWorkspace}>새 작업</button><button type="button" onClick={duplicateWorkspace}>작업 복제</button><button type="button" onClick={deleteWorkspace}>작업 삭제</button><button type="button" onClick={saveSnapshot}>버전 저장</button><button type="button" onClick={restoreLastSnapshot}>버전 복원</button><button type="button" onClick={exportBackup}>JSON 백업</button><label className="manager-import" htmlFor="backup-file">JSON 가져오기</label><input id="backup-file" className="visually-hidden" type="file" accept="application/json,.json" onChange={importBackup} />
      </div>

      {!lockedMode && <div className="studio__tabs" role="tablist" aria-label="작업 유형"><button role="tab" aria-selected={mode === 'write'} className={mode === 'write' ? 'active' : ''} onClick={() => setMode('write')}>새 리스팅 생성</button><button role="tab" aria-selected={mode === 'validate'} className={mode === 'validate' ? 'active' : ''} onClick={() => setMode('validate')}>기존 문구 검증</button></div>}

      {mode === 'write' ? (
        <form className="studio-grid" onSubmit={submitGeneration} noValidate>
          <section className="input-panel">
            <div className="panel-title"><div><small>01 / PRODUCT FACTS</small><h3>제품 정보를 입력하세요</h3></div><div className="quality-score"><strong>{quality.score}</strong><span>/ 100<br />정보 품질</span></div></div>
            <div className="pdf-import"><div><strong>PDF에서 제품 정보 자동 입력</strong><span>텍스트 선택이 가능한 PDF · 최대 15MB</span></div><label className="file-button" htmlFor="product-pdf">PDF 선택</label><input className="visually-hidden" id="product-pdf" type="file" accept="application/pdf,.pdf" onChange={importProductPdf} /></div>
            {errors.pdf && <p className="field-error">{errors.pdf}</p>}
            <div className="form-grid">
              {Object.keys(FIELD_LABELS).map((key) => <label className={TEXTAREA_FIELDS.has(key) ? 'wide' : ''} key={key} htmlFor={`fact-${key}`}><span>{FIELD_LABELS[key]}{REQUIRED_FIELDS.includes(key) && <b>필수</b>}</span>{TEXTAREA_FIELDS.has(key) ? <textarea id={`fact-${key}`} value={current.facts?.[key] || ''} rows={key === 'benefits' ? 3 : 2} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={(event) => setFact(key, event.target.value)} /> : <input id={`fact-${key}`} list={key === 'category' ? 'product-types' : undefined} value={current.facts?.[key] || ''} aria-describedby={errors[key] ? `error-${key}` : undefined} onChange={(event) => setFact(key, event.target.value)} />}{errors[key] && <small className="field-error" id={`error-${key}`}>{errors[key]}</small>}</label>)}
              <datalist id="product-types">{PRODUCT_TYPES.map((type) => <option value={type} key={type} />)}</datalist>
            </div>
            {quality.missing.includes('evidence') && current.facts?.benefits && <p className="evidence-warning">효능 근거가 비어 있습니다. 근거 없는 효능·인증 표현은 생성 결과에서 제외됩니다.</p>}
            <button className="primary-action" type="submit">리스팅 초안 생성 <span>→</span></button>
          </section>
          <aside className="guide-panel"><small>GENERATION RULES</small><h3>사실에서 문장으로</h3><ol><li><b>필수 정보 확인</b><span>누락된 제품 사실을 생성 전에 확인합니다.</span></li><li><b>근거 없는 표현 제외</b><span>FDA 승인·치료 표현은 결과에 넣지 않습니다.</span></li><li><b>항목별 편집</b><span>Title부터 Search Terms까지 따로 다듬습니다.</span></li></ol><p>이 도구는 작성 보조 기능이며 정책 준수를 보증하지 않습니다. 게시 전 담당자의 최종 검토가 필요합니다.</p></aside>
        </form>
      ) : (
        <div className="studio-grid">
          <section className="input-panel">
            <div className="panel-title"><div><small>01 / SOURCE COPY</small><h3>검토할 문구를 가져오세요</h3></div><span className="local-chip">LOCAL ONLY</span></div>
            <label htmlFor="listing-source">상세페이지 원문</label>
            <textarea id="listing-source" className="source-textarea" rows="13" value={current.sourceText || ''} aria-describedby={errors.sourceText ? 'source-error' : 'source-help'} placeholder="Title, Bullet Points, Description 또는 Search Terms를 붙여넣으세요." onChange={(event) => setCurrent((value) => ({ ...value, sourceText: event.target.value }))} />
            <small id="source-help">파일 또는 붙여넣기 텍스트는 브라우저 내부에서만 처리합니다.</small>{errors.sourceText && <small className="field-error" id="source-error">{errors.sourceText}</small>}
            <div className="file-row"><label className="file-button" htmlFor="listing-file">TXT · HTML · MD · CSV 선택</label><input className="visually-hidden" id="listing-file" type="file" accept=".txt,.html,.htm,.md,.csv" onChange={importListingFile} /><span>최대 2MB · HTML 스크립트 제거</span></div>{errors.file && <p className="field-error">{errors.file}</p>}
            <button className="primary-action" type="button" onClick={() => validateText()}>문장별 위험 검토 <span>→</span></button>
          </section>
          <aside className="guide-panel"><small>REVIEW COVERAGE</small><h3>7개 표현 유형</h3><div className="coverage-tags"><span>치료·질병</span><span>FDA 승인</span><span>절대 보장</span><span>우월 표현</span><span>즉시 효과</span><span>프로모션</span><span>대문자 남용</span></div><p>문장 위치, 위험 이유, 검토 근거와 자연스러운 수정안을 함께 표시합니다.</p></aside>
        </div>
      )}

      <section className="results" ref={resultRef} tabIndex="-1" aria-label="작업 결과">
        <div className="results__head"><div><small>02 / REVIEW & EDIT</small><h3>{mode === 'write' ? '생성 결과 편집' : '문장별 위험 검토'}</h3></div>{mode === 'validate' && <div className="risk-summary"><b>{current.findings?.filter((item) => item.risk === 'HIGH').length || 0}</b> HIGH <b>{current.findings?.filter((item) => item.risk === 'MEDIUM').length || 0}</b> MEDIUM <b>{current.findings?.filter((item) => item.risk === 'LOW').length || 0}</b> LOW</div>}</div>
        {mode === 'write' ? current.listing ? <><ListingEditor listing={current.listing} onChange={(listing) => setCurrent((value) => ({ ...value, listing }))} onReview={reviewListingPart} />{current.listing.warnings?.map((warning) => <p className="result-warning" key={warning}>{warning}</p>)}</> : <div className="empty-result"><span>＋</span><p>제품 정보를 입력하면 편집 가능한 리스팅 초안이 여기에 표시됩니다.</p></div> : current.findings?.length || current.sourceText ? <RiskReview findings={current.findings || []} ignored={current.ignored || []} onApply={applyFinding} onIgnore={(id) => setCurrent((value) => ({ ...value, ignored: [...(value.ignored || []), id] }))} /> : <div className="empty-result"><span>⌁</span><p>문구를 검토하면 위험도와 수정 근거가 여기에 표시됩니다.</p></div>}
        <p className="disclaimer"><strong>검토 한계</strong> 자동 결과는 정책 준수를 보증하지 않습니다. Amazon과 FDA의 최신 정책 및 담당자 검토를 거쳐 게시하세요.</p>
      </section>
    </section>
  );
}
