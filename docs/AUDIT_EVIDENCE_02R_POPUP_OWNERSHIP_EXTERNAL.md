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
- Firefox current-site E2E opens Popup only after the explicit local fixture tab reaches its exact URL and completed state.
- `validate-popup-entry-contract.mjs` permanently guards source structure.

## State

- Historical verified product Head: `dfdd10d499e8f9b6bc9652867266469214ccdc85`.
- Stable verified Head after browser-readiness hardening: `49bad8aa7551e4bb6c5eabde2c8bdf375c2fea75`.
- All six permanent workflows passed on the stable verified Head.
- `app` ownership surface: VERIFIED.
- external-profile surface: VERIFIED.
- policy/browser-owned surface: OPEN.
- project progress remains 48%; Order 1 remains 45%.
- owner retest, merge, and release remain prohibited.

## Verification correction

The first exact-Head run found two stale gates. Loading must retain the original Options footer; ownership-blocked states alone hide it. The pre-existing Chromium journey must use the original inline input's blur/submit save contract rather than Nex-only action buttons.

The corrected and stabilized exact Head proves:

- loading retains the Options footer;
- ownership-blocked Popup hides profiles and Options;
- the real competing-extension takeover surface passes Chromium browser automation;
- the original inline external-profile input rejects an invalid reserved name;
- blur imports a valid external profile and closes the Popup;
- Chromium waits for the profile workflow and ownership runtime to converge before opening Popup;
- Firefox waits for the exact local current-site URL and completed tab state before opening Popup;
- Chromium, Firefox, native Inspect, paired UI evidence, documentation and CI gates remain green.

## Browser-gate readiness hardening

A documentation-only Head exposed two latent test races despite unchanged product code:

- the Chromium fixture could write proxy settings before background workflow initialization settled;
- the Firefox fixture could open Popup before its synthetic current-site tab reached the requested URL.

The permanent gates now wait on runtime state rather than elapsed time. The targeted Chromium external-profile journey and full Firefox journey passed before commit. Clean Head `49bad8aa7551e4bb6c5eabde2c8bdf375c2fea75` then passed all six permanent workflows, restoring stable 02R acceptance without broadening product scope.
