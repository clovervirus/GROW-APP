#!/usr/bin/env bash
set -euo pipefail

# Creates a git bundle with every branch and tag so the repository can be
# transferred off this restricted VM. Optionally override OUTPUT_DIR or
# BUNDLE_NAME when invoking the script.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"
OUTPUT_DIR="${OUTPUT_DIR:-$REPO_ROOT/artifacts}"
mkdir -p "$OUTPUT_DIR"
BUNDLE_NAME="${BUNDLE_NAME:-grow-app-$(date +%Y%m%d-%H%M%S).bundle}"
BUNDLE_PATH="${OUTPUT_DIR}/${BUNDLE_NAME}"
echo "Creating bundle at: $BUNDLE_PATH"
# Include every branch and tag
git bundle create "$BUNDLE_PATH" --all
ls -lh "$BUNDLE_PATH"
echo
cat <<EOF
Bundle ready: $BUNDLE_PATH

Next steps (run on a networked machine):
  1. Transfer the bundle above off this VM.
  2. Run the following commands to push every branch and tag to GitHub:

git clone --bare https://github.com/clovervirus/GROW-APP.git
cd GROW-APP.git
git fetch "$BUNDLE_PATH" '+refs/heads/*:refs/heads/*'
git fetch "$BUNDLE_PATH" --tags
git push origin --all
git push origin --tags

EOF
