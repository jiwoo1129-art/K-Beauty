export const REQUIRED_FIELDS = ['brand', 'productName', 'category', 'ingredients', 'benefits', 'directions'];

const unsupportedClaim = /FDA approved|clinically proven|cures?|treats?|heals?|prevents?\s+(?:acne|disease|eczema)/i;

export const countUtf8Bytes = (text) => new TextEncoder().encode(String(text || '')).length;

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
    title: `${facts.brand || ''} ${facts.productName || ''} ${facts.category || ''}`.replace(/\s+/g, ' ').trim(),
    bullets,
    description: `${facts.productName || 'This product'} features ${facts.ingredients || 'carefully selected ingredients'}. ${facts.directions || ''}`.replace(/\s+/g, ' ').trim(),
    searchTerms: String(facts.keywords || '').trim(),
    warnings: rejectedCount ? [`근거가 없거나 규제 위험이 있는 효능 표현 ${rejectedCount}개를 제외했습니다.`] : [],
    qualityScore: quality.score,
  };
}
