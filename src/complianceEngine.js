export const MAX_FILE_SIZE = 2 * 1024 * 1024;
export const SUPPORTED_EXTENSIONS = ['.txt', '.html', '.htm', '.md', '.csv'];

const FDA_CLAIMS = 'https://www.fda.gov/cosmetics/cosmetics-labeling/cosmetics-labeling-claims';
const FDA_LABELING = 'https://www.fda.gov/cosmetics/cosmetics-labeling-regulations/summary-cosmetics-labeling-requirements';
const FTC_ADS = 'https://www.ftc.gov/business-guidance/advertising-marketing/advertising-marketing-basics';
const AMAZON_TITLES = 'https://sellercentral.amazon.com/seller-forums/discussions/t/c9d67ab5-b7ef-4d79-a371-bcf70dd08ddf';

const RULES = [
  { category: 'drug', pattern: /\b(cures?|treats?|heals?|prevents?)\b[^.!?\n]*(acne|eczema|disease|infection)?/gi, risk: 'HIGH', reason: '질병의 치료·예방 또는 신체 기능 변화로 해석될 수 있습니다.', evidenceLabel: 'FDA Cosmetics Labeling Claims', sourceUrl: FDA_CLAIMS, suggestion: 'Helps improve the look of blemishes' },
  { category: 'fda', pattern: /\b(FDA[- ]?(?:approved|certified|registered))\b/gi, risk: 'HIGH', reason: '일반 화장품이 FDA의 사전 승인을 받은 것처럼 오인될 수 있습니다.', evidenceLabel: 'FDA Cosmetics Labeling Requirements', sourceUrl: FDA_LABELING, suggestion: 'Formulated in accordance with applicable cosmetic labeling requirements' },
  { category: 'absolute', pattern: /\b(guaranteed|100% guaranteed|always works?|zero risk|permanent(?:ly)?)\b/gi, risk: 'HIGH', reason: '객관적 근거 없이 절대적인 결과를 보장하는 표현입니다.', evidenceLabel: 'FTC Advertising Basics', sourceUrl: FTC_ADS, suggestion: 'Designed to support visible-looking results with consistent use' },
  { category: 'superiority', pattern: /\b(best|number\s*1|#1|superior|ultimate)\b/gi, risk: 'MEDIUM', reason: '비교 우위 표현에는 객관적이고 최신인 근거가 필요합니다.', evidenceLabel: 'FTC Truth in Advertising', sourceUrl: FTC_ADS, suggestion: 'A focused formula for everyday skincare' },
  { category: 'instant', pattern: /\b(instant(?:ly)?|immediate(?:ly)?|overnight miracle)\b/gi, risk: 'MEDIUM', reason: '즉각적인 효과를 단정하면 소비자를 오인시킬 수 있습니다.', evidenceLabel: 'FTC Advertising Basics', sourceUrl: FTC_ADS, suggestion: 'Helps skin look refreshed after use' },
  { category: 'promotion', pattern: /\b(free shipping|limited time|buy now|sale|coupon)\b/gi, risk: 'MEDIUM', reason: '상품 설명과 제목에는 프로모션성 문구를 분리하는 것이 안전합니다.', evidenceLabel: 'Amazon Product Title Requirements', sourceUrl: AMAZON_TITLES, suggestion: '프로모션 문구 삭제' },
];

function decodeEntities(text) {
  return text.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
}

export function sanitizeImportedText(raw, extension = '.txt') {
  if (!/\.html?$/i.test(extension)) return String(raw || '').replace(/\u0000/g, '');
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(String(raw || ''), 'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,noscript').forEach((node) => node.remove());
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }
  return decodeEntities(String(raw || '').replace(/<(script|style|iframe|object|embed|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

export function analyzeListing(text) {
  const source = String(text || '');
  const findings = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      findings.push({ id: `${rule.category}-${match.index}`, source: match[0], start: match.index, end: match.index + match[0].length, risk: rule.risk, category: rule.category, reason: rule.reason, evidenceLabel: rule.evidenceLabel, sourceUrl: rule.sourceUrl, suggestion: rule.suggestion });
    }
  }
  const capitals = source.match(/\b[A-Z][A-Z\s]{9,}\b/g) || [];
  capitals.forEach((match) => {
    const start = source.indexOf(match);
    findings.push({ id: `uppercase-${start}`, source: match, start, end: start + match.length, risk: 'LOW', category: 'uppercase', reason: '과도한 대문자는 읽기 어렵고 Amazon 제목 품질 기준에 맞지 않을 수 있습니다.', evidenceLabel: 'Amazon Product Title Requirements', sourceUrl: AMAZON_TITLES, suggestion: match.toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase()) });
  });
  const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return findings.sort((a, b) => rank[a.risk] - rank[b.risk] || a.start - b.start);
}
