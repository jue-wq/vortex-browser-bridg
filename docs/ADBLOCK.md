# Advertising, tracker and cosmetic filtering

Vortex Browser Bridge provides local-first blocking with explicit platform differences.

- Chromium desktop (Manifest V3): supported network rules compile to declarativeNetRequest. Chromium MV3 does not expose general-purpose blocking webRequest to ordinary extensions, so advanced dynamic behavior is narrower.
- Firefox desktop and Firefox for Android: blocking webRequest is available. The optional full-list mode integrates the MPL-2.0 Ghostery WebExtension engine and its cosmetic companion.

## Full filter lists on Firefox

Built-in filters work offline. A user may explicitly choose "Enable full filter lists" or "Update EasyList/EasyPrivacy lists" in Settings. Only that action downloads public ad/tracker subscriptions. The compiled engine is saved in IndexedDB on the device and restored on the next startup. No browsing history, page URLs, cookies or telemetry are uploaded by Vortex Browser Bridge.

The upstream Ghostery WebExtension blocker is MPL-2.0 and documents compatibility with uBlock Origin and EasyList filter syntax. It is included as a dependency rather than copied into this repository.

## Rule examples

```
||doubleclick.net^
||ads.example^$script,image,third-party
@@||trusted.example^
example.org##.sponsored,.ad-slot
example.org#@#.sponsored
```

The built-in parser handles a useful subset for Chromium DNR and fallback operation. The Firefox engine handles a broader EasyList/uBO-compatible syntax subset, cosmetic filters and scriptlet-related behaviors.

## Privacy and safety

- Filter lists download only after explicit user confirmation.
- Rules are evaluated locally after they are cached.
- Cookie values and browsing history are never part of filter-list requests.
- Android app handoff is independent from adblocking and requires a future loopback-only, API-key-protected VortexDM service.

## Known limitations

Full uBlock Origin feature parity is not claimed. Chromium MV3 is limited by DNR semantics; Firefox provides the fuller compatibility path. Dynamic per-site firewall controls are not yet implemented.
