# Milestone 8 Status — Original-Compatible Rewrite

## Authority

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This file is the single hand-maintained Milestone 8 progress and blocker summary. Exact moving Head and workflow conclusions are read from Draft PR #11 and GitHub Checks.

- Branch: `feat/m8-profile-workflow`.
- Pull request: #11, Draft.
- Active release candidate: none.
- Order 1 acceptance build: prepared for one repository-owner run.
- Last failed candidate: `M8-OWNER-QC-1` on 2026-07-30.
- Provisional total progress: 52% (unrounded 52.1%; confidence band 48%–55%).
- Active journey: Order 1 — installation/startup/Toolbar, 80%.
- Change from the previous baseline: +5 rounded project points; no denominator correction.
- Merge and release: prohibited.

The historical `98%` and broad `DONE` counts measured an incomplete automated contract and remain invalid.

## Product contract

ZeroOmega Nex is a bottom-layer clean-room rewrite of ZeroOmega v3.5.0, not a modernization redesign. Supported original exports must import directly and become immediately usable. Experienced original users must not rebuild profiles, reinterpret ordinary settings or learn a replacement workflow. Visible differences require exact original evidence, a bounded browser limitation or explicit repository-owner acceptance.

## Current Order 1 result

The exact branch now passes one consolidated permanent-gate transaction containing:

- CI;
- Browser E2E;
- Original Toolbar Evidence;
- Milestone 8 Visual Evidence;
- Parity Documentation.

Chromium and Firefox both verify:

- clean-install System initialization;
- Direct and user-edited Fixed activation;
- Fixed proxy and bypass Action states;
- same-tab transitions and two-tab isolation;
- normal browser close and relaunch;
- restored Applied ProfileSpec, active Fixed route, proxy endpoint and Toolbar Action state;
- attached Rule List 01H;
- represented Switch, nested Switch, Virtual, nested Virtual, PAC, temporary-rule and Virtual → Switch states;
- external-control and renderer-fallback states.

Native Chromium Inspect verifies set, clear, base restoration and tab isolation.

These results move Order 1 from 35% to 80%. They complete the engineering, automation and real-browser closure work that was previously missing. They do not supply repository-owner acceptance.

## Represented original-observable boundaries

The retained branch is `VERIFIED_AUTOMATION` for:

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
- renderer fallback 01N;
- mixed Virtual → Switch 01O;
- browser-internal/default fallback;
- same-tab transitions and two-tab isolation;
- normal restart restoration;
- native Chromium Inspect.

Unknown combinations remain fail closed. Switch → System is not missing because the original runtime rejects it.

## Order 1 closure boundary

Order 1 must not expand indefinitely through theoretical nested or mixed graphs. New evidence families are allowed only when:

1. the owner acceptance journey reaches an unresolved state;
2. represented Nex behavior disagrees with the original;
3. the gap risks data loss, unsafe proxy state, credential exposure or failed recovery;
4. the state is required by the ordinary acceptance path.

Other combinations remain fail closed and move to Orders 3, 5 or 6.

## Owner acceptance readiness

`DELIVERY_ORDER_01_OWNER_ACCEPTANCE.md` defines the single one-pass owner journey.

The acceptance package must be the `browser-builds` artifact from the exact PR Head whose five permanent gates are green. It is an Order 1 acceptance build, not a release candidate.

Remaining Order 1 blockers:

- one repository-owner ordinary-use run;
- visible Ω/title/Badge/detail and physical Toolbar/Popup review;
- explicit `PASS` or the first demonstrated blocking mismatch.

No further engineering or evidence-family expansion is authorized before that result unless the exact Head becomes red.

## Project-wide release blockers

- `KG-ICON-001` — complete Toolbar journey still awaits owner acceptance;
- `KG-IMPORT-001` — real original export direct import and immediate equivalent use;
- `KG-IMPORT-COLOR-001` — shorthand original color normalization;
- `KG-UI-001` — layout, density, dialogs, controls and hierarchy;
- `KG-EXTRA-001` — unnecessary descriptions and extra workflow;
- `KG-INVENTION-001` — visible behavior without provenance or accepted difference;
- `KG-FLOW-001` — complete feature and interaction parity;
- `KG-GOV-001` — final completion and owner-acceptance governance.

## Immediate execution order

1. Run the single Order 1 owner acceptance journey on the exact green build.
2. Record `PASS` or the first blocking mismatch.
3. On `FAIL`, fix only the demonstrated blocker and directly dependent state.
4. On `PASS`, mark `KG-ICON-001` and Order 1 `OWNER_ACCEPTED`.
5. Begin Order 2 real original-export migration, including `KG-IMPORT-COLOR-001`.

## Candidate prohibition

Green automation alone cannot authorize merge or release. The prepared package is only an Order 1 acceptance build. A release candidate remains prohibited until the applicable later delivery orders pass.
