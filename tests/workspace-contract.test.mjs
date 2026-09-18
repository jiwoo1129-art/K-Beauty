import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('connects generation validation files editing and copy feedback', async () => {
  const workspace = await readFile(new URL('../src/StudioWorkspace.jsx', import.meta.url), 'utf8');
  const editor = await readFile(new URL('../src/ListingEditor.jsx', import.meta.url), 'utf8');
  const review = await readFile(new URL('../src/RiskReview.jsx', import.meta.url), 'utf8');
  assert.match(workspace, /aria-live="polite"/);
  assert.match(workspace, /htmlFor=/);
  assert.match(workspace, /\.txt,\.html,\.htm,\.md,\.csv/);
  assert.match(workspace, /2MB/);
  assert.match(workspace, /scrollIntoView/);
  assert.match(editor, /navigator\.clipboard\.writeText/);
  assert.match(editor, /복사됨/);
  assert.match(review, /수정안 적용/);
  assert.match(review, /지적 제외/);
  assert.match(workspace, /정책 준수를 보증하지 않습니다/);
});

test('connects local workspace management actions', async () => {
  const workspace = await readFile(new URL('../src/StudioWorkspace.jsx', import.meta.url), 'utf8');
  for (const phrase of ['작업 복제', '작업 삭제', '버전 저장', '버전 복원', 'JSON 백업', 'JSON 가져오기']) assert.match(workspace, new RegExp(phrase));
});
