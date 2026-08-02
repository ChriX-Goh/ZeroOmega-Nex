# Audit Evidence 02G — Chromium Ownership Synchronization

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records one bounded browser-runtime correction. It is not an acceptance candidate or completion claim.

## Repeated failure

Multiple ordinary-Head Browser E2E runs failed at the same Chromium step:

`External proxy state did not converge to an importable Fixed candidate`

Firefox, Chromium native Inspect, CI and the other permanent gates remained healthy. Retrying the Chromium job sometimes passed, which initially resembled browser-state propagation variance. Repetition across unrelated Heads proved that relying on retries was not an acceptable permanent contract.

## Evidence sequence

The Chromium journey first gained explicit completion and read-back checks for `chrome.proxy.settings.set()`:

- callback-backed completion;
- immediate `chrome.runtime.lastError` handling;
- required `fixed_servers` mode;
- required fallback SOCKS and HTTP hosts.

Ordinary Head `12b2e2a6cab66ea51ad961717ee2f1eff36ea0de` still failed after all those assertions passed. This proved that Chrome accepted the external proxy, but another runtime path later replaced it.

A diagnostic Head then recorded every remaining ownership precondition. Its failure proved:

- control level was `controlled_by_this_extension`;
- persisted activation remained `activeBuiltInMode: system`;
- `showExternalProfile` remained `true`;
- the browser initially exposed the expected external Fixed configuration;
- the ownership response was healthy but contained no external candidate;
- by the time ownership read the platform state, the effective proxy had reverted to `{ mode: "system" }`.

## Root cause

The MV3 service worker can restart while System is the persisted built-in mode. Background startup recovery always called `restoreActiveSnapshot()`, which reapplied System before the ownership command inspected the current browser state. A valid external Fixed or PAC configuration was therefore overwritten during worker startup, making external-profile discovery inherently race-prone.

The proxy-settings change listener was not the writer; it only refreshed Toolbar state. The overwrite came from startup recovery.

## Verified product correction

System-mode startup recovery now reads the effective platform proxy state before restoring the persisted built-in mode.

When:

- the persisted built-in mode is System; and
- the effective Chromium state parses as a valid external Fixed or PAC profile;

background startup preserves that external state instead of reapplying `{ mode: "system" }`. The ordinary ownership path can then expose the candidate for import.

The correction does not alter:

- Direct recovery;
- genuine System recovery when the effective state is already System;
- PAC snapshot recovery;
- pending activation rollback;
- temporary-rule recovery;
- invalid external configurations;
- external-profile duplicate detection or import validation.

A pure decision helper is covered by unit tests for valid Fixed, valid PAC, Direct mode, built-in System and invalid Fixed configurations. The Chromium E2E retains all explicit preconditions and detailed diagnostics.

## Verification boundary

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

A fresh normal-Head Browser E2E run must pass Chromium on its first attempt and continue through every Toolbar specialist step. A manual rerun is not success evidence.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
