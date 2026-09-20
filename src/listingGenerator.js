export const REQUIRED_FIELDS = ['brand', 'productName', 'category', 'netContents', 'origin'];

const unsupportedClaim = /FDA approved|clinically proven|cures?|treats?|heals?|prevents?\s+(?:acne|disease|eczema)/i;

export const countUtf8Bytes = (text) => new TextEncoder().encode(String(text || '')).length;

export function formatListingText(listing) {
  return [
    'TITLE', listing.title || '', '',
    'BULLET POINTS', ...(listing.bullets || []).map((item, index) => `${index + 1}. ${item}`), '',
    'DESCRIPTION', listing.description || '', '',
    'SEARCH TERMS', listing.searchTerms || '',
  ].join('\n');
}

export function parseListingText(text) {
  const source = String(text || '').replace(/\r/g, '').trim();
  if (!source.startsWith('TITLE\n')) return { title: '', bullets: [], description: source, searchTerms: '' };
  const read = (start, end) => {
    const from = source.indexOf(`${start}\n`);
    if (from < 0) return '';
    const valueStart = from + start.length + 1;
    const to = end ? source.indexOf(`\n\n${end}\n`, valueStart) : source.length;
    return source.slice(valueStart, to < 0 ? source.length : to).trim();
  };
  return {
    title: read('TITLE', 'BULLET POINTS'),
    bullets: read('BULLET POINTS', 'DESCRIPTION').split('\n').map((line) => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean),
    description: read('DESCRIPTION', 'SEARCH TERMS'),
    searchTerms: read('SEARCH TERMS'),
  };
}

export function scoreProductFacts(facts) {
  const missing = REQUIRED_FIELDS.filter((key) => !String(facts[key] || '').trim());
  if (String(facts.benefits || '').trim() && !String(facts.evidence || '').trim()) missing.push('evidence');
  const total = REQUIRED_FIELDS.length + 1;
  return { score: Math.max(0, Math.round(100 * (1 - missing.length / total))), missing };
}

export function generateListing(facts) {
  const quality = scoreProductFacts(facts);
  const benefitParts = String(facts.benefits || '').split(/[,\n]/).map((value) => value.trim()).filter(Boolean);
  const safeBenefits = benefitParts.filter((value) => !unsupportedClaim.test(value));
  const rejectedCount = benefitParts.length - safeBenefits.length;
  const bullets = safeBenefits.length
    ? safeBenefits.map((benefit) => `Helps ${benefit.replace(/^helps\s+/i, '').replace(/[.]$/, '')}.`)
    : ['Supports a refreshed-looking skincare routine.'];

  return {
    title: `${facts.brand || ''} ${facts.productName || ''} ${facts.category || ''} ${facts.netContents || ''}`.replace(/\s+/g, ' ').trim(),
    bullets,
    description: [
      `${facts.productName || 'This product'} features ${facts.ingredients || 'carefully selected ingredients'}.`,
      facts.texture && `Texture: ${facts.texture}.`,
      facts.audience && `Designed for ${facts.audience}.`,
      facts.origin && `Country of origin: ${facts.origin}.`,
      facts.directions,
      facts.warnings && `Caution: ${facts.warnings}`,
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(),
    searchTerms: `${facts.primaryKeyword || ''} ${facts.keywords || ''}`.replace(/\s+/g, ' ').trim(),
    warnings: rejectedCount ? [`근거가 없거나 규제 위험이 있는 효능 표현 ${rejectedCount}개를 제외했습니다.`] : [],
    qualityScore: quality.score,
  };
}
