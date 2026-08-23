# Audit Evidence 02P — Popup Current-Site Compact Surface

## Scope

This work package covers the closed Popup surface on an ordinary page while `auto switch` is active. It also preserves the existing temporary-rule transaction and opens the native result menu, but it does not claim the expanded menu visuals or the Add-condition form are fully paired with the original.

## Original authority

Pinned ZeroOmega v3.5.0 sources:

- `omega-web/src/popup/index.html`;
- `omega-web/src/popup/js/loader.js`;
- `omega-web/src/popup/js/profiles.js`;
- `omega-web/src/popup/js/i18n.js`;
- commit `05cbb30` and the SHA-256-verified official Chromium package.

The official closed surface is two compact `430 × 31px` rows in this order:

1. plus icon + `Add condition`;
2. filter icon + current domain + caret.

No native result select is persistently visible.

## Demonstrated Nex defects

The first paired artifact proved that Nex rendered a 69px persistent temporary-profile select before a wide `Add condition for <domain>` button. It exposed option text, removed the original icons/caret, changed action order and increased information density. This was a visible Nex invention, not a browser limitation.

The first real 02P run then exposed a second defect: the generic Popup button selector overrode the original-compatible site-action row styles. Original rendered `#337ab7`, transparent background, no border and a 4px radius, while Nex inherited the ordinary Nex button color and radius. The original-compatible selector was made more specific without `!important` or post-render DOM mutation.

Firefox subsequently exposed a loading-tab race. `browser.tabs.create()` could return before the requested URL became visible through `tabs.get()`, so a Popup opened immediately for an explicit tab could omit the current-site rows. Current-site inspection now prefers `pendingUrl`, retains the validated tab ID, and rechecks only while the tab remains loading and no supported URL is available. Ordinary completed pages still return immediately.

## Native correction

- `App.svelte` directly renders the original row order, visible labels, icons and caret.
- The temporary result menu is created by Svelte state, not by a `MutationObserver` or post-render DOM replacement.
- The persistent `<select>` and its `No temporary rule` text are removed from ordinary UI.
- Clicking a result still calls the existing session-only `toggle` command; choosing the active result removes it under the existing backend contract.
- Add condition still opens the typed form and commits through verified Apply.
- `OriginalPopupIcon.svelte` owns the plus/filter vectors under the same icon contract as other Popup rows.
- Original-compatible site-action selectors outrank the generic Popup button selectors without leaking special-case inline styles.
- Current-site inspection handles loading tabs through `pendingUrl` plus a bounded retry path.

## Automated acceptance

The permanent read-only `Original Nex UI Evidence` workflow now executes the 02P paired capture on every relevant Popup/evidence change. It fails unless:

- Original and Nex closed-surface text lines are identical;
- both rows match original width, height, padding, font, color, background, borders and radius;
- Add condition precedes the domain row with no more than the original compact gap;
- plus, filter, domain and caret counts match;
- Nex exposes zero persistent temporary-rule selects.

Final bounded implementation Head: `8fce26518a2cb520bc2eb27d395e967fd2c621a2`.

Permanent gate results on that Head:

- CI — run `30901231540`, success;
- Browser E2E — run `30901231545`, success;
- Parity Documentation — run `30901231490`, success;
- Milestone 8 Visual Evidence — run `30901231497`, success;
- Original Toolbar Evidence — run `30901231444`, success;
- Original Nex UI Evidence — run `30901231447`, success.

Firefox main E2E and all six Toolbar specialist steps passed. Chromium main E2E, native Inspect and all six Toolbar specialist steps passed.

Final paired artifact:

- artifact ID `8889164450`;
- digest `sha256:879a1ac72ecf2e576d519b974e97131e7ec6c43815cb21799ef5c1b5f1f48d10`;
- source Head `8fce26518a2cb520bc2eb27d395e967fd2c621a2`;
- official and Nex text lines both equal `[Direct]`, `[System Proxy]`, `proxy`, `auto switch`, `Add condition`, `example.com`, `Options`;
- `extraInNex=[]`, `missingInNex=[]`;
- both closed rows are 430×31px with `5px 25px 5px 8px` padding, 14px text, 21px line height, `#337ab7`, transparent background, no border and 4px radius;
- plus/filter/caret structure matches and both sides expose zero persistent temporary-rule selects.

## Status boundary

- Closed Popup current-site surface: `VERIFIED_AUTOMATION`.
- Loading-tab current-site discovery: `VERIFIED_AUTOMATION` for the bounded explicit-tab journey.
- Expanded temporary-rule menu visuals: `PARTIAL` until paired Original↔Nex evidence exists.
- Add-condition form and submission visuals: `PARTIAL` until paired end-to-end evidence exists.
- Ownership-blocked, external-profile and browser-owned Popup presentation: open.
- Owner acceptance: not requested in this correction phase.

Product progress remains 48%; Order 1 remains 45%; no candidate, merge, release or owner retest is authorized.
