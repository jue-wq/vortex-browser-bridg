# Browser and mobile compatibility

| Target | Build | Blocking engine | VortexDM transport |
|---|---|---|---|
| Chrome/Edge/Brave/Vivaldi desktop | MV3 | `declarativeNetRequest` | Native Messaging |
| Firefox desktop | MV3 (MV2 compatibility package also built) | `webRequest` blocking | Native Messaging |
| Firefox Android | MV2 non-persistent event page | `webRequestBlocking` | Opt-in loopback HTTP to the Android app |
| Other Android Chromium extension hosts | Best effort only | DNR if implemented by host | Opt-in loopback HTTP |
| Google Chrome Android | **Unsupported** | No extension host | N/A |

Mozilla's Firefox Android guidance recommends Manifest V2 because MV3 background service workers are not supported on Android. Firefox Android also lacks `runtime.connectNative()`, so the extension cannot directly launch the desktop native host. Do not silently attempt it on Android.

## uBlock-Origin-style filtering
The bundled filter engine supports a deliberately documented ABP/uBO subset:
- `||domain^` network blocking and `@@||domain^` exceptions.
- Resource type constraints, `third-party`, `domain=` and excluded initiator domains.
- Cosmetic selectors `##selector`, domain-scoped cosmetic filters and `#@#` cosmetic exceptions.
- Custom rules pasted by the user and a local allow/disable switch.
- Chromium MV3 applies declarative rules; Firefox uses synchronous `webRequestBlocking` listeners.

This is not full uBlock Origin parity: scriptlets, dynamic firewall matrices, procedural cosmetic filters, full filter-list compiler semantics and subscription update orchestration are not yet implemented. Unsupported syntax is ignored rather than guessed.

## Mobile privacy and limits
- Android filter decisions are evaluated locally. No analytics or telemetry is sent.
- Browser-to-VortexDM forwarding on Android is optional and uses a random API key over 127.0.0.1 only. The VortexDM Android local API is a tracked implementation requirement, not yet a completed feature.
- Android browser downloads are not assumed to expose the same downloads events as desktop; the extension's blocking/filtering feature does not depend on download handoff being configured.
