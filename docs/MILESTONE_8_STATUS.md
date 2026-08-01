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

Captured original authority remains the exact v3.5.0 source, official Chromium/Firefox packages and installed runtime evidence recorded in the Order 1 documents.

Current verified Nex runtime:

- one registered background owner performs all real Action writes;
- real `browser.action`, `browser.i18n`, `browser.tabs`, top-level `browser.webNavigation` and OffscreenCanvas boundaries are constructed in the background;
- the repository resolver covers Direct, System, Fixed proxy/bypass, strict exact Switch matched/default results into Direct or one Fixed proxy, and exact immediate Virtual results into Direct or one Fixed proxy/bypass target;
- the coordinator establishes a browser-level Action baseline, then handles tab creation, URL updates, activation, serialization, stale-result suppression, lifecycle invalidation, cache invalidation and all-tab refresh; a top-level navigation-commit listener supplies final URLs when Firefox tab events are incomplete;
- clean installations proactively initialize to the original System route without opening UI; profile-workflow commands are serialized so concurrent reads cannot observe half-initialized startup, and missing proxy runtime is repaired from the saved startup route;
- Inspect feeds a single-writer overlay and no longer mutates title/Badge independently;
- permanent Chromium and Firefox Action E2E directly verify real tab IDs across System → Direct → Fixed proxy/bypass, exact Switch matched/default results into Direct/Fixed and exact immediate Virtual → Direct/Fixed proxy/bypass results;
- cross-document revision history is isolated by current `documentId` before validation.

### Exact verified checkpoint

Clean Head `6747760e01572d47038ec4beba6dba10ef4f1f02` passed all permanent gates after exact original immediate Virtual-to-Direct/Fixed integration and temporary-file cleanup:

- CI `30678329216`;
- Browser E2E `30678329237`;
- Parity Documentation `30678329224`;
- Milestone 8 Visual Evidence `30678329214`.

The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, Fixed proxy/bypass, exact Switch matched/default results into Direct/Fixed and exact immediate Virtual results into built-in Direct or one Fixed proxy/bypass target. The Virtual display preserves the original target suffix, including `[[Direct]]`, suppresses the Virtual default transition from details, uses the resolved target Badge and applies Direct/Fixed color inputs exactly. Dedicated transaction `30678033747` passed full `pnpm verify`, Chromium Virtual Action acceptance and three consecutive focused Firefox Virtual journeys. Official original-package run `30677618681` and Artifact `8811046002` (`sha256:f4485078f732e9d64294c13d2edd8cb09f26a3f1405dfa427f2d4072292ce2ed`) fix the source/runtime contract.

The `webNavigation` listener is a refresh input to the existing coordinator, not a second Action writer. Both built manifests require the permission through the exact manifest guard and retain no required global host access.

Still open:

- nested Switch/profile chains, nested Virtual and Virtual-to-inclusive/PAC targets, attached Rule Lists, PAC/temporary-rule/external-control result traces; Switch → System is rejected by the original runtime;
- forced renderer-fallback Action evidence and headed toolbar pixels where browser-readable state is insufficient;
- repository-owner acceptance of the corrected Order 1 journey.

No `TB-*` row or `KG-ICON-001` is owner-complete.

## Runtime harness boundary

Permanent Nex Firefox E2E uses WebDriver BiDi for extension-page navigation and directly verifies Action title/Badge/Popup. Diagnosis showed that concurrent workflow reads could observe a persisted ProfileSpec before initial System activation and Action follow-up completed. The runtime now serializes all profile-workflow commands, awaits activation follow-up and repairs missing proxy runtime on startup. Top-level `webNavigation.onCommitted` remains a final-URL coordinator input. Historical original-package evidence remains fixed to its separate Firefox 152.0.6 audit.

The browser Action architecture now has one writer. Inspect, profile activation and startup recovery are integrated inputs. Switch matched/default results into Direct and Fixed plus immediate Virtual results into Direct/Fixed proxy/bypass are exact integrated inputs backed by official runtime evidence. Switch → System is original-invalid. Nested/attached profile chains, nested Virtual/Virtual-to-inclusive/PAC, temporary rules and external-control transitions remain explicit missing inputs rather than permission to add simplified invented wording.

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

### 1. Complete the remaining Order 1 trace contract

- capture and map nested Switch/profile chains, attached Rule List results and PAC default/matched results;
- capture nested Virtual/Virtual-to-inclusive targets and attached Rule List results;
- connect temporary-rule and external-control transitions to the single writer;
- preserve the original multiline `matchProfile.results` wording and fail closed on unsupported trace shapes.

### 2. Finish the remaining renderer evidence

- force renderer failure and verify static fallback where feasible;
- capture headed toolbar pixels only where browser-readable Action state cannot establish equivalence.

### 3. Run focused owner acceptance

- install the exact clean build;
- verify startup/System, Direct, user Fixed, two-tab isolation, Popup and Inspect;
- record repository-owner `PASS` or concrete defects;
- do not close `KG-ICON-001` from automation alone.

### 4. Continue the fixed delivery order

After Order 1 owner acceptance, proceed to real original export → direct import → immediate use. No UI redesign or unrelated feature expansion is authorized.

## Candidate prohibition

No new candidate may be declared until the complete comparison graph is mapped, every visible Nex-only element has provenance or owner approval, representative real original exports work directly, complete Chromium and Firefox journeys pass, and the repository owner explicitly accepts the exact build.

## Current next action

Complete the remaining nested Switch/Virtual, PAC/Rule List/temp/external result traces plus renderer fallback/pixel evidence where needed, then run focused Order 1 owner acceptance. No candidate is permitted.
