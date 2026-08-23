# GOV-01 Progress Reconciliation

## Purpose

This document closes the one-time transition from the historical single-score model to the three-track model defined in `PROJECT_PROGRESS_MODEL.md`.

The reconciliation evaluates the same repository state. It does not award progress for governance documents, compatibility reclassification, additional tests, or a new weighting model.

## Previous audited anchor

- Historical product score: 47.9%, reported as 48%.
- Historical confidence band: 43%–50%.
- Latest owner result: Firefox `FAIL`, 2026-08-02.
- Release status: no accepted candidate.

## New product-completion calculation

The conservative mapping uses the last audited parent-journey completion values and does not count bounded child slices twice.

- Real original migration and semantic round trip: 35% completion × 25% weight = 8.75 project points.
- Profile-family and routing semantics: 60% completion × 20% weight = 12.00 project points.
- Toolbar, Popup, and daily switching: 45% completion × 15% weight = 6.75 project points.
- Options, dialogs, CRUD, and Apply/Discard: 51% completion × 15% weight = 7.65 project points.
- Export, restart, rollback, ownership, authentication, reliability, and security: 52% completion × 15% weight = 7.80 project points.
- Localization, accessibility, and bounded visual alignment: 44% completion × 5% weight = 2.20 project points.
- Final packaging and owner acceptance: 0% completion × 5% weight = 0.00 project points.

Total product completion: **45.15%**, reported as **45%**.

Delta from the previous audited anchor: **−2.75 project points**, reported as **−3 points**.

## Why the score fell

The decrease is a methodology correction, not a code regression.

- Five project points are now explicitly reserved for final packaging and owner acceptance; the current repository has no accepted candidate and receives zero in that journey.
- Real migration, semantic routing, and reliability receive more weight than incidental visible detail.
- Existing Session 13 Popup child slices remain valid evidence but are not counted as an independent parent journey.
- Governance changes receive zero product points.

No denominator expansion was introduced. The required first-release outcome remains the same.

## Evidence confidence

Evidence confidence remains a provisional **43%–50% band**.

Confidence is not raised because:

- representative sanitized owner exports have not completed the full migration chain;
- several semantic and reliability claims still rely mainly on synthetic fixtures or disconnected journey evidence;
- the latest consolidated owner result remains `FAIL`.

Confidence may change during `MIG-01` as real-data, browser, restart, semantic export, and failure-injection evidence is added.

## Release state

Release state remains **`NO-GO`**.

- PR #11 remains Draft.
- No merge, release, candidate claim, or owner retest is authorized.
- Green automation cannot override the owner failure or incomplete parent journeys.

## Governance closure decision

`GOV-01` is complete when this reconciliation and the final governance sources are committed and their applicable checks pass.

Full row-by-row rewriting of the historical `UI_AUDIT_MATRIX.md` is not a precondition for product work. `UI_AUDIT_RECLASSIFICATION.md` immediately removes its authority as a product contract. Each product batch must migrate and classify the matrix rows relevant to its own parent journey before those rows can support acceptance or scoring.

This just-in-time migration prevents governance from becoming another unbounded evidence project while preserving traceability.

## Next authorized work

The active product batch becomes `MIG-01`:

`real original export -> direct import -> atomic activation -> real route decisions -> browser restart -> semantic re-export`

Product WIP remains one. Popup, Options, diagnostics, scheduling, history, backup, remote sync, new Profile families, Rust/WASM, and native-engine expansion remain frozen unless required to close the migration journey.
