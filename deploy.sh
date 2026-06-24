#!/usr/bin/env bash
# Stage git-changed files and upload them to NationBuilder.
#
# STAGING
#   First run: diffs against downloaded-from-nb/ baseline.
#   Subsequent runs: diffs against the SHA recorded in .last-deploy-sha.
#   Uncommitted working-tree changes are always included.
#
# UPLOADING
#   Requires .nb-cookies — copy the full Cookie header value from DevTools
#   while logged into NationBuilder admin and paste it into that file.
#   Refresh the file when uploads start failing with session/CSRF errors.
#
# FLAGS
#   --upload   Also upload all staged files to NationBuilder via curl.
#              Without this flag, deploy.sh only stages files into upload-to-nb/.

set -euo pipefail
cd "$(dirname "$0")"

NB_HOST="https://langford2026electioncampaign.nationbuilder.com"
NB_THEME_ID="6a35a28b1c12ee3267034f74"
NB_UPLOAD_URL="$NB_HOST/admin/sites/1/themes/$NB_THEME_ID/attachments?browser_id=default"

DEPLOY_SHA_FILE=".last-deploy-sha"
COOKIE_FILE=".nb-cookies"
UPLOAD=false
[[ "${1:-}" == "--upload" ]] && UPLOAD=true

count=0
upload_count=0
upload_errors=0

# ── Helpers ───────────────────────────────────────────────────────────────────

stage_file() {
  local path="$1"
  [[ -f "$path" ]] || return 0
  mkdir -p upload-to-nb
  cp "$path" "upload-to-nb/$(basename "$path")"
  echo "  staged:   $(basename "$path")"
  (( count++ )) || true
}

is_source_file() {
  case "$1" in
    templates/*.html | stylesheets/* | javascripts/*.js | files/*) return 0 ;;
    *) return 1 ;;
  esac
}

mime_for() {
  case "$1" in
    *.html)        echo "text/html" ;;
    *.scss|*.css)  echo "text/css" ;;
    *.js)          echo "application/javascript" ;;
    *.svg)         echo "image/svg+xml" ;;
    *.png)         echo "image/png" ;;
    *.jpg|*.jpeg)  echo "image/jpeg" ;;
    *.gif)         echo "image/gif" ;;
    *.woff2)       echo "font/woff2" ;;
    *.woff)        echo "font/woff" ;;
    *.ttf)         echo "font/ttf" ;;
    *)             echo "application/octet-stream" ;;
  esac
}

# ── Stage ─────────────────────────────────────────────────────────────────────

if [[ -f "$DEPLOY_SHA_FILE" ]]; then
  base=$(cat "$DEPLOY_SHA_FILE")
  echo "Files changed since last deploy (${base:0:8}):"

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
echo "$count file(s) staged in upload-to-nb/"

git rev-parse HEAD > "$DEPLOY_SHA_FILE"

$UPLOAD || exit 0

# ── Upload ────────────────────────────────────────────────────────────────────

uploadable=()
for filepath in upload-to-nb/*; do
  [[ -f "$filepath" ]] && uploadable+=("$filepath")
done

if [[ ${#uploadable[@]} -eq 0 ]]; then
  exit 0
fi

if [[ ! -f "$COOKIE_FILE" ]]; then
  echo ""
  echo "ERROR: $COOKIE_FILE not found."
  echo "Copy the Cookie header value from NationBuilder DevTools and save it to that file."
  exit 1
fi

echo ""
echo "Uploading ${#uploadable[@]} file(s) to NationBuilder..."

# Fetch the upload page to get a fresh CSRF token
echo "Fetching upload page for CSRF token..."
page_html=$(curl -s --compressed -w "\n__HTTP_STATUS__:%{http_code}" \
  -b "$(cat "$COOKIE_FILE")" \
  "$NB_UPLOAD_URL")

http_status=$(echo "$page_html" | grep -o '__HTTP_STATUS__:[0-9]*' | cut -d: -f2)
page_html=$(echo "$page_html" | sed '/__HTTP_STATUS__:/d')

echo "  HTTP status: ${http_status:-unknown}"
echo "  Page snippet: $(echo "$page_html" | tr -d '\n' | cut -c1-200)"

# Extract meta csrf-token — used for both the X-CSRF-Token header and the
# authenticity_token form field (NB injects it from the meta tag via JS)
csrf=$(echo "$page_html" \
  | grep -o 'name="csrf-token" content="[^"]*"' \
  | sed 's/.*content="//;s/"//')

echo "  CSRF token:  ${csrf:0:20}${csrf:+…}"

if [[ -z "$csrf" ]]; then
  echo ""
  echo "ERROR: Could not extract CSRF token — session may have expired."
  echo "  Expected: <meta name=\"csrf-token\" content=\"...\">"
  echo "  Got page title: $(echo "$page_html" | grep -o '<title>[^<]*</title>' | head -1)"
  echo ""
  echo "Refresh $COOKIE_FILE: open NationBuilder admin in your browser, open"
  echo "DevTools → Network → any request → Headers → Cookie, copy the value"
  echo "of the '_session_id' cookie and save it to $COOKIE_FILE."
  exit 1
fi

for filepath in "${uploadable[@]}"; do
  filename="$(basename "$filepath")"
  mime="$(mime_for "$filename")"

  response=$(curl -s --compressed \
    -b "$(cat "$COOKIE_FILE")" \
    -H "X-CSRF-Token: $csrf" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "Accept: application/json, text/javascript, */*; q=0.01" \
    -H "Origin: $NB_HOST" \
    -F "utf8=✓" \
    -F "authenticity_token=$csrf" \
    -F "attachment[attachment]=@$filepath;type=$mime" \
    "$NB_UPLOAD_URL")

  if echo "$response" | grep -q '"result":"success"'; then
    echo "  uploaded: $filename"
    (( upload_count++ )) || true
  else
    echo "  FAILED:   $filename"
    echo "  Response: $response"
    (( upload_errors++ )) || true
  fi
done

echo ""
if [[ $upload_errors -eq 0 ]]; then
  echo "$upload_count file(s) uploaded."
else
  echo "$upload_count uploaded, $upload_errors failed."
  exit 1
fi
