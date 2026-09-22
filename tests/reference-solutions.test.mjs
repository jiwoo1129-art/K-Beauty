import test from 'node:test';
import assert from 'node:assert/strict';
import { buildListingDraft, toValidationSegments } from '../src/writer/writerAgent.js';
import { validateSegments } from '../src/writer/validationAgent.js';
import { createWriterHandoff } from '../src/writer/agentWorkflow.js';
import { buildListingText, buildRevisedListingText } from '../src/writer/listingText.js';

test('reference writer generates five bullets and a complete listing from five required facts', () => {
  const missing = buildListingDraft({ brandName: 'Mizu' });
  assert.equal(missing.status, 'BLOCKED_BY_MISSING_INFORMATION');
  const draft = buildListingDraft({ brandName: 'Mizu', productName: 'Barrier Serum', productType: 'Skin Care - Face', netContents: '30 mL', countryOfOrigin: 'Korea', keyFeatures: 'lightweight hydration' });
  assert.equal(draft.status, 'READY');
  assert.equal(draft.bullets.length, 5);
  assert.match(buildListingText(draft), /=== Backend Search Terms ===/);
  assert.equal(toValidationSegments(draft).length, 7);
});

test('reference validation flags the same drug claim and hands off only flagged text', () => {
  const source = 'Mizu serum cures acne\nGentle daily care';
  const result = validateSegments([
    { section: 'title', index: 0, text: 'Mizu serum cures acne' },
    { section: 'description', index: 0, text: 'Gentle daily care' },
  ]);
  assert.equal(result.verdict, 'BLOCKED');
  assert.equal(result.segment_results[0].status, 'VIOLATION');
  assert.equal(result.segment_results[1].status, 'COMPLIANT');
  const handoff = createWriterHandoff(result, source);
  assert.equal(handoff.revision_tasks.length, 1);
  assert.equal(handoff.revision_tasks[0].source_start, 0);
  assert.equal(buildRevisedListingText(source, [{ ...handoff.revision_tasks[0], text: 'Mizu serum for daily care' }]), 'Mizu serum for daily care\nGentle daily care');
});

test('reference title length rule blocks titles over 200 characters', () => {
  const result = validateSegments([{ section: 'title', index: 0, text: 'A'.repeat(201) }]);
  assert.equal(result.verdict, 'BLOCKED');
  assert.match(result.blocking_summary, /글자 수 제한/);
});
