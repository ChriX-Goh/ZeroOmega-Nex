# ZeroOmega Nex Project Progress Model

## Purpose

This document defines how total progress toward the first stable original-compatible browser release is reported.

The percentage is not derived from code volume, commit count, old matrix row counts, or green tests alone. It measures complete user journeys against the project contract: original evidence, explicit Original ↔ Nex mapping, implementation, contract verification, real browser/data evidence, and repository-owner acceptance.

## Current total progress

**Provisional total progress: 46%.**

**Confidence band: 42%–50%.**

The confidence band remains wider until the complete Original and Nex surface inventories are captured. Audit findings may legitimately move the percentage downward when previously hidden scope is discovered. This is correction of the denominator, not lost implementation.

The failed `M8-OWNER-QC-1` candidate and the historical `98%` estimate are not inputs to this model.

## Journey weights

| Order | Complete user journey                                                 |   Weight |
| ----: | --------------------------------------------------------------------- | -------: |
|     1 | Installation, startup, toolbar icon/title/Badge and per-tab state     |      12% |
|     2 | Original export file → direct import → immediate equivalent use       |      20% |
|     3 | Popup selection, result state, current-site rules and temporary rules |      12% |
|     4 | Options information architecture, dialogs and Apply/Discard lifecycle |      16% |
|     5 | Fixed, Switch, PAC, Virtual, Rule List and profile lifecycle journeys |      22% |
|     6 | Export, restart, rollback, ownership and authentication               |      10% |
|     7 | Localization, information density and visual alignment                |       8% |
|       | **Total**                                                             | **100%** |

The migration journey receives the largest individual compatibility weight after the complete profile journeys because direct use of an original export is a non-negotiable project outcome.

## Completion gates inside every journey

| Gate                       | Share inside journey | Meaning                                                                       |
| -------------------------- | -------------------: | ----------------------------------------------------------------------------- |
| Original capture           |                  15% | Original source, runtime, UI and data behavior are captured.                  |
| Nex capture and mapping    |                  10% | Current Nex behavior is independently captured and explicitly mapped.         |
| Implementation             |                  40% | Required behavior exists without unapproved inventions.                       |
| Contract automation        |                  15% | Tests verify source-derived original contracts rather than Nex-only fixtures. |
| Real browser/data evidence |                  10% | Clean Chromium/Firefox and real original data pass where applicable.          |
| Owner acceptance           |                  10% | Repository owner accepts the exact behavior/build.                            |
| **Total**                  |             **100%** | A journey reaches 100% only after owner acceptance.                           |

No journey may receive owner-acceptance points from inference, silence, generated screenshots, or automation.

## Current scored baseline

| Order |   Weight | Current journey completion | Earned project points | Basis                                                                                                                                                                                                     |
| ----: | -------: | -------------------------: | --------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|     1 |      12% |                        25% |                   3.0 | Core original toolbar source, exact Ω geometry, 18-row mapping and two pure source-derived implementation slices exist; installed original runtime capture, per-tab adapter and owner review remain open. |
|     2 |      20% |                        35% |                   7.0 | Legacy decoding and typed import foundations exist, but the owner’s real original export is not directly usable and no accepted real-export corpus exists.                                                |
|     3 |      12% |                        46% |                   5.5 | Substantial Popup/runtime implementation and browser checks exist, but the complete original hierarchy, density and all states have not passed side-by-side owner review.                                 |
|     4 |      16% |                        51% |                   8.1 | Options and Draft/Applied foundations are substantial; project-wide layout, extra descriptions, dialogs and interaction parity remain untrusted.                                                          |
|     5 |      22% |                        60% |                  13.2 | Fixed/Switch/PAC/Virtual and lifecycle implementation is broad, but old `DONE` rows require complete journey re-audit and real migrated-data verification.                                                |
|     6 |      10% |                        52% |                   5.2 | Authentication, ownership, snapshots and rollback foundations exist; original-facing lifecycle and real imported configuration verification remain incomplete.                                            |
|     7 |       8% |                        44% |                   3.5 | Typed localization and generated Nex visual checks exist; original installed runtime comparison, density cleanup and owner acceptance remain open.                                                        |
|       | **100%** |                            |        **45.5 → 46%** | Rounded to the nearest whole percentage point.                                                                                                                                                            |

## Reporting rules

Every substantive project report must include:

1. the current total percentage;
2. the confidence band while the full audit is incomplete;
3. the delta from the preceding reported baseline;
4. the exact evidence that caused the change;
5. any denominator correction caused by newly discovered original scope;
6. the currently active journey and its completion percentage.

The percentage must never be described as release readiness. PR #11 remains Draft, no candidate is active, and 100% still requires direct original-export migration, complete two-browser journeys, removal of unjustified UI/workflow, and owner `PASS` on one exact final candidate.
