# MIG-01.6 Negative Corpus and Failure-Preservation Matrix

Status: repository-controlled checkpoint. Product WIP remains `MIG-01`; this matrix does not replace
Corpus B and does not authorize owner retest or release.

## Contract

Every row below is fail-closed. A blocking failure must not silently reinterpret input, must not make
an unconfirmed candidate active, and must leave or restore the previous confirmed browser
configuration. When the failure occurs after a user Draft exists, the Draft is preserved for
inspection/retry unless the operation itself is an explicit discard/rollback action.

| Layer | Failure vector / machine result | Required invariant | Evidence |
| --- | --- | --- | --- |
| Parser | malformed JSON -> `decode.invalid-json` | no candidate, no active-state mutation | `packages/legacy-zeroomega/src/decode.test.ts`; `failure-preservation.test.ts` |
| Parser | invalid base64 / base64 JSON -> `decode.invalid-base64`, `decode.invalid-base64-json` | no candidate | decoder tests |
| Parser | unsupported schema -> `decode.unsupported-schema` | no candidate | decoder + invalid fixture harness |
| Parser | input bytes over bound -> `decode.input-too-large` | reject before mapping | `failure-preservation.test.ts` |
| Parser | JSON nodes over bound -> `decode.too-many-nodes` | reject before mapping | `failure-preservation.test.ts` |
| Parser | nesting over bound -> `decode.too-deep` | reject before mapping | `failure-preservation.test.ts` |
| Parser | string data over bound -> `decode.string-data-too-large` | reject before mapping | decoder implementation / CI |
| Parser | profiles over bound -> `decode.too-many-profiles` | reject before mapping | `failure-preservation.test.ts` |
| Parser | Switch rules over bound -> `decode.too-many-rules` | reject before mapping | `failure-preservation.test.ts` |
| Parser | cyclic object input -> `decode.cyclic-object` | no candidate | decoder + failure-preservation tests |
| Mapping | missing profile reference -> blocking report | no accepted candidate; browser workflow storage byte-for-byte unchanged during real Options analysis | invalid fixture harness + Chromium/Firefox large migration E2E |
| Mapping | profile-reference cycle | no candidate | invalid fixture harness / importer tests |
| Mapping | duplicate Profile identity / key-name shadow mismatch | no candidate | invalid fixtures + original-runtime duplicate-name provenance |
| Mapping | unknown profile / condition type | no candidate | invalid fixture harness / importer tests |
| Mapping | secret-like unknown metadata | reject rather than preserve unsafe opaque data | complex migration negative tests |
| Storage / transaction | initial workflow CAS conflict | browser activation never starts | `packages/profile-workflow/src/apply.test.ts` |
| Storage / transaction | post-activation commit conflict | browser rolls back to previous Applied | `apply.test.ts` |
| Storage / transaction | rollback persistence / rollback failure | do not claim success; keep recovery-required state | `apply.test.ts`, `snapshot-rollback.test.ts` |
| Compilation / preflight | target-dependent URL wildcard cannot be safely compiled | Apply fails; previous browser state remains/restores; compatibility classification stays target-dependent | large-capacity diagnosis run `31155032522`; PAC/compiler tests |
| Preflight | unsafe top-level `file:` PAC | reject before authentication, runtime creation, or browser proxy mutation on Chromium and Firefox | `apps/extension/src/lib/profile-workflow-activation.test.ts` |
| Preflight | browser-only SOCKS credentials | reject before authentication or proxy mutation | `profile-workflow-activation.test.ts` |
| Authentication | permission/preparation failure | proxy state unchanged | `profile-workflow-activation.test.ts` |
| Install | PAC installation failure | authentication preparation rolls back; previous platform proxy restored by activation transaction | extension activation + browser-adapter activation tests |
| Confirm | installed PAC cannot be confirmed | rollback previous platform state/snapshot; failed candidate not promoted | `packages/browser-adapters/src/activation.test.ts` |
| Restart | adapter has interrupted pending activation | recover last-known-good snapshot or mark recovery failure precisely | browser-adapter restart recovery tests |
| Restart | workflow has persisted `pendingApply` (`activating`, `committing`, or `rollback-required`) | restart forcibly restores authoritative previous Applied, clears pending only after confirmed rollback, keeps Draft; failed rollback remains `rollback-required` | new `apply-recovery.test.ts` + dual-browser failure E2E run `31161871995` |
| Import analysis | blocking invalid `.bak` selected after a known-good active large profile | no Import & Use action; workflow storage exactly unchanged; confirmed PAC and real route decisions remain active | Chromium job `92813831446`; Firefox job `92813831428` |
| Export | invalid ProfileSpec / missing route reference | semantic export returns `ok:false`; input candidate remains byte/structure-equivalent to pre-call value | `packages/legacy-zeroomega/src/failure-preservation.test.ts` |
| Export security | ordinary export contains secret-backed proxy/PAC credentials or sensitive headers | secret values/references omitted, no usable credential leakage | exporter tests + C/D browser semantic-export evidence |

