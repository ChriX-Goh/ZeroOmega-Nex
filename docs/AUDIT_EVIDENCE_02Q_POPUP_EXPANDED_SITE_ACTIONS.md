# Audit Evidence 02Q — Expanded Popup Site Actions

## Purpose

This evidence slice covers the two expanded current-site surfaces that remain after the verified 02P closed-state contract:

1. the temporary-rule result dropdown;
2. the Add-condition form.

The source of truth is the official ZeroOmega v3.5.0 Chromium package and the pinned original source at `zero-peak/ZeroOmega@05cbb30`. Nex-only screenshots cannot establish parity.

## Original contract

### Temporary-rule dropdown

The original row expands in place. The dropdown contains result profiles only, preserves original profile ordering, and marks the current temporary result active. It does not expose a link to a separate temporary-rule manager.

### Add-condition form

Opening Add condition changes the Popup into a dedicated form state:

- the profile menu is hidden;
- the Options row is hidden;
- the form is at least 360 px wide;
- the form contains the destination profile legend, condition type, condition details, result profile, Cancel, and Add condition;
- an empty required condition pattern disables submission.

The form is a routed Popup state, not an inline panel below the profile menu.

## Nex correction

Session 13 adds a bounded compatibility layer that:

- hides the Nex-only temporary-rule management row from the original Popup dropdown;
- preserves the existing typed temporary-rule runtime and result selection;
- hides the profile menu, Inspect/request summaries, and Options footer while the Add-condition form is open;
- restores the original 360 px form geometry, Bootstrap-era control density, and primary/cancel action order;
- retains required-pattern validation and the existing typed Add-condition transaction.

No runtime storage, profile interpreter, temporary-rule semantics, or browser proxy activation code is changed by this slice.

## Permanent paired evidence

`Original Nex UI Evidence` now runs `scripts/capture-original-nex-popup-expanded-site-action-evidence.mjs` against the exact PR Head. The artifact records paired screenshots, rendered HTML, text, geometry, style metrics, and validation state for both expanded surfaces.

The gate fails when:

- Nex exposes a visible temporary-rule management row;
- result-option counts differ;
- the expansion mode differs;
- the Nex profile menu or Options footer remains visible with the form open;
- required-pattern validation differs.

## State

- Implementation: `PENDING_EXACT_HEAD_VERIFICATION`.
- Firefox owner retest: prohibited.
- Merge and release: prohibited.
- Project progress remains 48%.
- Order 1 remains 45%.

Passing this evidence slice closes only the expanded current-site presentation contract. Ownership-blocked and external-profile entry states remain separate Session 13 blockers.
