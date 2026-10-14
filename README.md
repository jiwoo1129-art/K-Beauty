# COMPLY.AI — Bilingual Beauty Listing Studio

Static Korean/English demo interface based on the publicly visible COMPLY.AI Listing Studio structure.

## Capabilities
- Korean/English UI switch with persisted preference
- Product information to English draft template (no AI service connected)
- TXT export / copy
- TXT or HTML import
- Preliminary keyword-based risk screening (not official compliance validation)

## Publish to GitHub Pages
1. Upload `index.html`, `README.md`, and `.github/workflows/deploy.yml` to the `main` branch of `jiwoo1129-art/K-Beauty` (preserve the workflow folder structure).
2. Under repository Settings → Pages → Build and deployment, choose **GitHub Actions** as the source.
3. After the workflow runs, visit https://jiwoo1129-art.github.io/K-Beauty/ .

## Limitation
The original application's source, back-end, policy engine, and API keys were not supplied. This demo is not a replacement for its actual AI generation or official regulatory validation. Never treat demo flags as compliance approval.
