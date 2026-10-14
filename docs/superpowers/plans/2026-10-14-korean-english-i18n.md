# Korean and English UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent Korean/English UI toggle to COMPLY.AI Beauty Listing Studio without changing its existing visual design or interrupting any listing workflow.

**Architecture:** A dependency-free translation module owns locale normalization, persistence, interpolation, and matching Korean/English dictionaries. A React context exposes locale state without remounting page workflows. Existing UI components replace literal interface strings with translation keys while Amazon US listing output and selectable product taxonomy values remain English.

**Tech Stack:** React 18, Vite 5, Node test runner, browser localStorage, GitHub Actions and GitHub Pages

## Global Constraints

- Preserve the existing UI/UX, layout, styling, colors, fonts, animations, and page structure.
- Keep listing creation, compliance validation, file uploads, clipboard actions, and downloads working.
- Default to Korean, persist `ko` or `en` in `localStorage`, and recover invalid values to `ko`.
- Language changes must only re-render labels and must not reset form, file, draft, validation, handoff, or workspace state.
- Amazon US Listing content and product taxonomy values remain English; surrounding UI, validation explanations, and status messages are localized.
- Add no runtime dependency for internationalization.

---

### Task 1: Locale core and dictionary contract

**Files:**
- Create: `src/i18n.js`
- Create: `src/LanguageContext.jsx`
- Create: `tests/i18n.test.mjs`

**Interfaces:**
- Produces: `LANGUAGE_STORAGE_KEY`, `translations`, `normalizeLanguage(value)`, `readStoredLanguage(storage)`, `writeStoredLanguage(storage, language)`, `translate(language, key, values)`, `LanguageProvider`, and `useLanguage()`.

- [ ] **Step 1: Write failing locale tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { translations, normalizeLanguage, readStoredLanguage, writeStoredLanguage, translate } from '../src/i18n.js';

test('defaults missing and invalid language values to Korean', () => {
  assert.equal(normalizeLanguage(), 'ko');
  assert.equal(normalizeLanguage('fr'), 'ko');
  assert.equal(normalizeLanguage('en'), 'en');
});

test('Korean and English dictionaries expose identical keys', () => {
  assert.deepEqual(Object.keys(translations.ko).sort(), Object.keys(translations.en).sort());
});

