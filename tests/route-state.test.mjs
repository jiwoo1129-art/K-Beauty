import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRoute, routeHref } from '../src/routeState.js';

test('normalizes the three supported routes', () => {
  assert.equal(normalizeRoute('/'), 'home');
  assert.equal(normalizeRoute('/write'), 'write');
  assert.equal(normalizeRoute('/write/'), 'write');
  assert.equal(normalizeRoute('/validate'), 'validate');
  assert.equal(normalizeRoute('/unknown'), 'home');
});

test('keeps workflow routes under a repository base path', () => {
  assert.equal(routeHref('/write', '/K-Beauty/'), '/K-Beauty/write');
  assert.equal(routeHref('/validate', '/K-Beauty/'), '/K-Beauty/validate');
  assert.equal(routeHref('/', '/K-Beauty/'), '/K-Beauty/');
  assert.equal(routeHref('/write', './'), '/write');
});

test('normalizes routes after removing a repository base path', () => {
  assert.equal(normalizeRoute('/K-Beauty/', '/K-Beauty/'), 'home');
  assert.equal(normalizeRoute('/K-Beauty/write', '/K-Beauty/'), 'write');
  assert.equal(normalizeRoute('/K-Beauty/validate/', '/K-Beauty/'), 'validate');
});
