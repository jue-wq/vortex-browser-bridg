#!/usr/bin/env bash
set -euo pipefail

root="${GITHUB_WORKSPACE:-$(pwd)}"
dist="$root/dist"
tmp="$RUNNER_TEMP/vortex-bridge-packages"
rm -rf "$dist" "$tmp"
mkdir -p "$dist" "$tmp"

# Chrome's unpacked developer build is distributed as a ZIP archive.
(cd "$root/.output/chrome-mv3" && zip -qr "$dist/vortex-browser-bridge-chrome.zip" . -x '*.map')

package_firefox() {
  local source="$1" name="$2" work="$3"
  if [[ -n "${AMO_JWT_ISSUER:-}" && -n "${AMO_JWT_SECRET:-}" ]]; then
    npx --yes web-ext@8 sign --source-dir "$source" \
      --artifacts-dir "$work" --channel unlisted \
      --api-key "$AMO_JWT_ISSUER" --api-secret "$AMO_JWT_SECRET"
    local signed
    signed="$(find "$work" -maxdepth 1 -type f -name '*.xpi' -print -quit)"
    test -n "$signed"
    cp "$signed" "$dist/$name"
  else
    # An XPI is a ZIP-format WebExtension archive; keep the required .xpi suffix.
    (cd "$source" && zip -qr "$dist/$name" . -x '*.map')
  fi
}

package_firefox "$root/.output/firefox-mv3" \
  "vortex-browser-bridge-firefox.xpi" "$tmp/firefox"
package_firefox "$root/.output/firefox-mv2" \
  "vortex-browser-bridge-firefox-android.xpi" "$tmp/firefox-android"

# Android Firefox must not request desktop Native Messaging permission.
if grep -Eq '"nativeMessaging"' "$root/.output/firefox-mv2/manifest.json"; then
  echo "Firefox for Android manifest must not contain nativeMessaging" >&2
  exit 1
fi

expected=(
  "$dist/vortex-browser-bridge-chrome.zip"
  "$dist/vortex-browser-bridge-firefox.xpi"
  "$dist/vortex-browser-bridge-firefox-android.xpi"
)
for package in "${expected[@]}"; do
  test -s "$package"
  unzip -t "$package"
  size="$(stat -c '%s' "$package")"
  if (( size >= 600 * 1024 )); then
    echo "Package must be smaller than 600 KiB: $package ($size bytes)" >&2
    exit 1
  fi
done

test "$(find "$dist" -maxdepth 1 -type f | wc -l)" -eq 3
echo "Verified packages:"
printf ' - %s\n' "${expected[@]}"
