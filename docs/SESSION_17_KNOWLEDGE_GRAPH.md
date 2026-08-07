# Session 17 Knowledge Graph — MIG-01.6 Negative Corpus and Failure Preservation

This graph continues the single authorized product WIP, `MIG-01` real original-export migration.
Session 17 starts from the fully green large-capacity product Head
`d24002c6525c282c9a87bdbe98992b5541916dd0`. Product completion remains exactly `45.15%`
(reported `45%`), release remains `NO-GO`, PR #11 remains Draft, Corpus B remains an external owner-data
blocker, and owner retest remains prohibited. Popup/Options product work remains frozen.

## 1. Active graph

```text
ZeroOmega Nex
  -> MIG-01 real original-export golden path [only product WIP]
    -> Corpus A [complete]
    -> Corpus B [external blocker: sanitized owner representative backup absent]
    -> Corpus C [complete]
    -> Corpus D repository-controlled field matrix [complete]
    -> large original/runtime-produced representative capacity [complete]
    -> MIG-01.6 negative corpus + failure preservation [complete]
       -> parser fail-closed machine codes
       -> mapping blockers / no candidate
       -> storage / workflow CAS rollback
       -> compilation / preflight rejection
       -> authentication / installation / confirmation rollback
       -> interrupted Apply restart recovery [new defect fixed]
       -> real blocked-import browser non-mutation [new dual-browser evidence]
       -> semantic export failure purity
    -> MIG-01.7 semantic re-import + secret-leak consolidation [next]
```

## 2. Session-start authoritative state

The product branch was rechecked at
`d24002c6525c282c9a87bdbe98992b5541916dd0` with all six permanent workflows successful:

- CI `31157117120`;
- Browser E2E `31157117107`;
- Parity Documentation `31157117163`;
- Milestone 8 Visual Evidence `31157117135`;
- Original Nex UI Evidence `31157117115`;
- Original Toolbar Evidence `31157117134`.

The large original/runtime-produced capacity vector remains 222,565 bytes with SHA-256
`e0aacb5a7b1173942ddb8880036e0dc67bebacea454d35b6f70d587beffc4d51`, 36 profiles,
1,024 Switch rules, and 1,024 Rule List entries. Its successful storage/restart evidence remains
unchanged.

## 3. Existing negative/failure evidence recovered before new work

MIG-01.6 did not begin from zero. Existing repository evidence already covered:

- decoder malformed/base64/schema/resource/cycle failure paths;
- invalid fixtures for missing references, cycles, duplicate Profile identity, key/name mismatch,
  unknown profile/condition types, unsafe secret-like metadata, and other mapping blockers;
- workflow Apply initial CAS conflict, post-activation commit conflict, activation failure, rollback
  failure, and rollback-required state;
- browser-adapter preflight/install/confirmation rollback plus interrupted adapter activation restart
  recovery;
- extension activation rejection of unsafe top-level `file:` PAC on both targets before browser
  mutation;
- browser-only SOCKS credentials rejected before authentication/proxy mutation;
- authentication preparation failure leaves proxy state untouched;
- browser installation failure rolls authentication preparation back;
- ordinary semantic export strips secret-backed credentials and sensitive headers.

The missing high-severity workflow boundary was restart recovery for a _persisted workflow
`pendingApply`_.

## 4. Defect discovered: stale workflow pending Apply

`ProfileWorkflowState.pendingApply` is durable and can contain `activating`, `committing`, or
`rollback-required`. Workflow commands correctly reject a new operation while that field exists.
Before this session, extension startup restored the browser adapter's proxy snapshot but never
reconciled workflow-level `pendingApply`.

Therefore a process/browser exit after the workflow marker was persisted but before normal Apply
commit/rollback could produce this inconsistent state:

```text
browser proxy runtime recovered or otherwise usable
+ workflow pendingApply remains forever
= workspace permanently busy, new commands blocked
```

That violates MIG-01's hard requirement that every failure leave or restore the previous confirmed
active configuration and must not strand the user in a half transaction.

## 5. Implemented interrupted-Apply recovery

New `packages/profile-workflow/src/apply-recovery.ts` defines
`recoverInterruptedProfileWorkflowApply()`.

Recovery contract:

1. read the durable workflow state;
2. if no `pendingApply` exists, do nothing;
3. treat `state.applied` as the sole authoritative previous confirmed configuration;
4. invoke the normal activation driver's `rollback(state.applied, startupRoute)` path;
5. only after browser rollback succeeds, clear `pendingApply`;
6. preserve the user Draft exactly for inspection/retry;
7. increment workflow generation;
8. record a failed Apply history entry with `stage = "recovery"` and
   `rollbackSucceeded = true`;
9. if browser rollback fails, retain/convert the marker to `rollback-required`, record
   `rollbackSucceeded = false`, and never report successful recovery.

