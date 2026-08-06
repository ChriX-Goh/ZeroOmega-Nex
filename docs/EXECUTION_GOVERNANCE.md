# ZeroOmega Nex Execution Governance

This document converts the Product Constitution into an operating system for long-running development. It prevents gradual drift, repeated local optimization, evidence inflation, and scope expansion.

## 1. Work hierarchy

Every authorized change must belong to this hierarchy:

`Objective -> Capability -> Journey -> Batch -> Task -> Acceptance -> Evidence`

- **Objective** — the stable first-release outcome. Changes require repository-owner approval and a constitution update.
- **Capability** — a durable user or system ability needed by the objective. Changes require an ADR or explicit scope decision.
- **Journey** — a complete user outcome with a measurable start and end state.
- **Batch** — one coherent delivery package that materially advances one parent journey.
- **Task** — an implementation or evidence step inside the batch.
- **Acceptance** — the observable and engineering conditions that decide whether the batch succeeded.
- **Evidence** — the smallest sufficient proof for those conditions.

A task without a named parent batch is unauthorized. A batch that does not close or materially advance a named journey is unauthorized.

## 2. Product WIP limit

Product work-in-progress is limited to **one active implementation batch**.

Allowed in parallel:

- original evidence capture;
- test-fixture preparation;
- documentation research;
- failure reproduction;
- review of already completed work.

Not allowed in parallel:

- unrelated product features;
- a second UI redesign stream;
- speculative Rust/WASM or native-engine work;
- remote sync, broad diagnostics, history, backup, or scheduling work that does not close the active first-release journey.

## 3. Required batch contract

Before code changes, every batch must record:

1. Batch ID and parent journey.
2. User outcome in one sentence.
3. Compatibility classes affected.
4. Included scope.
5. Explicit frozen/excluded scope.
6. Original or real-data anchors.
7. Acceptance criteria.
8. Evidence plan proportional to risk.
9. Known unknowns and target differences.
10. Stop rules.
11. Expected knowledge-graph nodes changed.
12. Product, compatibility, process, and technical debt impact.

A batch cannot start while any of items 1–10 is materially ambiguous.

## 4. Pre-development gates

### Goal gate

- Does the batch directly advance the first stable replacement?
- Which weighted journey gains value if it succeeds?
- Would a user notice a complete new ability or resolved blocker?

### Boundary gate

- Is each requirement classified as `CONTRACT-EXACT`, `UX-COMPATIBLE`, `MODERNIZED`, or `LEGACY-DEFECT-REJECTED`?
- Is the proposal preserving the user contract rather than copying implementation accidents?
- Is any new visible concept being introduced? New ordinary-user concepts are denied by default.

### Value gate

A batch is rejected when most work produces only:

- new tests for already proven low-risk states;
- additional screenshots without a new decision;
- documentation churn around unchanged product state;
- one more isolated micro-state that does not materially advance its parent journey.

### Complexity gate

The batch must identify the smallest coherent user outcome. It must not split one journey into fragments that each require independent full CI and owner acceptance, and it must not combine multiple unrelated journeys into one PR transaction.

## 5. Development gates

During implementation:

- run targeted unit, component, contract, and affected-browser tests;
- keep the active batch scope frozen;
- record newly discovered scope separately rather than silently absorbing it;
- do not advance the public exact Head for every probe or documentation adjustment when a staging branch can contain iteration;
- retain the simplest semantic oracle and compare optimized implementations against it;
- treat real original exports as primary migration evidence and synthetic fixtures as boundary supplements.

A newly discovered issue may enter the active batch only when it blocks the batch acceptance criteria. Otherwise it becomes a dependency or future batch candidate.

## 6. Batch completion gates

A batch completes only when:

- every acceptance criterion has a result;
- no blocked criterion is disguised as partial success;
- targeted tests pass;
- required real-browser or real-data evidence passes;
- documentation and knowledge graph contain the batch delta;
- debt changes are recorded;
- one clean exact Head is identified;
- the permanent full gate set runs once on that Head when required by risk and repository policy.

