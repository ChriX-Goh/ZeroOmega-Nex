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

## Demonstrated Nex defect

The first paired artifact proved that Nex rendered a 69px persistent temporary-profile select before a wide `Add condition for <domain>` button. It exposed option text, removed the original icons/caret, changed action order and increased information density. This was a visible Nex invention, not a browser limitation.

## Native correction

- `App.svelte` now directly renders the original row order, visible labels, icons and caret.
- The temporary result menu is created by Svelte state, not by a `MutationObserver` or post-render DOM replacement.
- The persistent `<select>` and its `No temporary rule` text are removed from ordinary UI.
- Clicking a result still calls the existing session-only `toggle` command; choosing the active result removes it under the existing backend contract.
- Add condition still opens the typed form and commits through verified Apply.
- `OriginalPopupIcon.svelte` owns the plus/filter vectors under the same icon contract as other Popup rows.

## Automated acceptance

The paired evidence script now fails unless:

- Original and Nex closed-surface text lines are identical;
- both rows match original width, height, padding, font, color, background, borders and radius;
- Add condition precedes the domain row with no more than the original compact gap;
- plus, filter, domain and caret counts match;
- Nex exposes zero persistent temporary-rule selects.

Chromium E2E opens the native menu, selects a real result and verifies session-only PAC overlay storage. Firefox E2E verifies the localized two-row structure, `430 × 31px` geometry, absence of a persistent select and native menu opening.

## Status boundary

- Closed Popup current-site surface: target state `VERIFIED_AUTOMATION` after all permanent gates pass on one normal Head.
- Expanded temporary-rule menu visuals: `PARTIAL` until paired Original↔Nex evidence exists.
- Add-condition form and submission visuals: `PARTIAL` until paired end-to-end evidence exists.
- Owner acceptance: not requested in this correction phase.

Product progress remains 48%; Order 1 remains 45%; no candidate, merge, release or owner retest is authorized.
