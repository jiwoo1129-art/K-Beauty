import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkspaceStore } from '../src/workspaceStore.js';

test('saves duplicates snapshots restores and imports workspaces', () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const store = createWorkspaceStore(storage);
  const saved = store.save({ name: 'Serum launch', input: 'draft', result: {} });
  const snap = store.snapshot(saved.id);
  store.save({ ...saved, input: 'changed' });
  const restored = store.restore(saved.id, snap.id);
  const copy = store.duplicate(saved.id);
  assert.equal(restored.input, 'draft');
  assert.notEqual(copy.id, saved.id);
  assert.equal(createWorkspaceStore(storage).importJson(store.exportJson()).length, 2);
});

test('rejects incompatible backup data', () => {
  const storage = { getItem: () => null, setItem: () => {} };
  assert.throws(() => createWorkspaceStore(storage).importJson('{"schemaVersion":2,"workspaces":[]}'), /지원하지 않는 백업/);
});
