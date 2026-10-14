import { buildSourceAnnotations } from './sourceAnnotations.js';
import { useLanguage } from '../LanguageContext.jsx';

const statusOrder = ['VIOLATION', 'NEEDS_EVIDENCE', 'COMPLIANT', 'NOT_APPLICABLE'];
const numberedStatuses = new Set(['VIOLATION', 'NEEDS_EVIDENCE']);

function getCounts(segments) {
  return statusOrder.map((status) => ({
    status,
    count: segments.filter((segment) => segment.status === status).length,
  }));
}

function renderSource(rawSource, ranges, t) {
  const chunks = [];
  let cursor = 0;
  for (const range of ranges) {
    chunks.push(rawSource.slice(cursor, range.start));
    chunks.push(
      <mark className={`source-mark is-${range.status.toLowerCase()}`} key={`${range.start}-${range.end}`}>
        {range.text}
        <span className="source-tag">{range.number ? `[${range.number}]` : t(`status.${range.status}`)}</span>
      </mark>,
    );
    cursor = range.end;
  }
  chunks.push(rawSource.slice(cursor));
  return chunks;
}

export default function AnnotatedValidationReport({ rawSource = '', segments = [] }) {
  const { t } = useLanguage();
  if (!rawSource) return <p className="report-empty">{t('report.empty')}</p>;

  const ranges = buildSourceAnnotations(rawSource, segments);
  const issues = segments
    .filter((segment) => numberedStatuses.has(segment.status))
    .map((segment, index) => ({ segment, number: index + 1 }));

  return (
    <section className="annotated-report" aria-labelledby="annotated-report-title">
      <header className="annotated-report-header">
        <div>
          <span className="annotated-report-kicker">{t('report.kicker')}</span>
          <h4 id="annotated-report-title">{t('report.title')}</h4>
        </div>
        <div className="report-counts" aria-label={t('report.countsAria')}>
          {getCounts(segments).map(({ status, count }) => (
            <span className={`report-count is-${status.toLowerCase()}`} key={status}>
              {t(`status.${status}`)} <b>{count}</b>
            </span>
          ))}
        </div>
      </header>

      <div className="annotated-document">
        <pre className="source-document">{renderSource(rawSource, ranges, t)}</pre>
      </div>

      {issues.length > 0 && (
        <div className="finding-list" aria-label={t('report.findingsAria')}>
          {issues.map(({ segment, number }) => (
            <article className={`finding-item is-${segment.status.toLowerCase()}`} key={`${number}-${segment.section}-${segment.index}`}>
              <strong className="finding-number">[{number}] {t(`status.${segment.status}`)}</strong>
              <p>{segment.source_text}</p>
              <div className="finding-reason">{segment.reason}</div>
              {(segment.matched_policies || []).map((policy) => (
                <div className="finding-policy" key={`${policy.rule_id}-${policy.outcome}`}>
                  <b>{policy.rule_id}</b>
                  {policy.source_url && <a href={policy.source_url} target="_blank" rel="noreferrer">{t('report.policySource')}</a>}
                </div>
              ))}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
