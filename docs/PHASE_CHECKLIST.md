# Phase checklist

A checked item means implementation exists; phase completion requires all acceptance checks and CI evidence.

## Phase 1 — WXT, shared protocol and transport
- [x] WXT + strict TypeScript + Preact
- [x] Zod envelope and IPC payload schemas
- [x] Desktop Native Messaging transport
- [x] Opt-in loopback HTTP transport base
- [x] Batch chunker baseline
- [ ] Clean typecheck and tests green
- [ ] Chrome MV3, Firefox desktop MV3 and Firefox Android MV2 builds green
- [x] Mock transport handshake/correlation, rejection ACK and chunk round-trip contract tests
- [ ] Real Native Messaging host handshake, timeout and browser-host round-trip acceptance

## Phase 2 — Download interception
- [x] Pure download rule engine
- [x] Header TTL cache
- [x] Safe 1,500 ms ACK-or-browser-fallback code path
- [x] 30+ interception rule matrix cases
- [ ] Host-unavailable browser E2E tests
- [ ] Android Firefox download API capability matrix and handoff tests

## Phase 3 — Media, extraction and privacy filtering
- [x] Android responsibility clarified: original uBlock Origin in Firefox for Android; Bridge Android focuses on download handoff
- [x] Disable Bridge adblock engine and hide its custom filter controls on Firefox for Android
- [x] Direct media URL detector/deduplicator
- [x] Platform/playlist detector
- [x] Local filter parser with network exceptions and cosmetic rules
- [x] Chromium DNR blocking adapter
- [x] Firefox webRequest fallback and Ghostery filter engine integration
- [x] Explicit EasyList/EasyPrivacy-compatible list update and local IndexedDB cache
- [ ] Filter-list update/cache restore, exception and cosmetic conformance suite
- [x] Privacy-safe public-media extraction request (URL/title only; no session cookies collected)
- [ ] yt-dlp extraction E2E and authenticated media support

## Phase 4 — Content scripts and batch grabber
- [x] Closed Shadow DOM UI baseline
- [x] Page link scanner
- [x] Ghostery cosmetics content-script integration for Firefox
- [x] Context menus, keyboard commands, extension filters and app-provided batch queue selector
- [ ] Regex filters and hostile-CSS E2E
- [ ] 150+ link chunked transfer and hostile-CSS E2E

## Phase 5 — Popup, settings and store release
- [x] User-approved VortexDM icon configured for extension manifest and toolbar action
- [x] Preact popup/options shells
- [x] User filter toggle and custom filter editor
- [x] Android Firefox MV2 build target and loopback bridge settings shell
- [x] Firefox full filter-list settings and explicit consent flow
- [ ] Live task controller, theme sync and full settings persistence
- [ ] Android real-device Firefox tests and app loopback-server integration
- [ ] TR/EN localization, store metadata and release packages
