import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSegments } from '../src/writer/validationAgent.js';

const violatingSegment = [{
  section: 'description',
  index: 0,
  text: 'Clinically proven to heal acne.',
}];

test('validation reasons and blocking summary can be returned in English', () => {
  const result = validateSegments(violatingSegment, {}, 'en');
  assert.equal(result.verdict, 'BLOCKED');
  assert.match(result.segment_results[0].reason, /Violation reason:/);
  assert.match(result.blocking_summary, /Block reason:/);
  assert.match(result.blocking_reasons[0], /human review/i);
});

test('validation remains Korean by default', () => {
  const result = validateSegments(violatingSegment);
  assert.match(result.segment_results[0].reason, /위반 사유:/);
  assert.match(result.blocking_summary, /BLOCK 사유:/);
});

test('title-length reasons interpolate the measured lengths in English', () => {
  const title = 'A'.repeat(201);
  const result = validateSegments([{ section: 'title', index: 0, text: title }], {}, 'en');
  assert.match(result.segment_results[0].reason, /201 characters/);
  assert.match(result.segment_results[0].reason, /200-character limit/);
});
