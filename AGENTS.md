# Final Handoff Checklist

This document captures the steps required to publish the Grow Suite repositories from this
network-restricted environment.

## 1. Export every branch as a bundle (Path A)

Run the helper script to generate a portable bundle:

```bash
./scripts/create-bundle.sh
```

By default the archive is written to `artifacts/` with a timestamped name. Transfer that
bundle to a machine that can reach GitHub, then run:

```bash
git clone --bare https://github.com/clovervirus/GROW-APP.git
cd GROW-APP.git
git pull /path/to/<bundle>.bundle --all
git push origin --all
git push origin --tags
```

Verify that `main`, `feature/lighting`, `feature/environment`, and `feature/host-shell`
appear on the GitHub **Branches** page.

## 2. Optional: attempt a direct push (Path B)

If proxy credentials become available, configure them and retry the push:

```bash
git config --global http.proxy  http://USER:PASS@HOST:PORT
git config --global https.proxy http://USER:PASS@HOST:PORT
git push -u origin main
for b in feature/lighting feature/environment feature/host-shell; do
  git push -u origin "$b"
done
```

Expect the push to fail with `CONNECT tunnel failed` until valid proxy authentication is
in place.

## 3. GitHub UI fallback (Path C)

When neither of the above paths is possible, upload the required files directly in the
GitHub UI:

1. Create a new branch (for example `feature/bootstrap-pages`).
2. Upload the following paths from this workspace:
   - `.github/workflows/pages-cdn.yml`
   - `.github/workflows/pages-vite.yml`
   - `grow-suite-cdn/`
   - `.gitignore`
   - `validation-report.md`
3. Open a pull request and merge it into `main`.

## 4. Enable GitHub Pages

After the workflows are on `main`, enable Pages from **Settings → Pages** with
**Source: GitHub Actions**. The "Deploy CDN app (no build)" workflow publishes the site.

## 5. Create the draft PR

Once branches are pushed and a `GITHUB_TOKEN` is available, run the following from any
machine with curl and jq:

```bash
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/clovervirus/GROW-APP/pulls" \
  -d '{
    "title":"Zero-install CDN scaffold",
    "head":"feature/lighting",
    "base":"main",
    "draft":true
  }' | jq -r '.html_url // "(created)"'
```

## 6. Smoke-test the CDN deployment

Replace the placeholder URL with the actual Pages URL exposed by the workflow run:

```bash
URL="https://<owner>.github.io/<repo>/"
[ "$URL" = "https://<owner>.github.io/<repo>/" ] && { echo "⚠️ set URL"; exit 1; }
code=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
[[ "$code" == "200" ]] || { echo "HTTP $code from $URL"; exit 1; }
html=$(curl -s "$URL" | tr -d '\n')
[[ "$html" == *"Grow Suite (CDN)"* ]] || { echo "Missing app marker text"; exit 1; }

echo "✅ Pages is up: $URL"
```

## 7. Re-run validation after pushing

Back in this repository (or a clone), confirm the state with:

```bash
./scripts/create-bundle.sh # optional for future exports

set -euo pipefail
cd /workspace/GROW-APP
git remote -v
git branch -vv
if git remote get-url origin >/dev/null 2>&1; then
  git ls-remote --heads origin | awk '{print $2}' | sed 's#refs/heads/##'
fi
```

Document the final status in `validation-report.md` once everything is green.
