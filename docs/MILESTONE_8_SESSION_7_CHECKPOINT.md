# Milestone 8 Session 7 Checkpoint

**Recorded:** 2026-07-29  
**Audited branch:** `feat/m8-profile-workflow`  
**Audited Head:** `ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb`  
**Pull request:** #11, Draft  
**Estimated first replacement-release progress:** 94%

## Purpose

This checkpoint reconciles repository reality before Session 7 continues. It is a delta to `ORIGINAL_KNOWLEDGE_GRAPH.md`, `UI_AUDIT_MATRIX.md`, `MILESTONE_8_STATUS.md`, and PR #11; it does not replace the original ZeroOmega v3.5.0 source baseline or the canonical acceptance matrix.

## Verified repository state

At audited Head `ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb`:

- CI run `30410949026` passed.
- Browser E2E run `30410949038` passed.
- Parity Documentation run `30410949016` passed.
- Milestone 8 Visual Evidence run `30410949036` passed.
- Real proxy challenge integration run `30410949018` failed during Chromium before Firefox executed.

The Chromium failure showed extension control and a PAC containing the expected proxy, but the sentinel target reached the origin directly: `directTargetCount: 1`, `targetUnauthorizedCount: 0`, and `targetAuthorizedCount: 0`. This does not yet prove a product authentication defect; it proves the current real-407 route is not a valid acceptance path until proxy traversal itself is established.

## Direction and scope assessment

No major product or architectural drift was found. Milestone 8 still rebuilds the familiar ZeroOmega v3.5.0 interface and workflow on top of the typed ProfileSpec, deterministic PAC, immutable snapshot, and atomic browser-adapter architecture.

The following partially pulled-forward Milestone 9 capabilities remain justified dependencies rather than a new direction:

- bounded Rule Source and PAC downloads,
- scheduled refresh and retained-cache failure behavior,
- optional-origin permission boundaries,
- bounded session-only request diagnostics.

No further Milestone 9 expansion should occur before Milestone 8 closes.

## Governance drift found

Repository execution advanced faster than the control documents:

1. PR #11 and `MILESTONE_8_STATUS.md` identify older stable Heads than the branch tip.
2. `UI_AUDIT_MATRIX.md` still marks consolidated visual evidence as missing and retains stale conclusion text for capabilities already completed or explicitly scoped.
3. `scripts/validate-parity-docs.mjs` counts every table column containing status-like words rather than the Nex-status column only.
4. The validator currently requires `PARTIAL`, `MISSING`, and `UNVERIFIED` rows to remain non-zero, which makes a genuinely closed matrix impossible.
5. Temporary 407 integration patches and workflow machinery remain on the product branch and require cleanup before a consolidated candidate.

This is control-plane drift, not evidence that the rebuilt product has abandoned the agreed direction.

## Progress model

The 94% estimate uses acceptance value rather than commit count:

| Area                                                             |   Weight | Completion | Weighted result |
| ---------------------------------------------------------------- | -------: | ---------: | --------------: |
| Milestones 0–7 foundation and engines                            |      35% |       100% |           35.0% |
| Milestone 8 product and original-compatible workflow             |      45% |        96% |           43.2% |
| Real-environment, documentation, owner-QC, and candidate closure |      20% |        78% |           15.6% |
| **Total**                                                        | **100%** |            |       **93.8%** |

Rounded project progress toward the first stable replacement release is **94%**. Pure implementation is approximately 96%; formal Milestone 8 closure remains lower because proxy challenge, document reconciliation, owner QC, and candidate freezing are release gates.

## Ordered execution plan

1. Repair parity status parsing and remove the artificial requirement to preserve unfinished rows.
2. Reconcile the matrix, Milestone 8 status, PR checkpoint, and release-candidate records against actual evidence.
3. Prove Chromium proxy traversal independently of authentication, then test Basic/Digest 407 handling.
4. Execute Firefox only after its proxy route is independently proven.
5. Remove temporary patches, integration-only workflows, obsolete candidate references, and generated diagnostic residue.
6. Produce one exact-Head consolidated candidate with fresh artifact digest and owner-QC checklist.
7. Require repository-owner visual review, real complex-backup acceptance, authenticated-route acceptance, restart recovery, and final browser checks before PR #11 leaves Draft.

## Session 7 acceptance boundary

Session 7 must not declare a replacement candidate merely because ordinary CI remains green. A valid closure requires all of the following:

- corrected canonical documentation and status accounting,
- proven real proxy traversal and authentication behavior or an explicit, source-backed capability decision,
- clean exact-Head CI, Chromium/Firefox E2E, parity documentation, and visual evidence,
- removal of temporary integration machinery,
- repository-owner acceptance of the consolidated visual artifact and a real complex backup.
