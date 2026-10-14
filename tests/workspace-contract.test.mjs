import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('connects reference writing and validation flows', async () => {
  const i18n = await readFile(new URL('../src/i18n.js', import.meta.url), 'utf8');
  const write = await readFile(new URL('../src/writer/WritingWorkspace.jsx', import.meta.url), 'utf8');
  const validate = await readFile(new URL('../src/writer/AgentWorkspace.jsx', import.meta.url), 'utf8');
  const result = await readFile(new URL('../src/writer/ListingDraft.jsx', import.meta.url), 'utf8');
  const report = await readFile(new URL('../src/writer/AnnotatedValidationReport.jsx', import.meta.url), 'utf8');
  assert.match(write, /write\.pdfTitle/);
  assert.match(write, /write\.requiredProgress/);
  assert.match(write, /write\.generate/);
  assert.match(i18n, /PDF에서 제품 정보 자동 입력/);
  assert.match(validate, /\.txt,\.html,\.htm/);
  assert.match(validate, /agent\.run/);
  assert.match(validate, /agent\.writerHandoff/);
  assert.match(result, /draft\.copyAll/);
  assert.match(result, /common\.downloadTxt/);
  assert.match(report, /report\.title/);
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
  const i18n = await readFile(new URL('../src/i18n.js', import.meta.url), 'utf8');
  assert.match(write, /application\/pdf,\.pdf/);
  assert.match(i18n, /15MB/);
  assert.match(write, /extractPdfText/);
  for (const label of ['제품 유형', '용량', '원산지', '제형 및 사용감', '주요 고객', '브랜드 톤']) assert.match(i18n, new RegExp(label));
});

test('supports whole-listing copy download and two-way route transfer', async () => {
  const validate = await readFile(new URL('../src/writer/AgentWorkspace.jsx', import.meta.url), 'utf8');
  const write = await readFile(new URL('../src/writer/WritingWorkspace.jsx', import.meta.url), 'utf8');
  const result = await readFile(new URL('../src/writer/ListingDraft.jsx', import.meta.url), 'utf8');
  assert.match(result, /draft\.copyAll/);
  assert.match(result, /common\.downloadTxt/);
  assert.match(result, /URL\.createObjectURL/);
  assert.match(validate, /saveWriterHandoff/);
  assert.match(validate, /window\.location\.assign\(routeHref\('\/write'\)\)/);
  assert.match(write, /comply\.writerHandoff/);
});
