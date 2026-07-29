# Milestone 8 Session 7 Checkpoint

**Recorded:** 2026-07-29  
**Audited branch:** `feat/m8-profile-workflow`  
**Initial audited Head:** `ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb`  
**Latest integrated product Head:** `4233e45340ea0d1185e87270aa9c10cfcd2c7b6b`  
**Pull request:** #11, Draft  
**Initial estimated first replacement-release progress:** 94%  
**Current estimated first replacement-release progress:** 97%

## Purpose

This checkpoint records the verified Session 7 delta to `ORIGINAL_KNOWLEDGE_GRAPH.md`, `UI_AUDIT_MATRIX.md`, `MILESTONE_8_STATUS.md`, and PR #11. It does not replace the ZeroOmega v3.5.0 source baseline or the canonical acceptance matrix.

## Initial repository state

At initial audited Head `ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb`:

- CI run `30410949026` passed.
- Browser E2E run `30410949038` passed.
- Parity Documentation run `30410949016` passed.
- Milestone 8 Visual Evidence run `30410949036` passed.
- Real proxy challenge integration run `30410949018` failed during Chromium before Firefox executed.

The initial failure showed extension control and a PAC containing the expected proxy, but the sentinel target reached the origin directly: `directTargetCount: 1`, `targetUnauthorizedCount: 0`, and `targetAuthorizedCount: 0`. This exposed an invalid acceptance route rather than proving an authentication product defect.

## Governance drift found and corrected

- `scripts/validate-parity-docs.mjs` now parses the Nex-status column relative to the classification column instead of counting status-like text in unrelated columns.
- The validator no longer forces `PARTIAL`, `MISSING`, or `UNVERIFIED` rows to stay non-zero.
- The canonical matrix now honestly reports `DONE=119`, `PARTIAL=7`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.
- PR #11, status, candidate gate, matrix, knowledge graph, and this checkpoint are synchronized by exact product checkpoints rather than stale moving Heads.
- Obsolete candidate pointers and one-off integration machinery are removed after verified product commits.

## Session 7 completed product closures

### Real proxy traversal and authentication

Integration run `30414496421`, rerun job `90458570753`, committed product Head `8c0d4ce735d0f59cec80442667442a8160dfc182`.

The verified path proves:

- an unresolvable sentinel can succeed only through the controlled proxy;
- Chromium and Firefox receive a genuine Basic 407, acquire the correct permissions, supply background-owned credentials, and succeed on retry;
- Firefox permission acquisition stays inside the original Apply gesture;
- secret storage diagnostics redact `/secret/` entries;
- authenticated routes return to Direct before broad authentication permission removal.

### Unified four-type New Profile acceptance

Integration run `30416441326` committed product Head `febb7dcd8a5455bd31c499a88bf450039bc4a67b`.

- A separate fresh Chromium extension workspace creates Fixed, Switch, PAC, and Virtual through the real localized New Profile dialog.
- Every creation verifies the selected type, profile name, and type-specific editor.
- Typed Draft state contains all four exact kinds; Virtual points to the newly created Fixed profile.
- Normal Apply converges Draft and Applied state.
- J-04 is `DONE`.

### PAC browser-target capability acceptance

Integration run `30418355127` committed product Head `4233e45340ea0d1185e87270aa9c10cfcd2c7b6b`.

- A pure browser-target capability module accepts PAC creation only when writable `proxy.settings.get/set` is available.
- The original ZeroOmega unsupported branch is preserved: `proxy.register` or `proxy.registerProxyScript` disables PAC creation and shows the localized explanation.
- Unknown targets without writable `proxy.settings` fail closed.
- Unit tests cover current, original unsupported, and missing-settings targets.
- Component tests cover supported/unsupported metadata and localized rendering.
- Chromium injects `chrome.proxy.registerProxyScript` before Options loads, then verifies the PAC radio is disabled and the original-style warning is shown.
- Repository verification and complete Chromium E2E passed before commit; the temporary workflow and patch self-deleted.
- A-12 is `DONE`; release-blocking `MUST_MATCH` rows fall from five to four.

## Direction and scope assessment

No major product or architectural drift was found. Milestone 8 still rebuilds the familiar ZeroOmega v3.5.0 workflow on typed ProfileSpec, deterministic PAC, immutable snapshots, and atomic browser adapters.

The following partially pulled-forward Milestone 9 capabilities remain justified dependencies:

- bounded Rule Source and PAC downloads;
- scheduled refresh and retained-cache failure behavior;
- optional-origin permission boundaries;
- bounded session-only request diagnostics.

No further Milestone 9 expansion should occur before Milestone 8 closes.

## Current progress model

| Area                                                             |   Weight | Completion | Weighted result |
| ---------------------------------------------------------------- | -------: | ---------: | --------------: |
| Milestones 0–7 foundation and engines                            |      35% |       100% |           35.0% |
| Milestone 8 product and original-compatible workflow             |      45% |        99% |           44.6% |
| Real-environment, documentation, owner-QC, and candidate closure |      20% |        87% |           17.4% |
| **Total**                                                        | **100%** |            |       **97.0%** |

Rounded progress toward the first stable replacement release is **97%**. Pure engineering implementation is approximately 99%; formal closure remains lower because four canonical `MUST_MATCH` rows, one consolidated candidate, and repository-owner visual/real-backup acceptance remain release gates.

## Remaining canonical work

Four release-blocking `MUST_MATCH` rows remain:

1. B-03 — original-style Rename action/dialog parity or a justified source-backed decision.
2. C-09 — protocol/target capability matrix.
3. D-04 — Switch condition-type matrix acceptance.
4. D-05 — condition-specific fields and Draft/Apply browser acceptance.

C-05 remains `UNCERTAIN` for modern FTP behavior. A-14 and I-11 remain non-blocking visual `REFERENCE` rows.

## Ordered next actions

1. Establish a human-authored exact verification Head after the PAC capability product commit.
2. Require exact-Head CI, Browser E2E, Parity Documentation, and Visual Evidence to pass.
3. Implement and verify B-03 Rename parity.
4. Complete or explicitly scope C-09, D-04, and D-05 without weakening acceptance criteria.
5. Freeze one consolidated candidate with fresh artifact digest and owner-QC checklist.
6. Require repository-owner visual review, real complex-backup acceptance, authenticated-route acceptance, restart recovery, and final browser checks before PR #11 leaves Draft.

## Session 7 acceptance boundary

Automation alone does not declare a replacement candidate. A valid release requires corrected canonical documentation, proven real browser behavior, a clean exact human-authored Head, no temporary integration residue, and repository-owner acceptance of one consolidated visual artifact and a real complex backup.
