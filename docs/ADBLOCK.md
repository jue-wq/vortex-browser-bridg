# Advertising, tracker and cosmetic filtering

## Android: use original uBlock Origin
The Android ad-blocking requirement is fulfilled by the original uBlock Origin (uBO) by Raymond Hill installed in Firefox for Android from Mozilla's official add-on listing: https://addons.mozilla.org/android/addon/ublock-origin/ . Confirm the publisher is Raymond Hill. The add-on is GPL-3.0-only and Mozilla distributes the signed Android-compatible extension.

Vortex Browser Bridge on Android is for download detection and VortexDM handoff. It is not the Android ad blocker, does not claim uBO feature parity, and should not run a second ad blocker alongside uBO in the same Firefox profile. uBO filters browser web content only; it is not device-wide and does not block ads inside unrelated Android apps.

## Other Bridge targets
- Chromium desktop (Manifest V3): supported network rules compile to declarativeNetRequest. Chromium MV3 does not expose general-purpose blocking webRequest to ordinary extensions, so advanced dynamic behavior is narrower.
- Firefox desktop: the optional local-first filter engine integrates the MPL-2.0 Ghostery WebExtension engine and EasyList/EasyPrivacy-compatible subscriptions.

Filter subscriptions on these desktop targets require explicit user action. Compiled rules are stored locally. No browsing history, page URLs, cookies or telemetry are uploaded by Vortex Browser Bridge.

## Known limitations
- Google Chrome for Android is not an extension target.
- Firefox for Android is the supported Android route for original uBO.
- Dynamic per-site firewall controls are not implemented by Browser Bridge.
