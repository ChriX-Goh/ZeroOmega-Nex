# ZeroOmega Nex Product Constitution

This document is the highest-authority product contract for ZeroOmega Nex. When another repository document conflicts with it, this document wins until the conflict is corrected.

## 1. Product identity

ZeroOmega Nex is a clean-room, bottom-layer rewrite and modern compatible successor to ZeroOmega v3.5.0 for Firefox and Chromium.

It is not a new product merely inspired by ZeroOmega, and it is not a pixel-, DOM-, event-timing-, or implementation-level clone. The project preserves the original user contract and migration value while replacing the data model, compiler, storage, browser adapters, state machines, security boundaries, test infrastructure, and internal architecture.

The product objective is:

> Existing ZeroOmega users keep their configuration, mental model, familiar high-frequency workflow, and effective behavior, while Nex provides a faster, safer, more reliable, and maintainable implementation.

## 2. Compatibility classes

Every compatibility requirement and audit row must be assigned exactly one class before implementation or closure.

### `CONTRACT-EXACT`

Applies to user data, configuration meaning, profile identity, names, colors, ordering, references, startup state, Quick Switch state, rule priority, PAC and Rule List meaning, effective routing results, temporary-rule lifecycle, persistence, semantic export, security boundaries, activation, restart, failure recovery, and rollback.

Requirements:

- supported data is preserved without silent loss or reinterpretation;
- equivalent input and browser state produce equivalent effective behavior;
- unsupported, target-dependent, or downgraded behavior is reported precisely before it can replace a working state;
- failures leave or restore the previous confirmed working state;
- internal implementation is unrestricted by the original code path.

### `UX-COMPATIBLE`

Applies to Toolbar, Popup, Options, dialogs, terminology, information hierarchy, defaults, validation meaning, action order, profile CRUD, Apply/Discard, current-site rules, temporary rules, and other ordinary user journeys.

Requirements:

- an experienced original user can complete the ordinary task without instructions or material relearning;
- core terms, entry points, default meaning, necessary steps, destructive consequences, and resulting state remain familiar and predictable;
- ordinary UI must not expose rewrite internals such as Draft revisions, compiler stages, snapshots, capability research, graph traces, or delivery status;
- task success, state meaning, and error recovery matter more than exact pixels or DOM structure.

`UX-COMPATIBLE` does not require identical DOM trees, CSS values, anti-aliasing, animation timing, blur-versus-click implementation, or every incidental geometry value. Exact geometry remains required only where it materially affects recognition, information hierarchy, accessibility, hit targets, overflow, or task completion.

### `MODERNIZED`

Applies to internal architecture, performance, reliability, responsive layout, keyboard and focus behavior, accessibility, high-DPI support, dark-mode support, loading feedback, error readability, diagnostics boundaries, and other improvements that do not change the user contract.

A modernization is permitted when it:

- does not add a mandatory ordinary-user step;
- does not change configuration meaning or effective result;
- does not rename or relocate a core concept in a way that causes material relearning;
- does not expose internal architecture as a new product mental model;
- has task-level or engineering evidence appropriate to its risk.

### `LEGACY-DEFECT-REJECTED`

Applies to confirmed historical bugs, races, silent corruption, security weaknesses, severe performance defects, inaccessible behavior, obsolete browser restrictions, and accidental framework or DOM behavior.

Such behavior is not inherited merely because it existed in the original. The repository records the original behavior, defect evidence, corrected behavior, and compatibility impact. A narrow compatibility adapter may be retained only when real user data or established automation materially depends on the defect.

## 3. Direct migration contract

Supported ZeroOmega `schemaVersion: 2` exports must import directly and become immediately usable without manual profile reconstruction, reinterpretation, or a mandatory new migration ritual.

Import may use internal candidate revisions, validation, compilation, secret isolation, and atomic activation. Those safety stages remain internal. On any failure, the previous active state remains intact and the failure is reported precisely.

The importer must preserve representable configuration and safe opaque legacy metadata. Every field is mapped, preserved, explicitly target-limited, explicitly downgraded, or rejected with a precise reason. Silent omission is prohibited.

The primary migration acceptance chain is:

`real original export -> direct import -> activation -> real route decisions -> browser restart -> semantic re-export`

Synthetic fixtures are necessary but cannot replace representative official and sanitized real exports.

## 4. User-interface boundary

Original v3.5.0 remains the default evidence source for ordinary user concepts, terminology, entry points, defaults, information hierarchy, and high-frequency task flow.

