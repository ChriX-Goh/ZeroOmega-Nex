# Milestone 8 Session 7 Checkpoint

**Recorded:** 2026-07-29  
**Audited branch:** `feat/m8-profile-workflow`  
**Initial audited Head:** `ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb`  
**Integrated product Head:** `8c0d4ce735d0f59cec80442667442a8160dfc182`  
**Current reconciliation Head before final automation:** `851e88816805ed1bc3b118e3b9480bf56030e6e8`  
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

### Governance drift found and parity accounting reconciled

- `scripts/validate-parity-docs.mjs` now parses the Nex-status column relative to the classification column instead of counting status-like text across translation and evidence columns.
- The validator no longer requires `PARTIAL`, `MISSING`, or `UNVERIFIED` rows to remain non-zero. A fully closed matrix is now representable.
- `UI_AUDIT_MATRIX.md` now reports zero `BROKEN`, `MISSING`, and `UNVERIFIED` rows while preserving genuine open work.
- The reconciled matrix retains six `MUST_MATCH` gaps: target-dependent PAC-disable wiring, Rename-dialog parity, protocol capability matrix, Switch condition-type matrix, Switch condition-field matrix, and unified four-type browser creation E2E.
- It also retains one `UNCERTAIN` FTP capability row and two non-blocking `REFERENCE` visual rows.

### Real proxy traversal and authentication

Integration run `30414496421`, rerun job `90458570753`, passed every step and committed product Head `8c0d4ce735d0f59cec80442667442a8160dfc182`.

The verified path now proves:

- an unresolvable sentinel target can succeed only through the controlled proxy;
- Chromium receives a genuine Basic 407, grants `webRequestAuthProvider` plus HTTP(S) origins, supplies the background-owned credential, and succeeds on retry;
- Firefox receives the same genuine 407, grants `webRequestBlocking` plus HTTP(S) origins inside the original Apply user gesture, supplies the credential, and succeeds on retry;
- Firefox no longer awaits `permissions.contains` before `permissions.request`, because that preliminary asynchronous boundary consumed user activation;
- secret storage diagnostics redact `/secret/` entries;
- the authenticated route returns to Direct before the broad authentication permission is removed, preserving normal exit behavior and later fine-grained origin-permission tests.

The integration passed repository verification, Chromium E2E, Firefox E2E, evidence upload, product commit, and nine-patch cleanup.

### Control-plane reconciliation and cleanup

- `MILESTONE_8_STATUS.md` was replaced with a concise current authority that records the integrated product Head, 407 evidence, honest open rows, and release gates.
- `MILESTONE_8_RELEASE_CANDIDATE.md` now explicitly declares that no current installable candidate exists and retires all obsolete artifact pointers.
- The stale one-off `Integrate real proxy 407` workflow was removed after its successful product commit.
- The obsolete `allow-zero-broken-parity-status.py` patch was removed.
- PR #11 remains Draft and must be synchronized to the reconciliation Head after exact automation.

## Direction and scope assessment

No major product or architectural drift was found. Milestone 8 still rebuilds the familiar ZeroOmega v3.5.0 interface and workflow on top of typed ProfileSpec, deterministic PAC, immutable snapshots, and atomic browser adapters.

The following partially pulled-forward Milestone 9 capabilities remain justified dependencies rather than a new direction:

- bounded Rule Source and PAC downloads,
- scheduled refresh and retained-cache failure behavior,
- optional-origin permission boundaries,
- bounded session-only request diagnostics.

No further Milestone 9 expansion should occur before Milestone 8 closes.

## Current progress model

| Area                                                             |   Weight | Completion | Weighted result |
| ---------------------------------------------------------------- | -------: | ---------: | --------------: |
| Milestones 0–7 foundation and engines                            |      35% |       100% |           35.0% |
| Milestone 8 product and original-compatible workflow             |      45% |        98% |           44.1% |
| Real-environment, documentation, owner-QC, and candidate closure |      20% |        84% |           16.8% |
| **Total**                                                        | **100%** |            |       **95.9%** |

Rounded progress toward the first stable replacement release is **96%**. Pure implementation is approximately 98%. Formal closure remains lower because six canonical `MUST_MATCH` rows, exact reconciliation automation, one consolidated candidate, and repository-owner visual/real-backup acceptance are still release gates.

## Ordered next actions

1. Run exact-Head CI, Browser E2E, Parity Documentation, and Visual Evidence from the human-authored reconciliation Head.
2. Close or explicitly scope the six remaining `MUST_MATCH` rows without diluting acceptance criteria.
3. Update PR #11 to the exact verified reconciliation Head and run IDs.
4. Produce one consolidated candidate with a fresh artifact digest and owner-QC checklist.
5. Require repository-owner visual review, real complex-backup acceptance, authenticated-route acceptance, restart recovery, and final browser checks before PR #11 leaves Draft.

## Session 7 acceptance boundary

Session 7 must not declare a replacement candidate merely because automation is green. A valid closure requires all of the following:

- corrected canonical documentation and status accounting,
- proven real proxy traversal and authentication behavior,
- clean exact-Head CI, Chromium/Firefox E2E, parity documentation, and visual evidence,
- removal of temporary integration machinery,
- repository-owner acceptance of the consolidated visual artifact and a real complex backup.
