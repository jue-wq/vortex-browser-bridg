# Phase checklist

A checked item describes an implemented/reviewed artifact; a phase is complete only when all acceptance checks and CI evidence exist.

## Phase 1 — WXT, protocol and transport
- [x] WXT + strict TypeScript + Preact base
- [x] Zod envelope and typed IPC message schemas
- [x] Native Messaging transport and connection manager baseline
- [x] 256 KiB batch chunker
- [ ] Chrome and Firefox clean builds and typecheck green
- [ ] Mock host handshake, timeout and 2 MiB chunk round-trip tests

## Phase 2 — Download rules and interception
- [x] Pure rule engine baseline
- [x] Header cache with TTL
- [ ] 30+ rule cases including size, MIME, domain, incognito and bypass
- [ ] Safe 1,500 ms acknowledgement fallback end-to-end
- [ ] Header correlation under concurrent requests

## Phase 3 — Media and yt-dlp bridge
- [x] Direct media URL detector/deduplicator baseline
- [x] Platform/playlist detector baseline
- [ ] HLS/DASH manifest filtering and session recovery tests
- [ ] User-consented, origin-scoped cookie transfer
- [ ] Popup extraction flow and playlist choice

## Phase 4 — Content scripts and batch grabber
- [x] Closed Shadow DOM selection pill baseline
- [x] Page link scanner and batch message
- [ ] Context menus and keyboard commands
- [ ] Regex/extension filters and queue selection
- [ ] 150+ link chunked transfer and hostile-CSS E2E

## Phase 5 — Popup, options and store release
- [x] Preact popup and options page shells
- [ ] Live active-task controller and theme synchronization
- [ ] Full connection/interception/media settings
- [ ] TR/EN localization and store metadata
- [ ] Chrome ZIP, Firefox XPI, AMO source package and release checks
