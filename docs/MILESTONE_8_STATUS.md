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

- `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`;
- `docs/PROJECT_PROGRESS_MODEL.md`;
- `docs/ACTIVE_PARITY_AUDIT_INDEX.md`.

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

These are implementation inventory only. None is presumed original-compatible until revalidated against original source, original runtime behavior, original exported files, clean Chromium/Firefox installations and repository-owner review.

No old broad `DONE` row is owner-complete by inheritance.

## Active Order 1 checkpoint

Captured source/package evidence:

- exact original toolbar source and 18-row Original ↔ Nex map;
- exact official Chromium and Firefox v3.5.0 packages and hashes;
- exact Ω geometry and dynamic size contract;
- original static/inclusive/Direct icon color decisions;
- original result-Badge preference, localized built-in labels and four-code-unit truncation;
- pure per-tab presentation composition without Nex-only state.

Captured real original runtime evidence:

- Chromium exact-package evidence: `docs/AUDIT_EVIDENCE_01C_ORIGINAL_CHROMIUM_RUNTIME.md`;
- Firefox exact-package evidence: `docs/AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`;
- both targets cover initial/System, Direct, two-tab and internal-page Action title/Badge/Popup observations plus installed Options and Popup surfaces;
- Firefox evidence records the runtime difference between the manifest Popup entry and the per-tab `action.getPopup()` result;
- Firefox successful run `30597356624`, Artifact `8780625790`, digest `sha256:1638d78b85d5c70c52d50510ec3e98b0b479a96c0bbf98f86cd133f48e889980`.

Verified pure-model slice Head `5b60bba3e1e66718a01171034582a606cf2334bb` passed:

- CI `30509677377`;
- Browser E2E `30509677387`;
- Parity Documentation `30509677380`;
- Milestone 8 Visual Evidence `30509677378`.

The exact-package runtime captures close only the basic reference states. They do not close Order 1. Still open:

- user-created Fixed profile state;
- Switch/PAC result and two-color icon state;
- Virtual and attached Rule List state;
- temporary-rule state;
- Inspect state;
- external-controller transition details;
- headed toolbar pixels where required;
- Nex browser-action integration and per-tab coordination;
- repository-owner acceptance.

A structural Nex conflict is confirmed: current Inspect runtime directly mutates title and Badge state. It must become an input to one unified per-tab Action coordinator rather than competing with it.

## Runtime harness boundary

The successful Firefox evidence used Firefox `152.0.6`. A later GitHub runner image exposed Firefox `153.0`, whose Marionette navigation rejected direct `moz-extension://` navigation before state capture. This is a test-harness compatibility change, not evidence against the successful exact-package run. Future reruns must use supported BiDi browsing-context navigation or pin the verified Firefox runtime.

## Non-invention rule

Every Nex-only visible element must have either:

1. a direct original source/runtime anchor; or
2. a documented necessary divergence with technical evidence and explicit owner acceptance.

Without that provenance, the element is a defect. Unknown original behavior remains `UNKNOWN`; it must not be filled by design assumptions.

## Failed candidate record

`M8-OWNER-QC-1` remains historically fixed to:

- Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`;
- Artifact `8725915254`;
- product Head `23272bd9efc4abbcec5ca99c86d31a1353714e8b`.

Its status is `FAILED`. It must not be reissued, renamed or used as evidence of current completeness.

## Reopened blockers

- `KG-ICON-001` — toolbar icon, Badge, title and runtime-state parity.
- `KG-IMPORT-001` — direct import and immediate use of real original exports.
- `KG-UI-001` — layout, density, dialogs and action hierarchy.
- `KG-EXTRA-001` — unnecessary descriptions and extra workflow.
- `KG-INVENTION-001` — user-visible behavior invented without original evidence or owner approval.
- `KG-FLOW-001` — complete feature and interaction parity.
- `KG-GOV-001` — completion and acceptance governance.

All are release-blocking.

## Immediate work order

### 1. Freeze the remaining Order 1 runtime matrix

- capture user Fixed, Switch/PAC, Virtual, attached Rule List, temporary-rule, Inspect and external-control states;
- preserve browser-specific differences instead of forcing Chromium and Firefox into one inferred contract;
- keep uncaptured states explicitly `UNKNOWN`.

### 2. Implement the unified Action path

- implement one browser-action adapter;
- implement one per-tab result coordinator;
- connect tab creation, URL update, tab activation and profile changes;
- convert Inspect from direct Action mutation to coordinator state input;
- converge temporary rules, route results, Rule Lists, Virtual profiles and external control into the same state calculation.

### 3. Verify Order 1 independently

- capture current Nex without assuming equivalence;
- verify two tabs, inactive tabs, route changes, temporary rules, Inspect, restart and stale-state clearing;
- run Chromium and Firefox real-browser checks;
- require repository-owner `PASS` before closing `KG-ICON-001`.

### 4. Continue the fixed delivery order

1. installation, startup and toolbar state;
2. direct import and immediate use of real original exports;
3. Popup behavior;
4. Options information architecture and Apply/Discard;
5. Fixed, Switch, PAC, Virtual and Rule List journeys;
6. profile lifecycle, exports, authentication, ownership, restart and rollback;
7. localization, density and visual alignment.

## Candidate prohibition

No new candidate may be declared until the complete comparison graph is mapped, every visible Nex-only element has provenance or owner approval, representative real original exports work directly, complete Chromium and Firefox journeys pass, and the repository owner explicitly accepts the exact build.

## Current next action

Complete the remaining original toolbar states, then implement the unified browser-action adapter and per-tab coordinator against the source plus Chromium/Firefox runtime evidence. No candidate is permitted.
