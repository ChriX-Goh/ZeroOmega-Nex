# Session 14 Knowledge Graph — Governance Reset and Migration Lock

This file records the incremental knowledge and decisions from Session 14. Stable product rules live in `PRODUCT_CONSTITUTION.md`; current authorization lives in `PROJECT_STATE.json`; moving exact Head and Checks live in GitHub.

## 1. Session trigger

The repository owner reported two related failures:

1. the project originally exposed a redesigned, explanation-heavy UI and failed to directly use original exports;
2. the later correction risked becoming a one-to-one clone of incidental original behavior, with excessive evidence cost for micro-states.

Session 14 therefore established a governance boundary before further product work and then locked the next product batch to real migration.

## 2. Preserved owner intent

The following requirements are not weakened:

- supported original exports import directly and become immediately usable;
- original users do not rebuild profiles or materially relearn ordinary tasks;
- names, colors, ordering, references, startup, Quick Switch, PAC, Rule Lists, bypass, temporary rules, route decisions, persistence, restart, semantic export, failure recovery, rollback, ownership, authentication, and security remain protected;
- internal architecture is replaced with a faster, safer, more reliable, and maintainable design;
- internal Draft, compiler, snapshot, graph, capability, and delivery concepts remain outside ordinary UI;
- Firefox and Chromium are verified separately;
- owner retest, merge, candidate, and release remain prohibited.

## 3. Compatibility graph

```text
PRODUCT-IDENTITY
  -> CONTRACT-EXACT
     -> migration data
     -> semantic route results
     -> persistence / restart
     -> export / rollback / ownership / authentication / security
  -> UX-COMPATIBLE
     -> familiar terminology
     -> familiar entry points and defaults
     -> ordinary task success
     -> no material relearning
  -> MODERNIZED
     -> compile-first PAC architecture
     -> reliability / accessibility / responsive behavior
     -> performance and bounded clarity improvements
  -> LEGACY-DEFECT-REJECTED
     -> confirmed bugs / races / corruption
     -> unsafe or obsolete behavior
     -> incidental framework / DOM / event behavior
```

This graph rejects both unauthorized redesign and default pixel, DOM, event-timing, or defect cloning.

## 4. Execution governance graph

```text
Objective
  -> Capability
     -> Journey
        -> Batch
           -> Task
              -> Acceptance
                 -> Evidence
```

Hard edges:

- every task has a parent batch and journey;
- product WIP is one;
- every batch declares compatibility classes, frozen scope, acceptance, evidence, risks, stop rules, debt, and knowledge-graph delta;
- iteration uses targeted checks;
- one clean exact Head receives the permanent gate set when required;
- owner sees complete journeys or irreducible decisions, not micro-slices.

## 5. Governance assets

Session 14 added or aligned:

- `PRODUCT_CONSTITUTION.md`;
- `EXECUTION_GOVERNANCE.md`;
- `PROJECT_STATE.json`;
- `COMPATIBILITY.md`;
- `DELIVERY_PLAN.md`;
- `PROJECT_PROGRESS_MODEL.md`;
- `PROJECT_CHARTER.md`;
- `MILESTONE_8_STATUS.md`;
- `AGENTS.md`;
- `README.md`;
- `UI_AUDIT_RECLASSIFICATION.md`;
- `ADR-020_COMPATIBILITY_BOUNDARY_AND_PROPORTIONAL_EVIDENCE.md`;
- `GOV_01_PROGRESS_RECONCILIATION.md`;
- `MIG_01_BATCH_CONTRACT.md`;
- this incremental graph.

No product implementation file was intentionally changed by `GOV-01`.

## 6. Resolved governance nodes

- `KG-GOV14-BOUNDARY` — four compatibility classes are binding.
- `KG-GOV14-WIP` — product WIP=1 and batch hierarchy are binding.
- `KG-GOV14-MATRIX-AUTHORITY` — the historical UI matrix is an evidence inventory, not a product contract.
- `KG-GOV14-CONFLICT-SCAN` — ADR-003 remains valid; ADR-012 evidence granularity and ADR-019 ordinary-UI exposure are clarified by ADR-020.
- `KG-GOV14-PR-SYNC` — PR #11 reflects the current product boundary and sequence.
- `KG-GOV14-RECONCILE` — historical 47.9% is reconciled to 45.15% product completion under the new weights.
- `KG-GOV14-STATE-SCHEMA` — deferred; no current machine consumer justifies a separate schema gate.