test('stored language is restored and persisted safely', () => {
  const data = new Map([['comply.ai.language', 'en']]);
  const storage = { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
  assert.equal(readStoredLanguage(storage), 'en');
  writeStoredLanguage(storage, 'ko');
  assert.equal(data.get('comply.ai.language'), 'ko');
});

test('translations interpolate named values', () => {
  assert.equal(translate('en', 'validation.itemsFound', { count: 3 }), '3 review items found.');
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/i18n.test.mjs`

Expected: FAIL because `src/i18n.js` does not exist.

- [ ] **Step 3: Implement the locale API and complete dictionaries**

```js
export const LANGUAGE_STORAGE_KEY = 'comply.ai.language';
export const translations = {
  ko: { 'validation.itemsFound': '{count}개의 검토 항목을 찾았습니다.' },
  en: { 'validation.itemsFound': '{count} review items found.' },
};
export function normalizeLanguage(value) { return value === 'en' ? 'en' : 'ko'; }
export function readStoredLanguage(storage) {
  try { return normalizeLanguage(storage?.getItem(LANGUAGE_STORAGE_KEY)); } catch { return 'ko'; }
}
export function writeStoredLanguage(storage, language) {
  const normalized = normalizeLanguage(language);
  try { storage?.setItem(LANGUAGE_STORAGE_KEY, normalized); } catch { /* session state still works */ }
  return normalized;
}
export function translate(language, key, values = {}) {
  const template = translations[normalizeLanguage(language)][key];
  if (template === undefined) throw new Error(`Missing translation: ${key}`);
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}
```

`translations.ko` and `translations.en` must contain every literal introduced by Tasks 2–4 with identical keys.

```jsx
const LanguageContext = createContext(null);
export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => readStoredLanguage(window.localStorage));
  const setLanguage = (next) => setLanguageState(writeStoredLanguage(window.localStorage, next));
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key, values) => translate(language, key, values) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
```

- [ ] **Step 4: Run test and verify GREEN**

Run: `node --test tests/i18n.test.mjs`

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/i18n.js src/LanguageContext.jsx tests/i18n.test.mjs
git commit -m "feat: add Korean English locale foundation"
```

### Task 2: Persistent top-right language controls and landing/solution copy

**Files:**
- Create: `src/LanguageToggle.jsx`
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Modify: `src/Hero.jsx`
- Modify: `src/SolutionPage.jsx`
- Modify: `src/ThemeToggle.jsx`
- Modify: `src/styles.css`
- Modify: `src/solution.css`
- Create: `tests/i18n-ui-contract.test.mjs`

**Interfaces:**
- Consumes: `LanguageProvider` and `useLanguage()` from Task 1.
- Produces: `LanguageToggle`, rendered in the home navigation and solution-page top utility row.

- [ ] **Step 1: Write a failing UI contract test**

```js
test('language controls are available on home and workflow pages', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const solution = readFileSync(new URL('../src/SolutionPage.jsx', import.meta.url), 'utf8');
  assert.match(app, /<LanguageToggle/);
  assert.match(solution, /<LanguageToggle/);
});

test('application is wrapped once without remounting workflows on locale changes', () => {
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /<LanguageProvider>[\s\S]*<App \/>[\s\S]*<\/LanguageProvider>/);
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/i18n-ui-contract.test.mjs`

Expected: FAIL because the provider and toggle are not rendered.

- [ ] **Step 3: Add the provider, toggle, and translated copy**

```jsx
export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div className="language-toggle" role="group" aria-label={t('language.label')}>
      <button type="button" aria-pressed={language === 'ko'} onClick={() => setLanguage('ko')}>한국어</button>
      <span aria-hidden="true">/</span>
      <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
    </div>
  );
}
```

Wrap `<App />` in `<LanguageProvider>` in `main.jsx`. In each listed component call `const { t } = useLanguage()` and replace navigation, accessibility labels, hero text, CTA copy, footer disclaimer, workflow labels, solution headings, breadcrumbs, notes, and theme-toggle labels with dictionary keys. Keep existing class names and element ordering; only insert `LanguageToggle` beside the existing right-side navigation controls.

```css
.language-toggle { display: inline-flex; align-items: center; gap: .35rem; white-space: nowrap; }
.language-toggle button { font: inherit; color: inherit; background: transparent; border: 0; padding: 0; cursor: pointer; }
.language-toggle button[aria-pressed="true"] { font-weight: 800; }
```

Scope any required solution-page alignment rule to `.solution-crumb .language-toggle`; do not change colors, page dimensions, animations, or responsive breakpoints.

- [ ] **Step 4: Run locale and existing contract tests**

Run: `node --test tests/i18n.test.mjs tests/i18n-ui-contract.test.mjs tests/visual-contract.test.mjs tests/project-contract.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/main.jsx src/App.jsx src/Hero.jsx src/SolutionPage.jsx src/ThemeToggle.jsx src/LanguageToggle.jsx src/styles.css src/solution.css src/i18n.js tests/i18n-ui-contract.test.mjs
git commit -m "feat: add persistent language controls"
```

### Task 3: Localize listing creation without resetting input state

**Files:**
- Modify: `src/writer/WritingWorkspace.jsx`
- Modify: `src/writer/ProductChoiceField.jsx`
- Modify: `src/writer/ListingDraft.jsx`
- Modify: `src/i18n.js`
- Extend: `tests/i18n-ui-contract.test.mjs`

**Interfaces:**
- Consumes: `useLanguage()` and interpolation from Task 1.
- Preserves: `form`, `draft`, `validation`, `handoff`, `revisedItems`, `pdfStatus`, and `isGenerating` states inside their existing components.

- [ ] **Step 1: Add failing source and dictionary coverage tests**

```js
test('write workflow reads locale without keying or remounting its root', () => {
  const source = readFileSync(new URL('../src/writer/WritingWorkspace.jsx', import.meta.url), 'utf8');
  assert.match(source, /useLanguage\(\)/);
  assert.doesNotMatch(source, /key=\{language\}/);
});

test('write workflow no longer hard-codes Korean interface sentences', () => {
  for (const file of ['WritingWorkspace.jsx', 'ProductChoiceField.jsx', 'ListingDraft.jsx']) {
    const source = readFileSync(new URL(`../src/writer/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /제품을 알려주세요|선택하세요|입력 대기|검증 통과|TXT 다운로드/);
  }
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/i18n-ui-contract.test.mjs`

Expected: FAIL on the current Korean literals.

- [ ] **Step 3: Translate all creation workflow interface text**

Convert `fields`, field labels, and field groups to stable identifiers, then resolve their label, title, placeholder, group title, and hint with `t(...)` during render. Pass `t`-resolved copy into `SingleChoiceField` and `MultiChoiceField`, or call `useLanguage()` inside those components for select prompts, custom input labels, counts, and placeholders.

Use interpolated status keys for PDF errors and results:

```jsx
setPdfStatus({ text: t('write.pdf.imported', { count }), error: false });
setError(t('write.requiredError', { fields: nextDraft.missing.map((name) => t(`field.${name}`)).join(', ') }));
```

Translate all `ListingDraft` controls, states, aria labels, headings, output-outline labels, policy stamps, revised-copy labels, and download button labels. Do not translate `buildListingText(...)`, generated Listing sentences, filenames, product taxonomy values, or field values.

- [ ] **Step 4: Run focused and writer regression tests**

Run: `node --test tests/i18n.test.mjs tests/i18n-ui-contract.test.mjs tests/listing-generator.test.mjs tests/product-pdf.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/i18n.js src/writer/WritingWorkspace.jsx src/writer/ProductChoiceField.jsx src/writer/ListingDraft.jsx tests/i18n-ui-contract.test.mjs
git commit -m "feat: localize listing creation workflow"
```

### Task 4: Localize validation, result explanations, and retained workspace UI

**Files:**
- Modify: `src/writer/AgentWorkspace.jsx`
- Modify: `src/writer/AnnotatedValidationReport.jsx`
- Modify: `src/writer/validationAgent.js`
- Modify: `src/StudioWorkspace.jsx`
- Modify: `src/ListingEditor.jsx`
- Modify: `src/RiskReview.jsx`
- Modify: `src/complianceEngine.js`
- Modify: `src/i18n.js`
- Create: `tests/i18n-validation.test.mjs`
- Extend: `tests/i18n-ui-contract.test.mjs`

**Interfaces:**
- Changes: `validateSegments(segments, productFacts, language = 'ko')` and `analyzeListing(text, language = 'ko')` accept an optional locale while preserving existing Korean-default callers and test behavior.
- Produces: localized reasons, blocking summaries, upload errors, statuses, report labels, result actions, and retained workspace messages.

- [ ] **Step 1: Write failing validation-language tests**

```js
test('validation reasons can be returned in English', () => {
  const result = validateSegments([{ section: 'description', index: 0, text: 'Clinically proven to heal acne.' }], {}, 'en');
  assert.equal(result.verdict, 'BLOCKED');
  assert.match(result.segment_results[0].reason, /Violation reason:/);
  assert.match(result.blocking_summary, /Block reason:/);
});

