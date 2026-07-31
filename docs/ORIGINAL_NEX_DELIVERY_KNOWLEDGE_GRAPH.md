# ZeroOmega Original ↔ Nex Delivery Knowledge Graph

## 0. Canonical project contract

This document is simultaneously:

- the highest-level product contract for the ZeroOmega rewrite;
- the Original ↔ Nex engineering knowledge graph;
- the owner-facing delivery order;
- the defect and acceptance authority.

The project goal is not to design a new proxy-extension product inspired by ZeroOmega. The goal is to **rewrite the complete underlying implementation while preserving the original user-facing product contract as closely as modern browser APIs permit**.

The repository owner reconfirmed this contract on 2026-07-30: the entire project, not merely the failed candidate, must be judged against the original. Existing UI, behavior, labels, descriptions and workflows cannot be trusted merely because they were already implemented.

### 0.1 Non-negotiable outcome

The finished product must allow an experienced ZeroOmega user to switch without relearning the product:

1. The user exports a configuration from the original extension.
2. The user installs the rewritten extension.
3. The user imports the original exported file directly.
4. The rewritten extension preserves the meaningful configuration, relationships, ordering, colors, startup state, Quick Switch state, rules, Rule Lists, PAC definitions, bypass entries and other supported behavior.
5. The imported configuration can be used immediately without manual reconstruction, reinterpretation or a new workflow.
6. Toolbar, Popup, Options, dialogs, terminology, action placement, profile editing and state transitions remain familiar enough to constitute a near-seamless migration.

The bottom layer may be replaced completely. The user-facing mental model may not be replaced merely because the new architecture is cleaner or easier to implement.

### 0.2 Original-first authority

For every user-visible surface, action, state transition, label and data transformation:

- the original ZeroOmega v3.5.0 source and real runtime behavior are the default authority;
- Nex must match the original observable contract unless a modern browser limitation makes that impossible;
- a necessary divergence must be minimized, documented with source/API evidence and explicitly accepted by the repository owner;
- absence of evidence is `UNKNOWN`, never permission to invent.

### 0.3 No-invention rule

The rewrite must not invent user-facing content or workflow without evidence and approval.

The following are defects unless they have an original source/runtime anchor or an owner-accepted divergence record:

- new pages or auxiliary surfaces;
- new multi-step workflows;
- additional dialogs or confirmation layers;
- description cards, help boxes, status summaries and compatibility taxonomies;
- renamed concepts or reorganized actions;
- different default selections or validation timing;
- new visible state distinctions created only to expose internal architecture;
- developer-oriented explanations shown during normal use.

Internal safety, typed state, snapshots, atomic Apply, diagnostics and modern browser adapters may be improved, but those improvements should remain behind the original-facing interaction model whenever possible.

### 0.4 UI contract

“UI尽可能一致” means more than using similar colors. The comparison must cover:

- window and Popup dimensions;
- toolbar icons and state transitions;
- navigation hierarchy;
- page boundaries;
- control order and grouping;
- labels and terminology;
- button placement and priority;
- dialogs and validation timing;
- information density and whitespace;
- help text quantity and placement;
- disabled, warning, error, loading and active states;
- profile colors, icons and inheritance;
- light/dark and locale expansion behavior.

Visual modernization is permitted only where it does not require relearning or alter the original workflow. Unnecessary explanation is not modernization.

### 0.5 Configuration migration contract

A configuration feature is not complete because a parser accepts a synthetic fixture. It is complete only when representative, sanitized files exported by the original extension can be imported into a clean Nex installation and used directly.

Acceptance must compare the original semantic graph before export with the Nex semantic and browser state after import, including:

- profile identity, type and names;
- colors, icons and ordering;
- profile references and result profiles;
- Fixed protocols, authentication references and bypass rules;
- Switch rules, condition kinds, fields, order and attached Rule Lists;
- PAC URLs, raw content, headers and cache-relevant state;
- Virtual targets and nested references;
- startup profile, active profile and Quick Switch order;
- generated/runtime fields that must be ignored, migrated or preserved;
- credentials under the documented security boundary;
- immediate Apply/activation behavior;
- export and semantic round trip.

Any manual repair needed after import is a compatibility defect unless explicitly accepted.

