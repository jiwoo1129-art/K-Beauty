const labels = { HIGH: '높음', MEDIUM: '중간', LOW: '낮음' };

export default function RiskReview({ findings, ignored = [], onApply, onIgnore }) {
  const visible = findings.filter((finding) => !ignored.includes(finding.id));
  if (!visible.length) return <div className="empty-review"><span>✓</span><strong>표시할 위험 문장이 없습니다.</strong><p>자동 검토 결과이며 최종 게시 전 사람의 확인이 필요합니다.</p></div>;
  return (
    <div className="risk-list">
      {visible.map((finding) => (
        <article className={`risk-card risk-card--${finding.risk.toLowerCase()}`} key={finding.id}>
          <div className="risk-card__top"><span className="risk-badge">{labels[finding.risk]} 위험</span><small>문자 {finding.start + 1}–{finding.end}</small></div>
          <blockquote>{finding.source}</blockquote>
          <p>{finding.reason}</p>
          <a href={finding.sourceUrl} target="_blank" rel="noreferrer">{finding.evidenceLabel} 원문 ↗</a>
          <div className="suggestion"><small>자연스러운 수정안</small><strong>{finding.suggestion}</strong></div>
          <div className="risk-card__actions"><button type="button" onClick={() => onApply(finding)}>수정안 적용</button><button type="button" onClick={() => onIgnore(finding.id)}>지적 제외</button></div>
        </article>
      ))}
    </div>
  );
}
