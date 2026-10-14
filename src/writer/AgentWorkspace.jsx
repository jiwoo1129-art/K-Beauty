import { useMemo, useState } from 'react';
import { createWriterHandoff, saveWriterHandoff } from './agentWorkflow.js';
import AnnotatedValidationReport from './AnnotatedValidationReport.jsx';
import WritingWorkspace from './WritingWorkspace.jsx';
import { validateSegments } from './validationAgent.js';
import { useLanguage } from '../LanguageContext.jsx';
import { routeHref } from '../routeState.js';

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
  const { language, t } = useLanguage();
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [validationInput, setValidationInput] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [handoff, setHandoff] = useState(null);
  const [state, setState] = useState('IDLE');
  const [error, setError] = useState('');

  const displayedValidation = useMemo(
    () => validationInput ? { ...validateSegments(validationInput.segments, validationInput.productFacts, language), trace_id: validation?.trace_id } : validation,
    [language, validation, validationInput],
  );
  const revisionCount = useMemo(() => displayedValidation?.segment_results?.filter((segment) => ['NEEDS_EVIDENCE', 'VIOLATION'].includes(segment.status)).length || 0, [displayedValidation]);

  async function runValidation() {
    if (!file) {
      setError(t('agent.fileError'));
      return;
    }
    setError('');
    setState('VALIDATING');
    setValidation(null);
    setValidationInput(null);
    setHandoff(null);
    try {
      const extracted = extractDocument(await file.text(), file.name);
      setSourceText(extracted.raw_source);
      const data = validateSegments(extracted.document_segments, extracted.product_facts, language);
      setValidationInput({ segments: extracted.document_segments, productFacts: extracted.product_facts });
      setValidation(data);
      setState(data.verdict);
    } catch (caught) {
      setError(caught.message);
      setState('ERROR');
    }
  }

  function queueWriterHandoff() {
    const payload = createWriterHandoff(displayedValidation, sourceText);
    saveWriterHandoff(payload);
    setHandoff(payload);
    setState('WRITER_PENDING');
    window.location.assign(routeHref('/write'));
  }

  return (
    <section className="agent-hub" id="agent-workspace" aria-live="polite">
      {solution === 'write' && (
        <WritingWorkspace />
      )}

      {solution === 'validate' && (
        <div className="workspace-panel">
          <div className="workspace-header"><div><p className="workspace-kicker">{t('agent.validationKicker')}</p><h3>{t('agent.title')}</h3></div><span className={`run-state run-state--${state.toLowerCase()}`}>{t(`agent.state.${state}`)}</span></div>
          <label className="file-drop" htmlFor="homepage-listing-file"><span>{t('agent.filePrompt')}</span><small>{file ? file.name : t('agent.fileHint')}</small></label>
          <input id="homepage-listing-file" className="visually-hidden" type="file" accept=".txt,.html,.htm,text/plain,text/html" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          <button className="button button--primary workspace-run" type="button" onClick={runValidation} disabled={state === 'VALIDATING'}>{t('agent.run')}<span aria-hidden="true">→</span></button>
          {error && <p className="workspace-error">{error}</p>}

          {displayedValidation && (
            <div className="validation-report">
              <div className="validation-summary"><div><span>{t('agent.finalVerdict')}</span><strong>{t(`verdict.${displayedValidation.verdict}`)}</strong></div><div><span>{t('agent.revisionTasks')}</span><strong>{revisionCount}</strong></div><small>{t('agent.trace')} {displayedValidation.trace_id}</small></div>
              {displayedValidation.verdict === 'BLOCKED' && displayedValidation.blocking_summary && (
                <p className="blocking-summary">{displayedValidation.blocking_summary}</p>
              )}
              <AnnotatedValidationReport rawSource={sourceText} segments={displayedValidation.segment_results} />
              {revisionCount > 0 && <button className="button button--primary writer-handoff" type="button" onClick={queueWriterHandoff}>{t('agent.writerHandoff')}<span>{revisionCount}</span></button>}
              {handoff && <div className="handoff-receipt"><strong>{t('agent.state.WRITER_PENDING')}</strong><span>{t('agent.handoffSaved', { count: handoff.revision_tasks.length })}</span><details><summary>{t('agent.handoffDetails')}</summary><pre>{JSON.stringify(handoff, null, 2)}</pre></details></div>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
