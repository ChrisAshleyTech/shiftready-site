#!/bin/sh
# Screenshot a page with headless Chrome. Needs tools/serve.ps1 on :5173.
# Usage: sh tools/shot.sh <path-and-hash> <out.png> [width] [height] [dark]
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
PROFILE="$(mktemp -d)"
EXTRA=""; [ "$5" = "dark" ] && EXTRA="--force-dark-mode --blink-settings=preferredColorScheme=0"
"$CHROME" --headless=new --disable-gpu --no-first-run --user-data-dir="$PROFILE" --hide-scrollbars $EXTRA \
  --window-size="${3:-1280},${4:-900}" --virtual-time-budget=8000 --screenshot="$2" "http://localhost:5173/$1" >/dev/null 2>&1
rm -rf "$PROFILE"
