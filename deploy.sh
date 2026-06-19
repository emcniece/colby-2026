#!/usr/bin/env bash
# Copy git-changed files into upload-to-nb/ for NationBuilder deployment.
#
# On the first run: diffs against downloaded-from-nb/ (the NB baseline).
# On subsequent runs: diffs against the git SHA recorded at last deploy.
# Also includes any uncommitted working-tree changes.
#
# Template files (.html) still need to be pasted into NationBuilder's
# template code editor — drag-and-drop only works for static assets.

set -euo pipefail
cd "$(dirname "$0")"

DEPLOY_SHA_FILE=".last-deploy-sha"
count=0

stage_file() {
  local path="$1"
  [[ -f "$path" ]] || return 0  # skip deletions
  local dest="upload-to-nb/$(basename "$path")"
  cp "$path" "$dest"
  echo "  $(basename "$path")"
  (( count++ )) || true
}

is_source_file() {
  case "$1" in
    templates/*.html | stylesheets/* | javascripts/*.js | files/*) return 0 ;;
    *) return 1 ;;
  esac
}

if [[ -f "$DEPLOY_SHA_FILE" ]]; then
  base=$(cat "$DEPLOY_SHA_FILE")
  echo "Files changed since last deploy (${base:0:8}):"

  # Collect paths from: committed changes + staged + unstaged + untracked
  while IFS= read -r path; do
    is_source_file "$path" && stage_file "$path"
  done < <(
    { git diff --name-only "$base" HEAD
      git diff --name-only HEAD
      git diff --name-only
      git ls-files --others --exclude-standard
    } | sort -u
  )

else
  echo "No deploy record — comparing against NB baseline (downloaded-from-nb/):"

  for path in templates/*.html stylesheets/theme.scss javascripts/*.js files/*; do
    local_baseline="downloaded-from-nb/$(basename "$path")"
    if [[ ! -f "$local_baseline" ]] || ! diff -q "$path" "$local_baseline" > /dev/null 2>&1; then
      stage_file "$path"
    fi
  done
fi

if [[ $count -eq 0 ]]; then
  echo "  (nothing changed since last deploy)"
fi

echo ""
echo "${count} file(s) staged in upload-to-nb/"

# Record the current HEAD so the next run diffs against it
git rev-parse HEAD > "$DEPLOY_SHA_FILE"
