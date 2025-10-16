#!/usr/bin/env bash
set -euo pipefail

# Creates a git bundle that contains every branch and tag in the repository.
# The resulting archive can be transferred to another machine and pushed to
# GitHub from there, bypassing the current network restrictions.

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

echo "\nNext steps: copy the bundle to a machine with GitHub access and run:"
echo "  git clone --bare https://github.com/clovervirus/GROW-APP.git"
echo "  cd GROW-APP.git"
echo "  git pull /path/to/${BUNDLE_NAME} --all"
echo "  git push origin --all"
echo "  git push origin --tags"
