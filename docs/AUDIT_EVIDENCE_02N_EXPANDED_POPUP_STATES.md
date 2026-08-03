# Audit Evidence 02N — Expanded Popup States

## Scope

This checkpoint expands the permanent Original ↔ Nex evidence boundary beyond the default Popup. It does not modify product behavior and is not an acceptance candidate.

## New paired surfaces

The workflow now drives runtime state through background APIs and captures:

- `popup-fixed-active` after applying the default `proxy` profile;
- `popup-switch-active` after applying the default `auto switch` profile.

The original package uses `applyProfile` and waits for `currentProfileName`. Nex uses the profile-workflow `activate-route` command and waits for the exact runtime profile route. Popup clicks are not used because a real browser popup may close after activation.

Each implementation therefore reaches its state through its own production background contract before the same-browser, same-locale, same-viewport screenshot, DOM, text and computed-style capture.

## Permanent artifact contract

Manifest schema 3 requires eight entries:

- four surfaces for official v3.5.0;
- the same four surfaces for Nex.

The existing default Popup, default Options and three-locale matrix remain mandatory. Fixed/Switch entries are added rather than replacing prior evidence.

The first ordinary schema-3 artifact is diagnostic. It must reveal the actual original result-selector, active-row, current-site and auxiliary-control structure before any product correction is attempted.

## Atomic verification

The schema-3 evidence expansion passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation on Actions-generated commit `a6a45cbfc0d60fe9fb74472060dfe2435cad6061`. Temporary patch scripts were removed in the same transaction.

## Ordinary verification boundary

This ordinary evidence Head must successfully drive both implementations through `proxy` and `auto switch`, produce exactly eight manifest entries and preserve all six permanent gates. No visual parity claim is made until the resulting paired artifact is inspected.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.

## First schema-3 result

Ordinary Head `1feee647d9d2cd2a4b0acfa89b2bb9172a4fff04` successfully produced the first schema-3 artifact and passed all six permanent gates. Artifact `8845149522` (`sha256:7dea6fc40f77ab5c8cbb321e2f8dcaccb84206917ddf786b15c5f04189c9056e`) proves both implementations reached active `proxy` and active `auto switch` through their production background contracts.

The active Fixed surfaces have the same visible structure and text. The active Switch surfaces expose a structural defect:

- Original keeps a single `auto switch` row and no `<select>`;
- Nex appends `[Direct]`, adds a visible `Result` label and renders a result-profile dropdown;
- Nex Popup height increases by 29px;
- manifest comparison reports `auto switch [Direct]`, `Result`, `Direct` and `System Proxy` only in Nex, with plain `auto switch` missing from Nex.

This is direct original evidence that the ordinary Popup result editor is a Nex-only invention. Backend mutation, condition-result computation, temporary rules and Options editing are not implicated.
