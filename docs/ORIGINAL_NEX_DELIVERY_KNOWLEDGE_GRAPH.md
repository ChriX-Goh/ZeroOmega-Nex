# ZeroOmega Original ↔ Nex Delivery Knowledge Graph

## 1. Purpose

This document is the owner-facing delivery order and the engineering authority for the ZeroOmega rewrite.

The rewrite is not accepted because code compiles, tests pass, screenshots exist, or a row was previously marked `DONE`. Acceptance requires demonstrated equivalence against the original product on real user workflows and real backups.

The owner QC performed on 2026-07-30 invalidated the previous Milestone 8 completion claim and candidate `M8-OWNER-QC-1`.

## 2. Current state

- Product completion: **not currently measurable**.
- Previous `DONE=124 / PARTIAL=2` summary: **not a valid release-completeness measure**.
- Active installable candidate: **none**.
- Required mode: full parity re-audit before further candidate preparation.
- PR #11 remains Draft.

## 3. Status vocabulary

| Status | Meaning |
| --- | --- |
| `SOURCE_CAPTURED` | Original source, runtime behavior, UI and data evidence are captured. |
| `NEX_CAPTURED` | Current Nex code and real browser behavior are captured. |
| `MAPPED` | Original and Nex nodes have an explicit relationship and gap classification. |
| `IMPLEMENTED` | Code exists, but equivalence has not yet passed acceptance. |
| `VERIFIED_AUTOMATION` | Automated checks pass against the explicit original contract. |
| `VERIFIED_REAL_DATA` | Real original backup and real browser workflow pass. |
| `OWNER_ACCEPTED` | Repository owner has reviewed and accepted the exact behavior. |
| `FAILED` | A demonstrated mismatch or defect exists. |
| `UNKNOWN` | Evidence is incomplete; must never be treated as done. |

Only `OWNER_ACCEPTED` is delivery-complete.

## 4. Required evidence for every delivery row

Every row must contain all of the following:

1. Original source file, symbol/controller/template and version.
2. Original runtime screenshot, recording or reproducible browser steps.
3. Original data shape before and after the operation.
4. Current Nex source file and runtime behavior.
5. Explicit relationship: exact match, compatible modernization, intentional divergence, missing, broken or extra behavior.
6. Expected user-visible result written without implementation jargon.
7. Automated test tied to the original contract rather than a self-created fixture alone.
8. Real Chromium and Firefox evidence when the original behavior is browser-sensitive.
9. Real exported ZeroOmega/SwitchyOmega backup evidence when configuration data is involved.
10. Repository-owner result: `PASS`, `FAIL` or `NOT RUN`.

A unit test, component render, generated screenshot, or synthetic fixture cannot independently close a row.

## 5. Knowledge graph model

### 5.1 Original product graph

`OriginalProduct`

- `BrowserToolbar`
  - icon artwork
  - icon state changes
  - badge/title/tooltip state
  - active profile indication
  - error/direct/system/temporary-rule states
  - click behavior and Popup dimensions
- `Popup`
  - profile list and hierarchy
  - active/result profile indication
  - current-site rule actions
  - temporary rule actions
  - error and ownership states
- `OptionsInformationArchitecture`
  - left navigation grouping
  - page separation
  - action placement
  - Apply/Discard lifecycle
  - dialog placement and wording
  - information density
- `ProfileLifecycle`
  - create
  - rename
  - delete
  - replace references
  - duplicate
  - color/icon inheritance
  - export profile/PAC/rule list
- `ProfileTypes`
  - Fixed
  - Switch
  - PAC
  - Virtual
  - Rule List/import-only states
- `RuleAndConditionEditing`
  - selector catalog
  - fields
  - validation timing
  - drag/order
  - source mode
  - attached rule lists
- `BackupContract`
  - accepted encodings
  - schema versions
  - generated/runtime fields
  - profile identity and references
  - credentials
  - startup/quick-switch state
  - import side effects
  - immediate usability after import
  - byte/semantic export round trip
- `RuntimeState`
  - selected profile
  - result profile
  - browser-installed proxy state
  - temporary rules
  - startup restore
  - ownership conflicts
  - authentication permissions
- `LocalizationAndVisuals`
  - en / zh-CN / zh-TW
  - light/dark
  - spacing, density, grouping, iconography and dialog behavior

### 5.2 Nex product graph

The Nex graph must expose the same user-facing nodes separately from internal architecture:

- `NexToolbarRuntime`
- `NexPopup`
- `NexOptionsInformationArchitecture`
- `NexProfileLifecycle`
- `NexProfileTypes`
- `NexRuleAndConditionEditing`
- `NexLegacyImporterExporter`
- `NexAppliedDraftBrowserState`
- `NexLocalizationAndVisuals`
- `NexExtraSurfaces`

Internal typed models, snapshots, diagnostics and safety boundaries are implementation nodes. They do not justify changing the original-facing interaction model unless an explicit accepted divergence exists.

### 5.3 Mapping edge types

| Edge | Meaning |
| --- | --- |
| `EXACT_EQUIVALENT` | Same observable behavior and compatible data result. |
| `MODERNIZED_EQUIVALENT` | Browser/API implementation changed but user contract remains equivalent. |
| `INTENTIONAL_DIVERGENCE` | Difference is documented, justified and owner accepted. |
| `MISSING_IN_NEX` | Original behavior is absent. |
| `BROKEN_IN_NEX` | Behavior exists but fails or produces incompatible state. |
| `EXTRA_IN_NEX` | Nex adds user-visible workflow or explanatory UI not required by the original. |
| `UNKNOWN` | Evidence is insufficient. |

