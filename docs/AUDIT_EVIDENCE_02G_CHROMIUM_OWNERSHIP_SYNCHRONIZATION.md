# Audit Evidence 02G — Chromium Ownership Synchronization

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records one bounded browser-test synchronization correction. It is not an acceptance candidate or completion claim.

## Repeated failure

Multiple ordinary-Head Browser E2E runs failed at the same Chromium step:

`External proxy state did not converge to an importable Fixed candidate`

Firefox, Chromium native Inspect, CI and the other permanent gates remained healthy. Retrying the Chromium job sometimes passed, which initially resembled browser-state propagation variance. Repetition across unrelated Heads proved that relying on retries was not an acceptable permanent contract.

## Root cause

The E2E set an external fixed proxy using `chrome.proxy.settings.set()` and immediately started ownership inspection. It did not explicitly wait for the Chrome callback that confirms the setting operation has completed. Depending on runner scheduling, ownership inspection could read the previous browser proxy state for the entire polling window.

## Verified correction

The Chromium journey now:

- wraps `chrome.proxy.settings.set()` in an explicit callback-backed promise;
- fails immediately on `chrome.runtime.lastError`;
- reads back the effective proxy setting after the callback;
- requires `fixed_servers` mode;
- requires the expected fallback SOCKS host;
- requires the expected HTTP host;
- only then asks the real Popup/background ownership path for an importable Fixed candidate.

The candidate, import form, profile-name validation, imported endpoints, bypass list and activation assertions remain unchanged. No timeout was lengthened and no assertion was removed.

## Verification boundary

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

A fresh normal-Head Browser E2E run must pass Chromium on its first attempt, followed by every Toolbar specialist step. A manual rerun is not evidence for this correction.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
