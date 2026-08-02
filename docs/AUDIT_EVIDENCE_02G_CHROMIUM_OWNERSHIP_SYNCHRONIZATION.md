# Audit Evidence 02G — Chromium Ownership Synchronization

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records an active browser-runtime correction. It is not an acceptance candidate or completion claim.

## Repeated failure

Multiple ordinary-Head Browser E2E runs failed at the same Chromium step:

`External proxy state did not converge to an importable Fixed candidate`

Firefox, Chromium native Inspect, CI and the other permanent gates remained healthy. Retrying Chromium sometimes passed, but repetition across unrelated Heads proved that retries were not an acceptable contract.

## Evidence sequence

The Chromium journey first gained explicit completion and read-back checks for `chrome.proxy.settings.set()`:

- callback-backed completion;
- immediate `chrome.runtime.lastError` handling;
- required `fixed_servers` mode;
- required fallback SOCKS and HTTP hosts.

Those assertions passed while ownership still failed. Diagnostics then proved:

- control level remained `controlled_by_this_extension`;
- persisted activation remained `activeBuiltInMode: system`;
- `showExternalProfile` remained `true`;
- Chrome initially exposed the expected external Fixed configuration;
- the ownership response was healthy but contained no external candidate;
- by ownership inspection, the effective setting had reverted to `{ mode: "system" }`.

## Two-stage root cause

The MV3 service worker can restart while System is the persisted built-in mode.

The first identified writer was `restoreActiveSnapshot()`. A guard was added so System-mode recovery reads the effective platform state and preserves a valid external Fixed or PAC candidate instead of immediately restoring System.

That first correction passed one ordinary Chromium run, but Head `af425f36be1c44b72a06658e04cc6b26c642f715` later reproduced the same overwrite. Source tracing exposed a second, deterministic write after the preservation return:

1. `restoreProxyRuntime()` detected the external candidate and returned;
2. its caller inspected the internal runtime route;
3. external browser state has no internal `activeRoute`;
4. the caller interpreted the missing route as an uninitialized browser;
5. it activated the configured startup route, defaulting to System.

The preservation guard therefore skipped only snapshot restoration, not the later startup activation.

## Corrected startup contract

Proxy startup recovery now returns an explicit disposition:

- `startup-complete` — external state was preserved or temporary-rule startup reconciliation completed;
- `inspect-startup-route` — normal recovery completed and the caller may inspect whether a startup route is still required;
- `failed` — recovery failed and no additional activation may run.

The default startup route is activated only for `inspect-startup-route` when no internal active route exists. `startup-complete` can never fall through to System activation.

This keeps unchanged:

- Direct recovery;
- genuine System recovery when the effective state is already System;
- PAC snapshot recovery;
- pending activation rollback;
- temporary-rule recovery;
- invalid external configurations;
- external-profile duplicate detection and import validation.

Pure unit tests cover every disposition with and without an existing active route, in addition to valid Fixed/PAC preservation and invalid/built-in states. Chromium E2E retains its explicit platform read-back, ownership preconditions and detailed failure diagnostics.

## Verification boundary

The correction must pass the atomic repository validation, then a fresh ordinary-Head Chromium main E2E on its first attempt and every Toolbar specialist step. A manual rerun is not success evidence.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
