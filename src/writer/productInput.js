export const PRODUCT_TYPES = [
  'Makeup - Body', 'Makeup - Eyes', 'Makeup - Face', 'Makeup - Lips', 'Makeup Palette', 'Makeup Remover',
  'Skin Care - Body', 'Skin Care - Eyes', 'Skin Care - Face', 'Skin Care - Lip Care', 'Skin Care - Sunscreen',
  'Hair Care - Shampoo & Conditioner', 'Hair Care - Styling', 'Hair Care - Treatment', 'Hair Care - Scalp',
  "Fragrance - Women's", "Fragrance - Men's", 'Foot, Hand & Nail Care', 'Personal Care - Bath & Body',
  'Personal Care - Deodorant', 'Personal Care - Oral Care', "Men's Grooming - Shave", "Men's Grooming - Skin Care",
];

export const KEY_INGREDIENTS = [
  'Centella Asiatica / Cica', 'Snail Mucin', 'Heartleaf', 'Rice Extract', 'Ginseng', 'Mugwort',
  'Propolis / Honey Extract', 'White Truffle', 'Niacinamide', 'Hyaluronic Acid', 'Ceramides',
  'Peptides / Copper Tripeptide', 'PDRN / Salmon DNA', 'Salicylic Acid (BHA)', 'AHA / PHA / LHA',
  'Retinol / Retinal / Bakuchiol', 'Vitamin C', 'Tea Tree', 'Panthenol',
];

export const TEXTURES = [
  'Watery / Essence-like', 'Viscous / Slimy', 'Lightweight Gel', 'Gel-Cream', 'Milky / Emulsion',
  'Rich Cream / Balm', 'Serum / Ampoule', 'Light Facial Oil', 'Bi-phase / Dual-layer', 'Dewy / Glass Skin',
  'Velvet / Semi-Matte', 'Matte / Oil-Control', 'Non-Greasy / Fast-Absorbing', 'Plumping & Nourishing',
];

export const TARGET_CUSTOMERS = [
  'Normal Skin', 'Dry Skin', 'Oily Skin', 'Combination Skin', 'Dehydrated Skin', 'Sensitive Skin',
  'Blemish-Prone Skin', 'Mature Skin', 'Dullness', 'Dryness', 'Excess Oil', 'Redness',
  'Uneven Texture', 'Loss of Firmness', 'Pores', 'Uneven Skin Tone',
];

export const KEYWORDS = [
  'hydrating facial serum', 'face serum', 'hyaluronic acid serum', 'ceramide serum', 'lightweight serum',
];

function splitChoices(value = '') {
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

export function mergeChoice(value, choice, checked) {
  const items = splitChoices(value).filter((item) => item !== choice);
  if (checked) items.push(choice);
  return [...new Set(items)].join(', ');
}

function labelValue(text, labels) {
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:${labels.join('|')})\\s*[:：-]\\s*([^\\n]+)`, 'i'));
  return match?.[1]?.trim() || '';
}

function found(text, options) {
  const normalized = text.toLowerCase();
  return options.filter((item) => normalized.includes(item.toLowerCase())).join(', ');
}

export function extractProductFields(text, current = {}) {
  const extracted = {
    brandName: labelValue(text, ['brand(?: name)?', '브랜드(?:명)?']),
    productName: labelValue(text, ['product name', '제품명']),
    productType: labelValue(text, ['product type', '제품 유형', 'category', '카테고리']),
    netContents: labelValue(text, ['net contents?', 'net weight', '용량']),
    countryOfOrigin: labelValue(text, ['country of origin', '원산지', 'made in']),
    keyIngredients: found(text, KEY_INGREDIENTS),
    texture: found(text, TEXTURES),
    targetCustomer: found(text, TARGET_CUSTOMERS),
  };

  return Object.fromEntries(
    Object.keys({ ...current, ...extracted }).map((key) => [key, current[key] || extracted[key] || '']),
  );
}

