# Milestone 8 Session 7 Checkpoint

**Recorded:** 2026-07-29  
**Audited branch:** `feat/m8-profile-workflow`  
**Initial audited Head:** `ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb`  
**Current integrated product Head:** `8c0d4ce735d0f59cec80442667442a8160dfc182`  
**Pull request:** #11, Draft  
**Initial estimated first replacement-release progress:** 94%  
**Current estimated first replacement-release progress:** 96%

## Purpose

This checkpoint reconciles repository reality during Session 7. It is a delta to `ORIGINAL_KNOWLEDGE_GRAPH.md`, `UI_AUDIT_MATRIX.md`, `MILESTONE_8_STATUS.md`, and PR #11; it does not replace the original ZeroOmega v3.5.0 source baseline or the canonical acceptance matrix.

## Initial repository state

At initial audited Head `ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb`:

- CI run `30410949026` passed.
- Browser E2E run `30410949038` passed.
- Parity Documentation run `30410949016` passed.
- Milestone 8 Visual Evidence run `30410949036` passed.
- Real proxy challenge integration run `30410949018` failed during Chromium before Firefox executed.

The Chromium failure showed extension control and a PAC containing the expected proxy, but the sentinel target reached the origin directly: `directTargetCount: 1`, `targetUnauthorizedCount: 0`, and `targetAuthorizedCount: 0`. That result did not prove a product authentication defect; it exposed an invalid acceptance route.

## Session 7 completed work

### Governance and parity accounting

- `scripts/validate-parity-docs.mjs` now parses the Nex-status column relative to the classification column instead of counting status-like text across translation and evidence columns.
- The validator no longer requires `PARTIAL`, `MISSING`, or `UNVERIFIED` rows to remain non-zero. A fully closed matrix is now representable.
- This checkpoint records the initial 94% estimate, the diagnosed governance drift, the completed 407 closure, and the current 96% estimate.

### Real proxy traversal and authentication

Integration run `30414496421`, rerun job `90458570753`, passed every step and committed product Head `8c0d4ce735d0f59cec80442667442a8160dfc182`.

The verified path now proves:

- an unresolvable sentinel target can succeed only through the controlled proxy;
- Chromium receives a genuine Basic 407, grants `webRequestAuthProvider` plus HTTP(S) origins, supplies the background-owned credential, and succeeds on retry;
- Firefox receives the same genuine 407, grants `webRequestBlocking` plus HTTP(S) origins inside the original Apply user gesture, supplies the credential, and succeeds on retry;
- Firefox no longer awaits `permissions.contains` before `permissions.request`, because that preliminary asynchronous boundary consumed user activation;
- secret storage diagnostics redact `/secret/` entries;
- the authenticated route returns to Direct before the broad authentication permission is removed, preserving normal exit behavior and the later fine-grained origin-permission tests.

The integration passed repository verification, Chromium E2E, Firefox E2E, evidence upload, product commit, and temporary-patch cleanup.

## Direction and scope assessment

No major product or architectural drift was found. Milestone 8 still rebuilds the familiar ZeroOmega v3.5.0 interface and workflow on top of typed ProfileSpec, deterministic PAC, immutable snapshots, and atomic browser adapters.

The following partially pulled-forward Milestone 9 capabilities remain justified dependencies rather than a new direction:

- bounded Rule Source and PAC downloads,
- scheduled refresh and retained-cache failure behavior,
- optional-origin permission boundaries,
- bounded session-only request diagnostics.

No further Milestone 9 expansion should occur before Milestone 8 closes.

## Governance drift found and disposition

Repository execution had advanced faster than the control documents:

1. PR #11 and `MILESTONE_8_STATUS.md` identified older stable Heads than the branch tip.
2. `UI_AUDIT_MATRIX.md` still marked consolidated visual evidence as missing and retained stale conclusion text.
3. The parity validator counted the wrong columns and artificially required unfinished rows.
4. Temporary 407 patches remained on the branch.

Session 7 has corrected the validator, closed the proxy data plane, and removed the nine integration patch files through the successful integration commit. The remaining control-plane work is to reconcile the matrix, status documents, PR body, and replacement-candidate record against Head `8c0d4ce735d0f59cec80442667442a8160dfc182` and the next exact human-authored checkpoint.

## Current progress model

| Area                                                             |   Weight | Completion | Weighted result |
| ---------------------------------------------------------------- | -------: | ---------: | --------------: |
| Milestones 0–7 foundation and engines                            |      35% |       100% |           35.0% |
| Milestone 8 product and original-compatible workflow             |      45% |        98% |           44.1% |
| Real-environment, documentation, owner-QC, and candidate closure |      20% |        84% |           16.8% |
| **Total**                                                        | **100%** |            |       **95.9%** |

Rounded progress toward the first stable replacement release is **96%**. Pure implementation is approximately 98%. Formal closure remains lower because canonical-document reconciliation, honest remaining parity rows, one consolidated candidate, and repository-owner visual/real-backup acceptance are still release gates.

## Ordered next actions

1. Reconcile `UI_AUDIT_MATRIX.md`, `MILESTONE_8_STATUS.md`, PR #11, and the release-candidate record.
2. Preserve genuine remaining gaps: Rename dialog parity, browser capability edges, Switch condition-matrix acceptance, and complete four-type browser creation evidence.
3. Run exact-Head CI, Browser E2E, Parity Documentation, and Visual Evidence from a human-authored reconciliation Head.
4. Remove any obsolete integration workflow or candidate references left after the product commit.
5. Produce one consolidated candidate with a fresh artifact digest and owner-QC checklist.
6. Require repository-owner visual review, real complex-backup acceptance, authenticated-route acceptance, restart recovery, and final browser checks before PR #11 leaves Draft.

## Session 7 acceptance boundary

Session 7 must not declare a replacement candidate merely because automation is green. A valid closure requires all of the following:

- corrected canonical documentation and status accounting,
- proven real proxy traversal and authentication behavior,
- clean exact-Head CI, Chromium/Firefox E2E, parity documentation, and visual evidence,
- removal of temporary integration machinery,
- repository-owner acceptance of the consolidated visual artifact and a real complex backup.
