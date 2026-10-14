# COMPLY.AI — Korean/English Demo

## Deploy on GitHub Pages

1. **Extract** the ZIP. Upload `index.html`, `404.html`, `.nojekyll`, and `.github/workflows/pages.yml` to the **root** of the `main` branch of `jiwoo1129-art/K-Beauty`. Do not upload the ZIP as a ZIP file or put the files under another folder.
2. Delete any old `.github/workflows/deploy.yml` to avoid two workflows deploying the same site.
3. Go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Go to **Actions → Deploy COMPLY.AI to GitHub Pages**, verify the run has a green check. Optionally run it using **Run workflow**.
5. Visit https://jiwoo1129-art.github.io/K-Beauty/ . If stale, hard refresh or add `?v=2`.

## Alternative (without Actions)

Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch `main` → Folder `/(root)` → Save.

## What it does

Korean/English language switch with saved preference, browser-based listing template, TXT download and preliminary keyword screening. This is a prototype, **not** a connected Amazon/FDA policy engine. No server-side or API-based analysis.
