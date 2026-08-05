# Audit Evidence 02R — Popup Ownership and External Profile

## Scope

This slice covers two reproducible original-facing Popup entry states:

1. proxy control taken by another extension (`app`);
2. a Chromium proxy configuration owned by this extension but not represented by the active Nex profile (`external profile`).

The policy/browser-owned `not-controllable` state remains open because CI cannot truthfully create browser policy ownership. Source mapping exists, but it is not counted as browser evidence.

## Original contract

Pinned ZeroOmega v3.5.0 source and the official Chromium build establish that a blocked Popup hides the profile menu and Options row, shows reason/details, and exposes only Cancel and Manage. An external profile is a normal row after built-ins and before user profiles; clicking it replaces the row label with one naming input. Enter or blur saves it. No separate Cancel/Save action row appears.

## Permanent gates

- Chromium external-control Toolbar E2E opens the Popup during a real competing-extension takeover and asserts the blocked surface.
- Chromium Popup external-profile E2E writes an external fixed proxy through Nex's own browser API, verifies row order and form structure, then verifies blur-to-import.
- `validate-popup-entry-contract.mjs` permanently guards source structure.

## State

- `app` ownership surface: pending exact-Head verification.
- external-profile surface: pending exact-Head verification.
- policy/browser-owned surface: OPEN.
- project progress remains 48%; Order 1 remains 45%.
- owner retest, merge, and release remain prohibited.
