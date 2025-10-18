# GROW-APP — Codex Ticket vs Codespaces (Decision + First-Launch Guide)

## Executive summary

If your VM can’t `git push` (proxy **CONNECT 403**), you have two viable ways to ship:

* **GPT Codex Ticket (Bundle/Upload path):** Export a **git bundle** from the restricted VM, push it from any networked machine, enable **GitHub Pages**, and smoke-test. This is the most reliable under network blocks.
* **GitHub Codespaces (Cloud dev box):** Great once your code is in the repo, or if you can upload the bundle/zip from your local machine’s browser. Codespaces avoids local proxy issues, but you **still need to move your repo** out of the restricted VM (bundle/zip/UI upload).

**Recommendation:** If you’re blocked right now, run the **Codex Ticket** below (Path A). If you want a comfortable, online IDE for further work, adopt **Codespaces** after the first push.

---

## Quick chooser

| Situation                        | Pick                                      |
| -------------------------------- | ----------------------------------------- |
| VM blocked by proxy              | **Codex Ticket**                          |
| You can upload a file in browser | **Either** (Codex first, then Codespaces) |
| Need web IDE & terminals         | **Codespaces**                            |
| No local admin rights/tools      | **Codex Ticket**                          |

> Long prose stays out of the table per guideline. Details in sections below.

---

## Path A — GPT **Codex Ticket** (offline-friendly, copy-paste)

This is the single, copy-paste plan to get **GROW-APP** deployed to **GitHub Pages** even when `git push` is blocked in your VM.

### A0) One-time snapshot (safe to re-run)

```bash
set -euo pipefail
cd /workspace/GROW-APP || true

printf "\n## REMOTE\n"; git remote -v || true
printf "\n## LOCAL BRANCHES\n"; git branch -vv || true
if git remote get-url origin >/dev/null 2>&1; then
  printf "\n## REMOTE HEADS (origin)\n"; git ls-remote --heads origin | awk '{print $2}' | sed 's#refs/heads/##'
else
  echo "(origin not set)"
fi

# Workflow presence on main
if git show main:.github/workflows/pages-cdn.yml >/dev/null 2>&1; then
  echo "\n## pages-cdn.yml exists on main ✅"
else
  echo "\n## pages-cdn.yml missing on main ❌"
fi
```

### A1) From the **restricted VM** — export a portable bundle with all branches/tags

```bash
cd /workspace/GROW-APP
mkdir -p artifacts
cat > scripts/create-bundle.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"
OUTPUT_DIR="${OUTPUT_DIR:-$REPO_ROOT/artifacts}"
mkdir -p "$OUTPUT_DIR"
BUNDLE_NAME="${BUNDLE_NAME:-grow-app-$(date +%Y%m%d-%H%M%S).bundle}"
BUNDLE_PATH="${OUTPUT_DIR}/${BUNDLE_NAME}"
echo "Creating bundle at: $BUNDLE_PATH"
git bundle create "$BUNDLE_PATH" --all
ls -lh "$BUNDLE_PATH"
echo "\nNext: download that file and continue on any networked machine."
BASH
chmod +x scripts/create-bundle.sh
./scripts/create-bundle.sh
# => artifacts/grow-app-YYYYMMDD-HHMMSS.bundle (download this file)
```

### A2) On **any machine with Internet** — push the bundle to GitHub

```bash
# Replace with your repo slug if different
REPO_SLUG="clovervirus/GROW-APP"

# Bare clone then pull from the bundle
rm -rf GROW-APP.git 2>/dev/null || true
git clone --bare "https://github.com/${REPO_SLUG}.git"
cd GROW-APP.git
# Path to the downloaded bundle file
BUNDLE="/absolute/path/to/grow-app-YYYYMMDD-HHMMSS.bundle"  # <-- set this
[ -f "$BUNDLE" ] || { echo "Bundle not found: $BUNDLE"; exit 1; }

git pull "$BUNDLE" --all

git push origin --all
git push origin --tags
```

### A3) Ensure Pages workflow is present on `main` (if missing)

```bash
# In a normal clone (not bare), add the Pages workflow if it isn't already on main
cd ..
rm -rf GROW-APP 2>/dev/null || true
git clone "https://github.com/${REPO_SLUG}.git"
cd GROW-APP

mkdir -p .github/workflows
cat > .github/workflows/pages-cdn.yml <<'YAML'
name: Deploy CDN app (no build)
on:
  push:
    branches: [ main ]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: true
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Upload static site
        uses: actions/upload-pages-artifact@v3
        with:
          path: grow-suite-cdn
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
YAML

git add .github/workflows/pages-cdn.yml
git commit -m "chore: deploy CDN app to Pages" || true
git push origin main
```

### A4) Enable GitHub Pages and deploy

* Repo **Settings → Pages** → **Source: GitHub Actions**.
* The workflow **Deploy CDN app (no build)** will publish your site on success.

### A5) (Optional) Create a **draft PR** for review

```bash
# Requires a classic token with repo scope in $GITHUB_TOKEN
REPO_SLUG="clovervirus/GROW-APP"
: "${GITHUB_TOKEN:?Set GITHUB_TOKEN and rerun}"

curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${REPO_SLUG}/pulls" \
  -d '{
    "title":"Zero-install CDN scaffold",
    "head":"feature/lighting",
    "base":"main",
    "draft":true
  }' | jq -r '.html_url // "(created)"'
```

### A6) Smoke-test the deployed Pages site

```bash
URL="https://<owner>.github.io/<repo>/"  # replace
[ "$URL" = "https://<owner>.github.io/<repo>/" ] && { echo "⚠️ set URL"; exit 1; }
code=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
[[ "$code" == "200" ]] || { echo "HTTP $code from $URL"; exit 1; }
html=$(curl -s "$URL" | tr -d '\n')
[[ "$html" == *"Grow Suite (CDN)"* ]] || { echo "Missing app marker text"; exit 1; }
echo "✅ Pages is up: $URL"
```

---
