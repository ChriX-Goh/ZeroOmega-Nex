# ADR-020 — Classified Compatibility Boundary and Proportional Evidence

**Status:** Accepted

## Decision

ZeroOmega Nex uses four binding compatibility classes:

- `CONTRACT-EXACT` for user data, configuration meaning, effective route results, persistence, restart, semantic export, failure recovery, rollback, ownership, authentication, and security;
- `UX-COMPATIBLE` for ordinary user tasks, terminology, entry points, defaults, information hierarchy, action meaning, and resulting state without material relearning;
- `MODERNIZED` for internal architecture, performance, reliability, accessibility, responsive behavior, and bounded clarity improvements that preserve the contract;
- `LEGACY-DEFECT-REJECTED` for confirmed bugs, races, silent corruption, unsafe behavior, obsolete browser limits, and accidental framework, DOM, or event behavior.

Evidence is proportional to independent user and system risk. Data, routing, persistence, security, rollback, real migration, and complete parent journeys require strong end-to-end evidence. Ordinary UX uses task-level browser evidence and bounded visual checks. Incidental pixels, DOM structure, blur/click implementation, and animation timing do not receive independent permanent gates unless they affect recognition, hierarchy, overflow, accessibility, hit targets, or task completion.

## Reason

The project experienced two opposite forms of drift:

1. internal compiler, Draft, snapshot, capability, history, and migration concepts were exposed as a redesigned ordinary-user product;
2. the correction toward original compatibility began turning every visible micro-state and incidental implementation detail into a heavy exact-match contract.

Neither extreme serves the original objective. Existing users need their data, mental model, high-frequency workflow, and effective behavior preserved. The rewrite also needs freedom to replace the old architecture, correct defects, improve accessibility and reliability, and avoid permanently cloning framework accidents.

## Consequences

- `PRODUCT_CONSTITUTION.md` is the highest-authority definition of these classes.
- Product WIP is one authorized high-value batch.
- Owner testing is reserved for complete parent journeys, material product decisions, and the final candidate.
- Historical `MUST_MATCH`, `REFERENCE`, `UNCERTAIN`, `INTENTIONAL_DIVERGENCE`, and `NOT_PORTING` labels remain evidence-era metadata until migrated.
- Historical `DONE` rows do not automatically close parent journeys or authorize current product behavior.
- Real original exports outrank synthetic fixtures for migration claims.
- A model or documentation change cannot create product progress by itself.

## Supersession and clarification

This ADR does not reject ADR-003. It formalizes ADR-003's original intent: familiar workflow and muscle memory without pixel-perfect cloning.

This ADR narrows ADR-012's phrase “each stage needs permanent acceptance evidence.” Permanent evidence remains mandatory at the parent-journey and high-risk contract level; it is not mandatory as a separate workflow and exact-Head cycle for every micro-state.

This ADR partially supersedes the ordinary-UI consequence of ADR-019. The compiler must retain the exact protocol/target/authentication/DNS capability matrix and must report real limitations truthfully. The ordinary Fixed editor must not display a permanent capability research section merely because the data exists. It shows concise, task-relevant warnings only when the current configuration is affected. Detailed PAC directive, transport, authentication, DNS, and target diagnostics belong in an explicit advanced inspection or diagnostic surface.

ADR-019's data preservation, target capability, authentication, PAC, and fail-before-mutation decisions remain accepted.

## Delivery effect

- `GOV-01` aligns the repository with this decision and adds zero product points.
- `MIG-01` becomes the next product implementation batch.
- Existing Session 13 Popup micro-state evidence remains regression coverage inside the future consolidated Popup journey.
- Popup/Options beautification, broad diagnostics, scheduling, history, backup, remote sync, new Profile families, Rust/WASM, and native-engine expansion remain frozen unless an authorized first-release batch requires them.
