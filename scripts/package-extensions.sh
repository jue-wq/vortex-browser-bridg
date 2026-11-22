#!/usr/bin/env bash
set -euo pipefail

assets="$GITHUB_WORKSPACE/release-assets"
mkdir -p "$assets"

if [[ -n "${CHROME_EXTENSION_PRIVATE_KEY:-}" ]]; then
  printf '%s\n' "$CHROME_EXTENSION_PRIVATE_KEY" > "$RUNNER_TEMP/vortex-browser-bridge-chrome.pem"
fi
npx --yes crx3@2.0.0 \
  --keyPath "$RUNNER_TEMP/vortex-browser-bridge-chrome.pem" \
  --crxPath "$assets/vortex-browser-bridge-chrome.crx" \
  "$GITHUB_WORKSPACE/.output/chrome-mv3"
test "$(head -c 4 "$assets/vortex-browser-bridge-chrome.crx")" = "Cr24"

if [[ -n "${AMO_JWT_ISSUER:-}" && -n "${AMO_JWT_SECRET:-}" ]]; then
  npx --yes web-ext@8 sign --source-dir .output/firefox-mv3 \
    --artifacts-dir "$assets/firefox-signed" --channel unlisted \
    --api-key "$AMO_JWT_ISSUER" --api-secret "$AMO_JWT_SECRET"
  cp "$assets"/firefox-signed/*.xpi "$assets/vortex-browser-bridge-firefox.xpi"
else
  (cd .output/firefox-mv3 && zip -qr "$assets/vortex-browser-bridge-firefox-unsigned.zip" . -x '*.map')
fi

if [[ -n "${AMO_JWT_ISSUER:-}" && -n "${AMO_JWT_SECRET:-}" ]]; then
  npx --yes web-ext@8 sign --source-dir .output/firefox-mv2 \
    --artifacts-dir "$assets/firefox-android-signed" --channel unlisted \
    --api-key "$AMO_JWT_ISSUER" --api-secret "$AMO_JWT_SECRET"
  cp "$assets"/firefox-android-signed/*.xpi "$assets/vortex-browser-bridge-firefox-android.xpi"
else
  (cd .output/firefox-mv2 && zip -qr "$assets/vortex-browser-bridge-firefox-android-unsigned.zip" . -x '*.map')
fi

for package in "$assets"/*.xpi "$assets"/*.zip; do
  [[ -f "$package" ]] || continue
  unzip -t "$package"
done

# Keep individual deliverables compact; do not silently ship oversized builds.
for package in "$assets"/*; do
  [[ -f "$package" ]] || continue
  size="$(stat -c '%s' "$package")"
  if (( size > 600 * 1024 )); then
    echo "Package exceeds 600 KiB: $package ($size bytes)" >&2
    exit 1
  fi
done
