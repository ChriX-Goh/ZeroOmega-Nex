# ZeroOmega Nex Project Progress Model

## Purpose

This document defines progress toward the first stable original-compatible browser release.

Progress is not derived from code volume, commit count, old matrix rows, test count or green CI alone. It measures complete user journeys against the product contract: original evidence, explicit Original ↔ Nex mapping, implementation, contract automation, real browser/data evidence and repository-owner acceptance.

## Current total progress

- Provisional total progress: **52%**.
- Unrounded score: **52.1%**.
- Confidence band: **48%–55%**.
- Active journey: **Order 1 at 80%**.
- Previous baseline: **47%** total and **35%** Order 1.
- Change: **+5 rounded project points** and **+45 Order 1 points**.
- Denominator correction: none.

The failed `M8-OWNER-QC-1` candidate and historical `98%` estimate are not inputs to this model.

## Journey weights

| Order | Complete user journey                                                 |   Weight |
| ----: | --------------------------------------------------------------------- | -------: |
|     1 | Installation, startup, Toolbar icon/title/Badge and per-tab state     |      12% |
|     2 | Original export file → direct import → immediate equivalent use       |      20% |
|     3 | Popup selection, result state, current-site rules and temporary rules |      12% |
|     4 | Options information architecture, dialogs and Apply/Discard lifecycle |      16% |
|     5 | Fixed, Switch, PAC, Virtual, Rule List and profile lifecycle journeys |      22% |
|     6 | Export, restart, rollback, ownership and authentication               |      10% |
|     7 | Localization, information density and visual alignment                |       8% |
|       | **Total**                                                             | **100%** |

## Completion gates inside every journey

| Gate                       | Share inside journey | Meaning                                                                |
| -------------------------- | -------------------: | ---------------------------------------------------------------------- |
| Original capture           |                  15% | Original source, runtime, UI and data behavior are captured.           |
| Nex capture and mapping    |                  10% | Current Nex behavior is independently captured and explicitly mapped.  |
| Implementation             |                  40% | Required behavior exists without unapproved inventions.                |
| Contract automation        |                  15% | Tests verify original-derived contracts rather than Nex-only fixtures. |
| Real browser/data evidence |                  10% | Clean Chromium/Firefox and real original data pass where applicable.   |
| Owner acceptance           |                  10% | Repository owner accepts the exact behavior/build.                     |
| **Total**                  |             **100%** | A journey reaches 100% only after owner acceptance.                    |

No journey receives owner-acceptance points from inference, silence, generated screenshots or automation.

## Current scored baseline

| Order |   Weight | Current journey completion | Earned project points | Current basis                                                                                                                                                                                                                                                                                                                                                                                               |
| ----: | -------: | -------------------------: | --------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|     1 |      12% |                        80% |                   9.6 | One exact Head passes CI, original evidence, visual evidence, parity documentation and complete Chromium/Firefox Browser E2E. The suite covers clean startup, user-edited Fixed proxy/bypass, represented profile traces, ownership, renderer fallback, native Inspect and normal close/relaunch with restored Applied ProfileSpec, active route, endpoint and Action state. Owner acceptance remains open. |
|     2 |      20% |                        35% |                   7.0 | Legacy decoding and typed import foundations exist, but representative real original exports have not passed direct import, activation, browsing, restart and semantic re-export. `KG-IMPORT-COLOR-001` remains open.                                                                                                                                                                                       |
|     3 |      12% |                        46% |                   5.5 | Substantial Popup/runtime implementation and browser checks exist, but complete original hierarchy, density, site-rule interaction and owner review remain open.                                                                                                                                                                                                                                            |
|     4 |      16% |                        51% |                   8.1 | Options and Draft/Applied foundations are substantial; original layout, dialogs, extra descriptions and interaction parity remain untrusted.                                                                                                                                                                                                                                                                |
|     5 |      22% |                        60% |                  13.2 | Fixed/Switch/PAC/Virtual/Rule List implementation is broad, but historical `DONE` rows require complete-journey re-audit and real migrated-data verification.                                                                                                                                                                                                                                               |
|     6 |      10% |                        52% |                   5.2 | Authentication, ownership, snapshots and rollback foundations exist; complete original-facing lifecycle and real imported-configuration verification remain incomplete.                                                                                                                                                                                                                                     |
|     7 |       8% |                        44% |                   3.5 | Typed localization and generated Nex visual checks exist; paired original runtime comparison, density cleanup and owner acceptance remain open.                                                                                                                                                                                                                                                             |
|       | **100%** |                            |        **52.1 → 52%** | Rounded to the nearest whole percentage point.                                                                                                                                                                                                                                                                                                                                                              |

## Evidence causing the change

Order 1 moved from 35% to 80% because one exact build now verifies:

- the complete permanent gate set;
- clean-install System initialization;
- ordinary Direct and user-edited Fixed activation;
- Fixed proxy and bypass Action states;
- same-tab transitions and two-tab isolation;
- normal Chromium and Firefox close/relaunch;
- restored Applied ProfileSpec, active Fixed route, endpoint and real Toolbar state;
- represented Switch, Virtual, Rule List, PAC, temporary-rule and mixed profile traces;
- external-control recovery and renderer fallback;
- native Chromium Inspect.

`DELIVERY_ORDER_01_OWNER_ACCEPTANCE.md` converts these engineering results into one owner-facing acceptance run. No owner-acceptance points have been awarded.

## Why Order 1 is not complete

The remaining 20% covers:

- physical Toolbar/Popup and visible Ω/title/Badge/detail review;
- one ordinary-use repository-owner run on the exact green artifact;
- explicit `PASS`, or correction of the first demonstrated blocker.

Exotic uncaptured graph shapes remain fail closed and move to later orders. They no longer prevent Order 1 from reaching owner acceptance.

## Reporting rules

Every substantive project report must include:

1. current total percentage;
2. confidence band while the full audit remains incomplete;
3. delta from the preceding baseline;
4. exact evidence causing the change;
5. denominator correction caused by newly discovered original scope;
6. active journey and its percentage.

The percentage must never be described as release readiness. PR #11 remains Draft, no release candidate is active, and 100% still requires direct original-export migration, complete two-browser journeys, removal of unjustified UI/workflow and repository-owner `PASS` on one exact final candidate.
