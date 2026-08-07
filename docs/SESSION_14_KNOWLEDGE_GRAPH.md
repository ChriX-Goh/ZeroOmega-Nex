# Session 14 Knowledge Graph - Governance Reset and Migration Lock

This file records the current Session 14 project graph. Stable product rules live in
`PRODUCT_CONSTITUTION.md`. Current authorization lives in `PROJECT_STATE.json`.
GitHub PR metadata and checks remain authoritative for the moving exact Head.

## 1. Product identity and execution rules

ZeroOmega Nex is a modern successor rewrite of ZeroOmega v3.5.0.

Compatibility classes:

- `CONTRACT-EXACT`: data, semantics, routes, persistence, recovery and security.
- `UX-COMPATIBLE`: familiar tasks, terminology, defaults and resulting state.
- `MODERNIZED`: safer architecture, reliability, accessibility and performance.
- `LEGACY-DEFECT-REJECTED`: confirmed bugs, races, corruption and unsafe behavior.

Execution hierarchy:

```text
Objective
  -> Capability
    -> Journey
      -> Batch
        -> Task
          -> Acceptance
            -> Evidence
```

Binding rules:

- Product WIP is one parent batch.
- The only active product batch is `MIG-01`.
- Historical UI rows are evidence inventory, not the product contract.
- Permanent gates run on coherent exact Heads, not every micro-state.
- Owner review is reserved for complete journeys or irreducible decisions.
- Popup/Options refinement remains frozen unless it is an irreducible MIG-01 blocker.

## 2. Audited project state

- Product completion: `45.15%`, reported as `45%`.
- Evidence confidence: `43%-50%`.
- Release state: `NO-GO`.
- PR #11 remains open and Draft.
- Latest owner result: Firefox `FAIL`, dated 2026-08-02.
- Merge, release, candidate claims and owner retest remain prohibited.

The historical `47.9%` anchor was corrected by the GOV-01 reconciliation. Closing a child
migration slice strengthens evidence but does not automatically add weighted parent progress.

## 3. Completed governance batch

`GOV-01` is complete. It established one product identity, four compatibility classes,
product WIP=1, proportional evidence, stop/re-plan rules, machine-readable project state,
and the rule that internal engineering concepts do not become ordinary-user workflow.

## 4. Active product batch

The only active product batch remains `MIG-01` — real original migration and semantic round trip.

Parent journey:

```text
real original export
  -> direct import
  -> compatibility report
  -> acceptance transaction
  -> Apply and browser confirmation
  -> real route decisions
  -> persistent restart
  -> semantic schema-v2 export
  -> failure-state preservation
  -> Chromium and Firefox
```

Hard acceptance requirements:

- Preserve all representable required data.
- Permit no silent loss, reinterpretation or downgrade.
- Complete the full chain on Chromium and Firefox for required positive corpus.
- Preserve or restore the previous confirmed state on every injected failure.
- Require no mandatory manual reconstruction ritual.
- Leak no usable credentials, secrets or secret references.

## 5. Corpus A — official original fixture

Authoritative fixture:

`fixtures/zeroomega-v2/original-default-v3.5.0.bak`

It was produced by the pinned original ZeroOmega v3.5.0 runtime and has provenance.
Contractual semantics include:

- Fixed profile `proxy`, color `#99ccee`;
- HTTP fallback proxy `proxy.example.com:8080`;
- bypass `127.0.0.1`, `::1`, `localhost`;
- Switch profile `auto switch`, color `#99dd99`;
- `internal.example.com` -> Direct;
- `*.example.com` -> `proxy`;
- default route -> Direct;
- Quick Switch disabled with an empty route list;
- startup profile empty.

The disabled Quick Switch state is contractual. Route tests may temporarily enable the imported
Switch through public workflow commands, but must restore the imported state before export.

## 6. Backend migration oracle

`apps/extension/src/lib/original-default-migration.test.ts` proves analysis, acceptance, Apply,
schema-v2 export/re-import, activation-failure preservation, accepted-Draft retention after Apply
failure, and secret-store preservation. The ordinary UI still composes `accept-import` and `apply`
as two commands; no combined background migration command was introduced.

