// Mirrors the two policy checks and response shape used by Writer Studio.
import { translate } from '../i18n.js';

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

function violationReason(rule, text, language) {
  if (rule.type === 'length') return translate(language, 'validation.titleLength', { length: text.length, max: rule.max_chars, over: text.length - rule.max_chars });
  const matched = text.match(rule.pattern)?.[0] || text.slice(0, 80);
  return /FDA approved/i.test(matched)
    ? translate(language, 'validation.fdaReason', { matched })
    : translate(language, 'validation.drugReason', { matched });
}

export function validateSegments(segments = [], productFacts = {}, language = 'ko') {
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
      reason: violated.length
        ? `${translate(language, 'validation.reasonPrefix')} ${violated.map((rule) => violationReason(rule, text, language)).join(' ')}`
        : missingEvidence.length
          ? translate(language, 'validation.missingEvidence')
          : checked.length
            ? translate(language, 'validation.noViolation')
            : translate(language, 'validation.notApplicable'),
    };
  });
  const violations = segmentResults.filter((segment) => segment.status === 'VIOLATION');
  const first = violations[0];
  const phrase = first?.source_text.match(rules.find((rule) => first.matched_policies.some((policy) => policy.rule_id === rule.rule_id && policy.outcome === 'VIOLATION'))?.pattern || /$^/)?.[0] || first?.source_text.slice(0, 80);
  const blockingSummary = first ? translate(language, 'validation.blockSummary', {
    phrase,
    category: translate(language, first.matched_policies.some((policy) => policy.rule_id === 'VR-AMZ-TITLE-001' && policy.outcome === 'VIOLATION') ? 'validation.titleCategory' : 'validation.drugCategory'),
    more: violations.length > 1 ? translate(language, 'validation.more', { count: violations.length - 1 }) : '',
  }) : null;
  const hasEvidenceGap = segmentResults.some((segment) => segment.status === 'NEEDS_EVIDENCE');
  return {
    verdict: violations.length ? 'BLOCKED' : hasEvidenceGap ? 'NEEDS_REVISION' : 'PASS', ready_for_human_approval: !violations.length && !hasEvidenceGap,
    findings: [], missing_evidence: [], blocking_reasons: violations.length ? [translate(language, 'validation.humanReview')] : [], blocking_summary: blockingSummary,
    segment_results: segmentResults, trace_id: `val_${crypto.randomUUID()}`, rule_version: rules.map((rule) => rule.rule_id).join(','),
  };
}