`ProfileWorkflowApplyRecord.stage` and browser-storage parsing now accept `recovery`. The extension
background reuses one workflow repository and, after the existing browser-adapter runtime restore,
invokes this recovery whenever startup sees `pendingApply`. Successful recovery refreshes Toolbar
state and skips ordinary startup-route activation because the rollback path already installed the
confirmed Applied configuration.

## 6. Core recovery evidence

Disposable research branch: `research/mig01-failure-preservation`.

First core run `31160935676` / job `92810861181` executed the new semantic tests successfully but
then hit an `exactOptionalPropertyTypes` result-shape error; no recovery assertion failed.

After omitting absent optional `state` fields correctly, run `31161089410` / job `92811352498`
completed SUCCESS:

- all 28 focused workflow/adapter tests passed;
- all three pending phases recover the previous Applied configuration;
- Draft survives recovery;
- pending is cleared only after rollback success;
- rollback failure remains `rollback-required`;
- no-pending startup is a no-op;
- `@zeroomega-nex/profile-workflow` TypeScript check passed;
- extension TypeScript check passed.

Tested recovery-core commit:
`0c0036a3a0680e24f6a603f62014f5923e05a518`.

## 7. Real blocked-import and interrupted-Apply browser proof

The provenance-bound large original migration E2E was extended rather than creating a separate
permanent micro-workflow. After the known-good large migration/restart/export/re-import state, both
browsers perform two negative paths.

### 7.1 Blocking invalid import

The real Options import entrypoint receives
`fixtures/zeroomega-v2/invalid/missing-reference.json`.

Assertions:

- compatibility analysis reports at least one rejected item;
- Import & Use is unavailable;
- the entire `zeroomega-nex/profile-workflow/v1*` storage namespace is structurally identical before
  and after analysis;
- the already confirmed PAC remains active;
- real direct/proxy route decisions continue to pass.

This is direct browser evidence for the hard criterion “import analysis does not mutate active
state”.

### 7.2 Interrupted Apply injection

The test then writes a valid but interrupted transaction directly into real extension storage:

- current Applied revision is retained as `previousAppliedRevisionId`;
- a user Draft edit changes the first profile name to `proxy-00 [interrupted draft]`;
- candidate gets a new revision;
- `pendingApply.phase = "committing"`;
- workflow generation is incremented;
- Chromium platform proxy is deliberately changed to Direct;
- Firefox platform proxy is deliberately changed to `proxyType = none`.

The entire browser is then closed and reopened with the same persistent profile.

Final research run `31161871995` completed SUCCESS:

- Chromium job `92813831446` SUCCESS;
- Firefox job `92813831428` SUCCESS, Firefox 152.0.6;
- dual-browser-tested-script commit job `92814130501` SUCCESS.

Chromium evidence:

- rejected import count: 1;
- injected generation 9 -> recovered generation 10;
- platform was intentionally Direct before shutdown;
- original Applied revision remains unchanged after restart;
- dirty Draft survives;
- `pendingApply` is gone;
- workspace is no longer busy;
- `lastApply.status = failed`, `stage = recovery`, `rollbackSucceeded = true`;
- real route decisions pass after recovery.

Firefox evidence:

- rejected import count: 1;
- injected generation 5 -> recovered generation 6;
- platform was intentionally `proxyType = none` before shutdown;
- original Applied revision and dirty Draft survive;
- pending is cleared only after recovery;
- `lastApply.stage = recovery`, `rollbackSucceeded = true`;
- real route decisions pass after recovery.

Research script artifacts:

- Chromium artifact `8987405930`, ZIP SHA-256
  `557a814c448d8878635a57ed16da7161e5457066188f72c43d74605215204832`;
- Firefox artifact `8987415306`, ZIP SHA-256
  `1392a960b9b4d3452ef94be89a24f16c0b0c1ba3fbd100d39e119411052713e5`.

The tested E2E scripts were committed on the disposable research branch at
`276009c9be12cd316b6485560127298fc432eb26`. Research workflows/patchers are not product files.

## 8. Parser/export negative contract strengthened

`packages/legacy-zeroomega/src/failure-preservation.test.ts` freezes exact fail-closed decoder codes
for:

- `decode.input-too-large`;
- `decode.too-many-nodes`;
- `decode.too-deep`;
- `decode.too-many-profiles`;
- `decode.too-many-rules`;
- `decode.cyclic-object`;
- `decode.invalid-json`;
- `decode.unsupported-schema`.

The same suite imports the official original default backup, deliberately corrupts a semantic
startup route, and proves ordinary export returns `ok:false` with
`profile-spec.profile.missing-startup-reference` while leaving the invalid input candidate
structurally unchanged.

## 9. Canonical matrix

