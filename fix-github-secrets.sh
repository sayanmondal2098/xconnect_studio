#!/usr/bin/env bash
set -euo pipefail

REMOTE="${1:-origin}"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Run this from inside a git repo."
  exit 1
fi

if [ -z "${BRANCH}" ]; then
  echo "ERROR: Could not detect current branch."
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "ERROR: You have uncommitted changes. Commit/stash first."
  exit 1
fi

ensure_filter_repo() {
  if command -v git-filter-repo >/dev/null 2>&1; then
    return 0
  fi

  echo "git-filter-repo not found. Trying apt..."
  if command -v apt >/dev/null 2>&1; then
    if sudo -n true 2>/dev/null || sudo true; then
      sudo apt update
      if sudo apt install -y git-filter-repo; then
        return 0
      fi
    fi
  fi

  echo "apt install failed/unavailable. Trying pipx..."
  if command -v pipx >/dev/null 2>&1; then
    pipx install git-filter-repo || pipx upgrade git-filter-repo || true
    if command -v git-filter-repo >/dev/null 2>&1; then
      return 0
    fi
  fi

  echo "pipx not available or failed. Using local venv..."
  if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: python3 not found."
    exit 1
  fi

  python3 -m venv .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install --upgrade pip
  pip install git-filter-repo
}

echo "== Ensuring git-filter-repo =="
ensure_filter_repo

echo "== Removing .env and .envvvvv from all history =="
git filter-repo --force --path .env --path .envvvvv --invert-paths

echo "== Pruning old objects locally =="
git reflog expire --expire=now --all || true
git gc --prune=now --aggressive || true

echo "== Updating .gitignore =="
touch .gitignore
grep -qxF ".env" .gitignore || printf "\n# Ignore env files (secrets)\n.env\n.env.*\n!.env.example\n" >> .gitignore

echo "== Creating .env.example (safe) =="
if [ ! -f .env.example ]; then
  cat > .env.example <<'EOF'
# Example env file (NO real secrets)
# cp .env.example .env
GITHUB_TOKEN=replace_me
API_KEY=replace_me
EOF
fi

if ! git diff --quiet; then
  git add .gitignore .env.example || true
  git commit -m "chore: ignore env files and add env example"
fi

echo "== Force pushing rewritten history =="
git push --force-with-lease "${REMOTE}" "${BRANCH}"

echo "DONE. Revoke the leaked token(s) and generate new ones."