## 6. Initial owner-reported defect register

| ID | Area | Original contract | Observed Nex result | Current status | Delivery requirement |
| --- | --- | --- | --- | --- | --- |
| `KG-ICON-001` | Browser toolbar icon | Icon and visible toolbar state change with the current profile/runtime situation; Popup identity matches the original interaction model. | Nex background currently has no toolbar icon state controller; icon/UI remain inconsistent. | `FAILED` | Capture every original icon/badge/title state, implement a deterministic state machine, and verify transitions in real Chromium and Firefox. |
| `KG-IMPORT-001` | Original backup import | A real exported original configuration imports and can be used directly without manual reconstruction. | Owner reports original export still cannot be imported and used directly. Existing acceptance relies heavily on synthetic fixtures and internal Draft transactions. | `FAILED` | Build a sanitized real-backup corpus, preserve all meaningful fields/references/order/startup state, import into a clean browser and prove direct usability. |
| `KG-UI-001` | UI layout | Original information density, action hierarchy, dialogs and page workflow remain familiar to an experienced original user. | Layout and UI remain substantially different. | `FAILED` | Produce page-by-page original/Nex annotated comparisons and fix structure before cosmetic polish. |
| `KG-EXTRA-001` | Explanatory boxes | Normal workflows use the original amount and placement of help text; extra guidance appears only where required by a real capability boundary. | Nex contains many unnecessary description/help boxes that alter density and workflow. | `FAILED` | Inventory every user-visible explanatory block; remove, collapse or relocate every block without an original or accepted-divergence justification. |
| `KG-FLOW-001` | General behavior | Normal actions, state transitions and terminology follow the original mental model. | Owner reports many additional functional and logical mismatches beyond the listed examples. | `FAILED` | Re-audit every user journey; no existing `DONE` row is trusted without owner-facing evidence. |
| `KG-GOV-001` | Acceptance governance | Completion reflects product parity and real user acceptance. | Automation closure was incorrectly promoted to product completion. | `FAILED` | Separate implementation, automated verification, real-data verification and owner acceptance in all status reporting. |

## 7. Delivery order

### Order 0 — invalidate the failed candidate

Deliverables:

- Mark `M8-OWNER-QC-1` as failed owner QC.
- Remove all language claiming product parity completion or 100% completion.
- Reopen release blockers and freeze candidate production.

Acceptance: candidate and PR state clearly say failed/not release-ready.

### Order 1 — capture the original product completely

Deliverables:

- Page/surface inventory.
- Toolbar icon/badge/title transition inventory.
- Popup workflow inventory.
- Options navigation and dialog inventory.
- Profile-type and condition-field inventory.
- Import/export schema and runtime-field inventory.
- Real original browser screenshots/recordings and source anchors.

Acceptance: every original node is `SOURCE_CAPTURED`; unknown nodes are visible, not omitted.

### Order 2 — capture the current Nex product independently

Deliverables:

- Same inventory and recordings using the current branch.
- Current data transformations for each workflow.
- Inventory of every extra dialog, description box, warning panel and auxiliary page.

Acceptance: every Nex node is `NEX_CAPTURED` without assuming equivalence.

### Order 3 — construct the comparison order

Deliverable: one owner-readable table for every original node with original evidence, Nex evidence, gap, required correction and test/QC instructions.

Acceptance: all nodes are `MAPPED`; no broad row such as “Popup done” can hide sub-behavior gaps.

### Order 4 — fix by complete user journey

Priority:

1. Install/startup/toolbar state.
2. Import a real original backup and use it immediately.
3. Popup selection and current-site/temporary rules.
4. Options information architecture and Apply/Discard lifecycle.
5. Fixed/Switch/PAC/Virtual complete editing journeys.
6. Profile lifecycle and exports.
7. Authentication, ownership, restart and rollback.
8. Localization, density and visual alignment.

Acceptance: each journey passes automation, real data, two-browser checks and owner review before the next candidate.

### Order 5 — real-backup corpus

Required corpus categories:

- small default export;
- multiple Fixed profiles with protocol/auth/bypass variation;
- complex Switch rules and attached Rule Lists;
- PAC URL/raw/header/cache states;
- Virtual and nested references;
- profile colors/order/quick-switch/startup state;
- schema-v1 and schema-v2 exports;
- exported backups containing generated/runtime fields;
- configurations previously used by the repository owner.

Every corpus item must record provenance, sanitized hash, expected semantic graph and import result.

### Order 6 — owner-facing delivery package

Each delivery package must include:

- exact build identity and hashes;
- original/Nex side-by-side comparison report;
- resolved and unresolved defect register;
- real-backup compatibility report;
- Chromium/Firefox results;
- installation and rollback steps;
- explicit list of intentional divergences;
- checklist requiring owner `PASS` rather than inferred acceptance.

## 8. Completion rule

The project is 100% complete only when:

- every required original node is mapped;
- every mismatch is fixed or explicitly owner-accepted as a divergence;
- representative real original backups import and work directly;
- toolbar, Popup, Options, all profile journeys, restart, rollback and authentication pass in Chromium and Firefox;
- extra UI is justified or removed;
- the repository owner marks the exact final candidate `PASS`.

Until then, completion percentage must be reported as **unknown pending full parity audit**, not inferred from test counts.