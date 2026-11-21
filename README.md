# Vortex Browser Bridge

WXT + strict TypeScript + Preact extension for desktop Chromium/Firefox and Firefox for Android. Integrates with VortexDM through Native Messaging on desktop and an opt-in 127.0.0.1 HTTP bridge on Android.

## Supported targets
- Chrome/Edge/Brave/Vivaldi desktop: Manifest V3, DNR-based network blocking.
- Firefox desktop: Manifest V3 (and Firefox MV2 compatibility build), webRequest-based filtering.
- Firefox for Android: Manifest V2 non-persistent event page; full extension UI, ad/tracker filtering, cosmetic filters and local loopback handoff.
- Other Android Chromium forks: best-effort only after per-browser compatibility tests.
- **Google Chrome for Android is not supported** because it does not provide an extension host.

## uBlock-Origin-style protection
Includes a local-first filter engine for common ABP/uBO-style network rules, exceptions, per-domain/resource-type conditions, cosmetic hiding rules, custom user rules and per-site allow rules. It is a foundation with an explicit compatibility subset, not a claim of full uBlock Origin feature parity or use of Raymond Hill's code/lists.

## Development
```bash
npm install
npm run check
npm run build:chrome
npm run build:firefox
npm run build:firefox:android
```

## Durable checkpoints
Read `docs/PROJECT_STATUS.md`, `docs/PHASE_CHECKLIST.md`, `docs/CHECKPOINT.md` and `progress.json` before resuming. Run `npm run check:progress` before phase transitions. Only attach observed CI evidence to completed checks.
