import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS, analyzeListing, sanitizeImportedText } from '../src/complianceEngine.js';

test('removes executable HTML and reports risk evidence', () => {
  assert.equal(MAX_FILE_SIZE, 2 * 1024 * 1024);
  assert.ok(SUPPORTED_EXTENSIONS.includes('.csv'));
  const clean = sanitizeImportedText('<script>alert(1)</script><p>FDA approved acne cure</p>', '.html');
  assert.doesNotMatch(clean, /script|alert/i);
  const findings = analyzeListing(clean);
  assert.equal(findings[0].risk, 'HIGH');
  assert.match(findings[0].reason, /FDA|치료/);
  assert.match(findings[0].sourceUrl, /^https:\/\//);
  assert.ok(findings[0].suggestion);
  assert.ok(findings[0].end > findings[0].start);
});

test('detects guarantees promotions and uppercase abuse', () => {
  const findings = analyzeListing('BEST SERUM. GUARANTEED RESULTS INSTANTLY. FREE SHIPPING');
  assert.ok(findings.some((item) => item.category === 'absolute'));
  assert.ok(findings.some((item) => item.category === 'promotion'));
  assert.ok(findings.some((item) => item.category === 'uppercase'));
});
