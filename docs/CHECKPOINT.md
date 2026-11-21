# Durable checkpoint

- Current phase: 1 of 5 (IN_PROGRESS)
- Implemented baseline: WXT configuration, strict TypeScript, shared IPC v1 schema, chunker, Native Messaging transport, opt-in loopback HTTP transport, connection manager, interception rules, header TTL cache, media detector, platform detector, Shadow DOM page scanner, Preact popup/options shells, Vitest tests, progress validator and CI.
- CI findings: protocol-sync job passed. Verify job stopped at setup-node because npm cache was enabled without a lockfile. Cache setting removed; dependency install/typecheck/Vitest/production builds have not yet run.
- No phase is marked DONE.
- Resume: read progress.json; run `npm install`, `npm run check`, `npm run build:chrome`, and `npm run build:firefox`; fix issues; append run URL and commit SHA evidence.
- Next task: verify WXT builds, generate a lockfile and add a mocked Native Messaging round-trip suite.
