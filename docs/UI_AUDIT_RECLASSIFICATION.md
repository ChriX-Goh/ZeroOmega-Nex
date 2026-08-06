# UI Audit Reclassification Overlay

`UI_AUDIT_MATRIX.md` preserves a large body of original-source and browser evidence, but its historical classification vocabulary is no longer a product contract. This overlay controls how those rows are interpreted until the matrix is migrated row by row.

## 1. Authority

- Product classes come only from `PRODUCT_CONSTITUTION.md`.
- Historical `MUST_MATCH`, `REFERENCE`, `UNCERTAIN`, `INTENTIONAL_DIVERGENCE`, and `NOT_PORTING` labels are evidence-era metadata.
- A historical `DONE` means the recorded implementation/evidence existed; it does not automatically mean the row is still required, correctly classified, or sufficient to close its parent journey.
- No historical row may be used to authorize pixel/DOM/event-level cloning or an ordinary UI engineering concept.

## 2. Migration mapping

- **Historical `MUST_MATCH`.** Treat as an unclassified requirement, often `UX-COMPATIBLE` and sometimes `CONTRACT-EXACT`. Determine whether the row protects data/semantics/recovery, a complete user task, or only incidental presentation.
- **Historical `REFERENCE`.** Treat as non-binding visual or implementation evidence. Classify as `UX-COMPATIBLE` evidence or `MODERNIZED`; do not score independently without task impact.
- **Historical `UNCERTAIN`.** Treat as `UNKNOWN`. Obtain original, target, or real-data evidence before implementation or closure.
- **Historical `INTENTIONAL_DIVERGENCE`.** Treat as a candidate `DR-xxxx`, `MODERNIZED`, or `LEGACY-DEFECT-REJECTED` item. Confirm material impact, evidence, and current decision authority.
- **Historical `NOT_PORTING`.** Treat as a scope or implementation decision. Confirm that it is internal technology, a rejected defect, or an explicitly deferred feature.

## 3. Row-level decision rules

Classify as `CONTRACT-EXACT` when the row changes:

- imported or exported user data;
- profile identity, name, color, order, references, startup, or Quick Switch;
- rule/PAC/Rule List meaning or effective route result;
- persistence, restart, activation, rollback, failure recovery, ownership, authentication, or security.

Classify as `UX-COMPATIBLE` when the row protects a complete ordinary task:

- finding a familiar entry point;
- selecting or switching a profile;
- creating, editing, renaming, deleting, applying, or discarding configuration;
- understanding current/result/blocked/error state;
- using site or temporary rules;
- completing the task without instructions or material relearning.

Classify as `MODERNIZED` when the row concerns:

- implementation technology;
- responsive layout, keyboard/focus, accessibility, high DPI, dark mode;
- clearer errors/loading without a new mandatory workflow;
- performance, testability, maintainability, or internal architecture.

Classify as `LEGACY-DEFECT-REJECTED` when evidence shows:

- bug, race, silent corruption, security weakness, severe performance defect;
- obsolete browser restriction;
- inaccessible or accidental framework/DOM/event behavior.

## 4. Evidence and status reinterpretation

- `DONE` with only Nex fixtures remains engineering evidence, not original compatibility proof.
- `DONE` with precise geometry remains useful only where geometry affects hierarchy, recognition, overflow, accessibility, or hit targets.
- `DONE` that exposes Draft, compiler, snapshot, capability, graph, migration-transaction, or delivery concepts in ordinary UI is not acceptable evidence; the visible behavior must be removed or moved behind an explicit advanced diagnostic boundary.
- `PARTIAL` parent journeys remain partial even when multiple child rows are `DONE`.
- Owner `FAIL` remains authoritative for the failed consolidated build.

## 5. Initial conflict findings

The first matrix section already demonstrates why migration is required:

- A-01 records top-level History and dynamic Draft state as evidence under `MUST_MATCH`; those internal/workflow additions are not authorized ordinary UI under the current Constitution.
- A-14 correctly states that pixel-perfect skin cloning is not required and should map to bounded `UX-COMPATIBLE`/`MODERNIZED` evidence.
- B-09 records immutable revision as an internal implementation detail; it belongs to `MODERNIZED`, not a visible `MUST_MATCH` contract.
- C-05 is a target-capability/data-preservation decision and must be split: retained import/export meaning is `CONTRACT-EXACT`, inactive modern browser FTP traffic is target-dependent under its ADR.
- C-09 combines semantic capability truth with user-facing explanation. Compiler/target behavior is `CONTRACT-EXACT`; ordinary explanatory UI is only required when the user must act on a real limitation and must remain concise.

These examples do not invalidate the implementation automatically. They invalidate the historical classification as the current acceptance authority.

## 6. Migration batches

Matrix migration is performed by parent journey, not by arbitrary row count:

1. `MIG-01`: import/export/data/startup/Quick Switch/PAC/Rule List and failure rows.
2. `UX-POPUP-01`: Toolbar, Popup, current/result, site/temporary, ownership rows.
3. `UX-OPTIONS-01`: navigation, dialogs, CRUD, validation, Apply/Discard rows.
4. `SEM-01`: Profile-family, condition, and route-result rows.
5. `REL-01`: restart, rollback, export, ownership, authentication, security rows.
6. `FINAL-01`: localization, accessibility, hierarchy, density, overflow, hit-target, and bounded visual rows.

A row is considered migrated only when it has:

- current compatibility class;
- parent journey/batch;
- user or system outcome;
- evidence level;
- current status;
- debt or difference record where applicable.

## 7. Current limitation

The historical matrix has not yet been fully migrated. Until that is complete:

- it remains an evidence inventory;
- it cannot override the Constitution, Execution Governance, Delivery Plan, Project State, or current Owner result;
- it cannot authorize a new micro-slice batch;
- it cannot be used to calculate product completion by counting `DONE` rows.

This overlay resolves the immediate authority conflict while `KG-GOV14-MATRIX-CLASSIFY` remains open.
