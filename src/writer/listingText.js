function valueOrFallback(value) {
  return String(value || '').trim() || 'Not provided';
}

export function revealTextParts(parts = [], visibleCharacters = 0) {
  let remaining = Math.max(0, visibleCharacters);
  return parts.map((part) => {
    const text = String(part || '');
    const visible = text.slice(0, remaining);
    remaining = Math.max(0, remaining - text.length);
    return visible;
  });
}

export function buildListingText(draft = {}) {
  const info = draft.productInfo || {};
  const paragraphs = draft.description?.paragraphs || (draft.description?.text ? [draft.description.text] : []);
  return [
    '=== Basic Product Info ===',
    `Brand: ${valueOrFallback(info.brand)}`,
    `Product Name: ${valueOrFallback(info.productName)}`,
    `Product Type: ${valueOrFallback(info.productType)}`,
    `Net Contents: ${valueOrFallback(info.netContents)}`,
    `Country of Origin: ${valueOrFallback(info.countryOfOrigin)}`,
    '',
    '=== Title ===',
    valueOrFallback(draft.title?.text),
    '',
    '=== Bullet Points ===',
    ...(draft.bullets || []).map((item) => `- ${item.text}`),
    '',
    '=== Product Description ===',
    ...paragraphs.flatMap((paragraph, index) => index ? ['', paragraph] : [paragraph]),
    '',
    '=== How to Use ===',
    valueOrFallback(draft.howToUse),
    '',
    '=== Caution ===',
    valueOrFallback(draft.caution),
    '',
    '=== Backend Search Terms ===',
    valueOrFallback(draft.searchTerms),
  ].join('\n');
}

export function buildListingFilename(draft = {}) {
  const info = draft.productInfo || {};
  const slug = `${info.brand || ''}-${info.productName || ''}`
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'amazon-product'}-amazon-listing.txt`;
}

export function buildRevisedListingText(originalListing = '', revisedItems = []) {
  const source = String(originalListing || '');
  const replacements = [];
  let cursor = 0;

  for (const item of revisedItems) {
    const original = String(item.source_text ?? item.original_text ?? '');
    const replacement = String(item.text || '');
    if (!original || !replacement) continue;

    if (Number.isInteger(item.source_start) && Number.isInteger(item.source_end)) {
      if (source.slice(item.source_start, item.source_end) === original) {
        replacements.push({ start: item.source_start, end: item.source_end, text: replacement });
      }
      continue;
    }

    const start = source.indexOf(original, cursor);
    if (start < 0) continue;
    const end = start + original.length;
    replacements.push({ start, end, text: replacement });
    cursor = end;
  }

  return replacements
    .sort((a, b) => b.start - a.start)
    .reduce((text, item) => text.slice(0, item.start) + item.text + text.slice(item.end), source);
}

