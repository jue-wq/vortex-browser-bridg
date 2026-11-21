# Browser Bridge architecture

## Boundary
WXT entrypoints own browser lifecycle. Pure modules (`RuleEngine`, URL/media detector and chunker) have no browser globals and are unit-testable. The background service worker owns native transport and persisted session state. Popup/options/content scripts communicate with it through typed runtime messages.

## Transports
Native Messaging is primary. HTTP fallback is optional, loopback-only, API-key protected and off by default. A download is cancelled only after VortexDM acknowledges the task within 1,500 ms. A missing host or timeout leaves the browser download alone.

## Privacy
Cookie access must be triggered by an explicit user action; never persist cookie values. Only request cookies for the active page origin. Do not log auth headers/cookie values. Use a closed Shadow Root for in-page UI. Validate URLs as HTTP(S), and use strict Zod schemas for external messages.

## Android ad-blocking boundary
The original uBlock Origin is installed separately from Mozilla's official add-on listing in Firefox for Android. Browser Bridge on Android handles downloads only and must not duplicate uBO's filtering. Its Ghostery/local filter engine is for desktop targets; do not describe it as the Android uBO implementation.

## Current implementation boundary
The first baseline adds contract schemas, 256 KiB batch chunking, Native Messaging transport, opt-in localhost transport, a pure interception rule engine, header TTL cache, media URL deduper, platform detector, content scanner, popup/options shells and unit tests. Full cross-browser E2E, session cookie consent, comprehensive permissions UX, resilient SW recovery and store release still remain tracked in the phase checklist.