## 1. Purpose

The rewrite is not accepted because code compiles, tests pass, screenshots exist, or a previous matrix row was marked `DONE`. Acceptance requires demonstrated equivalence against the original product on complete user journeys and real original exports.

The repository-owner trial on 2026-07-30 invalidated the previous Milestone 8 completion claim and candidate `M8-OWNER-QC-1`.

## 2. Current state

- Provisional total progress: **47%** with a **42%–50% confidence band**, calculated by `docs/PROJECT_PROGRESS_MODEL.md`.
- Previous `DONE=124 / PARTIAL=2` summary: **invalid as a product-completeness measure**.
- Active installable candidate: **none**.
- Previous candidate `M8-OWNER-QC-1`: **FAILED**.
- Existing code and tests: implementation inventory requiring re-audit, not presumed parity evidence.
- Required mode: complete Original capture, independent Nex capture, explicit mapping, then journey-level correction.
- PR #11 remains Draft; merge and release are prohibited.

### Exact verified checkpoint — 2026-08-01

Clean Head `5ce5a21a865a569e327a78062d7d255fe0f76126` passed all permanent gates after the exact Switch-to-Fixed toolbar trace slice and temporary-file cleanup:

- CI `30672861182`;
- Browser E2E `30672861154`;
- Parity Documentation `30672861161`;
- Milestone 8 Visual Evidence `30672861171`.

The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets now verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, internal/default fallback, same-tab proxy ↔ bypass and exact Switch → Fixed matched/default transitions. Native Inspect verifies tab-local set, current-page clear, base restoration and isolation. Dedicated transaction `30672598304` passed full verification, Chromium Switch acceptance and three consecutive focused Firefox Switch journeys.

Firefox diagnosis proved a second startup boundary: concurrent workflow reads could observe a persisted ProfileSpec before initial System activation and Action follow-up completed. Profile-workflow commands are now serialized, activation follow-up is awaited and missing proxy runtime is repaired from the saved startup route. Top-level `webNavigation.onCommitted` remains an exact-guarded coordinator input and required global host access remains forbidden.

The checkpoint remains slice-level evidence and does not alter the 47% / 35% progress model.

## 3. Status vocabulary

| Status                | Meaning                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| `SOURCE_CAPTURED`     | Original source, runtime behavior, UI and data evidence are captured.        |
| `NEX_CAPTURED`        | Current Nex code and real browser behavior are captured independently.       |
| `MAPPED`              | Original and Nex nodes have an explicit relationship and gap classification. |
| `IMPLEMENTED`         | Code exists, but equivalence has not passed acceptance.                      |
| `VERIFIED_AUTOMATION` | Automated checks pass against the explicit original contract.                |
| `VERIFIED_REAL_DATA`  | Real original exports and real browser journeys pass.                        |
| `OWNER_ACCEPTED`      | Repository owner has reviewed and accepted the exact behavior/build.         |
| `FAILED`              | A demonstrated mismatch or defect exists.                                    |
| `UNKNOWN`             | Evidence is incomplete; it must never be treated as done.                    |

Only `OWNER_ACCEPTED` is delivery-complete.

## 4. Required evidence for every delivery row

Every row must contain:

1. Original source file, symbol/controller/template and version.
2. Original runtime screenshot, recording or reproducible browser steps.
3. Original UI hierarchy and visible text.
4. Original data shape before and after the operation.
5. Current Nex source file and real runtime behavior.
6. Explicit relationship and gap classification.
7. Inventory of missing and extra Nex behavior.
8. Expected user-visible result written without implementation jargon.
9. Automated test tied to the original contract rather than a self-created fixture alone.
10. Real Chromium and Firefox evidence when browser-sensitive.
11. Real exported ZeroOmega/SwitchyOmega file evidence when configuration is involved.
12. Provenance for every Nex-only visible element or workflow.
13. Repository-owner result: `PASS`, `FAIL` or `NOT RUN`.

A unit test, component render, generated screenshot, synthetic fixture or successful build cannot independently close a row.

## 5. Knowledge graph model

### 5.1 Original product graph

`OriginalProduct`

- `InstallationAndStartup`
  - first-run behavior
  - default configuration
  - startup restore
  - browser ownership state
