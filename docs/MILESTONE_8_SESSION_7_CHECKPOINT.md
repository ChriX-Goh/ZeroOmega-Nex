# Milestone 8 Session 7 Checkpoint

**Recorded:** 2026-07-29  
**Audited branch:** `feat/m8-profile-workflow`  
**Initial audited Head:** `ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb`  
**Integrated product Head:** `febb7dcd8a5455bd31c499a88bf450039bc4a67b`  
**Exact verified Head:** `a168d78fe53b6cbd4cae92d15ccb2366e90cb4f4`  
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

## Governance drift found and corrected

- `scripts/validate-parity-docs.mjs` now parses the Nex-status column relative to the classification column instead of counting status-like text across translation and evidence columns.
- The validator no longer requires `PARTIAL`, `MISSING`, or `UNVERIFIED` rows to remain non-zero. A fully closed matrix is now representable.
- `UI_AUDIT_MATRIX.md` reports zero `BROKEN`, `MISSING`, and `UNVERIFIED` rows while preserving genuine open work.
- PR #11, the status document, candidate gate, matrix, and this checkpoint are being synchronized to the exact verified state rather than older moving Heads.
- Obsolete candidate pointers, the one-off proxy integration workflow, the old parity patch, and temporary four-profile integration machinery were removed.

## Real proxy traversal and authentication

Integration run `30414496421`, rerun job `90458570753`, passed every step and committed product Head `8c0d4ce735d0f59cec80442667442a8160dfc182`.

The verified path proves:

- an unresolvable sentinel target can succeed only through the controlled proxy;
- Chromium receives a genuine Basic 407, grants `webRequestAuthProvider` plus HTTP(S) origins, supplies the background-owned credential, and succeeds on retry;
- Firefox receives the same genuine 407, grants `webRequestBlocking` plus HTTP(S) origins inside the original Apply user gesture, supplies the credential, and succeeds on retry;
- Firefox no longer awaits `permissions.contains` before `permissions.request`, because that preliminary asynchronous boundary consumed user activation;
- secret storage diagnostics redact `/secret/` entries;
- the authenticated route returns to Direct before broad authentication permission removal, preserving normal exit behavior and later fine-grained origin-permission tests.

## Unified four-type New Profile browser acceptance

Integration run `30416441326` passed repository verification and complete Chromium E2E, then committed product Head `febb7dcd8a5455bd31c499a88bf450039bc4a67b` and removed its temporary workflow and patch.

- Chromium opens a separate fresh extension profile with no imported fixture state.
- The real New Profile dialog creates `Created Fixed`, `Created Switch`, `Created PAC`, and `Created Virtual` in sequence.
- Each creation selects the requested radio kind, closes the dialog, selects the new profile, and renders its type-specific editor.
- The Virtual profile targets the newly created Fixed profile; typed Draft state contains the four exact kinds and reference.
- The complete Draft commits through the normal Apply transaction and converges with Applied state.
- J-04 is `DONE`; release-blocking `MUST_MATCH` rows fell from six to five.

## Exact verified checkpoint

At human-authored Head `a168d78fe53b6cbd4cae92d15ccb2366e90cb4f4`:

- CI `30416573442` passed.
- Browser E2E `30416573430` passed Chromium, Firefox, and headed native Chromium Inspect.
- Parity Documentation `30416573424` passed 126 rows: `DONE=118`, `PARTIAL=8`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.
- Visual Evidence `30416573395` passed all 24 locale/theme captures.
- Build artifact ID `8710375259`, digest `sha256:a61770c9e6e1860e8acb5692282984bf72257713b06c85b1abd95b45f5c0b34c`.
- Visual artifact ID `8710369376`, digest `sha256:67a660e2ee1421590759e310347a5a17a34065a2446042570b5d8e5bb61743c6`.

These artifacts remain verification evidence, not a consolidated owner-QC candidate.

## Direction and scope assessment

No major product or architectural drift was found. Milestone 8 still rebuilds the familiar ZeroOmega v3.5.0 interface and workflow on top of typed ProfileSpec, deterministic PAC, immutable snapshots, and atomic browser adapters.

The following partially pulled-forward Milestone 9 capabilities remain justified dependencies rather than a new direction:

- bounded Rule Source and PAC downloads;
- scheduled refresh and retained-cache failure behavior;
- optional-origin permission boundaries;
- bounded session-only request diagnostics.

No further Milestone 9 expansion should occur before Milestone 8 closes.

## Current progress model

| Area                                                             |   Weight | Completion | Weighted result |
| ---------------------------------------------------------------- | -------: | ---------: | --------------: |
| Milestones 0–7 foundation and engines                            |      35% |       100% |           35.0% |
| Milestone 8 product and original-compatible workflow             |      45% |        98% |           44.1% |
| Real-environment, documentation, owner-QC, and candidate closure |      20% |        84% |           16.8% |
| **Total**                                                        | **100%** |            |       **95.9%** |

Rounded progress toward the first stable replacement release is **96%**. Pure implementation is approximately 98%. Formal closure remains lower because five canonical `MUST_MATCH` rows, one consolidated candidate, and repository-owner visual/real-backup acceptance remain release gates.

## Remaining canonical work

Five release-blocking `MUST_MATCH` rows remain:

1. A-12 — target-dependent PAC unsupported state in New Profile.
2. B-03 — original-style Rename action/dialog parity or a justified decision.
3. C-09 — protocol/target capability matrix.
4. D-04 — Switch condition-type matrix acceptance.
5. D-05 — condition-specific fields and Draft/Apply browser acceptance.

C-05 remains `UNCERTAIN` for modern FTP behavior. A-14 and I-11 remain non-blocking visual `REFERENCE` rows.

## Ordered next actions

1. Close A-12 with a real target capability signal and browser proof.
2. Close or explicitly scope B-03, C-09, D-04, and D-05 without diluting acceptance criteria.
3. Keep exact-Head CI, Browser E2E, Parity Documentation, and Visual Evidence green.
4. Produce one consolidated candidate with a fresh artifact digest and owner-QC checklist.
5. Require repository-owner visual review, real complex-backup acceptance, authenticated-route acceptance, restart recovery, and final browser checks before PR #11 leaves Draft.

## Session 7 acceptance boundary

Session 7 must not declare a replacement candidate merely because automation is green. A valid closure requires:

- corrected canonical documentation and status accounting;
- proven real proxy traversal and authentication behavior;
- all `MUST_MATCH` rows closed or explicitly scoped;
- clean exact-Head CI, Chromium/Firefox E2E, parity documentation, and visual evidence;
- removal of temporary integration machinery;
- repository-owner acceptance of the consolidated visual artifact and a real complex backup.
