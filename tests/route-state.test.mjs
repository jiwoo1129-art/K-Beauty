import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRoute } from '../src/routeState.js';

test('normalizes the three supported routes', () => {
  assert.equal(normalizeRoute('/'), 'home');
  assert.equal(normalizeRoute('/write'), 'write');
  assert.equal(normalizeRoute('/write/'), 'write');
  assert.equal(normalizeRoute('/validate'), 'validate');
  assert.equal(normalizeRoute('/unknown'), 'home');
});
