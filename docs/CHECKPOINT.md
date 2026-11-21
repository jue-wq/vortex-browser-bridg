# Durable checkpoint

- Current phase: 5 of 5 (IN_PROGRESS; final consolidated tests/builds intentionally deferred until all implementation work is complete).
- Targets: Chromium desktop MV3, Firefox desktop MV3 and Firefox for Android MV2. Google Chrome for Android is not supported.
- Android ad blocking: original Raymond Hill uBlock Origin from Mozilla Add-ons in Firefox for Android. Browser Bridge disables its own Android network/cosmetic filters and handles downloads only. See VortexDM docs/ANDROID_UBO_INTEGRATION.md.
- Desktop ad blocking: Chromium DNR-compatible rules; Firefox desktop uses the MPL-2.0 Ghostery engine and EasyList/EasyPrivacy-compatible subscriptions. These are not presented as uBO parity.
- Desktop transport: Native Messaging. Android transport: authenticated HTTP to 127.0.0.1 using the ephemeral port and 256-bit API key shown by VortexDM. Enter both in Bridge options after each VortexDM app restart.
- Bridge now has persisted interception settings, 30+ capture-policy cases, media/platform detection, queue-aware batch capture, keyboard/context-menu actions, Android Firefox popup/options, yt-dlp capability gating and loopback HTTP reconnect handling.
- Media extraction sends URL/title/playlist mode/queue only. It does not read or forward browser cookies; private/authenticated media extraction is not supported.
- Current authored tests include mock ConnectionManager handshake/correlation/rejection/chunk contract tests and Android HTTP fallback health/API-key/IPC/reconnect tests. They have not yet been included in the final consolidated validation pass.
- VortexDM now provides user-scoped Windows/Linux Native Messaging registration/uninstall scripts and a build/install guide; Bridge documents the matching host ID and Firefox/Chromium registration flow. Android continues to use loopback, not Native Messaging.
- Popup/options now use browser i18n messages for English and Turkish. IPC schemas no longer include cookie fields or the unused focus_app action; the shared protocol docs are synchronized.
- Outstanding: real browser Native Messaging host round-trip and timeout, Android Firefox download API/device capability acceptance, filter-list restore/conformance, regex/hostile-CSS tests, 150+ link end-to-end batch, app-to-extension live task state, full translation coverage, store metadata and signed packages.
- Branding: user-supplied VortexDM artwork is configured as the extension toolbar/action icon.
- No phase is marked DONE.
- Next implementation priorities: finish real browser/app E2E and large-batch/hostile-CSS acceptance, complete localization/store packaging, then run the full final test/build matrix and fix all failures.
