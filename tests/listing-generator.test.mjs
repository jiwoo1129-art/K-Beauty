import test from 'node:test';
import assert from 'node:assert/strict';
import { countUtf8Bytes, formatListingText, generateListing, parseListingText, scoreProductFacts } from '../src/listingGenerator.js';

test('scores required facts and excludes unsupported claims', () => {
  const facts = { brand: 'COMPLY LAB', productName: 'Barrier Serum', category: 'Serum', ingredients: 'Ceramide', benefits: 'hydrates, FDA approved, heals acne', evidence: '', certifications: '', directions: 'Apply twice daily', keywords: 'k beauty serum' };
  assert.equal(scoreProductFacts(facts).missing.includes('evidence'), true);
  const listing = generateListing(facts);
  assert.doesNotMatch(JSON.stringify(listing), /FDA approved|heals acne/i);
  assert.equal(listing.warnings.length > 0, true);
  assert.equal(countUtf8Bytes('케이뷰티'), 12);
});

test('requires the core product facts', () => {
  const result = scoreProductFacts({ brand: 'A' });
  assert.deepEqual(result.missing.slice(0, 4), ['productName', 'category', 'netContents', 'origin']);
  assert.ok(result.score < 50);
});

test('includes verified commerce facts in the listing', () => {
  const listing = generateListing({
    brand: 'COMPLY LAB', productName: 'Barrier Serum', category: 'Skin Care - Face',
    netContents: '30 ml', origin: 'Korea', ingredients: 'Ceramide',
    benefits: 'supports hydrated-looking skin', texture: 'lightweight', audience: 'dry skin',
    directions: 'Apply twice daily', warnings: 'External use only', brandTone: 'clear',
    primaryKeyword: 'hydrating facial serum', keywords: 'ceramide serum', evidence: 'instrument test'
  });
  assert.match(listing.title, /30 ml/);
  assert.match(listing.description, /lightweight/);
  assert.match(listing.description, /External use only/);
});

test('formats and parses a complete downloadable listing', () => {
  const listing = { title: 'Barrier Serum', bullets: ['Hydrating', 'Lightweight'], description: 'Daily serum.', searchTerms: 'face serum' };
  const text = formatListingText(listing);
  assert.equal(text, 'TITLE\nBarrier Serum\n\nBULLET POINTS\n1. Hydrating\n2. Lightweight\n\nDESCRIPTION\nDaily serum.\n\nSEARCH TERMS\nface serum');
  assert.deepEqual(parseListingText(text), listing);
});

test('keeps unstructured validation copy as the description', () => {
  assert.deepEqual(parseListingText('A draft without headings'), { title: '', bullets: [], description: 'A draft without headings', searchTerms: '' });
});

test('parses headings after compliance capitalization fixes', () => {
  const text = 'Title\nBarrier Serum\n\nBullet Points\n1. Hydrating\n\nDescription\nDaily serum.\n\nSearch Terms\nface serum';
  assert.deepEqual(parseListingText(text), { title: 'Barrier Serum', bullets: ['Hydrating'], description: 'Daily serum.', searchTerms: 'face serum' });
});
