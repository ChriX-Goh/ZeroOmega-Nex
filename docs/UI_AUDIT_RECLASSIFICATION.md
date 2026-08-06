# UI Audit Reclassification Overlay

`UI_AUDIT_MATRIX.md` preserves a large body of original-source and browser evidence, but its historical classification vocabulary is no longer a product contract. This overlay controls how those rows are interpreted and migrated.

## 1. Authority

- Product classes come only from `PRODUCT_CONSTITUTION.md` and ADR-020.
- Historical `MUST_MATCH`, `REFERENCE`, `UNCERTAIN`, `INTENTIONAL_DIVERGENCE`, and `NOT_PORTING` labels are evidence-era metadata.
- A historical `DONE` means the recorded implementation or evidence existed; it does not automatically mean the row is still required, correctly classified, or sufficient to close its parent journey.
- No historical row may authorize pixel, DOM, event-level cloning or an ordinary UI engineering concept.

## 2. Historical-label mapping

- **`MUST_MATCH`.** Treat as unclassified. Determine whether it protects `CONTRACT-EXACT` data/semantics/recovery, a complete `UX-COMPATIBLE` task, or only incidental presentation.
- **`REFERENCE`.** Treat as non-binding visual or implementation evidence. Classify as task evidence or `MODERNIZED`; do not score independently without task impact.
- **`UNCERTAIN`.** Treat as `UNKNOWN`. Obtain original, target, or real-data evidence before implementation or closure.
- **`INTENTIONAL_DIVERGENCE`.** Treat as a candidate `DR-xxxx`, `MODERNIZED`, or `LEGACY-DEFECT-REJECTED` item. Confirm material impact and current decision authority.
- **`NOT_PORTING`.** Treat as a scope or implementation decision. Confirm that it is internal technology, a rejected defect, or an explicitly deferred feature.

## 3. Row-level decision rules

Classify as `CONTRACT-EXACT` when the row changes:

- imported or exported user data;
- profile identity, name, color, order, references, startup, or Quick Switch;
- rule, PAC, Rule List meaning, or effective route result;
- persistence, restart, activation, rollback, failure recovery, ownership, authentication, or security.

Classify as `UX-COMPATIBLE` when the row protects a complete ordinary task:

- finding a familiar entry point;
- selecting or switching a profile;
- creating, editing, renaming, deleting, applying, or discarding configuration;
- understanding current, result, blocked, or error state;
- using site or temporary rules;
- completing the task without instructions or material relearning.

Classify as `MODERNIZED` when the row concerns:

- implementation technology;
- responsive layout, keyboard/focus, accessibility, high DPI, or dark mode;
- clearer errors or loading without a new mandatory workflow;
- performance, testability, maintainability, or internal architecture.

Classify as `LEGACY-DEFECT-REJECTED` when evidence shows:

- bug, race, silent corruption, security weakness, or severe performance defect;
- obsolete browser restriction;
- inaccessible or accidental framework, DOM, or event behavior.

## 4. Evidence and status reinterpretation

- `DONE` with only Nex fixtures remains engineering evidence, not original compatibility proof.
- `DONE` with precise geometry remains useful only where geometry affects hierarchy, recognition, overflow, accessibility, or hit targets.
- `DONE` that exposes Draft, compiler, snapshot, capability, graph, migration-transaction, or delivery concepts in ordinary UI is not acceptable product evidence.
- `PARTIAL` parent journeys remain partial even when multiple child rows are `DONE`.
- Owner `FAIL` remains authoritative for the failed consolidated build.

## 5. Initial conflict findings

- A-01 records top-level History and dynamic Draft state as positive `MUST_MATCH` evidence; those internal additions are not authorized ordinary UI.
- A-14 correctly states that pixel-perfect skin cloning is not required and maps to bounded `UX-COMPATIBLE` or `MODERNIZED` evidence.
- B-09 records immutable revision as an internal implementation detail; it belongs to `MODERNIZED`, not a visible contract.
- C-05 must split retained import/export meaning from inactive modern-browser FTP traffic.
- C-09 combines semantic capability truth with permanent explanatory UI. ADR-020 keeps the capability matrix but moves detailed diagnostics out of ordinary Fixed UI; only concise task-relevant warnings remain.

These findings do not automatically invalidate the implementation. They invalidate the historical classification as current acceptance authority.

## 6. Just-in-time migration by parent batch

The full historical matrix is not rewritten as an upfront governance project. Each parent batch must migrate its relevant rows before those rows support acceptance or scoring:

1. `MIG-01`: import, export, data, startup, Quick Switch, PAC, Rule List, persistence, and failure rows.
2. `UX-POPUP-01`: Toolbar, Popup, current/result, site/temporary, and ownership rows.
3. `UX-OPTIONS-01`: navigation, dialogs, CRUD, validation, and Apply/Discard rows.
4. `SEM-01`: Profile-family, condition, and route-result rows.
5. `REL-01`: restart, rollback, export, ownership, authentication, and security rows.
6. `FINAL-01`: localization, accessibility, hierarchy, density, overflow, hit-target, and bounded visual rows.

A row is migrated when it has:

- current compatibility class;
- parent journey and batch;
- user or system outcome;
- evidence level;
- current status;
- debt or difference record where applicable.

## 7. Current use

Until a row is migrated:

- it remains evidence inventory only;
- it cannot override the Constitution, ADR-020, Execution Governance, Delivery Plan, Project State, or current owner result;
- it cannot authorize a micro-slice batch;
- it cannot create product points through `DONE` counting;
- it may be cited as an original or implementation anchor after its relevance is independently checked.

This overlay closes the immediate authority conflict without turning governance into another unbounded row-processing project.
