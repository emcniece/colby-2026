#!/usr/bin/env bash
# Populate upload-to-nb/ with the full set of deployable theme files.
# Run this before drag-and-dropping into NationBuilder's theme file manager.
#
# Template files (layout.html, _homepage.html, etc.) still need to be pasted
# manually into NationBuilder's template code editor — see CLAUDE.md.

set -euo pipefail
cd "$(dirname "$0")"

# 1. Seed with the complete downloaded theme (baseline — all NB files)
cp downloaded-from-nb/* upload-to-nb/

# 2. Overwrite with our modified files (templates, stylesheets, javascripts, images)
cp templates/*.html upload-to-nb/
cp stylesheets/theme.scss upload-to-nb/
cp javascripts/*.js upload-to-nb/
cp files/* upload-to-nb/

echo "upload-to-nb/ ready: $(ls upload-to-nb/ | wc -l | tr -d ' ') files"
echo "Update the datestamp in stylesheets/theme.scss before deploying CSS."
