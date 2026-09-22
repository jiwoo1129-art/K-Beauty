import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('connects reference writing and validation flows', async () => {
  const write = await readFile(new URL('../src/writer/WritingWorkspace.jsx', import.meta.url), 'utf8');
  const validate = await readFile(new URL('../src/writer/AgentWorkspace.jsx', import.meta.url), 'utf8');
  const result = await readFile(new URL('../src/writer/ListingDraft.jsx', import.meta.url), 'utf8');
  const report = await readFile(new URL('../src/writer/AnnotatedValidationReport.jsx', import.meta.url), 'utf8');
  assert.match(write, /PDF에서 제품 정보 자동 입력/);
  assert.match(write, /필수 정보/);
  assert.match(write, /Listing 초안 생성/);
  assert.match(validate, /\.txt,\.html,\.htm/);
  assert.match(validate, /단락별 정책 검증/);
  assert.match(validate, /글쓰기 에이전트로 넘기기/);
  assert.match(result, /전체 Listing 복사/);
  assert.match(result, /TXT 다운로드/);
  assert.match(report, /원문 위반 검토/);
});

test('renders writing and validation as separate same-window routes', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /normalizeRoute/);
  assert.match(app, /popstate/);
  assert.match(app, /<SolutionPage solution=\{route\}/);
  assert.doesNotMatch(app, /target="_blank"/);
});

test('supports the reference product intake and local PDF autofill', async () => {
  const write = await readFile(new URL('../src/writer/WritingWorkspace.jsx', import.meta.url), 'utf8');
  assert.match(write, /application\/pdf,\.pdf/);
  assert.match(write, /15MB/);
  assert.match(write, /extractPdfText/);
  for (const label of ['제품 유형', '용량', '원산지', '제형 및 사용감', '주요 고객', '브랜드 톤']) assert.match(write, new RegExp(label));
});

test('supports whole-listing copy download and two-way route transfer', async () => {
  const validate = await readFile(new URL('../src/writer/AgentWorkspace.jsx', import.meta.url), 'utf8');
  const write = await readFile(new URL('../src/writer/WritingWorkspace.jsx', import.meta.url), 'utf8');
  const result = await readFile(new URL('../src/writer/ListingDraft.jsx', import.meta.url), 'utf8');
  assert.match(result, /전체 Listing 복사/);
  assert.match(result, /TXT 다운로드/);
  assert.match(result, /URL\.createObjectURL/);
  assert.match(validate, /saveWriterHandoff/);
  assert.match(validate, /window\.location\.assign\('\/write'\)/);
  assert.match(write, /comply\.writerHandoff/);
});
