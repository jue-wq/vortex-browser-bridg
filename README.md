# Vortex Browser Bridge

WXT + strict TypeScript + Preact extension for desktop Chromium/Firefox and Firefox for Android. Integrates with VortexDM through Native Messaging on desktop and an opt-in 127.0.0.1 HTTP bridge on Android.

## Supported targets
- Chrome/Edge/Brave/Vivaldi desktop: Manifest V3, DNR-based network blocking.
- Firefox desktop: Manifest V3 (and Firefox MV2 compatibility build), webRequest-based filtering.
- Firefox for Android: Manifest V2 non-persistent event page; popup/options, link/media capture and authenticated local loopback handoff. Ad/tracker and cosmetic filtering are delegated to the original uBlock Origin add-on; Bridge's own filter engine is disabled on Android.
- Other Android Chromium forks: unsupported until per-browser API compatibility is proven.
- **Google Chrome for Android is not supported** because it does not provide an extension host.

## Android ad blocking: original uBlock Origin
On Android, use the original uBlock Origin by Raymond Hill in Firefox for Android from the official [Mozilla Add-ons listing](https://addons.mozilla.org/android/addon/ublock-origin/). Browser Bridge is the download handoff extension; it is not the Android ad blocker and does not replace uBO. Do not install a second content blocker in the same Firefox profile.

The local ABP/uBO-compatible subset and Ghostery engine are maintained for non-Android Bridge targets only. They are not represented as full uBO or used as an Android substitute.

## Development
```bash
npm install
npm run check
npm run build:chrome
npm run build:firefox
npm run build:firefox:android
```

## Durable checkpoints
Read `docs/PROJECT_STATUS.md`, `docs/PHASE_CHECKLIST.md`, `docs/CHECKPOINT.md` and `progress.json` before resuming. Run `npm run check:progress` before phase transitions. Only attach observed CI evidence to completed checks.

## Standalone extension packages
CI builds each browser target separately and publishes individual files:
- `vortex-browser-bridge-chrome.crx` — Chrome/Chromium CRX3 package
- `vortex-browser-bridge-firefox.xpi` — Firefox desktop package
- `vortex-browser-bridge-firefox-android.xpi` — Firefox for Android package

Tag releases attach these files individually to the GitHub Release; users do not need to download a combined ZIP. For stable extension identity, configure the repository secret `CHROME_EXTENSION_PRIVATE_KEY` with a persistent PEM private key; otherwise the CI creates a one-run key and the CRX ID changes between builds. Chromium may restrict sideloading CRX files outside managed policies or the Chrome Web Store, so the unpacked MV3 output remains the developer-mode fallback. Configure `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` to have CI sign both Firefox XPIs through Mozilla Add-ons; without those secrets the workflow emits unsigned XPIs for temporary/developer testing and they are not represented as normal release-channel installable packages.
