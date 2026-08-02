# Active Original ↔ Nex Parity Audit Index

## Authority

`PRODUCT_CONSTITUTION.md` is authoritative. `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` defines stable nodes and dependencies. `MILESTONE_8_STATUS.md` is the hand-maintained project summary. Draft PR #11 and GitHub Checks provide the exact moving Head and workflow conclusions.

## Current repository state

- Branch: `feat/m8-profile-workflow`.
- PR: #11, Draft.
- Active release candidate: none.
- Prepared artifact: one Order 1 owner-acceptance build.
- Failed historical candidate: `M8-OWNER-QC-1`.
- Provisional total progress: 52% (52.1%; confidence band 48%–55%).
- Active journey: Order 1 at 80%.
- Merge and release: prohibited.

## Current architecture

The retained runtime has:

- one background Action writer;
- one browser-global baseline plus per-tab overrides;
- serialized startup, activation and Action refresh;
- clean-install System initialization;
- repository-backed original-observable projection;
- exact renderer/localization and compatibility fallback;
- Inspect through the same executor;
- temporary-rule and ownership inputs through the same coordinator;
- fail-closed behavior for uncaptured trace shapes.

## Represented Toolbar families

The unified projection is `VERIFIED_AUTOMATION` for:

- Direct and System;
- Fixed proxy and bypass;
- one-level Switch → Direct/Fixed;
- attached Rule List 01H;
- nested Switch 01I;
- immediate Virtual → Direct/Fixed proxy/bypass;
- nested Virtual 01J;
- URL-backed PAC static Toolbar state 01K;
- temporary-rule Toolbar state 01L;
- external-control Toolbar state 01M;
- mixed Virtual → Switch 01O.

The Action boundary separately covers renderer fallback 01N. Chromium and Firefox verify every represented family, normal browser restart, restored user-edited Fixed state, internal-page fallback, same-tab transitions and two-tab isolation. Native Chromium Inspect verifies set, clear, base restoration and tab isolation.

Switch → System is not missing because the original runtime rejects it.

## Permanent original evidence harness

`.github/workflows/original-toolbar-evidence.yml`:

- downloads and verifies the official ZeroOmega v3.5.0 Chromium package;
- runs each scenario in an isolated browser profile;
- creates and applies profiles through original runtime APIs;
- captures runtime state, `_actionForUrl`, bounded ownership probes and renderer probes;
- uploads JSON evidence with read-only repository permission.

Scenario registry:

- `nested-switch` → 01I;
- `nested-virtual` → 01J;
- `pac` → 01K;
- `temporary-rule` → 01L;
- `external-control` → 01M;
- `renderer-fallback` → 01N;
- `virtual-switch` → 01O.

Pull requests run `all`.

## Exact-build closure evidence

One exact PR Head now passes:

- CI;
- Browser E2E;
- Original Toolbar Evidence;
- Milestone 8 Visual Evidence;
- Parity Documentation.

The Browser E2E transaction includes:

- full Chromium and Firefox extension journeys;
- focused Toolbar Action journeys;
- user-edited Fixed activation and bypass;
- normal close/relaunch with Applied ProfileSpec, active route, endpoint and Action restoration;
- attached Rule List and shared represented profile traces;
- external-control and renderer-fallback tests;
- native Chromium Inspect.

`DELIVERY_ORDER_01_OWNER_ACCEPTANCE.md` defines the remaining one-pass owner review. No new engineering family is authorized before that result unless the exact Head becomes red or the owner journey exposes a blocker.

## Active delivery sequence

1. **Order 1 — installation/startup/Toolbar: 80%.** Engineering, automation and real-browser closure are ready; owner acceptance remains open.
2. **Order 2 — original export → direct Nex use:** blocked by `KG-IMPORT-001` and `KG-IMPORT-COLOR-001`.
3. **Order 3 — Popup and temporary/site-rule journey:** complete hierarchy and interaction parity remain open.
4. **Order 4 — Options / Apply / Discard:** layout, workflow, dialog and text parity remain open.
5. **Order 5 — complete profile/lifecycle journeys:** historical implementation requires complete-journey re-audit.
6. **Order 6 — export/restart/rollback/ownership/authentication:** engineering assets exist; accepted complete behavior is unproved.
7. **Order 7 — localization/density/visual alignment:** paired original comparison and owner acceptance remain open.

## Deferred Order 1 shapes

These remain fail closed and move to later orders unless the owner journey exposes them:

- nested Switch beyond 01I;
- nested Virtual beyond 01J;
- Virtual → Switch beyond 01O;
- attached Rule List beyond 01H;
- PAC lifecycle beyond 01K;
- temporary-rule lifecycle beyond 01L;
- external-control lifecycle beyond 01M;
- renderer failures beyond 01N.

## Active blockers

- `KG-ICON-001` — complete Toolbar journey: `FAILED` until owner `PASS`.
- `KG-OWNER-ORDER1-001` — acceptance build ready; owner result `NOT RUN`.
- `KG-IMPORT-001` — original export direct use: `FAILED`.
- `KG-IMPORT-COLOR-001` — original `#RGB` normalization: open.
- `KG-UI-001` — Options/Popup presentation and hierarchy: `FAILED`.
- `KG-EXTRA-001` — extra descriptions/workflow: `FAILED`.
- `KG-INVENTION-001` — visible behavior without provenance: `FAILED`.
- `KG-FLOW-001` — complete interaction parity: `FAILED`.
- `KG-GOV-001` — final owner-acceptance governance: open.

## Next fixed edge

Run the one-pass Order 1 owner acceptance journey on the exact green `browser-builds` artifact. Record `PASS` or the first blocking mismatch. A `PASS` authorizes Order 2 real-export migration and `KG-IMPORT-COLOR-001`; a `FAIL` authorizes only the demonstrated blocker and directly dependent states.

## Execution rule

Every product node closes through:

`Original source/runtime -> original input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

Synthetic fixtures, green CI, Nex-only screenshots or test volume cannot independently close a product journey.
