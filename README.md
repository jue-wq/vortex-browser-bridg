# Vortex Browser Bridge

WXT + TypeScript (strict) + Preact browser extension for Chromium and Firefox. It pairs with VortexDM through Native Messaging and the shared `IPC_PROTOCOL v1`.

## Development
```bash
npm install
npm test
npm run build:chrome
npm run build:firefox
```

## Durable phase tracking
Read `docs/CHECKPOINT.md` and `docs/PROJECT_STATUS.md` first. Update `progress.json` only with evidence-backed progress. Run `npm run check:progress` before closing a phase. CI fails if a phase is marked DONE without all checks and evidence.
