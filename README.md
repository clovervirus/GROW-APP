# Grow Suite CDN Scaffold

This repository packages the zero-install **Grow Suite** experience that was developed in a
network-restricted environment. It includes the Host Shell shim that embeds the Canvas Lighting
and Environment calculators, a Pages-friendly CDN distribution, and scripts for exporting the
workspace when direct pushes to GitHub are blocked.

## Repository Layout

| Path | Description |
| --- | --- |
| `grow-suite-cdn/` | Static CDN bundle that serves the Host Shell and tabs UI. |
| `grow-suite/` | Source reference for the Canvas calculators that the Host Shell loads. |
| `docs/final-handoff.md` | Checklist for exporting the repo, enabling GitHub Pages, and creating the draft PR. |
| `scripts/create-bundle.sh` | Helper for producing a portable `.bundle` file with every branch and tag. |
| `validation-report.md` | Latest status of remote connectivity and outstanding deployment steps. |

## Branches

The following local branches are ready to publish once GitHub access is available:

- `main`
- `feature/lighting`
- `feature/environment`
- `feature/host-shell`

Use the bundle script described below to move these branches to a machine with outbound network
access, then push them to the GitHub repository (`clovervirus/GROW-APP`).

## Exporting the Repository (Path A)

```bash
./scripts/create-bundle.sh
# => artifacts/grow-app-YYYYMMDD-HHMMSS.bundle
```

Transfer the generated bundle to a networked machine and run:

```bash
git clone --bare https://github.com/clovervirus/GROW-APP.git
cd GROW-APP.git
git pull /path/to/grow-app-YYYYMMDD-HHMMSS.bundle --all
git push origin --all
git push origin --tags
```

## Optional Proxy Push (Path B)

If valid proxy credentials become available in this environment, configure Git with:

```bash
git config --global http.proxy  http://USER:PASS@HOST:PORT
git config --global https.proxy http://USER:PASS@HOST:PORT
git push -u origin main
for b in feature/lighting feature/environment feature/host-shell; do
  git push -u origin "$b"
done
```

Expect `CONNECT tunnel failed` until the proxy allows authenticated GitHub traffic.

## GitHub UI Fallback (Path C)

When exporting is not possible, upload the core assets directly in the GitHub UI from a new
branch (for example `feature/bootstrap-pages`):

- `.github/workflows/pages-cdn.yml`
- `.github/workflows/pages-vite.yml`
- `grow-suite-cdn/`
- `.gitignore`
- `validation-report.md`

After uploading, open a PR and merge it into `main`.

## Enabling GitHub Pages

Once `main` is pushed, enable Pages from **Settings → Pages** with **Source: GitHub Actions**. The
`pages-cdn.yml` workflow deploys the static CDN app, and `pages-vite.yml` can be enabled for the
Vite build when desired.

## Local Smoke Test

To manually verify the CDN bundle before publishing, serve it locally:

```bash
cd grow-suite-cdn
python3 -m http.server 5173
```

Open `http://localhost:5173/` in a browser and provide the Lighting and Environment Canvas URLs in
the Host Shell tabs. Confirm that the "Ready" badges light up and that clicking **Send PPFD →
Environment** transfers the calculated PPFD value.

## Draft PR Creation

After the branches reach GitHub and a `GITHUB_TOKEN` is available, create the draft pull request:

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/clovervirus/GROW-APP/pulls" \
  -d '{
    "title": "Zero-install CDN scaffold",
    "head": "feature/lighting",
    "base": "main",
    "draft": true
  }' | jq -r '.html_url // "(created)"'
```