Documentation-only governance changes use documentation, schema, reference, and consistency checks. They do not require repeated full browser evidence unless they modify workflow code.

## 7. Owner involvement

The repository owner is asked to decide or test only when:

- a complete parent journey is ready;
- a material user-contract trade-off cannot be resolved from evidence;
- an irreversible visible product decision is proposed;
- the final consolidated candidate is ready.

Micro-slices, internal refactors, individual edge states, and repeated near-identical builds remain agent-verified.

## 8. Stop rules

Stop the active batch and re-plan when any of the following occurs:

- the required user outcome changes;
- more than one additional parent journey is being modified;
- the batch depends on an unclassified compatibility difference;
- real data disproves the assumed model;
- the proposed fix requires exposing internal architecture to ordinary users;
- evidence cost becomes larger than the user risk it protects;
- two consecutive implementation cycles add no measurable parent-journey progress;
- a new architecture-level defect invalidates the current acceptance model.

Do not continue accumulating patches under an invalid batch contract.

## 9. Debt budgets

### Technical debt

Code, architecture, performance, reliability, or testability compromises. High-severity technical debt cannot be carried across the batch that introduced it unless explicitly accepted.

### Compatibility debt

Known unverified, target-dependent, downgraded, or unsupported original behavior. Every item needs an owner, affected journey, evidence gap, and planned disposition.

### Process debt

Duplicated status, stale documents, redundant workflows, manual synchronization, micro-PR churn, and excessive evidence cost. Process debt must not grow in two consecutive batches.

### Scope debt

Pulled-forward features without first-release authorization. Scope debt is resolved by deleting, freezing, or formally scheduling the feature; it cannot remain implicitly active.

Each batch records debt added, debt removed, and the net change. A batch with positive high-severity debt requires explicit justification.

## 10. Knowledge graph rules

The knowledge graph stores:

- stable objectives and capability relationships;
- original evidence anchors;
- compatibility classification;
- user journeys and parent-child status;
- implementation ownership;
- unresolved evidence and target differences;
- batch dependencies and decisions;
- debt and stop-rule events.

It does not duplicate moving Head SHAs, workflow run IDs, or percentages across session files. Session records are append-only batch deltas. `docs/PROJECT_STATE.json` stores stable current authorization and product status; GitHub remains authoritative for moving Head and checks.

Required drift queries after every batch:

1. Which active tasks lack a parent journey?
2. Which visible behaviors lack a compatibility class?
3. Which completed slices have incomplete parents?
4. Which tests prove only Nex fixtures rather than original or real data?
5. Which documents duplicate dynamic state?
6. Which features are outside the first-release authorized scope?
7. Which debt nodes have aged across more than two batches?

## 11. Verification economy

Use evidence proportional to risk:

- data, routing, persistence, security, rollback, and full journeys receive strong end-to-end evidence;
- ordinary UX receives task-level cross-browser evidence and bounded visual checks;
- incidental pixels and implementation timing do not receive independent permanent gates;
- modernization receives accessibility, performance, reliability, or component evidence appropriate to the claimed benefit.

Permanent workflows should be reusable and read-only. Development iteration uses targeted checks. Superseded runs should be cancelled where supported. Artifacts hold temporary logs and screenshots; dependency caches are not evidence.

## 12. Current batch sequence

- `GOV-01` — governance and compatibility-class convergence. Product progress unchanged.
- `MIG-01` — real original-export golden path.
- `UX-POPUP-01` — consolidated Toolbar and Popup daily-use journey.
- `UX-OPTIONS-01` — Options, dialogs, CRUD, and Apply/Discard.
- `SEM-01` — Profile-family and rule-result semantic closure.
- `REL-01` — export, restart, rollback, ownership, authentication, reliability, and security.
- `FINAL-01` — localization, accessibility, bounded visual alignment, packaging, and owner candidate.

The active product implementation batch after `GOV-01` is `MIG-01`.
