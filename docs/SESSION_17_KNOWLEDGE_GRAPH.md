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
    -> MIG-01.6 negative corpus + failure preservation [this session]
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

The missing high-severity workflow boundary was restart recovery for a *persisted workflow
`pendingApply`*.

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
`profile-spec.profile.missing-reference` while leaving the invalid input candidate structurally
unchanged.

## 9. Canonical matrix

`docs/MIG_01_FAILURE_PRESERVATION_MATRIX.md` is the audit map for parser, mapping, storage,
compilation/preflight, authentication, installation, confirmation, restart, import analysis, and
export. It binds each failure class to its machine result, preservation invariant, and executable
evidence rather than creating one permanent workflow per micro-state.

## 10. Productization boundary

The research branch must not be merged. Productization starts again from the authoritative clean
product Head `d24002c6525c282c9a87bdbe98992b5541916dd0` and copies only:

- recovery implementation/test and required workflow contracts/storage parser/export;
- background startup integration;
- final dual-browser-tested large E2E scripts;
- legacy failure-preservation test;
- failure matrix;
- batch/canonical evidence documentation and this graph.

No `research-*` workflow or research patcher belongs on the product branch.

## 11. Closure/status

MIG-01.6 is closed only after the clean product Head containing the above files receives all six
permanent workflow successes. Closing MIG-01.6 does not close MIG-01 and does not increase the
project percentage by itself.

After MIG-01.6 closure, the next repository-controlled direction is MIG-01.7 semantic export/re-import
and secret-leak consolidation. Corpus B remains an external dependency and must not be fabricated.

Progress remains exactly `45.15%` (reported `45%`), release remains `NO-GO`, PR #11 remains Draft,
and owner retest remains prohibited.
