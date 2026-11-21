# Durable checkpoint

- Current phase: 1 of 5 (IN_PROGRESS)
- Platform scope: Chromium desktop MV3, Firefox desktop MV3 and Firefox Android MV2. Google Chrome Android is not an extension target.
- Adblocking: built-in DNR-compatible rules for Chromium and optional MPL-2.0 Ghostery WebExtension engine (EasyList/EasyPrivacy-compatible) on Firefox. Full filter subscriptions require explicit user action and compiled rules are cached in IndexedDB.
- Transport: Native Messaging on desktop; Android localhost transport settings only. Android app-side HTTP server is not implemented yet.
- CI evidence: run 44953304877 completed successfully: npm install, WXT prepare/typecheck, 12 Vitest cases, Chrome MV3 build, Firefox desktop MV3 build, Firefox Android MV2 build; protocol sync comparison passed.
- Outstanding Phase 1 acceptance: mock Native Messaging host handshake, timeout and 2 MiB chunk round-trip E2E.
- No phase is marked DONE.
- Resume: read progress.json; run npm run check; run npm run build:chrome, npm run build:firefox and npm run build:firefox:android; implement and test mock-host round trips; record the next CI URL/SHA.
- Next task: finish mock-host transport E2E, then expand download interception rule matrix and test the safe fallback.
