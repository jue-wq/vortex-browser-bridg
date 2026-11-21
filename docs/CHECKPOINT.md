# Durable checkpoint

- Current phase: 1 of 5 (IN_PROGRESS)
- Platform scope: Chromium desktop MV3, Firefox desktop MV3 and Firefox Android MV2. Google Chrome Android is not an extension target.
- Android ad-blocking decision: use original Raymond Hill uBlock Origin from the official Mozilla Add-ons listing in Firefox for Android. Browser Bridge Android handles download handoff only; its Ghostery/local filtering engine is not the Android blocker and must not duplicate uBO. See VortexDM docs/ANDROID_UBO_INTEGRATION.md.
- Adblocking: built-in DNR-compatible rules for Chromium and optional MPL-2.0 Ghostery WebExtension engine (EasyList/EasyPrivacy-compatible) on Firefox. Full filter subscriptions require explicit user action and compiled rules are cached in IndexedDB.
- Transport: Native Messaging on desktop; Android localhost transport settings only. Android app-side HTTP server is not implemented yet.
- CI evidence: run 44953304877 completed successfully: npm install, WXT prepare/typecheck, 12 Vitest cases, Chrome MV3 build, Firefox desktop MV3 build, Firefox Android MV2 build; protocol sync comparison passed.
- Outstanding Phase 1 acceptance: mock Native Messaging host handshake, timeout and 2 MiB chunk round-trip E2E.
- Branding: user-supplied VortexDM artwork is installed as `public/icon-32.png` and referenced by the WebExtension manifest and toolbar action.
- CI run `44955855449` exposed a party-modifier unit-test expectation issue; the fixture was corrected to test a true parent/child hostname relationship, while sibling registrable domains remain third-party. Fix commit `b1359d7a7c198e71b5959749bfa5d62a2c19a4dc` is awaiting CI.
- No phase is marked DONE.
- Resume: read progress.json; run npm run check; run npm run build:chrome, npm run build:firefox and npm run build:firefox:android; implement and test mock-host round trips; record the next CI URL/SHA.
- Latest fix: corrected `$third-party`/`$~third-party` test coverage to distinguish parent-child hostnames from sibling registrable domains. Await run `44955994248` before recording pass evidence.
- Next task: finish mock-host transport E2E, then expand download interception rule matrix and test the safe fallback.
