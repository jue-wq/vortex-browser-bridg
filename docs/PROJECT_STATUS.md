# Project status

- Project: Vortex Browser Bridge
- Status: **IN_PROGRESS**
- Current phase: **Phase 1 — WXT, shared protocol and transport**
- Targets: Chromium desktop MV3, Firefox desktop MV3, Firefox Android MV2. Google Chrome Android excluded.
- CI: **first green matrix** — run 44953304877 passed package install, generated WXT types, strict TypeScript check, unit tests and all three browser builds; protocol sync with VortexDM passed.
- Phase 1 remaining: mocked Native Messaging handshake, timeout and 2 MiB chunk round-trip E2E.
- Adblocking: Firefox full list engine is opt-in, locally cached and based on Ghostery WebExtension; Chromium MV3 uses its DNR-supported subset.
- Recent media capture improvement: completed web requests now inspect response `Content-Type` and retain the tab title, so extensionless HLS/DASH/audio/video endpoints can be detected; unit coverage added. CI caught and the latest patch fixes the missing helper import and strict optional-header typing; verification for that patch is pending.
- Android VortexDM handoff: both sides are implemented. Bridge uses the user-configured ephemeral port and API key; VortexDM listens on 127.0.0.1, exposes /health and /ipc, validates the API key, and dispatches protocol v1 requests. Real Firefox-for-Android/device round-trip acceptance remains pending.