The goal is near-zero migration and relearning cost, not visual or event-level cloning.

The following are hard constraints:

- original users must recognize how to select, create, edit, rename, delete, apply, discard, inspect, and recover configuration;
- default profiles, ordering, colors, startup meaning, current/result meaning, and destructive actions must not be casually redesigned;
- explanatory engineering prose and internal lifecycle taxonomy must not appear in ordinary UI;
- a modernization must be evaluated by user task impact, not by whether it looks newer;
- when evidence is insufficient, the state remains `UNKNOWN`; implementation must not invent a new product concept to fill the gap.

A visible difference requires a `DR-xxxx` record when it changes a `CONTRACT-EXACT` requirement, materially changes a `UX-COMPATIBLE` task, or is caused by a target limitation. Low-risk `MODERNIZED` changes and documented `LEGACY-DEFECT-REJECTED` corrections use proportionate evidence and do not require proof of an irreducible browser limitation.

## 5. Internal architecture constraints

- Ordinary navigation must not depend on an extension-side global `<all_urls>` proxy decision listener.
- Browser-native PAC execution is the default data plane.
- Configuration activation is atomic, confirmed, and rollback-safe.
- User configuration is the stable public contract; PAC, indexes, caches, and runtime snapshots are derived artifacts.
- Firefox and Chromium are verified separately.
- Request-level compatibility hooks are narrowly scoped, evidence-backed, and optional.
- Rust/WASM is introduced only after measured need and protected differential parity.
- Performance, safety, and maintainability improvements must remain behind the compatible user boundary.

## 6. Evidence proportionality

Evidence strength is proportional to user and system risk.

### High-risk evidence chain

Required for `CONTRACT-EXACT`, complete parent journeys, security boundaries, persistence, activation, rollback, and material UX changes:

`Original source/runtime or real data -> explicit mapping -> implementation -> deterministic tests -> applicable real browsers/data -> consolidated result`

### Task-level evidence

Normally sufficient for `UX-COMPATIBLE` behavior that does not alter data or routing semantics:

- original task anchor;
- task completion and state-transition tests;
- representative browser evidence;
- visual evidence for hierarchy, overflow, hit targets, and recognition where relevant.

Micro-states do not each require a separate permanent workflow, full six-gate exact-Head cycle, or owner inspection unless they carry independent high risk.

### Modernization evidence

Uses the smallest evidence that proves the improvement and protects the user contract, such as accessibility checks, performance measurements, component tests, failure injection, or bounded visual regression.

## 7. Completion and progress

Project reporting uses three separate tracks:

1. **Product completion** — how much of the required user outcome works.
2. **Evidence confidence** — how strongly the claimed behavior is proven.
3. **Release state** — `NO-GO`, `GO-FOR-OWNER`, or `OWNER-PASS`.

Owner acceptance controls release and irreversible product decisions. It does not erase measurable intermediate product completion, and the owner must not be repeatedly asked to test micro-slices.

Commit count, changed lines, test count, workflow count, green CI, or Nex-only screenshots are not product completion.

A bounded slice may be marked complete without closing its parent journey. Parent status changes only when the parent acceptance criteria are complete.

## 8. Execution governance

- Product work-in-progress is limited to one authorized high-value batch.
- Every batch states the parent journey, compatibility classes, user outcome, frozen scope, acceptance criteria, evidence plan, risks, and stop rules before implementation.
- Research and evidence preparation may run in parallel, but unrelated product implementation may not.
- Development uses targeted tests while iterating. One clean exact Head is created at batch completion and receives the full permanent gate set once.
- Dynamic Head and CI state come from GitHub. Stable product status and authorized work come from `docs/PROJECT_STATE.json` and the governing documents.
- Knowledge graphs record mappings, decisions, dependencies, unresolved evidence, and batch deltas; they must not duplicate competing product contracts or moving status.
- New features are unauthorized unless they close an accepted first-release journey or receive an explicit scope decision.

## 9. Current authorized delivery order

1. Complete governance and compatibility-class convergence without claiming product progress.
2. Close the real original-export golden migration path.
3. Complete the consolidated Toolbar and Popup daily-use journey.
4. Complete Options, dialogs, profile CRUD, and Apply/Discard.
5. Close Profile-family semantics and rule-result parity using real migrated data.
6. Close export, restart, rollback, ownership, authentication, reliability, and security.
7. Complete localization, accessibility, information density, and bounded visual alignment.
8. Produce one exact final candidate for repository-owner acceptance.

No merge, release, or release-candidate claim is permitted before the applicable gates pass.
