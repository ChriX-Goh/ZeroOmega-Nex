# ZeroOmega Nex Project Progress Model

## 1. Purpose

Progress reporting separates three questions that were previously conflated:

1. **Product completion** — how much of the required user outcome actually works.
2. **Evidence confidence** — how strongly that completion is proven by original evidence, real data, deterministic tests, browsers, and failure injection.
3. **Release state** — whether an exact build may be presented to the repository owner or released.

Commit count, changed lines, test count, workflow count, green CI, screenshots, and documentation volume are not product completion.

## 2. Current audit anchor

Until `GOV-01` completes and one explicit tri-track recalculation is committed, the previous audited baseline remains unchanged:

- product completion anchor: **47.9%**, reported as **48%**;
- confidence band: **43%–50%**;
- release state: **NO-GO**;
- PR #11: Draft;
- latest owner result: Firefox `FAIL`, 2026-08-02;
- active governance batch: `GOV-01`;
- product progress change from governance work: **0 points**.

The old `52%`, `98%`, and Order 1 `80%` claims remain superseded.

## 3. Product journey weights after recalculation

The tri-track recalculation must use these weights unless a later owner-approved change records the reason:

- **Real original migration and semantic round trip: 25%.**
- **Profile-family and routing semantics: 20%.**
- **Toolbar, Popup, and daily switching: 15%.**
- **Options, dialogs, CRUD, and Apply/Discard: 15%.**
- **Export, restart, rollback, ownership, authentication, reliability, and security: 15%.**
- **Localization, accessibility, and bounded visual alignment: 5%.**
- **Final packaging and owner acceptance: 5%.**

Total: **100%**.

This weighting intentionally gives real migration, effective behavior, and recovery more value than incidental presentation details.

## 4. Product completion scoring

Product completion is measured by usable parent-journey outcomes.

A journey may gain gradual completion for verified implementation and real browser/data behavior. Owner acceptance is not allowed to erase all intermediate product completion, but release remains blocked until the applicable owner gate.

Recommended internal shares for each journey:

- contract and acceptance criteria defined: 10%;
- implementation exists: 35%;
- deterministic task/semantic tests pass: 20%;
- required real data or real browser journey passes: 25%;
- consolidated parent-journey decision: 10%.

For the final packaging journey, the last 5% remains unavailable until the exact candidate receives owner `PASS`.

A bounded slice may be complete while its parent remains partial. Slice completion must not be converted into parent completion without satisfying the parent criteria.

## 5. Evidence confidence

Evidence confidence is reported independently from product completion. It answers whether the completion estimate is trustworthy.

Confidence inputs include:

- original source/package/runtime anchors;
- representative official and sanitized real exports;
- explicit Original-to-Nex mappings;
- deterministic semantic or task vectors;
- Chromium evidence;
- Firefox evidence;
- restart and failure-injection evidence;
- secret and data-loss checks;
- owner result where applicable.

Synthetic fixtures alone cap confidence for a real migration claim. Nex-only screenshots cap confidence for an original-facing UX claim. Green unit tests cannot substitute for browser ownership, persistence, or recovery evidence.

Confidence may rise without product completion rising, and product completion may rise while confidence remains provisional. Both must be reported.

## 6. Release state

Only three release states are valid:

- `NO-GO` — no owner package, merge, candidate, or release claim is authorized.
- `GO-FOR-OWNER` — all required parent journeys and exact-Head gates are complete; one consolidated package may be tested.
- `OWNER-PASS` — the repository owner accepted the exact candidate.

Automation cannot override an owner `FAIL` or advance release state by itself.

## 7. Compatibility-aware scoring

- `CONTRACT-EXACT` work receives product credit only when user data, semantic result, persistence, or failure behavior is actually available.
- `UX-COMPATIBLE` work is scored by complete task success and familiar mental model, not DOM or pixel identity.
- `MODERNIZED` work receives product credit only when it improves a required journey or non-functional release requirement without changing the contract.
- `LEGACY-DEFECT-REJECTED` work receives credit when the defect is demonstrated, corrected, and compatibility impact is protected.

Independent micro-geometry, blur timing, and incidental DOM parity do not create product points unless they resolve a task, accessibility, recognition, overflow, or hit-target blocker.

## 8. Reporting requirements

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

## 9. Recalculation procedure

After `GOV-01`:

1. classify every active journey and audit row;
2. map completed bounded slices to parent journeys without double counting;
3. remove credit that represented only evidence volume or incidental exactness;
4. retain credit for working architecture that produces real required outcomes;
5. score the same repository state under the new weights;
6. publish old 47.9% and the new number side by side with a reconciliation table;
7. update `PROJECT_STATE.json` once;
8. do not repeatedly recalculate during the same product batch.

No increase is permitted merely because the model changed.
