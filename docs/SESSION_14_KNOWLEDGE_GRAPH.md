# Session 14 Knowledge Graph — Governance Reset

This file records the incremental knowledge and decisions from Session 14. Stable product rules live in `PRODUCT_CONSTITUTION.md`; current authorization lives in `PROJECT_STATE.json`; moving exact Head and Checks live in GitHub.

## 1. Session trigger

The repository owner reported two related failures:

1. the project originally exposed a redesigned, explanation-heavy UI and failed to directly use original exports;
2. the later correction risked becoming a one-to-one clone of incidental original behavior, with excessive evidence cost for micro-states.

Session 14 therefore does not implement another Popup or Options slice. It establishes a governance boundary before further product work.

## 2. Preserved owner intent

The following requirements are not weakened:

- supported original exports import directly and become immediately usable;
- original users do not rebuild profiles or materially relearn ordinary tasks;
- names, colors, ordering, references, startup, Quick Switch, PAC, Rule Lists, bypass, temporary rules, route decisions, persistence, restart, semantic export, failure recovery, rollback, and security remain protected;
- internal architecture is replaced with a faster, safer, more reliable, and maintainable design;
- internal Draft, compiler, snapshot, graph, capability, and delivery concepts remain outside ordinary UI;
- Firefox and Chromium are verified separately;
- owner retest, merge, candidate, and release remain prohibited.

## 3. Corrected compatibility graph

```text
PRODUCT-IDENTITY
  -> CONTRACT-EXACT
     -> migration data
     -> semantic route results
     -> persistence / restart
     -> export / rollback / security
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
     -> incidental framework / DOM behavior
```

This graph rejects both extremes:

- unauthorized product redesign;
- default pixel, DOM, event-timing, and defect cloning.

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

Hard governance edges:

- every task must have a parent batch and journey;
- product WIP is one;
- every batch declares compatibility classes, frozen scope, acceptance, evidence, risks, stop rules, debt, and knowledge-graph delta;
- iteration uses targeted checks;
- one clean exact Head receives the permanent gate set when required;
- owner sees complete journeys or irreducible decisions, not micro-slices.

## 5. Current state graph

```text
PR #11
  -> Draft
  -> release state NO-GO
  -> latest owner result Firefox FAIL (2026-08-02)
  -> product completion audit anchor 47.9% ~= 48%
  -> confidence band 43%–50%

ACTIVE BATCH
  -> GOV-01
  -> governance only
  -> product code frozen
  -> product progress delta 0

NEXT PRODUCT BATCH
  -> MIG-01
  -> real original export
  -> direct import
  -> atomic activation
  -> real route decisions
  -> browser restart
  -> semantic re-export
```

## 6. Session 13 assets retained

Session 13 evidence is not discarded:

- 02Q form/dropdown behavior;
- 02R competing-extension takeover and external-profile inline rename/save;
- 02S Firefox enterprise policy ownership lock;
- current-site temporary-rule and ownership regressions;
- existing permanent read-only evidence workflows;
- one background Action writer, PAC data plane, browser adapters, atomic activation, rollback, and restart foundations.

These are bounded regression assets. They do not close the full Toolbar/Popup parent journey and do not outrank real migration.

## 7. Repository changes in GOV-01 foundation

Updated or created:

- `docs/PRODUCT_CONSTITUTION.md`;
- `docs/EXECUTION_GOVERNANCE.md`;
- `docs/PROJECT_STATE.json`;
- `docs/COMPATIBILITY.md`;
- `docs/DELIVERY_PLAN.md`;
- `docs/PROJECT_PROGRESS_MODEL.md`;
- `AGENTS.md`;
- `docs/MILESTONE_8_STATUS.md`;
- `docs/PROJECT_CHARTER.md`;
- `README.md`;
- this Session 14 incremental graph.

No product implementation file was intentionally changed.

## 8. GOV-01 unresolved nodes

- `KG-GOV14-MATRIX-CLASSIFY` — classify active `UI_AUDIT_MATRIX.md` rows under the four compatibility classes.
- `KG-GOV14-CONFLICT-SCAN` — find remaining active documents that still mandate full observable/pixel/event equivalence or old Order 1-before-migration sequencing.
- `KG-GOV14-STATE-SCHEMA` — add and validate a schema for `PROJECT_STATE.json` if the repository validation architecture supports it without unnecessary process weight.
- `KG-GOV14-PR-SYNC` — update PR #11 description to the new product identity, active batch, and next product batch.
- `KG-GOV14-RECONCILE` — perform one explicit old-model-to-tri-track progress reconciliation after classification; model change alone cannot increase progress.
- `KG-GOV14-CHECKS` — verify the final governance exact Head and applicable documentation/CI checks.

`GOV-01` remains in progress until these nodes are resolved or explicitly deferred with reasons.

## 9. MIG-01 acceptance graph

Required real corpus:

- official/default original export;
- sanitized owner daily-use export;
- nested Switch/Virtual/Rule List export;
- PAC/update/cache/bypass/authentication-metadata export;
- malformed, cyclic, missing-reference, oversized, unsupported, and hostile cases.

Hard acceptance:

- representable required data preservation: 100%;
- silent loss or downgrade: zero;
- both browsers complete import, activation, route decisions, restart, and semantic re-export;
- every failure preserves or restores the previous confirmed state;
- no mandatory manual reconstruction or migration ritual.

Frozen during MIG-01:

- Popup/Options beautification;
- new diagnostics or scheduling;
- history and backup expansion;
- Gist/WebDAV/remote sync;
- new Profile families;
- Rust/WASM or native-engine expansion.

## 10. Drift and stop rules

Stop and re-plan when:

- the active batch begins modifying a second unrelated parent journey;
- a behavior has no compatibility class;
- real data disproves the assumed mapping;
- a fix exposes internal architecture to ordinary users;
- evidence cost exceeds the independent user/system risk;
- two cycles add no measurable parent-journey progress;
- scope is expanded because infrastructure already exists rather than because a first-release journey requires it.

## 11. Debt state

- Technical debt: unchanged by governance documents; existing migration/storage/reliability risk remains to be tested in MIG-01 and REL-01.
- Compatibility debt: real original-export end-to-end chain remains the highest-severity open debt.
- Process debt reduced: product identity, WIP, stop rules, progress tracks, state authority, and delivery order now have explicit sources.
- Process debt still open: legacy matrix classifications and duplicated old wording.
- Scope debt reduced: remote sync, broad diagnostics, history, backup, new Profile families, Rust/WASM, and native engine are explicitly frozen outside their authorized journeys.

## 12. Session acceptance

Session 14 governance foundation succeeds only if repository inspection confirms:

- no product progress was claimed;
- PR remains Draft and release remains NO-GO;
- owner FAIL remains authoritative;
- next product implementation is locked to MIG-01;
- remaining GOV-01 work is visible rather than disguised as complete.