- `BrowserToolbar`
  - original icon artwork
  - icon state changes
  - badge/title/tooltip state
  - active profile indication
  - Direct/System/error/temporary-rule states
  - click behavior
- `Popup`
  - dimensions and density
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
  - dialogs, labels and validation timing
  - information density and help text
- `ProfileLifecycle`
  - create, rename, delete and duplicate
  - replace references
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
  - condition-specific fields
  - validation timing
  - drag/order
  - source mode
  - attached Rule Lists
- `BackupContract`
  - accepted encodings and schema versions
  - generated/runtime fields
  - profile identity and references
  - credentials
  - startup/Quick Switch state
  - import side effects
  - immediate usability after import
  - semantic export round trip
- `RuntimeState`
  - selected and result profile
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

The Nex graph must capture the current product independently, without assuming equivalence:

- `NexInstallationAndStartup`
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
- `NexInventedTerminologyAndWorkflow`

Internal architecture nodes are recorded separately and never count as user-facing parity by themselves.

### 5.3 Mapping edge types

| Edge                     | Meaning                                                                           |
| ------------------------ | --------------------------------------------------------------------------------- |
| `EXACT_EQUIVALENT`       | Same observable behavior and compatible data result.                              |
| `MODERNIZED_EQUIVALENT`  | Implementation changed, but the user contract and mental model remain equivalent. |
| `INTENTIONAL_DIVERGENCE` | Difference is necessary, evidenced, minimized and owner accepted.                 |
| `MISSING_IN_NEX`         | Original behavior is absent.                                                      |
| `BROKEN_IN_NEX`          | Behavior exists but fails or produces incompatible state.                         |
| `EXTRA_IN_NEX`           | Nex adds visible behavior not present in the original.                            |
| `UNJUSTIFIED_INVENTION`  | Nex behavior or UI was created without original evidence or owner approval.       |
| `UNKNOWN`                | Evidence is insufficient.                                                         |

## 6. Reopened defect register

| ID                 | Area                      | Original contract                                                                      | Observed Nex result                                                                                                                                                                                                                                                                                                                | Status   | Delivery requirement                                                                          |
| ------------------ | ------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `KG-ICON-001`      | Browser toolbar           | Icon, title and visible toolbar state follow the current profile/runtime situation.    | One background owner now drives a durable global baseline plus real per-tab System, Direct, Fixed proxy/bypass, exact Switch→Fixed matched/default, internal/default fallback, same-tab transitions and Inspect set/clear/isolation; remaining Switch/PAC/Virtual/Rule List/temp/external traces and owner acceptance remain open. | `FAILED` | Complete remaining original traces, renderer/pixel evidence where needed and owner review.    |
| `KG-IMPORT-001`    | Original export migration | Original exported files import directly and become immediately usable.                 | Owner’s original export cannot be used directly; existing tests rely heavily on synthetic fixtures.                                                                                                                                                                                                                                | `FAILED` | Build a real-export corpus and prove semantic/browser equivalence in clean installations.     |
| `KG-UI-001`        | UI structure              | Navigation, layout, density, dialogs and actions remain familiar.                      | Broad structural and interaction differences remain.                                                                                                                                                                                                                                                                               | `FAILED` | Produce page-by-page annotated comparisons and correct structure before cosmetic polish.      |
| `KG-EXTRA-001`     | Extra descriptions        | Normal workflows contain only original or necessary accepted guidance.                 | Many unnecessary description/help boxes change density and workflow.                                                                                                                                                                                                                                                               | `FAILED` | Inventory and remove/collapse/relocate every unjustified block.                               |
| `KG-INVENTION-001` | Invented product behavior | Original behavior is the default authority; unknowns remain unknown.                   | Multiple UI elements, explanations and workflows were inferred or invented instead of source-mapped.                                                                                                                                                                                                                               | `FAILED` | Establish provenance for every visible Nex-only element; delete or explicitly approve it.     |
| `KG-FLOW-001`      | General behavior          | Actions, defaults, state transitions and terminology follow the original mental model. | Many additional mismatches remain beyond the initial examples.                                                                                                                                                                                                                                                                     | `FAILED` | Re-audit every complete user journey; distrust old broad `DONE` rows.                         |
| `KG-GOV-001`       | Acceptance governance     | Completion reflects actual parity and owner acceptance.                                | Automation closure was promoted incorrectly to product completion.                                                                                                                                                                                                                                                                 | `FAILED` | Separate implementation, automation, real-data verification and owner acceptance permanently. |

