# Durable checkpoint

- Current phase: 1 of 5 (IN_PROGRESS)
- Implemented baseline: WXT configuration, strict TypeScript, shared IPC v1 schema, chunker, Native Messaging transport, opt-in loopback HTTP transport, connection manager, interception rules, header TTL cache, media detector, platform detector, Shadow DOM page scanner, Preact popup/options shells, Vitest unit tests, progress validator and CI.
- Not verified: package install, typecheck, Vitest and browser production builds have not yet been observed in CI. No phase is marked DONE.
- Resume sequence:
  1. Read `progress.json` and `PHASE_CHECKLIST.md`.
  2. Run `npm ci` (after lockfile is generated) or `npm install`.
  3. Run `npm run check`, then `npm run build:chrome` and `npm run build:firefox`.
  4. Fix all errors before changing a check to true.
  5. Add commit/run evidence to `progress.json` and update this checkpoint.
- Next task: verify clean WXT builds, add lockfile and mock Native Messaging integration suite.
