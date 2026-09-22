import { useMemo, useState } from 'react';
import { createWriterHandoff, saveWriterHandoff } from './agentWorkflow.js';
import AnnotatedValidationReport from './AnnotatedValidationReport.jsx';
import WritingWorkspace from './WritingWorkspace.jsx';
import { validateSegments } from './validationAgent.js';

function extractDocument(raw, fileName) {
  let source = raw;
  if (/\.html?$/i.test(fileName)) {
    const document = new DOMParser().parseFromString(raw.replace(/<\/(?:h[1-6]|p|li|div|section|article)>/gi, '$&\n').replace(/<br\s*\/?\s*>/gi, '\n'), 'text/html');
    document.body.querySelectorAll('script,style,iframe,object,embed,noscript').forEach((node) => node.remove());
    source = document.body.textContent || '';
  }
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sections = {};
  let current = 'body';
  for (const line of lines) {
    const header = line.match(/^\[([^\]]+)\]$/);
    if (header) {
      current = header[1].toLowerCase();
      sections[current] = [];
    } else {
      (sections[current] ||= []).push(line);
    }
  }
  const title = sections.title?.[0] || lines[0] || '';
  const bulletPoints = sections['bullet points'] || lines.filter((line) => /^(?:[-•*]|bullet\s*\d+)/i.test(line)).map((line) => line.replace(/^(?:[-•*]|bullet\s*\d+[:.)-]?)\s*/i, ''));
  const claims = sections['claims to validate'] || lines.filter((line) => /\b(cures?|treats?|heals?|reduces?|hydrates?|brightens?|protects?|soothes?|targets?)\b/i.test(line));
  const description = (sections.description || sections['product description'] || []).join(' ') || lines.slice(1).filter((line) => !bulletPoints.includes(line) && !claims.includes(line)).join(' ');
  const documentSegments = Object.entries(sections).flatMap(([section, items]) => items.map((text, index) => ({ section, index, text })));
  const segment = (name) => documentSegments.filter((item) => item.section === name).map((item) => item.text);
  return {
    raw_source: source,
    listing: { title, bullet_points: bulletPoints, description, claims },
    document_segments: documentSegments,
    product_facts: {
      ingredients: segment('ingredients').join(' ').split(/,\s*/).filter(Boolean),
      intended_use: 'cosmetic skincare product',
      directions: segment('directions').join(' '),
      warnings: segment('warnings'),
      certifications: [],
      evidence: [],
    },
  };
}

export default function AgentWorkspace({ solution }) {
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [handoff, setHandoff] = useState(null);
  const [state, setState] = useState('IDLE');
  const [error, setError] = useState('');

  const revisionCount = useMemo(() => validation?.segment_results?.filter((segment) => ['NEEDS_EVIDENCE', 'VIOLATION'].includes(segment.status)).length || 0, [validation]);

  async function runValidation() {
    if (!file) {
      setError('검증할 TXT 또는 HTML 파일을 선택해 주세요.');
      return;
    }
    setError('');
    setState('VALIDATING');
    setValidation(null);
    setHandoff(null);
    try {
      const extracted = extractDocument(await file.text(), file.name);
      setSourceText(extracted.raw_source);
      const data = validateSegments(extracted.document_segments, extracted.product_facts);
      setValidation(data);
      setState(data.verdict);
    } catch (caught) {
      setError(caught.message);
      setState('ERROR');
    }
  }

  function queueWriterHandoff() {
    const payload = createWriterHandoff(validation, sourceText);
    saveWriterHandoff(payload);
    setHandoff(payload);
    setState('WRITER_PENDING');
    window.location.assign('/write');
  }

  return (
    <section className="agent-hub" id="agent-workspace" aria-live="polite">
      {solution === 'write' && (
        <WritingWorkspace />
      )}

      {solution === 'validate' && (
        <div className="workspace-panel">
          <div className="workspace-header"><div><p className="workspace-kicker">VALIDATION AGENT</p><h3>상세페이지 초안 검증</h3></div><span className={`run-state run-state--${state.toLowerCase()}`}>{state}</span></div>
          <label className="file-drop" htmlFor="homepage-listing-file"><span>TXT 또는 HTML 상세페이지를 선택하세요</span><small>{file ? file.name : 'Title · Bullet · Description · Claim 자동 분류'}</small></label>
          <input id="homepage-listing-file" className="visually-hidden" type="file" accept=".txt,.html,.htm,text/plain,text/html" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <button className="button button--primary workspace-run" type="button" onClick={runValidation} disabled={state === 'VALIDATING'}>단락별 정책 검증<span aria-hidden="true">→</span></button>
          {error && <p className="workspace-error">{error}</p>}

          {validation && (
            <div className="validation-report">
              <div className="validation-summary"><div><span>FINAL VERDICT</span><strong>{validation.verdict}</strong></div><div><span>REVISION TASKS</span><strong>{revisionCount}</strong></div><small>Trace {validation.trace_id}</small></div>
              {validation.verdict === 'BLOCKED' && validation.blocking_summary && (
                <p className="blocking-summary">{validation.blocking_summary}</p>
              )}
              <AnnotatedValidationReport rawSource={sourceText} segments={validation.segment_results} />
              {revisionCount > 0 && <button className="button button--primary writer-handoff" type="button" onClick={queueWriterHandoff}>글쓰기 에이전트로 넘기기<span>{revisionCount}</span></button>}
              {handoff && <div className="handoff-receipt"><strong>WRITER_PENDING</strong><span>{handoff.revision_tasks.length}개 수정 작업이 인계 큐에 저장되었습니다.</span><details><summary>인계 payload 보기</summary><pre>{JSON.stringify(handoff, null, 2)}</pre></details></div>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