## 7. Corpus A packaged Chromium journey — complete

`scripts/e2e-chromium-original-migration.mjs` runs inside the existing Browser E2E Chromium job.
It proves ordinary Options import, identity/color/order/endpoint/bypass mapping, contractual Quick
Switch settings, public-workflow temporary activation, extension-controlled PAC, real Direct and
Proxy targets, persistent restart recovery, restoration of imported settings, schema-v2 semantic
export, secret-reference exclusion, and compatibility with the pre-existing Chromium regressions.

No independent permanent workflow was added.

## 8. Corpus A packaged Firefox journey — complete

`scripts/e2e-firefox-original-migration.mjs` runs before the existing Firefox regression suite in
`test:e2e:firefox` and now proves the Firefox equivalent of the complete official-fixture journey.

The first real Firefox run exposed a test-contract defect rather than an importer/PAC defect:
E2E Firefox is intentionally pinned to `zh-TW`, while the migration script searched exact `zh-CN`
labels. Commit `b7e461a5261bf3ab26e7a2f2714bdb0dee81a80d`
(`test: align Firefox migration locale with E2E build`) aligned only the test locale and labels;
no product/importer/PAC/Popup logic changed. Commit
`eda9999d888494879aabdc10e940e879933fc460` then applied repository-Prettier-only formatting.

Exact evidence checkpoint `eda9999d888494879aabdc10e940e879933fc460`:

- Browser E2E run `31139057915`: success;
- Firefox job `92744832113`: success;
- Firefox `Run Firefox extension E2E`: success;
- Firefox Toolbar Action, restart, attached Rule List, profile trace, external-control and renderer
  fallback regressions: success;
- Chromium job, Chromium native Inspect and Firefox policy-owned Popup jobs: success;
- CI run `31139057966`: success;
- Parity Documentation `31139057994`: success;
- Milestone 8 Visual Evidence `31139057920`: success;
- Original Nex UI Evidence `31139058042`: success;
- Original Toolbar Evidence `31139057924`: success.

The packaged Firefox journey proves:

- import through the supported Options surface;
- profile/settings mapping;
- temporary public-workflow activation of imported `auto switch`;
- confirmed Firefox PAC installation under extension control;
- real Direct and Proxy route decisions;
- persistent Firefox restart recovery;
- restoration of the original imported settings;
- semantic schema-v2 export with no secret references.

Therefore the official/default Corpus A migration chain is now green on both Chromium and Firefox.
This closes `MIG-01.3B` / the Corpus A dual-browser packaged slice. It does not close `MIG-01`.

## 9. Remaining MIG-01 debt

Required positive corpus still missing or incomplete:

- Corpus B: a sanitized owner daily-use backup. No repository evidence currently supplies it;
- Corpus C now has an original-runtime-produced fixture covering nested Switch -> Virtual -> Switch,
  Fixed proxy, original Rule List, Quick Switch/startup state and reference behavior. Its packaged
  Chromium/Firefox positive journey is exercised together with Corpus D-partial;
- Corpus D is partial: the same original-runtime fixture covers Unicode PacProfile names plus PAC
  URL/body and cache/update-shaped data, but the broader D matrix (including supported proxy-auth
  metadata, valid duplicate names and safe unknown fields) is not yet complete;
- large real exports for storage and persistent-restart capacity.

Compatibility/reliability debt still open:

- complete source-field classification into exact, target-dependent, downgraded, unsupported,
  rejected or safely opaque-preserved states;
- broader alias identity/color/order checks on original data;
- Virtual and target-dependent AutoDetect behavior;
- packaged parser/mapping/storage/compile/install/confirm/restart/export failure injection;
- complete two-browser failure-preservation matrix;
- final user wording for accepted import followed by Apply failure;
- full secret scan across export, PAC, logs, artifacts, command responses and rendered UI.

These gaps keep release state `NO-GO` and owner retest prohibited.

### MIG-01.5 Corpus C/D evidence added in Session 14

