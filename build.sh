#!/usr/bin/env bash
# Builds the GitHub Pages site from the app's single source page.
#
# ../ListenEverything/web/index.html is written body-only, because the Claude
# artifact host wraps it in its own <html><head> skeleton. A plain web host does
# no such thing, so this script supplies the skeleton: charset, viewport with
# safe-area support, the PWA manifest, theme colour. One source, two hosts.
#
#   ./build.sh && git add -A && git commit -m "Update" && git push
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
source_page="$here/../ListenEverything/web/index.html"

[ -f "$source_page" ] || { echo "source page not found: $source_page" >&2; exit 1; }

{
  cat <<'HEAD'
<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#16181D">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon.svg">
</head>
<body>
HEAD
  cat "$source_page"
  cat <<'TAIL'
</body>
</html>
TAIL
} > "$here/index.html"

echo "built $here/index.html ($(wc -c < "$here/index.html") bytes)"
