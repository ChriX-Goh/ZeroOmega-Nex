# Audit Evidence 02G — Chromium Ownership Synchronization

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records an active browser-runtime correction. It is not an acceptance candidate or completion claim.

## Repeated failure

Multiple ordinary-Head Browser E2E runs failed at the same Chromium step:

`External proxy state did not converge to an importable Fixed candidate`

Firefox, Chromium native Inspect, CI and the other permanent gates remained healthy. Retrying Chromium sometimes passed, but repetition across unrelated Heads proved that retries were not an acceptable contract.

## Evidence sequence

The Chromium journey first gained explicit completion and read-back checks for `chrome.proxy.settings.set()`. Those checks proved that Chrome accepted the external Fixed configuration before another extension runtime path restored System.

Diagnostics consistently proved:

- control level remained `controlled_by_this_extension`;
- persisted activation remained `activeBuiltInMode: system`;
- `showExternalProfile` remained `true`;
- Chrome initially exposed the expected external Fixed configuration;
- the ownership response was healthy but contained no external candidate;
- by ownership inspection, the effective setting had reverted to `{ mode: "system" }`.

## Progressive root-cause isolation

The first identified writer was `restoreActiveSnapshot()`. System-mode recovery was changed to preserve a valid external Fixed or PAC candidate instead of immediately restoring System.

A second fallthrough was then found: after external preservation returned, the caller saw no internal `activeRoute` and activated the default startup System route. Startup recovery gained an explicit disposition so `startup-complete` could not fall through to that activation.

Ordinary Head `1b20fd90d4fc25bc0af0e8473c49d74e44469822` still reproduced the overwrite. The remaining race was architectural:

1. `workflowRuntime.initialize()` queued only the initial workflow `get` command;
2. proxy authentication, pending recovery, external-state inspection and snapshot restoration ran later in a detached `.then()` callback;
3. the command queue became available as soon as `get` completed;
4. Popup commands could activate Direct, then System, and then install an external proxy while the detached startup recovery was still running;
5. the older recovery operation could finish last and write System over the external state.

The two earlier corrections were necessary for service-worker restart safety, but they did not serialize first-start recovery with user commands.

## Corrected initialization contract

`registerProfileWorkflowRuntime()` now accepts a `completeInitialization` hook. The initial workflow command and the complete proxy startup recovery run inside one queue operation. Runtime messages are not allowed to execute until that hook settles.

The background hook performs:

- authentication initialization;
- pending activation recovery;
- temporary-rule startup reconciliation;
- external Fixed/PAC preservation while System is persisted;
- active snapshot restoration;
- conditional startup-route activation;
- final Toolbar refresh.

Proxy recovery still returns an explicit disposition:

- `startup-complete` — external state was preserved or temporary-rule reconciliation completed;
- `inspect-startup-route` — normal recovery completed and startup-route inspection is allowed;
- `failed` — no later activation may run.

The default startup route is activated only for `inspect-startup-route` when no internal active route exists.

## Regression boundary

A dedicated unit test blocks the complete initialization hook, sends a concurrent runtime message and proves that the message cannot settle until recovery is released. Existing tests continue to cover concurrent initialization deduplication, complete initial activation, every restore disposition, external Fixed/PAC preservation and invalid states.

The correction must pass atomic repository validation, then a fresh ordinary-Head Chromium main E2E on its first attempt and every Toolbar specialist step. A manual rerun is not success evidence.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