The complex fixture in `fixtures/zeroomega-v2/original-complex-corpus-cd-v3.5.0.bak` was produced
by the actual pinned `zero-peak/ZeroOmega@v3.5.0` runtime. Provenance records original-runtime
Actions run `31140177004`, job `92748222921`, artifact `8979514864`, source commit
`05cbb30a2204cc3bdf3bb2e65765a70644a022d7`, and backup SHA-256
`92aec2d8932b808cc8654787ca907aa935d6dda44b018b079be8e5c7cc7397f4`.

The first real importer -> export -> re-import semantic failure was not a PAC or Quick Switch
failure. The original Virtual profile explicitly contained `rules: []`, while the importer only
preserved non-empty Virtual rules. Commit `5ffe270371c41ab6f0d5a7615ea606d103a2d79c` preserves
field presence for an original array, including the contractual empty array. Original Rule List
`pacScript` remains intentionally excluded from semantic comparison because it is classified as a
generated artifact, not source data. CI run `31141670644` passed after this production fix.

The apparent packaged Quick Switch loss was isolated to the migration test helper: the helper
rewrote the imported complex settings to the Corpus A one-route test state before restart. Pure
import and real accept -> Apply regressions proved both original routes survived. The packaged C/D
journeys therefore activate the already-enabled imported complex state without rewriting it, keep
that state through restart, then activate the imported PAC and validate real routing before semantic
export. No production Quick Switch workaround was added.

Exact packaged Corpus C/D evidence checkpoint
`731c105d8c627a5c8e916ba0ff97adf107c15cd4`:

- Browser E2E run `31143806960`: success;
- Chromium job `92759027010`: success, with `Chromium original Corpus C/D import, route, restart,
and semantic export passed.`;
- Firefox job `92759026952`: success, with `Firefox original Corpus C/D import, route, restart, and
semantic export passed.`;
- Chromium native Inspect job `92759026987`: success;
- Firefox policy-owned Popup job `92759026998`: success;
- CI `31143807015`, Parity Documentation `31143807007`, Milestone 8 Visual Evidence `31143806972`,
  Original Nex UI Evidence `31143806983`, and Original Toolbar Evidence `31143807002`: success.

This closes the repository-controlled positive packaged slice for Corpus C/D-partial. It does not
make partial Corpus D complete, supply externally blocked Corpus B, close `MIG-01`, change audited
product completion, or authorize owner retest/release.

## 10. Exact next implementation target

Continue the existing contract at `MIG-01.5` — run Corpus B-D and close mapping, storage,
activation and browser gaps.

Corpus B is externally blocked until a sanitized owner representative export exists. That blocker
must not stall repository-controlled progress. The immediate executable work is therefore:

1. extend the source-field preservation matrix with the remaining Corpus D field classes;
2. generate provenance-bound original-runtime cases for the still-missing D shapes where feasible;
3. drive those cases through importer -> activation -> route/restart -> semantic export;
4. close the packaged parser/mapping/storage/compile/install/confirm/restart/export failure matrix
   without weakening state-preservation or secret-scan requirements;
5. keep Corpus B explicitly blocked rather than fabricating owner data.

Do not switch to Popup or Options refinement between these steps.

## 11. Frozen scope

During `MIG-01`, continue to freeze unrelated Popup/Options beautification, broad diagnostics,
scheduling/history/backup/remote-sync expansion, new Profile families, speculative optimization,
Rust/WASM and native-engine work.

## 12. Stop and re-plan rules

Stop and re-plan only when real data disproves the current ProfileSpec/importer architecture, data
would be silently lost or reinterpreted, a second unrelated parent journey becomes necessary, a
behavior cannot be classified, active state would mutate before confirmation, or two consecutive
cycles add no measurable migration/recovery/security evidence.

## 13. Progress effect and handoff

Current audited state remains:

- product completion: `45.15%`, reported as `45%`;
- evidence confidence: `43%-50%`;
- release state: `NO-GO`;
- PR state: Draft;
- owner retest: prohibited;
- active parent batch: `MIG-01`;
- phase: official/default and original-runtime Corpus C/D-partial packaged journeys green; Corpus B
  externally blocked and remaining D/failure matrix next.

Next work stays in `MIG-01.5` on remaining Corpus D field/failure evidence, not UI microstates.
