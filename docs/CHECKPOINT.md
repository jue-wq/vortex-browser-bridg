# Durable checkpoint

- Current phase: 1 of 5 (IN_PROGRESS)
- Platform scope: Chromium desktop MV3, Firefox desktop MV3 and Firefox Android MV2. Google Chrome Android is not an extension target.
- Adblocking: built-in DNR-compatible rules for Chromium and optional MPL-2.0 Ghostery WebExtension engine (EasyList/EasyPrivacy-compatible) on Firefox. Full filter subscriptions require explicit user action and compiled rules are cached in IndexedDB.
- Transport: Native Messaging on desktop; Android localhost transport settings only. Android app-side HTTP server is not implemented yet.
- CI: protocol-sync passed. The TypeScript job found a bad WXT types entry; config now extends WXT-generated .wxt/tsconfig.json and runs wxt prepare.
- No phase is marked DONE.
- Resume: npm install, npm run check, npm run build:chrome, npm run build:firefox, npm run build:firefox:android; fix issues and record run URL/SHA.
- Next task: verify all three browser package builds, filter syntax and mocked host tests, then Android real-device checks.
