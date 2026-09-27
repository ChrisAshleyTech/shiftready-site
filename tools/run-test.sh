#!/bin/sh
# Runs a test page in headless Chrome and prints its #out text. Needs tools/serve.ps1 running on :5173.
# Usage: sh tools/run-test.sh tests/parity.html
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
PROFILE="$(mktemp -d)"
"$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" --virtual-time-budget=60000 \
  --dump-dom "http://localhost:5173/$1" 2>/dev/null | sed -n '/<pre id="out">/,/<\/pre>/p' | sed 's/<[^>]*>//g; s/&gt;/>/g; s/&lt;/</g; s/&amp;/\&/g'
rm -rf "$PROFILE"
