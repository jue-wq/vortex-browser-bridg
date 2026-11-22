#!/usr/bin/env bash
set -euo pipefail

assets=(
  dist/vortex-browser-bridge-chrome.zip
  dist/vortex-browser-bridge-firefox.xpi
  dist/vortex-browser-bridge-firefox-android.xpi
)
for asset in "${assets[@]}"; do
  test -s "$asset" || { echo "Release asset missing: $asset" >&2; exit 1; }
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

gh release upload "$tag" --repo "$GITHUB_REPOSITORY" "${assets[@]}" --clobber
