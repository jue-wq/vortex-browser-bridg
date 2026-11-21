# Vortex Browser Bridge

WXT + strict TypeScript + Preact extension for desktop Chromium/Firefox and Firefox for Android. Integrates with VortexDM through Native Messaging on desktop and an opt-in 127.0.0.1 HTTP bridge on Android.

## Supported targets
- Chrome/Edge/Brave/Vivaldi desktop: Manifest V3, DNR-based network blocking.
- Firefox desktop: Manifest V3 (and Firefox MV2 compatibility build), webRequest-based filtering.
- Firefox for Android: Manifest V2 non-persistent event page; full extension UI, ad/tracker filtering, cosmetic filters and local loopback handoff.
- Other Android Chromium forks: best-effort only after per-browser compatibility tests.
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
