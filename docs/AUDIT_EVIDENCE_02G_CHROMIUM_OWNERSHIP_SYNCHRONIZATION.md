# Audit Evidence 02G — Chromium Ownership Synchronization

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records an active browser-test investigation. It is not an acceptance candidate, completion claim or resolved correction.

## Repeated failure

Multiple ordinary-Head Browser E2E runs failed at the same Chromium step:

`External proxy state did not converge to an importable Fixed candidate`

Firefox, Chromium native Inspect, CI and the other permanent gates remained healthy. Retrying the Chromium job sometimes passed, which initially resembled browser-state propagation variance. Repetition across unrelated Heads proved that relying on retries was not an acceptable permanent contract.

## First synchronization hypothesis

The E2E originally set an external fixed proxy using `chrome.proxy.settings.set()` and immediately started ownership inspection. It did not explicitly wait for the Chrome callback that confirms the setting operation has completed.

The journey was strengthened to:

- wrap `chrome.proxy.settings.set()` in an explicit callback-backed promise;
- fail immediately on `chrome.runtime.lastError`;
- read back the effective proxy setting after the callback;
- require `fixed_servers` mode;
- require the expected fallback SOCKS host;
- require the expected HTTP host;
- only then ask the real Popup/background ownership path for an importable Fixed candidate.

## Normal-Head result

Ordinary Head `12b2e2a6cab66ea51ad961717ee2f1eff36ea0de` still failed on the first Chromium attempt at the ownership candidate step. The new read-back assertions passed before the failure. This proves that the browser accepted and exposed the expected external fixed proxy; waiting for the setting callback was necessary evidence but not a complete root-cause fix.

The unresolved decision is inside the background ownership path. Its remaining gates are:

1. Chromium still reports this extension as the proxy controller;
2. persisted activation state remains `activeBuiltInMode: system`;
3. applied interface settings retain `showExternalProfile: true`;
4. the effective fixed proxy parses as a non-duplicate external candidate.

## Current diagnostic correction

The Chromium journey now records and explicitly asserts the first three preconditions before ownership polling. It also records applied profiles and proxy endpoints. If ownership still fails, the thrown error includes:

- effective control level;
- persisted built-in activation mode;
- applied `showExternalProfile` value;
- relevant profile and endpoint inventory;
- the last ownership response;
- the last effective proxy setting.

This does not weaken, skip or lengthen the external-profile contract. The import form, name validation, endpoint mapping, bypass list and activation assertions remain unchanged.

The diagnostic enhancement passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

## Verification boundary

A fresh normal-Head Chromium run is required. If it fails, the exact false precondition or ownership response becomes the only next engineering target. A manual rerun is not success evidence.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