`docs/MIG_01_FAILURE_PRESERVATION_MATRIX.md` is the audit map for parser, mapping, storage,
compilation/preflight, authentication, installation, confirmation, restart, import analysis, and
export. It binds each failure class to its machine result, preservation invariant, and executable
evidence rather than creating one permanent workflow per micro-state.

## 10. Clean product checkpoint

Productization did not merge the research branch. A new tree was created directly from the previous
fully green product Head `d24002c6525c282c9a87bdbe98992b5541916dd0` and copied only the 14
verified product/evidence files. The resulting product commit is
`2da0f442efedb1f8d483d6e12d22fcf1c2ad2d99`
(`fix: preserve confirmed state across migration failures`). Compare against the parent is exactly
`ahead_by=1`, `behind_by=0`, with no research workflow, patcher, or temporary candidate file.

All six permanent workflows on that exact product commit completed SUCCESS:

- CI `31163579186`, verify job `92819206043`: SUCCESS; browser-build artifact `8988087403`,
  SHA-256 `e4bdbc499566487e07bd38d68aa837e038d1864f3b58a134ea7c157aae451068`;
- Browser E2E `31163579021`: SUCCESS;
  - Chromium job `92819205924`: SUCCESS. Permanent log records rejected import count 1,
    interrupted generation 9 -> recovered 10, intentionally forced platform Direct, unchanged
    Applied revision, preserved dirty Draft, `lastApply.stage = recovery`,
    `rollbackSucceeded = true`, and successful real route decisions after recovery. Diagnostics
    artifact `8988100097`, SHA-256
    `28e6b03d7262b8a18a3507846ffd0232273a8cc7409576e8d8eccb835e447c55`;
  - Firefox job `92819205714`: SUCCESS on Firefox 152.0.6. Permanent log records rejected import
    count 1, interrupted generation 5 -> recovered 6, intentionally forced `proxyType = none`,
    unchanged Applied revision, preserved dirty Draft, `lastApply.stage = recovery`,
    `rollbackSucceeded = true`, and successful real route decisions after recovery. Diagnostics
    artifact `8988142402`, SHA-256
    `cd27c8585dce119bc8368ae3ed9f949fce7a7876dc6de9b5cc9353e9061828f9`;
  - Firefox policy-owned-popup and Chromium native-inspect jobs also SUCCESS;
- Parity Documentation `31163579037`: SUCCESS;
- Milestone 8 Visual Evidence `31163579155`: SUCCESS;
- Original Nex UI Evidence `31163579414`: SUCCESS;
- Original Toolbar Evidence `31163578670`: SUCCESS.

The enhanced failure-preservation path is therefore part of the ordinary permanent Chromium and
Firefox migration E2E, not research-only evidence.

## 11. Research cleanup

The disposable research branch was not merged. Its temporary core/browser workflows and patcher were
removed before productization, and the last finalizer workflow was removed afterward in cleanup
commit `786e050d84885a79a14896fdbbb437beede6b687`. The product branch never contained those helpers.

## 12. Closure/status and next handoff

The repository-controlled MIG-01.6 negative corpus + failure-preservation checkpoint is closed. The
closure covers fail-closed parser/mapping behavior, transactional storage/Apply rollback, preflight
and browser install/confirm recovery, adapter restart recovery, the newly fixed workflow-level
interrupted-Apply restart recovery, blocked-import active-state non-mutation, and semantic export
failure purity/security evidence.

Closing MIG-01.6 does **not** close MIG-01, does not fabricate or satisfy Corpus B, and does not imply
that every possible browser/storage failure mode outside the defined matrix has been exhausted.
Owner retest remains prohibited and release remains `NO-GO`.

The next highest-value repository-controlled direction is MIG-01.7: consolidate semantic
export/re-import invariants and secret-leak checks across the proven A/C/D/large paths, including
cross-browser semantic export equivalence, re-import idempotence, and artifact/log/UI/command secret
scans. Corpus B remains an external owner-data dependency and must not be fabricated.

Progress remains exactly `45.15%` (reported `45%`), release remains `NO-GO`, PR #11 remains Draft,
and owner retest remains prohibited.

## Session 18 implementation continuation — MIG-01.7B (2026-08-07)

- MIG-01.7A exact-head evidence is closed at `c0b23ee765db8b50d86fc8fa61ba105cd7c2a830`; parent MIG-01.7 remains the only product WIP.
- MIG-01.7B adds runtime-only sensitive original-backup sentinels to packaged Chromium/Firefox and a permanent downstream Actions-log/diagnostics scanner. It changes evidence only, not Popup/Options behavior.
- Closure rule: do not mark MIG-01.7B green until CI plus the permanent Browser E2E run on the final cleaned Head succeed, including both main browser jobs and `migration-secret-leak-gate`.
- Product progress remains 45.15%, Corpus B remains external, release remains NO-GO.
