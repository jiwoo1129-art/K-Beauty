# Multi-Page Listing Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 화이트·주황 디자인과 제품·스캐닝 모션을 유지하면서 홈, Listing 작성, Listing 검증을 같은 사이트의 독립 경로로 제공한다.

**Architecture:** `window.location.pathname`과 History API를 감싼 작은 라우팅 모듈로 `/`, `/write`, `/validate`를 전환한다. 기존 생성기, 검증 엔진, 로컬 작업 저장소를 재사용하고 작성 폼·PDF 입력·복사·다운로드·페이지 간 전달만 확장한다.

**Tech Stack:** React 18, Vite 5, Node test runner, pdfjs-dist, browser localStorage, Sites hosting

## Global Constraints

- `/`의 화이트·주황 디자인, 제품 3D/2D 경험, 스캐닝 모션을 유지한다.
- 작성·검증 버튼은 새 탭이 아니라 같은 창의 `/write`, `/validate`로 이동한다.
- 파일과 작업 데이터는 브라우저 내부에서 처리하고 기존 자동 저장·복제·버전 기능을 유지한다.
- 라이트·다크 테마, 모바일 반응형, 키보드 접근성, `prefers-reduced-motion` 지원을 유지한다.
- 자동 결과가 Amazon/FDA 정책 준수를 보증하지 않는다는 안내를 유지한다.

---

## File Structure

- Create `src/routeState.js`: 경로 정규화와 History API 이동
- Create `src/productPdf.js`: PDF 텍스트 추출과 제품 정보 추론
- Modify `src/App.jsx`: 경로별 홈·작성·검증 화면 조합
- Modify `src/Hero.jsx`: 기존 CTA를 경로 이동 콜백으로 연결
- Modify `src/StudioWorkspace.jsx`: 경로 고정 모드, 참고 사이트 입력 필드, PDF 입력, 화면 간 전달
- Modify `src/ListingEditor.jsx`: 전체 복사, TXT 다운로드, 전체 정책 검토
- Modify `src/listingGenerator.js`: 확장 필드 기반 생성과 텍스트 직렬화
- Modify `src/styles.css`: 기존 디자인 토큰을 사용한 독립 작업 화면
- Modify `package.json`: `pdfjs-dist` 의존성
- Create `tests/route-state.test.mjs`: 경로 정규화
- Create `tests/product-pdf.test.mjs`: PDF 텍스트에서 제품 정보 추론
- Modify `tests/listing-generator.test.mjs`: 확장 필드와 TXT 출력
- Modify `tests/workspace-contract.test.mjs`: 독립 경로, PDF, 복사·다운로드·전달 계약

### Task 1: 홈·작성·검증 경로 분리

**Files:**
- Create: `src/routeState.js`
- Modify: `src/App.jsx`
- Modify: `src/Hero.jsx`
- Create: `tests/route-state.test.mjs`
- Modify: `tests/workspace-contract.test.mjs`

**Interfaces:**
- Produces: `normalizeRoute(pathname): 'home' | 'write' | 'validate'`
- Produces: `navigateTo(pathname): void`
- `App` passes `onNavigate(pathname)` to `Hero` and `StudioWorkspace`.

- [ ] **Step 1: Write the failing routing tests**

```js
// tests/route-state.test.mjs
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
```

Append to `tests/workspace-contract.test.mjs`:

```js
test('renders writing and validation as separate same-window routes', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /normalizeRoute/);
  assert.match(app, /popstate/);
  assert.match(app, /initialMode="write"/);
  assert.match(app, /initialMode="validate"/);
  assert.doesNotMatch(app, /target="_blank"/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test --test-isolation=none tests/route-state.test.mjs tests/workspace-contract.test.mjs`

Expected: FAIL because `src/routeState.js` does not exist and `App.jsx` does not render pathname routes.

- [ ] **Step 3: Implement the minimal route module**

```js
// src/routeState.js
export function normalizeRoute(pathname = '/') {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/write') return 'write';
  if (path === '/validate') return 'validate';
  return 'home';
}

export function navigateTo(pathname) {
  if (window.location.pathname === pathname) return;
  window.history.pushState({}, '', pathname);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
```

- [ ] **Step 4: Render one surface per route in `App.jsx`**

Use one `route` state initialized from `normalizeRoute(window.location.pathname)`, subscribe to `popstate`, and render:

```jsx
{route === 'home' && <Hero onSelect={(mode) => go(`/${mode}`)} />}
{route === 'write' && <StudioWorkspace initialMode="write" lockedMode onNavigate={go} />}
{route === 'validate' && <StudioWorkspace initialMode="validate" lockedMode onNavigate={go} />}
```

