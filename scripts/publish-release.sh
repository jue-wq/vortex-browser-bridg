#!/usr/bin/env bash
set -euo pipefail

assets=()
for name in \
  vortex-browser-bridge-chrome.crx \
  vortex-browser-bridge-firefox.xpi \
  vortex-browser-bridge-firefox-unsigned.zip \
  vortex-browser-bridge-firefox-android.xpi \
  vortex-browser-bridge-firefox-android-unsigned.zip; do
  [[ -f "release-assets/$name" ]] && assets+=("release-assets/$name")
done

if [[ "$GITHUB_REF" == refs/tags/v* ]]; then
  tag="$GITHUB_REF_NAME"
  title="$tag"
  prerelease=()
else
  tag="nightly"
  title="Vortex Browser Bridge Nightly"
  prerelease=(--prerelease)
fi

if ! gh release view "$tag" --repo "$GITHUB_REPOSITORY" >/dev/null 2>&1; then
  gh release create "$tag" --repo "$GITHUB_REPOSITORY" --title "$title" \
    --target "$GITHUB_SHA" --generate-notes "${prerelease[@]}"
fi

# Remove any stale signed-looking XPI when the current run only produced an unsigned ZIP.
if [[ ! -f release-assets/vortex-browser-bridge-firefox.xpi ]]; then
  gh release delete-asset "$tag" vortex-browser-bridge-firefox.xpi \
    --repo "$GITHUB_REPOSITORY" --yes || true
fi
if [[ ! -f release-assets/vortex-browser-bridge-firefox-android.xpi ]]; then
  gh release delete-asset "$tag" vortex-browser-bridge-firefox-android.xpi \
    --repo "$GITHUB_REPOSITORY" --yes || true
fi

(("${#assets[@]}" > 0)) || { echo "No extension packages found" >&2; exit 1; }
gh release upload "$tag" --repo "$GITHUB_REPOSITORY" "${assets[@]}" --clobber
