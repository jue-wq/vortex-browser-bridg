# Project status

- Project: Vortex Browser Bridge
- Status: **IN_PROGRESS**
- Current phase: **Phase 1 — WXT, shared protocol and transport**
- Targets: Chromium desktop MV3, Firefox desktop MV3/MV2, Firefox Android MV2 event page. Google Chrome Android is excluded.
- Added user-requested scope: local-first uBlock-Origin-style network/cosmetic filtering; this is a supported subset, not full uBO parity.
- Android transport: Native Messaging is unavailable; the extension uses an opt-in localhost bridge configuration. VortexDM's Android loopback service is still pending.
- Next action: run npm typecheck/tests and three WXT targets; fix compile/API issues before marking checks.
