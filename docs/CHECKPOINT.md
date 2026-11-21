# Durable checkpoint

- Current phase: 1 of 5 (IN_PROGRESS)
- Platform scope: Chromium desktop MV3, Firefox desktop MV3 and Firefox Android MV2. Google Chrome Android is not an extension target.
- Adblocking scope: bundled local filter engine, network exceptions, resource/domain constraints, cosmetic filter subset, user rules, DNR/Firefox webRequest adapters.
- Transport scope: Native Messaging desktop; Android localhost transport settings only. Android app-side HTTP server is not implemented yet.
- CI findings: protocol sync passed on prior workflow. The verify job initially stopped because setup-node npm cache required a lock file; cache was removed before package install, and new build/test run is pending.
- Resume: `npm install`, `npm run check`, `npm run build:chrome`, `npm run build:firefox`, `npm run build:firefox:android`; fix issues and record run URL/SHA.
- No phase is marked DONE.
- Next task: validate WXT APIs/TypeScript and all browser builds, then add filter-list conformance and Android real-device tests.
