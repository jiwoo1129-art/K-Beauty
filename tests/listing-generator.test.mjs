import test from 'node:test';
import assert from 'node:assert/strict';
import { countUtf8Bytes, generateListing, scoreProductFacts } from '../src/listingGenerator.js';

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
  assert.deepEqual(result.missing.slice(0, 5), ['productName', 'category', 'ingredients', 'benefits', 'directions']);
  assert.ok(result.score < 50);
});
