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
