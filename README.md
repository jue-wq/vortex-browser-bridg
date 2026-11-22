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
npm ci
npm run check
npm run build:chrome
npm run build:firefox
npm run build:firefox:android
bash scripts/package-extensions.sh
```

## Durable checkpoints
Read `docs/PROJECT_STATUS.md`, `docs/PHASE_CHECKLIST.md`, `docs/CHECKPOINT.md` and `progress.json` before resuming. Run `npm run check:progress` before phase transitions. Only attach observed CI evidence to completed checks.

## Standalone extension packages
CI creates and validates exactly these individual browser archives under `dist/`:
- `vortex-browser-bridge-chrome.zip` — Chrome/Chromium MV3 archive; extract it and load the extracted directory using the browser's **Load unpacked** developer option.
- `vortex-browser-bridge-firefox.xpi` — Firefox Desktop WebExtension package; install the XPI directly.
- `vortex-browser-bridge-firefox-android.xpi` — Firefox for Android WebExtension package; install the XPI through Firefox's supported add-on installation flow.

Firefox XPIs are signed through Mozilla Add-ons when `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` are configured. Without those secrets, CI still emits structurally valid unsigned XPI archives for developer/testing use; Firefox release installation may require Mozilla signing. The Android manifest is checked to ensure it does not request `nativeMessaging`. Each package is integrity-tested and must remain below 600 KiB.

For stable Chromium extension identity, configure `CHROME_EXTENSION_PRIVATE_KEY` if you distribute CRX builds separately; the CI deliverable here is the requested ZIP archive. Chromium may restrict sideloading outside managed policies or the Chrome Web Store.

## Firefox data disclosure
The Firefox manifest declares `websiteActivity` as required data because selected download/media URLs and related page context can be handed from the add-on to the user's local VortexDM application. This is a local handoff; the extension does not send this information to a VortexDM cloud service. Firefox displays the disclosure during installation on supported versions. The declaration is intentionally not suppressed or marked as `none`, since that would understate the local application handoff.
