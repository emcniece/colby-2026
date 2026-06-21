#!/usr/bin/env bash
# Usage: bash commit.sh "commit message"
# Stages all tracked changes, commits, updates .last-deploy-sha, and clears upload-to-nb/.

set -euo pipefail
cd "$(dirname "$0")"

if [ -z "${1:-}" ]; then
  echo "Usage: bash commit.sh \"commit message\""
  exit 1
fi

git add -u
git commit -m "$1"
git rev-parse HEAD > .last-deploy-sha
rm -rf ./upload-to-nb/*

echo "Committed $(cat .last-deploy-sha | head -c 7) — upload-to-nb/ cleared."
