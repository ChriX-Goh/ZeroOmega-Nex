# ZeroOmega Nex Project Progress Model

## Purpose

This document defines progress toward the first stable original-compatible browser release.

Progress is not derived from code volume, commit count, matrix row count, test count or green CI alone. It measures complete original-facing user journeys: original evidence, explicit Original ↔ Nex mapping, implementation, contract automation, real browser/data evidence and repository-owner acceptance.

## Current total progress

- Provisional total progress: **48%**.
- Unrounded score: **47.9%**.
- Confidence band: **43%–50%**.
- Active journey: **Order 1 at 45%**.
- Superseded baseline: **52%** total and **80%** Order 1.
- Change: **−4 rounded project points** and **−35 Order 1 points**.
- Denominator correction: none yet; paired capture of additional original surfaces may still correct the denominator.

The correction is caused by an explicit Firefox owner `FAIL` plus paired official Original ↔ Nex evidence. The former `52% / 80%` readiness claim incorrectly treated broad runtime automation as proof of visible product parity.

## Journey weights

| Order | Complete user journey                                                 | Weight |
| ----: | --------------------------------------------------------------------- | -----: |
|     1 | Installation, startup, Toolbar icon/title/Badge and entry experience  |    12% |
|     2 | Original export file → direct import → immediate equivalent use       |    20% |
|     3 | Popup selection, result state, current-site rules and temporary rules |    12% |
|     4 | Options information architecture, dialogs and Apply/Discard lifecycle |    16% |
|     5 | Fixed, Switch, PAC, Virtual, Rule List and profile lifecycle journeys |    22% |
|     6 | Export, restart, rollback, ownership and authentication               |    10% |
|     7 | Localization, information density and visual alignment                |     8% |
|       | **Total**                                                             | **100%** |

## Completion gates inside every journey

| Gate                       | Share inside journey | Meaning                                                                |
| -------------------------- | -------------------: | ---------------------------------------------------------------------- |
| Original capture           |                  15% | Original source, runtime, UI and data behavior are captured.           |
| Nex capture and mapping    |                  10% | Current Nex behavior is independently captured and explicitly mapped.  |
| Implementation             |                  40% | Required behavior exists without unapproved inventions.                |
| Contract automation        |                  15% | Tests verify original-derived contracts rather than Nex-only fixtures. |
| Real browser/data evidence |                  10% | Clean Firefox/Chromium and real original data pass where applicable.   |
| Owner acceptance           |                  10% | Repository owner accepts the exact original-facing behavior/build.     |
| **Total**                  |               **100%** | A journey reaches 100% only after owner acceptance.                  |

No journey receives owner-acceptance points from inference, silence, generated Nex-only screenshots or automation.

## Current scored baseline

| Order | Weight | Journey completion | Earned project points | Current basis |
| ----: | -----: | -----------------: | --------------------: | ------------- |
| 1 | 12% | 45% | 5.4 | Runtime Action engineering and dual-browser automation remain strong, but Firefox owner use and paired official screenshots prove the entry experience, default profiles, Popup and Options shell are not original-compatible. The prior acceptance build is retired. |
| 2 | 20% | 35% | 7.0 | Legacy decoding and typed import foundations exist, but representative real original exports have not passed direct import, activation, browsing, restart and semantic re-export. `KG-IMPORT-COLOR-001` remains open. |
| 3 | 12% | 46% | 5.5 | Substantial Popup/runtime implementation exists, but the first paired default Popup evidence shows missing `auto switch`, extra branding and altered row geometry/order. Complete original interaction parity remains open. |
| 4 | 16% | 51% | 8.1 | Options and Draft/Applied foundations are substantial, but paired evidence proves the default landing page, navigation, information hierarchy and visible descriptions are materially different from original. This score may fall as the full original surface inventory is captured. |
| 5 | 22% | 60% | 13.2 | Fixed/Switch/PAC/Virtual/Rule List implementation is broad, but historical completion rows require complete-journey re-audit and real migrated-data verification. |
| 6 | 10% | 52% | 5.2 | Authentication, ownership, snapshots and rollback foundations exist; complete original-facing lifecycle and real imported-configuration verification remain incomplete. |
| 7 | 8% | 44% | 3.5 | Typed localization and Nex visual capture exist, but paired original evidence now proves substantial density, wording and layout divergence. The score is provisional pending full paired inventory. |
| | **100%** | | **47.9 → 48%** | Rounded to the nearest whole percentage point. |

## Evidence causing the correction

### Owner evidence

The repository owner installed the Firefox build and reported:

- the icon changed;
- the broader product still looked substantially unchanged from the failed redesign;
- many UI and workflow differences remained;
- excessive explanatory and engineering text remained visible;
- internal project thinking belonged in code, the knowledge graph and Markdown, not the product UI.

This is an explicit `FAIL`, not an unrun acceptance step.

### Paired official evidence

The permanent `Original Nex UI Evidence` workflow downloads and verifies official ZeroOmega v3.5.0, then captures Original and Nex under the same Chromium version, locale, viewport and theme.

The first default-surface comparison proves:

- Original Options lands on `About`; Nex lands on the `Proxy` editor.
- Original exposes `proxy` and `auto switch`; Nex omits `auto switch`.
- Nex adds `配置历史`, decorative navigation glyphs and persistent application-state prose.
- Nex Fixed UI exposes a large protocol-capability research section absent from Original.
- Nex Popup adds `ZeroOmega Nex` branding and changes labels, row geometry, order and selected-state styling.

Nex-only screenshots remain useful regression evidence but cannot establish original parity.

## Why Order 1 is 45%

Order 1 retains credit for:

- original Toolbar source/runtime capture;
- one background Action writer;
- clean startup and global/per-tab coordination;
- represented Direct/System/Fixed/Switch/Virtual/Rule List/PAC/temporary/external-control Action states;
- dual-browser runtime and restart automation;
- native Chromium Inspect.

It loses the previous readiness credit because the visible ordinary-use entry journey is failed. The remaining work is not a final cosmetic review; it requires restoring original Popup/Options structure, default profiles, labels, density and interaction logic.

## Progress reporting rules

Every substantive project report must include:

1. current total percentage;
2. confidence band while the full paired audit remains incomplete;
3. delta from the preceding baseline;
4. exact evidence causing the change;
5. denominator correction caused by newly captured original scope;
6. active journey and its percentage;
7. owner result when one exists.

The percentage must never be described as release readiness. PR #11 remains Draft, no acceptance or release candidate is active, and no user retest is requested until paired Original ↔ Nex parity is materially restored.