test('validation remains Korean by default', () => {
  const result = validateSegments([{ section: 'description', index: 0, text: 'Clinically proven to heal acne.' }]);
  assert.match(result.segment_results[0].reason, /위반 사유:/);
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/i18n-validation.test.mjs`

Expected: FAIL because `validateSegments` ignores the third argument.

- [ ] **Step 3: Localize active validation and report UI**

Pass `language` from `useLanguage()` to `validateSegments`. Replace hard-coded reasons with language-specific templates while keeping rule IDs, verdict enum values, source URLs, offsets, and matching logic unchanged.

```js
function validationCopy(language) {
  return language === 'en'
    ? { reasonPrefix: 'Violation reason:', noViolation: 'No violating expression was found by applicable policy rules.' }
    : { reasonPrefix: '위반 사유:', noViolation: '적용 가능한 정책 규칙에서 위반 표현이 발견되지 않았습니다.' };
}
```

Translate all file prompts, run buttons, summaries, handoff receipts, report counts, aria labels, policy-source links, and empty states in `AgentWorkspace` and `AnnotatedValidationReport`.

- [ ] **Step 4: Localize retained workspace and engine result copy**

Use the same locale context for `StudioWorkspace`, `ListingEditor`, and `RiskReview`. Pass locale to `analyzeListing` so rule reasons and suggestions that are UI instructions can be shown in Korean or English. Preserve the detected source sentence and safe replacement sentence in English because they are Listing content.

- [ ] **Step 5: Run validation and full regression tests**

Run: `npm test`

Expected: every existing and new test passes with zero failures.

- [ ] **Step 6: Commit**

```bash
git add src/i18n.js src/writer/AgentWorkspace.jsx src/writer/AnnotatedValidationReport.jsx src/writer/validationAgent.js src/StudioWorkspace.jsx src/ListingEditor.jsx src/RiskReview.jsx src/complianceEngine.js tests/i18n-validation.test.mjs tests/i18n-ui-contract.test.mjs
git commit -m "feat: localize validation and result messages"
```

### Task 5: GitHub Pages-compatible routing and deployment

**Files:**
- Modify: `src/routeState.js`
- Modify: `src/writer/AgentWorkspace.jsx`
- Create: `.github/workflows/deploy-pages.yml`
- Modify: `tests/route-state.test.mjs`

**Interfaces:**
- Produces: base-aware `routeHref(path, base = import.meta.env.BASE_URL)` used for programmatic full-page navigation.
- Deployment output: Vite `dist` plus an identical `404.html` SPA fallback.

- [ ] **Step 1: Write failing base-path route tests**

```js
test('routeHref keeps workflow routes under a repository base path', () => {
  assert.equal(routeHref('/write', '/K-Beauty/'), '/K-Beauty/write');
  assert.equal(routeHref('/validate', './'), '/validate');
});

test('normalizeRoute accepts a repository base path', () => {
  assert.equal(normalizeRoute('/K-Beauty/write', '/K-Beauty/'), 'write');
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/route-state.test.mjs`

Expected: FAIL because `routeHref` and base stripping do not exist.

- [ ] **Step 3: Implement base-aware routing**

```js
export function basePath(base = import.meta.env.BASE_URL) {
  return base === './' || base === '/' ? '' : `/${String(base).replace(/^\/+|\/+$/g, '')}`;
}
export function routeHref(path, base) { return `${basePath(base)}${path === '/' ? '/' : path}`; }
export function normalizeRoute(pathname, base) {
  const prefix = basePath(base);
  const path = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) || '/' : pathname;
  return path === '/write' ? 'write' : path === '/validate' ? 'validate' : 'home';
}
```

Use `routeHref('/write')` instead of the absolute `window.location.assign('/write')` handoff. Keep History API behavior unchanged in local development.

- [ ] **Step 4: Add the Pages workflow**

```yaml
name: Deploy GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build -- --base=/K-Beauty/
      - run: cp dist/index.html dist/404.html
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 5: Verify build output and commit**

Run: `npm test && npm run build -- --base=/K-Beauty/`

Expected: tests pass, build exits 0, and `dist/index.html` references `/K-Beauty/assets/`.

```bash
git add src/routeState.js src/writer/AgentWorkspace.jsx tests/route-state.test.mjs .github/workflows/deploy-pages.yml
git commit -m "ci: deploy Beauty Listing Studio to Pages"
```

### Task 6: Browser verification, repository push, and live deployment check

**Files:**
- No production file changes unless a failing verification produces a focused test-first fix.

**Interfaces:**
- Verifies: persisted language, state preservation, desktop/mobile layout, workflow functionality, GitHub Actions deployment, and public URL.

- [ ] **Step 1: Run complete verification**

Run: `npm test`

Run: `npm run build -- --base=/K-Beauty/`

Run: `git diff --check`

Expected: all exit 0 with no test failures or whitespace errors.

- [ ] **Step 2: Verify both languages in a real browser**

Start `npm run dev`, then check `/`, `/write`, and `/validate` at desktop and mobile widths. Confirm Korean is the first-load default, English persists after reload, each language renders every control and validation result, and switching after typing form data leaves the typed value and active workflow unchanged.

- [ ] **Step 3: Verify functional workflows**

Create a Listing, upload a supported PDF, upload a TXT/HTML Listing, run validation, apply or hand off revisions, copy output, and trigger TXT/JSON downloads. Confirm each completes in both UI languages without console errors.

- [ ] **Step 4: Push commits to the requested GitHub repository**

Verify the authenticated GitHub identity and repository default branch, then push the implementation commits to `https://github.com/jiwoo1129-art/K-Beauty` without force-pushing or overwriting unrelated history.

- [ ] **Step 5: Confirm Pages deployment**

Check the GitHub Actions Pages job and open the returned environment URL. Confirm the home page and direct `/write` and `/validate` links render with assets, then report the exact live URL and any repository setting that still requires the owner's approval.