## Restart transaction recovery semantics

`pendingApply` is a durable two-phase marker. It cannot be treated as a harmless UI busy flag. A
browser/process exit can occur after the marker is persisted and before the transaction reaches its
normal commit/rollback path. On extension startup:

1. the browser-adapter runtime performs its existing snapshot recovery;
2. if workflow storage still contains `pendingApply`, Nex treats `state.applied` as the only
   authoritative confirmed configuration;
3. Nex invokes the same activation driver's rollback path for `state.applied` and its startup route;
4. only a successful browser rollback permits `pendingApply` to be cleared;
5. the user Draft is preserved;
6. `lastApply.stage = "recovery"` records the interrupted transaction as failed with
   `rollbackSucceeded = true`;
7. if the rollback fails, `pendingApply.phase` remains or becomes `rollback-required` and the product
   does not report recovery success.

This closes the stale-workflow-busy defect where adapter state could recover but the workflow layer
would remain permanently busy after a crash between Apply phases.

## Real dual-browser fault injection

Research run `31161871995` executes the failure vectors on top of the provenance-bound large
original-runtime migration state.

Chromium job `92813831446`:

- blocking `missing-reference.json` reports one rejected item;
- workflow storage is exactly equal before/after rejected analysis;
- real PAC route remains usable after the rejection;
- test then persists `pendingApply.phase = "committing"`, preserves a dirty Draft edit, and changes
  the platform proxy to Direct;
- after a full Chromium shutdown/relaunch with the same profile, generation advances from injected
  9 to recovered 10, the original Applied revision is unchanged, Draft survives, `pendingApply` is
  cleared, `lastApply.stage = "recovery"`, and `rollbackSucceeded = true`;
- real direct/proxy decisions pass again after recovery.

Firefox job `92813831428` performs the equivalent path on Firefox 152.0.6:

- blocking import storage non-mutation passes;
- platform proxy is intentionally changed to `proxyType = "none"`;
- generation advances from injected 5 to recovered 6 after complete browser restart;
- previous Applied revision and dirty Draft are preserved;
- pending transaction is cleared only after recovery; `lastApply.stage = "recovery"` and
  `rollbackSucceeded = true`;
- real route decisions pass after recovery.

The dual-browser-tested E2E scripts were committed on the disposable research branch by job
`92814130501`; research helpers are not product deliverables.

## Closure boundary

This MIG-01.6 repository-controlled milestone is considered closed when the clean product Head
contains the recovery implementation, exact negative machine-code/export-purity tests, the enhanced
permanent Chromium/Firefox large E2E, this matrix, and required canonical documentation, and that
exact Head receives the six permanent workflow successes.

Closure does **not** mean:

- Corpus B exists;
- every parser ceiling up to 16 MiB has been physically persisted in every browser;
- target-dependent URL wildcard behavior became exact;
- owner acceptance or release is allowed;
- `MIG-01` itself is complete.
