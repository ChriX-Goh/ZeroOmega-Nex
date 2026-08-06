# ZeroOmega Nex — Agent Operating Contract

Read `docs/PRODUCT_CONSTITUTION.md`, `docs/EXECUTION_GOVERNANCE.md`, and `docs/PROJECT_STATE.json` before making any change. The Constitution is the highest-authority product contract. Governance controls execution. Project State records the current authorized batch and release state.

## Product objective

Build a clean-room, bottom-layer rewrite and modern compatible successor to ZeroOmega v3.5.0 for Chromium and Firefox.

Preserve user data, configuration meaning, effective routing, persistence, failure recovery, and familiar high-frequency operation. Replace the internal architecture. Do not redesign the product mental model, and do not clone incidental pixels, DOM structure, event timing, or historical defects by default.

## Binding compatibility classes

Every changed behavior must be classified before implementation:

1. `CONTRACT-EXACT` — data, semantics, route results, persistence, restart, export, rollback, and security.
2. `UX-COMPATIBLE` — ordinary tasks, terminology, entry points, defaults, hierarchy, action meaning, and resulting state.
3. `MODERNIZED` — architecture, performance, reliability, accessibility, responsive behavior, and bounded clarity improvements that preserve the contract.
4. `LEGACY-DEFECT-REJECTED` — confirmed bugs, races, silent corruption, unsafe behavior, obsolete browser limits, and implementation accidents.

Do not treat every original DOM, CSS value, blur/click sequence, animation, or pixel as a product contract. Do not use modernization as permission to rename, relocate, or expose new ordinary-user concepts.

## Hard constraints

1. Supported ZeroOmega `schemaVersion: 2` exports must import directly and become immediately usable without manual profile reconstruction or a mandatory migration ritual.
2. Preserve representable names, colors, order, references, startup profile, Quick Switch, rule priority, bypass, endpoints, PAC, Rule Lists, temporary rules, safe metadata, and supported authentication boundaries.
3. Silent data loss, silent reinterpretation, and silent downgrade are prohibited.
4. Experienced original users must complete ordinary tasks without instructions or material relearning.
5. Ordinary UI must not expose Draft revisions, compilation, snapshots, graph traces, capability research, migration transactions, or delivery status.
6. A `DR-xxxx` record is required for changed `CONTRACT-EXACT` results, material task changes, target-forced differences, or unrepresentable real data.
7. Ordinary browser requests must not depend on an extension-side global `<all_urls>` proxy decision listener.
8. Browser-native PAC is the default data plane. Request-level compatibility hooks are narrow, optional, and evidence-backed.
9. User configuration is the public contract; compiled PAC, indexes, caches, and snapshots are derived.
10. Activation is atomic, confirmed, and rollback-safe.
11. Firefox and Chromium are verified separately.
12. Unknown behavior fails closed. Do not invent simplified product behavior to make a test pass.
13. Rust/WASM and native engine work require measured need, semantic protection, and current-batch authorization.
14. Permanent CI is read-only.
15. Do not ask the owner to test micro-slices. Present complete journeys or irreducible product decisions.

## Product WIP and scope

Product WIP is limited to one active implementation batch.

A task is unauthorized unless it has a named parent batch and journey. A new issue may enter the active batch only when it blocks the stated acceptance criteria; otherwise record it as a dependency or future batch candidate.

New features are denied unless they close an authorized first-release journey. Do not silently pull forward scheduling, broad diagnostics, history, backup, remote sync, native engine, new Profile families, or speculative optimization.

## Required batch workflow

Before implementation, record:

- batch ID and parent journey;
- user outcome;
- affected compatibility classes;
- included and frozen scope;
- original or real-data anchors;
- acceptance criteria;
- evidence plan;
- risks and unknowns;
- stop rules;
- debt impact;
- expected knowledge-graph delta.

During implementation:

- use targeted unit, component, contract, and affected-browser tests;
- keep the batch scope frozen;
- prefer real original exports for migration claims;
- treat synthetic fixtures as supplements;
- do not advance public Head for every probe when staging can contain iteration;
- stop and re-plan when the batch contract becomes invalid.

At batch completion:

- resolve every acceptance criterion;
- update compatibility mappings, debt, Project State, and knowledge graph;
- form one clean exact Head;
- run the permanent full gate set once when required;
- report product completion, evidence confidence, and release state separately.

## Evidence proportionality

Strong end-to-end evidence is mandatory for data, routing, persistence, security, activation, rollback, real migration, and complete parent journeys.

Task-level browser evidence and bounded visual checks are normally sufficient for `UX-COMPATIBLE` behavior. Micro-states do not each require a permanent workflow or owner inspection unless they carry independent high risk.

Modernization uses evidence appropriate to the claimed benefit: performance measurements, accessibility checks, component tests, failure injection, or bounded visual regression.

## Knowledge and state

- `docs/PROJECT_STATE.json` is the machine-readable source for stable current authorization, progress anchor, owner result, and release state.
- GitHub PR metadata and Checks are authoritative for moving Head, mergeability, and CI.
- Knowledge graphs contain evidence anchors, mappings, dependencies, debt, and incremental batch deltas.
- Session files must not duplicate competing product contracts, moving SHAs, workflow run IDs, or independently edited percentages.

After every batch, query for tasks without parent journeys, unclassified visible behavior, completed slices with incomplete parents, Nex-only evidence, duplicate dynamic state, out-of-scope features, and debt older than two batches.

## Completion and release

Product reporting has three tracks:

- product completion;
- evidence confidence;
- release state: `NO-GO`, `GO-FOR-OWNER`, or `OWNER-PASS`.

Owner acceptance controls release, not all measurable intermediate completion. Green CI cannot overrule an owner `FAIL`.

## Current authorization

Follow `docs/PROJECT_STATE.json`.

Current sequence:

1. `GOV-01` — governance convergence; no product progress increase.
2. `MIG-01` — real original-export golden path.
3. `UX-POPUP-01` — consolidated Toolbar and Popup journey.
4. `UX-OPTIONS-01` — Options, dialogs, CRUD, and Apply/Discard.
5. `SEM-01` — Profile-family and route semantics.
6. `REL-01` — export, restart, rollback, ownership, authentication, reliability, and security.
7. `FINAL-01` — localization, accessibility, bounded visual alignment, packaging, and owner candidate.

No merge, release, candidate claim, unrelated redesign, or owner retest is authorized while release state is `NO-GO`.