Convert the brand and navigation controls to buttons or links whose click handlers call `go('/')`, `go('/write')`, and `go('/validate')`. Keep `ThemeToggle` mounted on all routes and do not use `target="_blank"`.

- [ ] **Step 5: Lock `StudioWorkspace` to the route mode**

Change the signature to:

```jsx
export default function StudioWorkspace({ initialMode = 'write', lockedMode = false, onNavigate = () => {} })
```

When `lockedMode` is true, omit the internal tab list. Preserve the existing tab list for tests or embedded reuse when false.

- [ ] **Step 6: Run routing and full tests**

Run: `node --test --test-isolation=none tests/route-state.test.mjs tests/workspace-contract.test.mjs`

Expected: all selected tests PASS.

Run: `node --test --test-isolation=none tests/*.test.mjs`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/routeState.js src/App.jsx src/Hero.jsx src/StudioWorkspace.jsx tests/route-state.test.mjs tests/workspace-contract.test.mjs
git commit -m "feat: split listing studio into routes"
```

### Task 2: 참고 사이트 제품 입력과 PDF 자동 입력

**Files:**
- Create: `src/productPdf.js`
- Modify: `src/StudioWorkspace.jsx`
- Modify: `src/listingGenerator.js`
- Modify: `package.json`
- Create: `tests/product-pdf.test.mjs`
- Modify: `tests/listing-generator.test.mjs`

**Interfaces:**
- Produces: `inferProductFacts(text): Partial<ProductFacts>`
- Produces: `extractPdfText(file): Promise<string>`
- `ProductFacts` keys: `brand`, `productName`, `category`, `netContents`, `origin`, `ingredients`, `benefits`, `texture`, `audience`, `directions`, `warnings`, `brandTone`, `primaryKeyword`, `keywords`, `evidence`.

- [ ] **Step 1: Add failing PDF fact inference tests**

```js
// tests/product-pdf.test.mjs
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
```

Append to `tests/listing-generator.test.mjs`:

```js
test('includes verified commerce facts in the listing', () => {
  const listing = generateListing({
    brand: 'COMPLY LAB', productName: 'Barrier Serum', category: 'Skin Care - Face',
    netContents: '30 ml', origin: 'Korea', ingredients: 'Ceramide',
    benefits: 'supports hydrated-looking skin', texture: 'lightweight', audience: 'dry skin',
    directions: 'Apply twice daily', warnings: 'External use only', brandTone: 'clear',
    primaryKeyword: 'hydrating facial serum', keywords: 'ceramide serum', evidence: 'instrument test'
  });
  assert.match(listing.title, /30 ml/);
  assert.match(listing.description, /lightweight/);
  assert.match(listing.description, /External use only/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test --test-isolation=none tests/product-pdf.test.mjs tests/listing-generator.test.mjs`

Expected: FAIL because `productPdf.js` is missing and the generator ignores the added commerce facts.

- [ ] **Step 3: Add `pdfjs-dist`**

Run: `npm install pdfjs-dist@^4.10.38`

Expected: `package.json` and `package-lock.json` record `pdfjs-dist` without changing React or Vite versions.

- [ ] **Step 4: Implement PDF text extraction and labeled fact inference**

```js
// src/productPdf.js
const LABELS = {
  brand: ['브랜드명', 'brand'], productName: ['제품명', 'product name'],
  category: ['제품 유형', 'product type'], netContents: ['용량', 'net contents'],
  origin: ['원산지', 'country of origin'], ingredients: ['주요 성분', 'ingredients'],
  benefits: ['주요 특징', 'benefits'], texture: ['제형 및 사용감', 'texture'],
  audience: ['주요 고객', 'target customer'], directions: ['사용 방법', 'directions'],
  warnings: ['주의 사항', 'warnings'], brandTone: ['브랜드 톤', 'brand tone'],
  primaryKeyword: ['핵심 키워드', 'primary keyword'], keywords: ['추가 키워드', 'keywords'],
  evidence: ['효능 표현의 근거', '효능 근거', 'evidence']
};

export function inferProductFacts(text) {
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return Object.fromEntries(Object.entries(LABELS).flatMap(([key, labels]) => {
    const line = lines.find((value) => labels.some((label) => value.toLowerCase().startsWith(label.toLowerCase())));
    const value = line?.replace(/^[^:：]+[:：]\s*/, '').trim();
    return value ? [[key, value]] : [];
  }));
}

export async function extractPdfText(file) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url).toString();
  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => `${item.str}${item.hasEOL ? '\n' : ' '}`).join('').trim());
  }
  return pages.join('\n');
}
```

- [ ] **Step 5: Expand the product form without replacing the workspace engine**

In `StudioWorkspace.jsx`, expand `EMPTY_FACTS` and `FIELD_LABELS` to the documented 15 keys. Render:

- text inputs for brand, product name, capacity, origin, brand tone;
- a product-type select containing the reference site's Beauty categories and a direct-entry option;
- textareas or selectable suggestion chips for ingredients, benefits, texture, audience, directions, warnings, keywords, and evidence;
- a PDF input with `accept="application/pdf,.pdf"` and 15MB limit.

The PDF handler must reject oversized/non-PDF files, call `extractPdfText`, merge only non-empty inferred values into `current.facts`, and announce success or extraction failure through the existing `aria-live` region.

- [ ] **Step 6: Extend `generateListing` with the new verified fields**

Build the title from brand, product name, category, and net contents. Include texture, audience, origin, directions, and warnings only when supplied. Prefix search terms with `primaryKeyword`, deduplicate whitespace, and continue excluding unsupported claims.

- [ ] **Step 7: Run selected and full tests**

Run: `node --test --test-isolation=none tests/product-pdf.test.mjs tests/listing-generator.test.mjs`

Expected: all selected tests PASS.

Run: `node --test --test-isolation=none tests/*.test.mjs`

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/productPdf.js src/StudioWorkspace.jsx src/listingGenerator.js tests/product-pdf.test.mjs tests/listing-generator.test.mjs
git commit -m "feat: add complete product intake and PDF import"
```

### Task 3: 전체 복사·TXT 다운로드·검증 화면 전달

**Files:**
- Modify: `src/listingGenerator.js`
- Modify: `src/ListingEditor.jsx`
- Modify: `src/StudioWorkspace.jsx`
- Modify: `tests/listing-generator.test.mjs`
- Modify: `tests/workspace-contract.test.mjs`

**Interfaces:**
- Produces: `formatListingText(listing): string`
- Produces: `parseListingText(text): Listing`
- `ListingEditor` receives `onReviewAll(text): void`.
- `StudioWorkspace` saves `sourceText` before calling `onNavigate('/validate')`.

- [ ] **Step 1: Add failing formatter and UI contract tests**

Update the import in `tests/listing-generator.test.mjs` to include `formatListingText` and `parseListingText`:

```js
import { countUtf8Bytes, formatListingText, generateListing, parseListingText, scoreProductFacts } from '../src/listingGenerator.js';
```

Append to `tests/listing-generator.test.mjs`:

```js
test('formats a complete downloadable listing', () => {
  const text = formatListingText({
    title: 'Barrier Serum', bullets: ['Hydrating', 'Lightweight'],
    description: 'Daily serum.', searchTerms: 'face serum'
  });
  assert.equal(text, 'TITLE\nBarrier Serum\n\nBULLET POINTS\n1. Hydrating\n2. Lightweight\n\nDESCRIPTION\nDaily serum.\n\nSEARCH TERMS\nface serum');
  assert.deepEqual(parseListingText(text), {
    title: 'Barrier Serum', bullets: ['Hydrating', 'Lightweight'],
    description: 'Daily serum.', searchTerms: 'face serum'
  });
});
```

Append to `tests/workspace-contract.test.mjs`:

```js
test('supports whole-listing copy download and route transfer', async () => {
  const workspace = await readFile(new URL('../src/StudioWorkspace.jsx', import.meta.url), 'utf8');
  const editor = await readFile(new URL('../src/ListingEditor.jsx', import.meta.url), 'utf8');
  assert.match(editor, /전체 복사/);
  assert.match(editor, /TXT 다운로드/);
  assert.match(editor, /전체 정책 검토/);
  assert.match(editor, /URL\.createObjectURL/);
  assert.match(workspace, /onNavigate\('\/validate'\)/);
  assert.match(workspace, /수정 문구를 작성 화면으로 전달/);
  assert.match(workspace, /onNavigate\('\/write'\)/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test --test-isolation=none tests/listing-generator.test.mjs tests/workspace-contract.test.mjs`

Expected: FAIL because `formatListingText` and the three editor actions do not exist.

- [ ] **Step 3: Implement `formatListingText`**

```js
export function formatListingText(listing) {
  return [
    'TITLE', listing.title || '', '',
    'BULLET POINTS', ...(listing.bullets || []).map((item, index) => `${index + 1}. ${item}`), '',
    'DESCRIPTION', listing.description || '', '',
    'SEARCH TERMS', listing.searchTerms || ''
  ].join('\n');
}

export function parseListingText(text) {
  const source = String(text || '');
  const section = (name, next) => source.match(new RegExp(`${name}\\n([\\s\\S]*?)(?=\\n\\n${next}|$)`))?.[1]?.trim() || '';
  const title = section('TITLE', 'BULLET POINTS');
  const bulletText = section('BULLET POINTS', 'DESCRIPTION');
  const description = section('DESCRIPTION', 'SEARCH TERMS') || (!title ? source.trim() : '');
  const searchTerms = section('SEARCH TERMS', '$');
  return {
    title,
    bullets: bulletText.split(/\n/).map((line) => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean),
    description,
    searchTerms
  };
}
```

- [ ] **Step 4: Add the three whole-listing actions to `ListingEditor`**

Compute `const text = formatListingText(listing)`. The toolbar handlers must:

```js
await navigator.clipboard.writeText(text);
```

```js
const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'amazon-beauty-listing.txt';
link.click();
URL.revokeObjectURL(url);
```

```js
onReviewAll(text);
```

- [ ] **Step 5: Transfer the listing into the validation route**

In `StudioWorkspace`, implement:

```js
function reviewCompleteListing(text) {
  setCurrent((value) => ({ ...value, sourceText: text, findings: analyzeListing(text), ignored: [] }));
  store.save({ ...current, sourceText: text, findings: analyzeListing(text), ignored: [], mode: 'validate' });
  onNavigate('/validate');
}
```

Pass it as `onReviewAll={reviewCompleteListing}`. Keep the existing per-field review action; when the workspace is route-locked, it must also navigate to `/validate` after saving.

Add a validation result action labeled `수정 문구를 작성 화면으로 전달`. It must convert `current.sourceText` with `parseListingText`, save it as `current.listing` with mode `write`, then call `onNavigate('/write')`. For unstructured text, `parseListingText` places the entire source in `description` so the user never loses their draft.

- [ ] **Step 6: Run selected and full tests**

Run: `node --test --test-isolation=none tests/listing-generator.test.mjs tests/workspace-contract.test.mjs`

Expected: all selected tests PASS.

Run: `node --test --test-isolation=none tests/*.test.mjs`

Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/listingGenerator.js src/ListingEditor.jsx src/StudioWorkspace.jsx tests/listing-generator.test.mjs tests/workspace-contract.test.mjs
git commit -m "feat: connect listing export and policy review"
```

### Task 4: 현재 디자인 적용, 회귀 검증, 배포

**Files:**
- Modify: `src/styles.css`
- Modify: `tests/visual-contract.test.mjs`

**Interfaces:**
- Consumes: route-specific markup and actions from Tasks 1–3.
- Produces: responsive home, writing, and validation surfaces using the existing CSS token system.

- [ ] **Step 1: Add failing visual contract assertions**

Append to `tests/visual-contract.test.mjs`:

```js
test('styles route workspaces with the existing visual system', async () => {
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.route-workspace/);
  assert.match(css, /\.solution-nav/);
  assert.match(css, /\.listing-actions/);
  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /:focus-visible/);
});
```

- [ ] **Step 2: Run the visual contract and verify failure**

Run: `node --test --test-isolation=none tests/visual-contract.test.mjs`

Expected: FAIL because the new route-specific selectors are absent.

- [ ] **Step 3: Style the independent work surfaces**

Add `.route-workspace`, `.solution-nav`, `.listing-actions`, PDF import, suggestion-chip, form-section, and result-toolbar rules using the existing `--orange`, `--surface`, `--ink`, and border tokens. Keep the existing hero, 3D/2D model, `.claim-scan`, theme selectors, and reduced-motion block unchanged. At widths below the existing mobile breakpoint, stack the form and result panels and keep all controls at least 44px high.

- [ ] **Step 4: Run all automated checks**

Run: `node --test --test-isolation=none tests/*.test.mjs`

Expected: all tests PASS.

Run: `npm run build`

Expected: Vite production build succeeds with no unresolved imports.

- [ ] **Step 5: Perform browser QA**

Verify at desktop and mobile widths:

- `/` retains the white·orange hero, product visual, and scanning motion;
- both CTA buttons move in the same tab to the correct path;
- `/write` accepts required fields, a text PDF, generates a listing, copies it, downloads TXT, and sends it to validation;
- `/validate` accepts TXT/HTML, shows findings, and applies a suggestion;
- browser back/forward works;
- theme toggle, keyboard focus, reduced motion, and saved work remain functional.

- [ ] **Step 6: Commit**

```bash
git add src/styles.css tests/visual-contract.test.mjs
git commit -m "style: carry studio design across solution routes"
```

- [ ] **Step 7: Publish the exact tested commit**

Push the current commit to the existing Sites repository, package the successful build, save a new version, and deploy it with the site's existing owner-private audience. Confirm the production deployment reaches `succeeded` and return the existing copy URL.
