# Milestone 8 Status — Original-Compatible Rewrite

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft  
**Active candidate:** none  
**Last candidate:** `M8-OWNER-QC-1` — `FAILED` on 2026-07-30  
**Provisional total progress:** 47% (unrounded 46.7%; confidence band 42%–50%)  
**Active journey:** Order 1 — installation/startup/toolbar, 35%

## Canonical product goal

ZeroOmega Nex is a bottom-layer rewrite of the original ZeroOmega product, not a new product inspired by it.

The implementation, architecture, state model and browser adapters may be replaced completely. The user-facing contract must remain as close to the original as modern browser APIs permit.

The required end state is:

1. An experienced original user does not need to relearn normal operation.
2. The original extension exports its configuration file.
3. Nex imports that file directly.
4. The imported configuration preserves all meaningful supported state and can be used immediately without manual reconstruction.
5. Toolbar, Popup, Options, dialogs, terminology, action hierarchy, profile editing and state transitions remain familiar.
6. UI layout, density, controls and visible logic match the original wherever there is no necessary, evidenced and owner-approved divergence.
7. Nex does not invent pages, dialogs, descriptions, status systems or workflow merely to expose its internal architecture.

The highest authority is:

- `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`
- `docs/PROJECT_PROGRESS_MODEL.md`
- `docs/ACTIVE_PARITY_AUDIT_INDEX.md`

These files define the product contract, weighted progress, detailed comparison graph, defect register, implementation order and owner-facing delivery order.

## Status correction

Milestone 8 is not 100% complete and is not release-ready. The current audit-weighted progress is 47%, with a 42%–50% confidence band while the complete Original and Nex inventories remain open.

The previous `98%` estimate and `DONE=124 / PARTIAL=2` summary measured only an incomplete automated contract. They did not measure actual product equivalence, direct migration or owner acceptance.

Repository-owner trial demonstrated broad project-wide mismatches, including:

- missing toolbar icon/runtime-state parity;
- failure to import and directly use a real original export;
- substantially different UI layout and interaction logic;
- many unnecessary description/help boxes and extra workflow;
- multiple user-visible elements and behaviors created without strict original evidence;
- further mismatches too broad to reduce to a small final defect list.

The project has returned from candidate QC to a complete Original ↔ Nex re-audit.

## Current interpretation of existing code

The branch contains substantial implementation foundations:

- typed configuration and workflow state;
- PAC compilation;
- Chromium and Firefox adapters;
- profile editors;
- Popup, temporary rules, diagnostics, snapshots and rollback;
- localization and browser tests;
- legacy backup decoding/export code;
- authentication handling.

These are implementation inventory only. None is presumed original-compatible until it is revalidated against:

- original source;
- original runtime behavior;
- original exported files;
- clean Chromium and Firefox installations;
- repository-owner review.

No old broad `DONE` row is owner-complete by inheritance.

## Active Order 1 checkpoint

Captured evidence:

- exact original toolbar source and 18-row Original ↔ Nex map;
- exact official Chromium and Firefox v3.5.0 packages and hashes;
- exact Ω geometry and dynamic size contract;
- original static/inclusive/Direct icon color decisions;
- original result-Badge preference, localized built-in labels and four-code-unit truncation;
- pure per-tab presentation composition without Nex-only state.

Verified slice Head `5b60bba3e1e66718a01171034582a606cf2334bb` passed:

- CI `30509677377`;
- Browser E2E `30509677387`;
- Parity Documentation `30509677380`;
- Milestone 8 Visual Evidence `30509677378`.

These gates verify only the mapped pure-model slice. Installed original runtime screenshots, browser-action integration, tab event coordination and owner acceptance remain open.

A structural Nex conflict is confirmed: current Inspect runtime directly mutates title and Badge state. It must become an input to one unified per-tab action coordinator rather than competing with it.

## Non-invention rule

Every Nex-only visible element must have one of two things:

1. a direct original source/runtime anchor; or
2. a documented necessary divergence with technical evidence and explicit owner acceptance.

Without that provenance, the element is a defect.

This applies to:

- pages and auxiliary surfaces;
- dialogs and confirmation steps;
- description cards and help boxes;
- compatibility summaries and status taxonomies;
- labels and terminology;
- control regrouping;
- validation timing;
- visible distinctions created from internal Draft/Applied/snapshot architecture.

Unknown original behavior must remain `UNKNOWN`; it must not be filled by design assumptions.

## Failed candidate record

`M8-OWNER-QC-1` remains historically fixed to:

- Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`;
- Artifact `8725915254`;
- product Head `23272bd9efc4abbcec5ca99c86d31a1353714e8b`.

Its status is `FAILED`. It must not be reissued, renamed or used as evidence of current completeness.

## Reopened blockers

- `KG-ICON-001` — toolbar icon, badge, title and runtime-state parity.
- `KG-IMPORT-001` — direct import and immediate use of real original exports.
- `KG-UI-001` — layout, density, dialogs and action hierarchy.
- `KG-EXTRA-001` — unnecessary descriptions and extra workflow.
- `KG-INVENTION-001` — user-visible behavior invented without original evidence or owner approval.
- `KG-FLOW-001` — complete feature and interaction parity.
- `KG-GOV-001` — completion and acceptance governance.

All are release-blocking.

## Immediate work order

### 1. Complete Order 1 runtime capture and integration

- install the exact official Chromium and Firefox packages;
- capture toolbar icon/title/Badge states and browser differences;
- implement one browser-action adapter and per-tab coordinator;
- convert Inspect from direct Action mutation to coordinator state input;
- verify two tabs, route changes, temporary rules, Inspect and restart behavior;
- require owner review before closing `KG-ICON-001`.

### 2. Capture current Nex independently

Capture the same nodes without assuming equivalence, including every:

- extra page;
- extra dialog;
- description/help block;
- warning panel;
- status taxonomy;
- additional step;
- term or visible state without original provenance.

### 3. Build the detailed Original ↔ Nex delivery order

Every node must show:

- original source and runtime evidence;
- original UI and data before/after;
- Nex source and runtime evidence;
- missing, broken, extra or invented behavior;
- exact correction target;
- automated and real-export verification;
- Chromium/Firefox results;
- owner `PASS`, `FAIL` or `NOT RUN`.

Broad claims such as “Popup done”, “Import done” or “Profile editor done” are prohibited.

### 4. Fix complete user journeys

Priority:

1. installation, startup and toolbar state;
2. direct import and immediate use of real original exports;
3. Popup behavior;
4. Options information architecture and Apply/Discard;
5. Fixed, Switch, PAC, Virtual and Rule List journeys;
6. profile lifecycle and exports;
7. authentication, ownership, restart and rollback;
8. localization, density and visual alignment.

## Candidate prohibition

No new candidate may be declared until:

- the complete comparison graph is mapped;
- every visible Nex-only element has provenance or owner approval;
- representative real original exports import directly and work immediately;
- broad UI and workflow differences are corrected;
- unnecessary descriptions and extra workflow are removed;
- Chromium and Firefox pass complete real-data journeys;
- the repository owner explicitly accepts the exact build.

## Current next action

Complete installed original Chromium/Firefox toolbar runtime capture, then implement the unified browser-action adapter and coordinator against that evidence. No candidate is permitted.
