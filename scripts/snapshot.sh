#!/usr/bin/env bash
set -euo pipefail

# Provides a quick snapshot of the repository state that mirrors the
# connectivity checklist used during the final handoff. The output is safe to
# re-run and intended to be copy/pasted into handoff notes.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

printf "\n## REMOTE\n"
if ! git remote -v; then
  echo "(no remotes configured)"
fi

printf "\n## LOCAL BRANCHES\n"
if ! git for-each-ref --format='%(if)%(HEAD)%(then)* %(else)  %(end)%(refname:short) %(subject)' \
  --sort='-committerdate' refs/heads/; then
  echo "(no branches)"
fi

printf "\n## REMOTE HEADS (origin)\n"
if git remote get-url origin >/dev/null 2>&1; then
  if remote_heads=$(git ls-remote --heads origin 2>&1); then
    if [[ -z "$remote_heads" ]]; then
      echo "(no heads returned)"
    else
      printf '%s\n' "$remote_heads" \
        | awk '{print $2}' \
        | sed 's#refs/heads/##'
    fi
  else
    printf '(error querying origin)\n%s\n' "$remote_heads"
  fi
else
  echo "(origin not set)"
fi

if git show main:.github/workflows/pages-cdn.yml >/dev/null 2>&1; then
  printf "\n## pages-cdn.yml exists on main ✅\n"
else
  printf "\n## pages-cdn.yml missing on main ❌\n"
fi
