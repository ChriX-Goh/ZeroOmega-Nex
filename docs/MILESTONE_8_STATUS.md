# Milestone 8 Status — Compatible Successor Rewrite

## Authority

- `PRODUCT_CONSTITUTION.md` — highest product contract.
- `EXECUTION_GOVERNANCE.md` — binding execution and anti-drift rules.
- `PROJECT_STATE.json` — machine-readable current authorization, progress, owner result, and release state.
- GitHub PR #11 and Checks — moving exact Head, mergeability, and CI state.

This file summarizes Milestone 8 without duplicating moving SHAs or workflow run IDs.

## Current state

- Branch: `feat/m8-profile-workflow`.
- Pull request: #11, Draft.
- Product completion: 45.15%, reported as 45%.
- Delta from the historical 47.9% anchor: −2.75 points, reported as −3 points.
- Evidence confidence: provisional 43%–50% band.
- Release state: `NO-GO`.
- Latest owner result: Firefox `FAIL`, 2026-08-02.
- Completed governance batch: `GOV-01`; product progress contribution: zero.
- Active product batch: `MIG-01` — real original-export golden path.
- Merge, release, candidate claim, and owner retest: prohibited.

The historical `98%`, `52%`, broad `DONE` totals, and Order 1 `80%` readiness claim remain superseded.

## Product boundary

ZeroOmega Nex is a modern compatible successor rewrite, not an unrelated redesign and not an implementation-level clone.

- `CONTRACT-EXACT`: data, configuration meaning, route results, persistence, restart, semantic export, failure recovery, rollback, ownership, authentication, and security.
- `UX-COMPATIBLE`: familiar ordinary tasks, terminology, entry points, defaults, hierarchy, action meaning, and resulting state without material relearning.
- `MODERNIZED`: architecture, performance, reliability, accessibility, responsive behavior, and bounded clarity improvements that preserve the contract.
- `LEGACY-DEFECT-REJECTED`: confirmed bugs, races, silent corruption, security weaknesses, obsolete browser limits, and accidental framework behavior.

`ADR-020_COMPATIBILITY_BOUNDARY_AND_PROPORTIONAL_EVIDENCE.md` clarifies that exact protocol and target capability remain implemented and testable, but detailed capability research is not permanent ordinary-user UI. Concise task-relevant warnings appear only when the current configuration is affected.

## Owner failure retained

The owner failure remains authoritative. Demonstrated product defects included:

- Options opening the Proxy editor instead of the familiar default entry;
- missing original default `auto switch` profile;
- top-level History and persistent Draft/application status in ordinary UI;
- protocol-capability research and browser-internal explanations exposed in the Fixed editor;
- unnecessary subtitles, helper prose, and Nex branding;
- materially altered Popup hierarchy, ordering, and selected/current presentation;
- no proven real original-export direct-use journey.

These were structural product mismatches, not merely pixel differences.

## Valid completed assets

The following engineering assets remain valuable:

- strict TypeScript/WXT/Svelte browser shell;
- ProfileSpec, bounded legacy importer, reference interpreter, and PAC compiler;
- one background Action writer and global/per-tab state;
- Chromium and Firefox adapters;
- browser-native PAC data plane;
- atomic activation, confirmation, rollback, and restart recovery foundations;
- represented Direct, System, Fixed, Switch, Virtual, Rule List, PAC, temporary, and ownership states;
- bounded authentication handling;
- permanent read-only original evidence workflows;
- paired default UI evidence;
- Session 13 current-site, external-control, inline-rename, and policy-owned regression evidence.

Existing Popup slices 02Q/02R/02S remain bounded regression `PASS` results. They do not close the full Toolbar/Popup parent journey and do not control the immediate product sequence.

## GOV-01 closure

Governance now provides:

- one product identity and four compatibility classes;
- product WIP=1;
- Objective-to-Evidence work hierarchy;
- pre-development, development, completion, owner, stop, and debt gates;
- proportional evidence rather than one permanent workflow per micro-state;
- a machine-readable current state;
- a UI audit overlay that removes historical classification labels from product authority;
- an accepted ADR clarifying ADR-003, ADR-012, and the ordinary-UI consequence of ADR-019;
- a one-time progress reconciliation.

The historical UI matrix remains an evidence inventory. Each active parent batch must migrate its relevant rows before using them for acceptance or scoring. Rewriting all rows upfront is not an additional governance project.

`PROJECT_STATE.schema.json` is deferred because no current consumer requires a separate schema. JSON parsing and existing CI protect syntax; a schema is added only when it enables a real generator or validation gate.

## Active batch — MIG-01

The only authorized product implementation journey is:

`real original export -> direct import -> atomic activation -> real route decisions -> browser restart -> semantic re-export`

The binding contract is `MIG_01_BATCH_CONTRACT.md`.

Current phase:

1. inventory importer, fixtures, mappings, storage, activation, export, and debt;
2. establish provenance-bound positive and negative corpus;
3. migrate the audit rows relevant to migration;
4. run the first complete official/default chain and fix the first blocking layer.

Frozen during `MIG-01`:

- Popup/Options beautification unrelated to migration;
- new diagnostics, scheduling, history, or backup;
- Gist, WebDAV, or other remote sync;
- new Profile families;
- Rust/WASM or native-engine expansion.

## Open product journeys

- **Real original migration and semantic round trip — PARTIAL, active.** No representative real export has completed the full chain on both browsers.
- **Profile-family and routing semantics — PARTIAL.** Broad implementation exists, but real migrated-data semantic closure is incomplete.
- **Toolbar, Popup, and daily switching — PARTIAL.** Bounded states pass; the complete parent journey and owner acceptance remain open.
- **Options, dialogs, CRUD, Apply/Discard — PARTIAL.** Familiar complete task flow and material UX compatibility remain open.
- **Reliability and security — PARTIAL.** Foundations exist; the consolidated real-data failure-injection matrix remains open.
- **Localization, accessibility, bounded visual alignment — PARTIAL.** Surface coverage is incomplete and there is no final candidate.
- **Final packaging and owner acceptance — OPEN.** Release state is `NO-GO`.

## Verification policy

- development iteration uses targeted checks;
- original and real-data evidence drives compatibility claims;
- micro-states remain tests inside parent journeys unless independently high risk;
- one clean exact Head is formed at batch completion;
- the permanent full gate set runs once on that Head when required;
- the owner is not asked to inspect micro-slices.

## Release prohibition

No merge, release, acceptance build, or owner package is authorized. Green automation proves engineering health only. Release state can advance only after complete parent journeys and the exact consolidated candidate satisfy the applicable gates.
