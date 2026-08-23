# ZeroOmega Nex Project Progress Model

## 1. Purpose

Progress reporting separates three questions:

1. **Product completion** — how much of the required user outcome actually works.
2. **Evidence confidence** — how strongly that completion is proven by original evidence, real data, deterministic tests, browsers, and failure injection.
3. **Release state** — whether an exact build may be presented to the repository owner or released.

Commit count, changed lines, test count, workflow count, green CI, screenshots, and documentation volume are not product completion.

## 2. Current tri-track state

The one-time transition is recorded in `GOV_01_PROGRESS_RECONCILIATION.md`.

- Historical audit anchor: 47.9%, reported as 48%.
- Current product completion: **45.15%**, reported as **45%**.
- Delta: **−2.75 points**, reported as **−3 points**.
- Evidence confidence: provisional **43%–50% band**.
- Release state: **`NO-GO`**.
- PR #11: Draft.
- Latest owner result: Firefox `FAIL`, 2026-08-02.
- Active batch: `MIG-01`.

The decrease is a methodology correction, not a code regression. Governance work added zero product points. The old `52%`, `98%`, and Order 1 `80%` claims remain superseded.

## 3. Product journey weights

- Real original migration and semantic round trip: 25%.
- Profile-family and routing semantics: 20%.
- Toolbar, Popup, and daily switching: 15%.
- Options, dialogs, CRUD, and Apply/Discard: 15%.
- Export, restart, rollback, ownership, authentication, reliability, and security: 15%.
- Localization, accessibility, and bounded visual alignment: 5%.
- Final packaging and owner acceptance: 5%.

Total: 100%.

This weighting intentionally gives real migration, effective behavior, and recovery more value than incidental presentation detail.

## 4. Current journey mapping

- **Migration: 35% complete.** Typed importer and transaction foundations exist; no representative real export has completed the full chain on both browsers.
- **Profile and routing semantics: 60% complete.** Broad implementation and semantic assets exist; real migrated-data closure is incomplete.
- **Toolbar and Popup: 45% complete.** Strong runtime automation and bounded child slices exist; the full ordinary parent journey remains unaccepted.
- **Options and editing: 51% complete.** Broad editor and Apply/Discard foundations exist; complete familiar task flow remains open.
- **Reliability and security: 52% complete.** Activation, rollback, ownership, and authentication foundations exist; the consolidated real-data failure matrix remains open.
- **Localization and bounded visual quality: 44% complete.** Framework and partial evidence exist; full coverage and final accessibility remain open.
- **Final packaging and owner acceptance: 0% complete.** There is no accepted candidate.

These values are conservative mappings of the last audited repository state. Bounded child slices are not counted twice.

## 5. Product completion scoring

Product completion is measured by usable parent-journey outcomes.

A journey may gain gradual completion for verified implementation and real browser/data behavior. Owner acceptance does not erase measurable intermediate completion, but release remains blocked until the applicable owner gate.

Recommended internal shares:

- contract and acceptance criteria defined: 10%;
- implementation exists: 35%;
- deterministic task or semantic tests pass: 20%;
- required real data or real browser journey passes: 25%;
- consolidated parent-journey decision: 10%.

For final packaging, all five project points remain unavailable until the exact candidate receives owner `PASS`.

A bounded slice may be complete while its parent remains partial. Slice completion cannot be converted into parent completion without satisfying the parent criteria.

## 6. Evidence confidence

Evidence confidence is independent from product completion.

Confidence inputs include:

- original source, package, and runtime anchors;
- representative official and sanitized real exports;
- explicit Original-to-Nex mappings;
- deterministic semantic and task vectors;
- Chromium evidence;
- Firefox evidence;
- restart and failure-injection evidence;
- secret and data-loss checks;
- owner result where applicable.

Synthetic fixtures alone cap confidence for a real migration claim. Nex-only screenshots cap confidence for an original-facing UX claim. Green unit tests cannot substitute for browser ownership, persistence, or recovery evidence.

Confidence may rise without product completion rising, and product completion may rise while confidence remains provisional.

## 7. Release state

Only three release states are valid:

- `NO-GO` — no owner package, merge, candidate, or release claim is authorized.
- `GO-FOR-OWNER` — all required parent journeys and exact-Head gates are complete; one consolidated package may be tested.
- `OWNER-PASS` — the repository owner accepted the exact candidate.

Automation cannot override an owner `FAIL` or advance release state by itself.

## 8. Compatibility-aware scoring

- `CONTRACT-EXACT` work receives product credit only when user data, semantic result, persistence, or failure behavior is actually available.
- `UX-COMPATIBLE` work is scored by complete task success and familiar mental model, not DOM or pixel identity.
- `MODERNIZED` work receives product credit only when it improves a required journey or non-functional release requirement without changing the contract.
- `LEGACY-DEFECT-REJECTED` work receives credit when the defect is demonstrated, corrected, and compatibility impact is protected.

Independent micro-geometry, blur timing, and incidental DOM parity do not create product points unless they resolve a task, accessibility, recognition, overflow, or hit-target blocker.

## 9. Reporting requirements

Every substantive project report states:

1. product completion percentage;
2. evidence confidence or confidence band;
3. release state;
4. delta from the preceding audited value;
5. exact user outcome causing the delta;
6. active batch and parent journey;
7. latest owner result;
8. denominator or weighting change, when one occurred;
9. debt added or removed;
10. next authorized batch.

Reports must not present percentage as release readiness.

## 10. Update procedure

At batch completion:

1. migrate and classify the audit rows relevant to the batch;
2. map completed child slices to parent journeys without double counting;
3. award product credit only for actual user or required system outcomes;
4. update evidence confidence from new original, real-data, browser, restart, failure, or security evidence;
5. record debt change and release state;
6. update `PROJECT_STATE.json` once;
7. do not recalculate repeatedly during the same batch.

A model or documentation change cannot create product progress.
