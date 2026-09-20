import test from 'node:test';
import assert from 'node:assert/strict';
import { inferProductFacts } from '../src/productPdf.js';

test('infers labeled Korean and English product facts', () => {
  const facts = inferProductFacts(`브랜드명: COMPLY LAB
제품명: Evidence Barrier Serum
제품 유형: Skin Care - Face
용량: 30 ml
원산지: Republic of Korea
주요 성분: Ceramide, Panthenol
주요 특징: lightweight hydration
사용 방법: Apply twice daily
효능 근거: Instrumental hydration test`);
  assert.equal(facts.brand, 'COMPLY LAB');
  assert.equal(facts.productName, 'Evidence Barrier Serum');
  assert.equal(facts.netContents, '30 ml');
  assert.match(facts.ingredients, /Ceramide/);
  assert.match(facts.evidence, /Instrumental/);
});
