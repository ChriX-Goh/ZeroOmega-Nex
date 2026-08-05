# Delivery Order 01 — Owner Acceptance

## Purpose

This document is the repository-owner acceptance contract and outcome record for Order 1: installation, startup, Toolbar, Popup and Options entry behavior on one exact Chromium/Firefox build.

It does not close original-export migration, complete Popup/Options parity, every profile lifecycle or final visual alignment. Automation evidence supports engineering confidence but cannot replace original-facing parity or repository-owner acceptance.

## Current state

- Order 1 state: `REOPENED_AFTER_OWNER_FAIL`.
- Latest owner result: `FAIL` on Firefox, 2026-08-02.
- Retired tested Head: `d57449bb74d9fedb53602af9b1e908ae18d700b9`.
- Active owner-acceptance package: none.
- Active release candidate: none.
- Project progress: 48% (47.9%; confidence 43%–50%).
- Order 1 progress: 45%.
- Owner retest, merge and release: prohibited during the correction phase.
- `KG-ICON-001`, `KG-UI-001`, `KG-EXTRA-001`, `KG-INVENTION-001` and `KG-FLOW-001`: remain failed/open.

The former `52% / Order 1 80%` readiness claim and the acceptance package bound to the retired Head are invalid. They treated broad runtime automation as sufficient proof of original-facing product parity.

## Failed owner outcome

The Firefox owner run demonstrated that changing the icon and passing runtime automation did not make the product original-compatible.

The first blocking mismatch was structural rather than cosmetic:

- the broader product remained visibly unlike ZeroOmega v3.5.0;
- Options and Popup retained redesign differences;
- excessive explanatory and engineering text remained in ordinary UI;
- internal checkpoints, Draft/application state and capability analysis were exposed where they belonged only in code, tests, the knowledge graph and Markdown;
- the ordinary entry journey therefore required material relearning.

This is an explicit owner `FAIL`, not an unrun or inconclusive acceptance step.

## Retained automated evidence

The failed owner result does not invalidate the verified engineering infrastructure. The retired exact build had automated evidence for:

### Chromium

1. clean-install System state;
2. Direct, user-edited Fixed proxy and bypass Action state;
3. same-tab transitions and two-tab isolation;
4. normal close/relaunch restoration;
5. attached Rule List and represented profile-result traces;
6. competing-extension takeover and recovery;
7. renderer fallback and recovery;
8. native Inspect set, clear and tab isolation.

### Firefox

1. clean-install System state;
2. Direct, user-edited Fixed proxy and bypass Action state;
3. same-tab transitions and two-tab isolation;
4. normal close/relaunch restoration;
5. attached Rule List and represented profile-result traces;
6. external-control state and recovery;
7. renderer fallback and recovery.

These checks prove bounded runtime behavior. They do not prove Popup/Options structure, terminology, defaults, hierarchy, density or interaction-order parity.

## Correction gate before another owner package

A new owner-acceptance package must not be produced until all conditions below are met:

1. paired Original ↔ Nex evidence covers the relevant expanded Popup states, not only the default and closed current-site rows;
2. the temporary-rule menu and Add-condition form, validation and submission journey are mapped and verified;
3. ownership-blocked, external-profile and browser-owned Popup states are mapped against original evidence;
4. Options profile editors, dialogs, Apply/Discard behavior and information density have paired evidence;
5. unproven helper prose, Nex-only workflow and interaction-order differences are removed or supported by a documented browser limitation;
6. Firefox passes first on the exact Head; Chromium then confirms the same contracts;
7. the default-entry and closed current-site regression gates remain green;
8. a Go/No-Go review confirms that the exact build is ready for one bounded owner run.

Passing local or CI checks alone cannot authorize owner retest.

## Future one-pass owner journey

When a later exact package is authorized, run one ordinary-use review on the primary browser and use the second browser only for focused confirmation:

1. load the exact build into a clean browser profile;
2. confirm the initial Toolbar state before opening Options;
3. open Popup and verify its ordinary profile and current-site structure;
4. switch through Direct, one Fixed profile and one bypass result;
5. exercise one ordinary Switch, Virtual, attached Rule List and URL-backed PAC path;
6. add and remove one temporary current-site rule;
7. open an internal browser page and confirm fallback;
8. use Inspect once and clear it;
9. close and reopen the browser, confirming active-state restoration;
10. inspect Options default landing, profile editors, dialogs and Apply/Discard behavior;
11. record `PASS` or the first blocking mismatch.

The owner journey is an ordinary-use review, not a laboratory replay of every automation case.

## Acceptance criteria

Record `PASS` only when:

- an experienced ZeroOmega user can recognize the ordinary workflow without material relearning;
- Toolbar, Popup, Options and per-tab state do not contradict one another;
- original defaults, terminology, hierarchy, interaction order and information density are preserved unless a documented browser limitation prevents exact behavior;
- no engineering-only Draft, compile, snapshot, graph, capability-study or delivery terminology leaks into ordinary UI;
- normal restart restores the expected active state;
- no visible mismatch blocks daily use.

Record `FAIL` at the first ordinary-use blocker. The record must identify browser, visible state, expected original behavior and observed Nex behavior.

## Outcome record

- Exact tested Head: `d57449bb74d9fedb53602af9b1e908ae18d700b9` (retired).
- Browser: Firefox; exact version was not recorded in the stable repository evidence.
- Associated retired package: `browser-builds`, artifact ID `8830062559`, digest `sha256:3eb108df6ebc7f3bfb5e4d0db8f4ad94e3e888887961e154a94e08ffc0c8e076`.
- Result: `FAIL` on 2026-08-02.
- First blocking mismatch: the entry product remained structurally unlike ZeroOmega v3.5.0 and exposed excessive redesign/engineering prose despite the icon correction.
- Consequence: the acceptance build was retired; Order 1 returned to 45%; no active candidate exists.

## After the current result

Only correction work directly supporting original-facing entry parity is authorized. Order 2 real original-export migration, merge, beta, release, Rust/WASM, Native Engine and unrelated feature expansion remain blocked.

A later explicit owner `PASS` on a newly authorized exact build changes Order 1 to `OWNER_ACCEPTED` and authorizes the next delivery order. Until then, this document must remain synchronized with `MILESTONE_8_STATUS.md`, `PROJECT_PROGRESS_MODEL.md`, Draft PR #11 and the active session knowledge graph.
