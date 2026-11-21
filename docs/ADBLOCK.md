# Local ad and tracker filtering

Vortex Browser Bridge includes a privacy filter engine inspired by common uBlock Origin / Adblock Plus filter syntax. It is a new implementation and does not contain uBlock Origin code.

## Rule examples
```
||doubleclick.net^
||ads.example^$script,image,third-party
@@||trusted.example^
example.org##.sponsored,.ad-slot
example.org#@#.sponsored
```

The parser handles domain network rules, exceptions, selected resource types, third-party conditions, initiator-domain constraints and cosmetic selectors. It intentionally ignores unknown advanced syntax. Custom rules are saved in extension-local storage. Cookie and filter contents are not sent to analytics.

## Runtime
- Chromium Manifest V3 compiles supported network rules to dynamic `declarativeNetRequest` rules.
- Firefox desktop and Firefox Android use synchronous `webRequestBlocking` where available.
- Cosmetic filters are inserted by a content script; selector strings are screened to reject markup/style injection characters.

## Current limitations
No filter-list URL subscription manager, scriptlet injection, dynamic per-site firewall UI, redirect/resource replacement engine, or full EasyList syntax compatibility yet. Those are tracked follow-up tasks; never describe this as full uBlock Origin parity.
