// Mirrors the two policy checks and response shape used by Writer Studio.
const rules = [
  { rule_id: 'VR-US-FDA-006-001', regulation_id: 'REG-US-FDA-006', scope: 'all', type: 'drug_claim', pattern: /\b(cures?|treats?|heals?|prevents?|acne treatment|FDA approved)\b/i, source_url: 'https://www.fda.gov/consumers/consumer-updates/it-really-fda-approved' },
  { rule_id: 'VR-AMZ-TITLE-001', regulation_id: 'REG-US-AMZ-001', scope: 'title', type: 'length', max_chars: 200, source_url: 'https://sellercentral.amazon.com/help/hub/reference/external/G200164470' },
];

function normalizeSection(section) {
  const value = String(section || '').toLowerCase();
  if (value.includes('title')) return 'title';
  if (value.includes('bullet')) return 'bullet_points';
  if (value.includes('claim')) return 'claims';
  if (value.includes('ingredient')) return 'ingredients';
  if (value.includes('direction')) return 'directions';
  return 'description';
}

function violationReason(rule, text) {
  if (rule.type === 'length') return `제목이 ${text.length}자로 허용 한도 ${rule.max_chars}자를 ${text.length - rule.max_chars}자 초과하여 위반입니다.`;
  const matched = text.match(rule.pattern)?.[0] || text.slice(0, 80);
  return /FDA approved/i.test(matched)
    ? `“${matched}”는 화장품이 FDA의 공식 승인을 받은 것처럼 오인시키는 표현이라 위반입니다.`
    : `“${matched}”는 질환 치료·치유·예방 효과를 주장하여 화장품의 허용 범위를 벗어나는 표현이라 위반입니다.`;
}

export function validateSegments(segments = [], productFacts = {}) {
  const evidence = productFacts.evidence || [];
  const segmentResults = segments.map((segment) => {
    const section = normalizeSection(segment.section);
    const text = String(segment.text || '');
    const applicable = rules.filter((rule) => rule.scope === section || (rule.scope === 'all' && (rule.type !== 'drug_claim' || ['title', 'bullet_points', 'description', 'claims'].includes(section))));
    const checked = [];
    const violated = [];
    const missingEvidence = [];
    for (const rule of applicable) {
      const matched = rule.type === 'length' ? text.length > rule.max_chars : rule.pattern.test(text);
      if (rule.type === 'length' || matched || rule.type === 'drug_claim') checked.push(rule);
      if (matched && rule.evidence_required) {
        if (!evidence.some((item) => item?.source_url && text.toLowerCase().includes(String(item.claim || '').toLowerCase()))) missingEvidence.push(rule);
      } else if (matched) violated.push(rule);
    }
    const status = violated.length ? 'VIOLATION' : missingEvidence.length ? 'NEEDS_EVIDENCE' : checked.length ? 'COMPLIANT' : 'NOT_APPLICABLE';
    return {
      section, index: segment.index ?? 0, sentence_id: segment.sentence_id || `${section}:${segment.index ?? 0}`, source_text: text, status,
      matched_policies: checked.map((rule) => ({ rule_id: rule.rule_id, regulation_id: rule.regulation_id, source_url: rule.source_url, outcome: violated.includes(rule) ? 'VIOLATION' : missingEvidence.includes(rule) ? 'NEEDS_EVIDENCE' : 'CHECKED_NO_MATCH' })),
      reason: violated.length ? `위반 사유: ${violated.map((rule) => violationReason(rule, text)).join(' ')}` : missingEvidence.length ? '정책 DB에서 근거가 필수로 지정된 Claim이지만 연결된 근거가 없습니다.' : checked.length ? '적용 가능한 정책 규칙에서 위반 표현이 발견되지 않았습니다.' : '매칭되는 정책 규칙이 없어 검증 대상에서 제외되었습니다.',
    };
  });
  const violations = segmentResults.filter((segment) => segment.status === 'VIOLATION');
  const first = violations[0];
  const phrase = first?.source_text.match(rules.find((rule) => first.matched_policies.some((policy) => policy.rule_id === rule.rule_id && policy.outcome === 'VIOLATION'))?.pattern || /$^/)?.[0] || first?.source_text.slice(0, 80);
  const blockingSummary = first ? `BLOCK 사유: “${phrase}”은 ${first.matched_policies.some((policy) => policy.rule_id === 'VR-AMZ-TITLE-001' && policy.outcome === 'VIOLATION') ? 'Amazon 제목 글자 수 제한을 초과한 표현' : '질환 치료·예방 효능을 주장하는 표현'}에 해당하여 정책 위반으로 판정되었습니다.${violations.length > 1 ? ` (외 ${violations.length - 1}건)` : ''}` : null;
  const hasEvidenceGap = segmentResults.some((segment) => segment.status === 'NEEDS_EVIDENCE');
  return {
    verdict: violations.length ? 'BLOCKED' : hasEvidenceGap ? 'NEEDS_REVISION' : 'PASS', ready_for_human_approval: !violations.length && !hasEvidenceGap,
    findings: [], missing_evidence: [], blocking_reasons: violations.length ? ['의약품성 또는 고위험 Claim은 담당자 검토가 필요합니다.'] : [], blocking_summary: blockingSummary,
    segment_results: segmentResults, trace_id: `val_${crypto.randomUUID()}`, rule_version: rules.map((rule) => rule.rule_id).join(','),
  };
}