## 7. Delivery order

### Order 0 — reset false completion

- Keep `M8-OWNER-QC-1` permanently marked failed.
- Remove completion/candidate language from current status.
- Treat previous broad matrix results as historical implementation inventory only.
- Prohibit candidate generation, merge and release.

Acceptance: repository, PR and delivery graph all show the same failed/re-audit state.

### Order 1 — capture the original completely

Deliverables:

- complete surface and page inventory;
- toolbar icon/badge/title transition inventory;
- Popup states and workflows;
- Options navigation, controls, dialogs, wording and layout;
- every profile type and lifecycle operation;
- every condition type, field and validation rule;
- import/export schema and runtime-field contract;
- real original screenshots, recordings, source anchors and exported files.

Acceptance: every original node is `SOURCE_CAPTURED`; no unknown behavior is omitted or guessed.

### Order 2 — capture current Nex independently

Deliverables:

- matching inventory and recordings of the current branch;
- current data transformations for each workflow;
- every extra page, dialog, explanation, warning, taxonomy and auxiliary action;
- every visible term or state with no original provenance.

Acceptance: every Nex node is `NEX_CAPTURED`; extras and inventions are explicit.

### Order 3 — construct the owner-facing comparison order

For every original node, provide:

- original annotated screenshot/source/steps;
- Nex annotated screenshot/source/steps;
- data before/after comparison;
- mapping edge;
- defect and required correction;
- automation and real-data test plan;
- owner acceptance field.

Acceptance: all nodes are `MAPPED`; broad labels such as “Popup done” or “Import done” are prohibited.

### Order 4 — fix complete user journeys

Priority:

1. Installation, startup and toolbar state.
2. Direct import and immediate use of real original exports.
3. Popup selection, result state and site/temporary rules.
4. Options information architecture and Apply/Discard lifecycle.
5. Fixed, Switch, PAC, Virtual and Rule List editing.
6. Profile lifecycle and exports.
7. Authentication, ownership, restart and rollback.
8. Localization, information density and visual alignment.

Acceptance: each journey passes contract automation, real exports, Chromium/Firefox and owner review.

### Order 5 — real-export corpus

Required categories:

- original default export;
- multiple Fixed profiles with protocol/auth/bypass variation;
- complex Switch rules and attached Rule Lists;
- PAC URL/raw/header states;
- Virtual and nested references;
- profile colors, ordering, Quick Switch and startup state;
- schema-v1 and schema-v2 exports;
- generated/runtime-field variants;
- configurations previously used by the repository owner.

Each item records provenance, sanitized hash, expected semantic graph, browser result and owner verdict.

### Order 6 — owner-facing delivery package

Each package must include:

- exact build identity and hashes;
- Original/Nex side-by-side comparison report;
- resolved and unresolved defect register;
- real-export compatibility report;
- Chromium and Firefox results;
- installation and rollback steps;
- complete list of necessary accepted divergences;
- complete list of removed Nex inventions/extras;
- checklist requiring explicit owner `PASS`.

## 8. Completion rule

The project is 100% complete only when:

- every required original node is captured and mapped;
- every Nex-only visible element has original provenance or explicit owner approval;
- every mismatch is fixed or explicitly accepted as a necessary divergence;
- representative real original exports import directly and work immediately without reconstruction;
- toolbar, Popup, Options, dialogs, profiles, restart, rollback and authentication pass in Chromium and Firefox;
- UI and interaction require no material relearning by an experienced original user;
- unnecessary descriptions and extra workflow are removed;
- the repository owner marks one exact final candidate `PASS`.

Until the complete audit narrows the confidence band, every substantive report must provide the provisional audit-weighted percentage from `PROJECT_PROGRESS_MODEL.md`, its confidence band and the evidence delta. The percentage must never be inferred from code volume, test counts or old matrix row counts, and it must never be described as release readiness.
