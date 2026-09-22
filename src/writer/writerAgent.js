const REQUIRED_FIELDS = ['brandName', 'productName', 'productType', 'netContents', 'countryOfOrigin'];
const RISKY_CLAIMS = /\b(?:cures?|treats?|heals?|prevents?|fights?\s+acne|acne(?:\s+treatment)?|eczema|rosacea|psoriasis|FDA\s+(?:approved|certified)|clinically\s+proven|guaranteed|100%|permanent)\b/gi;

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function safeText(value) {
  return clean(value)
    .replace(RISKY_CLAIMS, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s*(?:and|or)\s+/i, '')
    .trim();
}

function sentence(value) {
  const text = safeText(value).replace(/[.]+$/, '');
  return text ? `${text}.` : '';
}

function joinTitle(parts) {
  return safeText(parts.filter(Boolean).join(', ')).slice(0, 200).replace(/[ ,]+$/, '');
}

export function normalizeWriterInput(input = {}) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, clean(value)]));
}

export function buildListingDraft(rawInput = {}) {
  const input = normalizeWriterInput(rawInput);
  const missing = REQUIRED_FIELDS.filter((key) => !input[key]);
  if (missing.length) return { status: 'BLOCKED_BY_MISSING_INFORMATION', missing };

  const title = joinTitle([
    `${input.brandName} ${input.productName}`,
    input.productType,
    input.keyIngredients,
    input.keyFeatures,
    input.netContents,
  ]);
  const supportedClaim = input.approvedClaims && input.evidenceSummary
    ? sentence(input.approvedClaims)
    : '';
  const claimNotice = input.approvedClaims && !input.evidenceSummary
    ? 'Approved claims were omitted because evidence was not supplied.'
    : '';
  const featureSentence = sentence(input.keyFeatures);
  const ingredientSentence = sentence(input.keyIngredients
    ? `The formula features ${input.keyIngredients}`
    : `The product is presented as a ${input.productType}`);
  const textureSentence = sentence(input.texture
    ? `The ${input.texture.toLowerCase()} texture is designed to fit comfortably into a daily routine`
    : `The ${input.productType.toLowerCase()} format is designed for straightforward daily application`);
  const customerSentence = sentence(input.targetCustomer
    ? `Created for ${input.targetCustomer.toLowerCase()}`
    : `Created for customers building a consistent beauty routine`);
  const directionsSentence = sentence(input.howToUse || 'Follow the directions printed on the product packaging');
  const facts = [
    `DAILY BEAUTY BENEFIT — ${featureSentence} ${sentence(`Use ${input.productName} as a consistent step in your everyday beauty routine`)}`,
    `FORMULA HIGHLIGHTS — ${ingredientSentence} ${sentence('Every ingredient statement is based only on the product information supplied')}`,
    `TEXTURE & FINISH — ${textureSentence} ${sentence('Layer it with the other steps in your routine according to the provided directions')}`,
    `MADE FOR YOUR ROUTINE — ${customerSentence} ${sentence(`This ${input.productType.toLowerCase()} offers a focused way to add the stated product features to regular care`)}`,
    `HOW TO USE — ${directionsSentence} ${sentence('Use only as directed and review the product label before application')}`,
  ];

  const descriptionParagraphs = [
    `${sentence(`${input.productName} by ${input.brandName} is a ${input.productType.toLowerCase()} created for ${input.keyFeatures}`)} ${sentence('Its focused format makes the verified product features easy to understand and add to a regular beauty routine')}`,
    `${ingredientSentence} ${sentence('The formula description is limited to the ingredient and product facts supplied for this Listing')}`,
    `${textureSentence} ${sentence(input.targetCustomer ? `It is positioned for ${input.targetCustomer.toLowerCase()}` : 'It is designed for regular cosmetic use')}`,
    `${directionsSentence} ${sentence(input.caution || 'Review all directions and cautions shown on the product packaging before use')}`,
    supportedClaim ? `${supportedClaim} ${sentence(`Supporting basis supplied: ${input.evidenceSummary}`)}` : '',
  ].filter(Boolean);

  return {
    status: 'READY',
    productInfo: {
      brand: input.brandName,
      productName: input.productName,
      productType: input.productType,
      netContents: input.netContents,
      countryOfOrigin: input.countryOfOrigin,
    },
    title: { sentence_id: 'T01', text: title },
    bullets: facts.map((text, index) => ({ sentence_id: `B0${index + 1}`, text })),
    description: {
      sentence_id: 'D01',
      paragraphs: descriptionParagraphs,
      text: descriptionParagraphs.join('\n\n'),
    },
    howToUse: directionsSentence,
    caution: sentence(input.caution),
    claimNotice,
    searchTerms: safeText(`${input.primaryKeyword || ''} ${input.secondaryKeywords || ''}`)
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(Boolean)
      .filter((term, index, terms) => terms.indexOf(term) === index)
      .join(' '),
  };
}

export function rewriteFlaggedSentence(task = {}) {
  const original = clean(task.source_text);
  let revised = original
    .replace(/\b(?:cures?|treats?|heals?|prevents?)\s+(?:acne|eczema|rosacea|psoriasis|damaged skin)(?:\s+(?:fast|quickly))?/gi, 'helps improve the look of visible skin concerns')
    .replace(/\b(?:acne(?:\s+treatment)?|eczema|rosacea|psoriasis)\b/gi, 'visible skin concerns')
    .replace(/\bFDA\s+(?:approved|certified)\b/gi, 'made with carefully selected cosmetic ingredients')
    .replace(/\bclinically\s+proven\b/gi, 'designed for cosmetic care')
    .replace(/\b(?:guaranteed|100%|permanent)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
  if (!revised || revised === original) revised = 'Designed to support the appearance of well-cared-for skin.';
  return { sentence_id: task.sentence_id || `${task.section || 'description'}:${task.index || 0}`, text: sentence(revised) };
}

export function toValidationSegments(draft = {}) {
  if (draft.status !== 'READY') return [];
  return [draft.title, ...(draft.bullets || []), draft.description].filter(Boolean).map((item, index) => ({
    section: item.sentence_id.startsWith('T') ? 'title' : item.sentence_id.startsWith('B') ? 'bullet_points' : 'description',
    index,
    sentence_id: item.sentence_id,
    text: item.text,
  }));
}

export function applyRevisions(sentences = [], revisionTasks = []) {
  const tasks = new Map(revisionTasks.map((task) => [task.sentence_id, task]));
  return sentences.map((item) => tasks.has(item.sentence_id)
    ? { ...item, text: rewriteFlaggedSentence(tasks.get(item.sentence_id)).text }
    : item);
}

