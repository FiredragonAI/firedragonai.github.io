#!/usr/bin/env bash
# Puts the Play App Signing fingerprint into assetlinks.json and ships it.
#
# Why this is needed: Google re-signs every upload with its own key, so the
# fingerprint the phone sees is NOT the one in our keystore. Until the site
# names Google's fingerprint, Android cannot verify that this app owns this
# domain, and the app opens with a browser address bar across the top instead
# of looking like an app. The fingerprint appears in Play Console under
#   Test and release > Setup > App integrity > App signing key certificate
# as "SHA-256 certificate fingerprint".
#
#   ./tools/set-play-fingerprint.sh AA:BB:CC:...:FF
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
play="${1:-}"

if [ -z "$play" ]; then
  echo "usage: $0 <SHA-256 fingerprint from Play Console>" >&2
  exit 1
fi

# The upload key stays in the list too: it is what a locally built APK is
# signed with, so sideloaded test builds keep verifying as well.
upload="07:B2:21:9C:34:28:09:C0:52:6B:3D:B6:0E:DD:1D:4E:53:60:3F:BC:51:37:E0:5D:A0:BA:76:21:EF:84:CA:B5"

node -e '
const fs = require("fs");
const [play, upload, out] = process.argv.slice(1);
const clean = (s) => s.trim().toUpperCase().replace(/[^0-9A-F]/g, "").match(/.{2}/g).join(":");
const fingerprints = [...new Set([clean(play), clean(upload)])];
if (fingerprints[0].split(":").length !== 32) { console.error("That does not look like a SHA-256 fingerprint (needs 32 bytes)."); process.exit(1); }
fs.writeFileSync(out, JSON.stringify([{
  relation: ["delegate_permission/common.handle_all_urls"],
  target: { namespace: "android_app", package_name: "io.github.firedragonai.listen", sha256_cert_fingerprints: fingerprints }
}], null, 2) + "\n");
console.log("assetlinks.json now lists " + fingerprints.length + " fingerprint(s)");
' "$play" "$upload" "$here/.well-known/assetlinks.json"

cd "$here"
git add .well-known/assetlinks.json
git commit -q -m "Add the Play App Signing fingerprint to the asset links" || echo "(nothing to commit)"
git push -q origin main
echo "pushed. Give Pages a minute, then check:"
echo "  curl https://firedragonai.github.io/.well-known/assetlinks.json"
