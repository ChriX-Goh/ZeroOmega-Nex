# Audit Evidence 02P — Popup Current-Site Compact Surface

## Scope

This work package covers only the closed Popup surface shown on an ordinary page while `auto switch` is active. It does not declare the expanded temporary-rule menu, the Add-condition form, ownership-blocked states, or owner acceptance complete.

## Original authority

Pinned ZeroOmega v3.5.0 sources:

- `omega-web/src/popup/index.html`;
- `omega-web/src/popup/js/loader.js`;
- `omega-web/src/popup/js/profiles.js`;
- `omega-web/src/popup/js/i18n.js`;
- commit `05cbb30` and the SHA-256-verified official Chromium package.

The official closed surface is two compact 430×31 rows in this order:

1. plus icon + `Add condition`;
2. filter icon + current domain + caret.

No native result select is persistently visible.

## Demonstrated Nex defect

The first paired artifact proved that Nex instead rendered a 69px persistent temporary-profile select before a wide `Add condition for <domain>` button. It exposed option text, removed the original icons/caret, changed action order, and increased information density. This was a visible Nex invention, not a browser limitation.

## Bounded correction prototype

- Restore the original row order and compact geometry.
- Restore the visible `Add condition` label, plus/filter icons, current domain and caret.
- Keep the existing current-site Apply and session-only temporary-rule transactions unchanged.
- Keep transaction compatibility plumbing outside the ordinary visible structure.
- Add strict paired text, structure and computed-style assertions to the permanent read-only evidence workflow.

The prototype passed the existing Browser E2E, Original Toolbar Evidence, Milestone 8 Visual Evidence, and paired Original↔Nex evidence. It is intentionally retained on this WIP branch because canonical `ORIGINAL_KNOWLEDGE_GRAPH.md` and `UI_AUDIT_MATRIX.md` could not be atomically appended through the current connector without replacing their complete contents.

## Evidence identities

- First diagnostic Head: `b1f02cbc5825f0af760f293411821244cf98e8d1`.
- Diagnostic artifact: `8878242959`.
- Diagnostic digest: `sha256:b246b72915d8d8bda80b69e71eb1b316da7ef84d8e632eef742ff3cf9e781c1f`.
- Prototype Head: `f51d15a0390eb36e781d66d07fad36bc96d4ec61`.
- Prototype paired artifact: `8878636443`.
- Prototype artifact digest: `sha256:65e05b7f784ec107c6f9af0d00772e46bd9227ebce118bc0445aa8fce90e7c0b`.
- Formatted work-package Head: `fe5d05b8cd25419add7070a5297d5dc496b39bfe`.
- Formatted artifact: `8878696776`.
- Formatted artifact digest: `sha256:16d2913a02a8b7925033456722266fb4d793d66b4015f5c28155c7c2184ab68a`.

## Required continuation

1. Atomically append the node to `docs/ORIGINAL_KNOWLEDGE_GRAPH.md` and update rows I-04/I-05/I-06/I-11 in `docs/UI_AUDIT_MATRIX.md`.
2. Commit formatted TypeScript and the strict paired evidence script.
3. Tighten CSS computed-style equality against the official rows.
4. Run all six permanent gates on one normal Head without runner-side formatting.
5. Inspect the paired artifact before changing status from `IMPLEMENTED` to `VERIFIED_AUTOMATION`.

## Non-claims

- The open temporary-rule menu is not yet accepted.
- The Add-condition form and submission journey are not yet paired end-to-end.
- Firefox and repository-owner acceptance remain required.
- Product progress remains 48%; Order 1 remains 45%; no candidate, merge, release, or owner retest is authorized.
