# Build and install Vortex Browser Bridge

## Supported targets
- Chromium desktop (Manifest V3)
- Firefox desktop (Manifest V3)
- Firefox for Android (Manifest V2)
- Google Chrome for Android and macOS are not supported.

## Build and validate

```sh
npm ci
npm run check
npm run build:chrome
npm run build:firefox
npm run build:firefox:android
bash scripts/package-extensions.sh
```

Build outputs are written under `.output/`; validated standalone archives are written under `dist/`.

## Install the packaged extension

- **Chrome / Chromium:** download `vortex-browser-bridge-chrome.zip`, extract it, open the browser's extensions page, enable Developer mode, and choose **Load unpacked** on the extracted directory. Chrome's developer-mode loader expects a directory, not a directly installable ZIP.
- **Firefox Desktop:** install `vortex-browser-bridge-firefox.xpi` directly using Firefox's add-on installation flow. A release-ready install requires Mozilla signing.
- **Firefox for Android:** install `vortex-browser-bridge-firefox-android.xpi` through Firefox for Android's supported add-on installation flow. It is built without the `nativeMessaging` permission and uses the authenticated local loopback bridge.

Unsigned Firefox XPIs are for development/testing and may be rejected by normal Firefox release builds. CI signs them through Mozilla Add-ons when `AMO_JWT_ISSUER` and `AMO_JWT_SECRET` are configured.

## Desktop connection

Build and install VortexDM's `vortex-native-host`, then register it using the scripts and instructions in VortexDM `docs/NATIVE_MESSAGING_INSTALL.md`. Firefox uses add-on ID `vortex-browser-bridge@vortexdm.local`. Chromium browsers require the production extension ID in the native-host manifest.

## Firefox for Android

1. Install Firefox for Android.
2. Install the original uBlock Origin by Raymond Hill from the [official Mozilla Add-ons listing](https://addons.mozilla.org/android/addon/ublock-origin/).
3. Install the Android-compatible Vortex Browser Bridge XPI.
4. Open VortexDM on the same device and enable its Android loopback server.
5. Copy the ephemeral port and API key from VortexDM's Android Bridge panel.
6. Open Bridge options in Firefox for Android and enter the port and key.
7. Restarting VortexDM rotates the key; update the Bridge settings after each restart.

On Android, Bridge detects links/media and hands downloads to VortexDM. It deliberately disables its own ad/tracker and cosmetic filters so it does not duplicate uBO. Do not install a repackaged uBO or a second content blocker into the Bridge.

## Media extraction

The popup enables yt-dlp extraction only when the VortexDM handshake reports an active yt-dlp profile. Extraction sends page URL, title, playlist mode and selected queue only. Browser cookies are not collected or forwarded; private/authenticated media is not supported.

## Platform responsibilities

- Original uBlock Origin filters web content in Firefox for Android.
- Bridge handles capture and VortexDM handoff on Android.
- Desktop Bridge targets use the local supported filter subset; full uBO parity is not claimed.