Final exact-Head checks remain a moving GitHub fact and are not copied into this file.

## 7. Matrix migration decision

Full row-by-row rewriting of all historical UI rows is not an upfront governance gate.

`UI_AUDIT_RECLASSIFICATION.md` immediately prevents historical labels and `DONE` counts from overriding current rules. Each parent batch must migrate the rows relevant to its own journey before those rows can support acceptance or scoring.

This converts a potentially unbounded governance exercise into just-in-time traceability:

- `MIG-01` migrates import, export, data, startup, Quick Switch, PAC, Rule List, persistence, and failure rows;
- `UX-POPUP-01` migrates Toolbar, Popup, current/result, site/temporary, and ownership rows;
- later batches migrate their own relevant rows.

## 8. Progress graph

```text
HISTORICAL AUDIT
  -> 47.9% product score
  -> 43%–50% confidence band

TRI-TRACK RECONCILIATION
  -> product completion 45.15% ~= 45%
  -> evidence confidence remains 43%–50%
  -> release state NO-GO
  -> delta -2.75 points
```

The decrease is a method correction:

- final packaging and owner acceptance now reserve five explicit points and currently score zero;
- migration, semantics, and reliability receive more weight;
- bounded Popup slices are not double counted;
- governance adds zero product points.

## 9. Session 13 assets retained

Session 13 evidence remains valid:

- 02Q form/dropdown behavior;
- 02R competing-extension takeover and external-profile inline rename/save;
- 02S Firefox enterprise policy ownership lock;
- current-site temporary-rule and ownership regressions;
- existing permanent read-only evidence workflows;
- one background Action writer, PAC data plane, browser adapters, atomic activation, rollback, and restart foundations.

These are bounded regression assets. They do not close the full Toolbar/Popup parent journey and do not outrank migration.

## 10. Active state graph

```text
PR #11
  -> Draft
  -> release state NO-GO
  -> latest owner result Firefox FAIL (2026-08-02)

COMPLETED BATCH
  -> GOV-01
  -> product progress delta 0

ACTIVE PRODUCT BATCH
  -> MIG-01
  -> phase INVENTORY_AND_CORPUS
  -> real original export
  -> direct import
  -> atomic activation
  -> real route decisions
  -> browser restart
  -> semantic re-export
```

## 11. MIG-01 hard acceptance

Required positive corpus:

- official/default original export;
- sanitized owner daily-use export;
- nested Switch/Virtual/Rule List export;
- PAC/update/cache/bypass/authentication-metadata export.

Required negative corpus:

- malformed, cyclic, missing-reference, oversized, unsupported, unsafe, and hostile cases.

Hard results:

- representable required data preservation: 100%;
- silent loss or downgrade: zero;
- both browsers complete the chain;
- every failure preserves or restores the previous confirmed state;
- no mandatory manual reconstruction or migration ritual;
- no secret leakage.

## 12. Frozen scope during MIG-01

- Popup/Options beautification unrelated to migration;
- broad diagnostics, scheduling, history, or backup;
- Gist, WebDAV, browser-cloud, or other remote sync;
- new Profile families;
- speculative optimization;
- Rust/WASM or native-engine expansion.

## 13. Drift and stop rules

Stop and re-plan when:

- the active batch begins modifying a second unrelated parent journey;
- a behavior has no compatibility class;
- real data disproves the assumed mapping;
- a fix exposes internal architecture to ordinary users;
- data would be silently dropped or reinterpreted;
- evidence cost exceeds the independent migration, semantic, recovery, or security risk;
- two cycles add no measurable parent-journey progress;
- scope expands because infrastructure exists rather than because migration requires it.

## 14. Debt state

- Technical debt: importer, storage, activation, large-configuration, and recovery risks must be tested in `MIG-01`.
- Compatibility debt: the real original-export chain is the highest-severity active debt.
- Process debt reduced: one product identity, state source, WIP rule, batch contract, progress model, and matrix authority.
- Scope debt reduced: unrelated future capabilities are explicitly frozen.
- High-severity data-loss, activation, recovery, or secret debt cannot pass `MIG-01` closure.
