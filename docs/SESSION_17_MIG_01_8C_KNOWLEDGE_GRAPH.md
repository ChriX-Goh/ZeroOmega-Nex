# Session 17 MIG-01.8C Knowledge Graph — Owner Handoff Failure-Surface Hardening

This graph continues the single authorized product WIP, `MIG-01` real original-export migration.
`MIG-01.8C` is repository-controlled security/readiness work only. It does not provide Corpus B,
does not close the parent batch, and does not change product completion.

## 1. Authoritative starting state

The continuation started from final `MIG-01.8B` Head
`e286fb17c7b92e1db371f4805a4ce7787326a2bd`.

At that exact Head:

- PR #11 was open, Draft, unmerged, and mergeable;
- CI `31197715431`: SUCCESS;
- Browser E2E `31197714807`: SUCCESS;
- Parity Documentation `31197714512`: SUCCESS;
- Milestone 8 Visual Evidence `31197714372`: SUCCESS;
- Original Nex UI Evidence `31197714273`: SUCCESS;
- Original Toolbar Evidence `31197714940`: SUCCESS;
- Chromium `92929940148`, Firefox `92929939885`, and downstream
  `migration-secret-leak-gate` `92930941936`: SUCCESS;
- Browser leak scanner: no controlled sentinel across 15 diagnostics files and 2 browser job logs;
- Chromium diagnostics artifact `9001558129`, SHA-256
  `a4d1ae5f214398aa568ae68e2ff9b7a22acc8721a4f4e33e3f58f4e74e36b06c`;
- Firefox diagnostics artifact `9001620664`, SHA-256
  `6e990846e227fd25e66fb54e3f23a4544826a99aa5bfbe27efb23c7a24793c02`;
- product completion: `45.15%` -> reported `45%`;
- evidence confidence band: `43%`–`50%`;
- release: `NO-GO`;
- latest owner result: Firefox FAIL, 2026-08-02;
- owner micro-slice retest: prohibited;
- only product WIP: parent `MIG-01`;
- Corpus B: external blocker, real owner representative `.bak` absent.

File Library was searched semantically and by recent-upload navigation at the start of this
continuation. No real Owner ZeroOmega `.bak` was present. Repository fixtures and reports therefore
remain ineligible as Corpus B substitutes.

## 2. Existing owner handoff before 8C

`MIG-01.8A` already provided:

```text
raw owner .bak outside repository
  -> inspect
  -> structure-only manifest
  -> separately sanitized owner .bak
  -> verify structural equivalence + safety
```

`MIG-01.8B` already provided:

```text
verified sanitized owner .bak
  -> existing importZeroOmegaBackup
  -> safe aggregate report
  -> blocked exit 2
  -> review-required exit 3
  -> ready-for-browser-chain exit 0
```

The JSON report intentionally excludes profile names, hosts, URLs, condition values, PAC/Rule List
source, issue messages/source paths, credentials, secret values, and raw backup content.

## 3. Newly discovered failure-surface gap

The safe report was not the entire public surface.

Before 8C:

- `owner-corpus-b-intake.mjs` printed arbitrary caught `Error.message` values;
- `owner-corpus-b-preflight.mjs` also printed arbitrary caught `Error.message` values;
- Node filesystem errors can embed absolute local file paths in those messages;
- the preflight wrapper spawned its internal Vitest runner with `stdio: 'inherit'`;
- a runner-side read/write failure could therefore print candidate, manifest, or report paths before
  the wrapper converted the failure to a safe machine state.

This meant a real owner handoff could keep raw configuration values out of the JSON report yet still
leak owner-local filesystem identifiers through stderr/CI logs on an infrastructure failure.

This is a direct Corpus-B security boundary and therefore higher value than unrelated UI or a
speculative generic browser harness.

## 4. MIG-01.8C scope

8C is deliberately narrow:

1. preserve actionable static domain validation failures;
2. prevent unexpected filesystem/process errors from echoing local paths;
3. prevent internal runner stdout/stderr from reaching the public wrapper;
4. freeze both properties with permanent black-box tests;
5. change no importer, extension runtime, ProfileSpec, routing behavior, Popup, or Options code.

## 5. Implementation

### Intake CLI

`scripts/owner-corpus-b-intake.mjs` now:

- uses exported `CorpusBIntakeError` for known domain failures;
- maps unknown errors to a static generic message that explicitly exposes no local path details;
- replaces assertion-generated aggregate-metric failures with a static domain error using
  `isDeepStrictEqual`;
- still preserves the existing structure/safety validation contract.

### Preflight wrapper

`scripts/owner-corpus-b-preflight.mjs` now:

- uses `CorpusBPreflightError` for known wrapper failures;
- preserves known `CorpusBIntakeError` domain messages;
- maps unknown filesystem/process failures to a static no-local-path message;
- runs the dedicated child preflight with stdin/stdout/stderr ignored rather than inherited;
- reports runner failure only through a static exit-code message;
- does not echo an unknown decision value.

No change was made to `owner-corpus-b-preflight-core.ts` or `importZeroOmegaBackup`.

## 6. New permanent black-box evidence

`packages/legacy-zeroomega/src/owner-corpus-b-intake.test.ts` adds:

- `does not expose a missing raw owner path in failure output`;
- sentinel: `OWNER_PRIVATE_RAW_PATH_SECRET`;
- the command must fail with the generic safe message;
- stderr must not contain the sentinel or full raw path.

`scripts/owner-corpus-b-preflight.test.ts` adds:

- `suppresses internal runner paths from public failure output`;
- an existing directory is deliberately passed as the report path so runner `writeFile` fails;
- sentinel: `OWNER_PRIVATE_REPORT_PATH_SECRET`;
- public wrapper must exit 1 with the static runner-failure message;
- stderr must not contain the sentinel, report path, or candidate path.

## 7. Focused and full verification

Temporary self-cleaning verifier:

- run `31199092414`;
- job `92934450626`;
- conclusion: SUCCESS.

The verifier applied the patch, ran repository-locked Prettier, deleted both temporary helper paths,
ran `git diff --check`, then executed focused and full verification. Only after all checks passed did
it commit the clean tree.

Focused owner-handoff suite:

- 2/2 test files PASS;
- 12/12 tests PASS;
- intake CLI: 8 tests;
- preflight: 4 tests;
- both new path-suppression tests PASS.

Full `pnpm verify` on the same clean working tree:

- architecture guard: PASS;
- UI compatibility and Popup source contract: PASS;
- parity docs: PASS;
- localization: PASS;
- ESLint: PASS;
- Prettier: PASS;
- all package TypeScript checks: PASS;
- Svelte check: 0 errors / 0 warnings;
- root Vitest: **118/118 files, 591/591 tests PASS**;
- component Vitest: **25/25 tests PASS**;
- Chromium build: PASS;
- Firefox build: PASS;
- manifest inspection: PASS;
- CSP audit: PASS;
- staging/archive: PASS.

## 8. Clean code tree

The self-cleaning verifier produced bot commit
`97dc79611d97b91707864344c5634424580f5255`, tree
`cd34189dc3fabb0e877f5fc107253052e5af14a4`.

The temporary paths are absent from that clean tree:

- `.github/scripts/mig-01-8c-patch.mjs`: absent;
- `.github/workflows/mig-01-8c-hardening-temp.yml`: absent.

Net code/test scope from the 8B final Head is limited to:

- `scripts/owner-corpus-b-intake.mjs`;
- `scripts/owner-corpus-b-preflight.mjs`;
- `packages/legacy-zeroomega/src/owner-corpus-b-intake.test.ts`;
- `scripts/owner-corpus-b-preflight.test.ts`.

No Popup/Options or extension runtime file is part of the 8C implementation.

## 9. Current dependency graph

```text
ZeroOmega Nex
  -> MIG-01 real original-export golden path [only product WIP]
    -> Corpus A [complete]
    -> Corpus C [complete]
    -> Corpus D [complete]
    -> large original-runtime representative [complete]
    -> MIG-01.6 failure preservation [complete]
    -> MIG-01.7 semantic/idempotence/secret surface [complete]
    -> MIG-01.8A owner intake readiness [complete]
    -> MIG-01.8B real-importer safe preflight readiness [complete]
    -> MIG-01.8C owner handoff failure-surface hardening [implemented]
       -> known validation messages remain static/actionable
       -> unknown filesystem/process errors suppress local paths
       -> internal runner output not inherited
       -> permanent black-box path sentinels
    -> Corpus B [external blocker: real owner representative .bak absent]
    -> MIG-01.8 final browser acceptance/closure [blocked on Corpus B]
```

## 10. Progress and release effect

8C closes repository-controlled security/readiness debt; it does not prove any additional owner
configuration compatibility.

Therefore:

- product completion remains exactly `45.15%`;
- reported progress remains `45%`;
- release remains `NO-GO`;
- PR #11 remains Draft/open/unmerged;
- owner micro-slice retest remains prohibited;
- product WIP remains exactly one parent batch, `MIG-01`.

## 11. Authorized next handoff

No additional synthetic or generic owner-browser work is authorized while Corpus B remains absent.

When the real Owner ZeroOmega v3.5.0 export exists:

1. keep raw `.bak` outside the repository;
2. run `owner-corpus-b-intake.mjs inspect`;
3. create a separately sanitized copy without changing behavior-bearing topology;
4. run `owner-corpus-b-intake.mjs verify`;
5. run `owner-corpus-b-preflight.mjs`;
6. exit 2 -> repair only the real rejected/downgraded migration layer exposed by Corpus B;
7. exit 3 -> resolve only the real target-dependent items with explicit Chromium/Firefox evidence;
8. exit 0 -> derive the minimum B-specific/data-driven browser route oracle from the actual
   sanitized topology;
9. run Chromium + Firefox direct import -> inactive validation -> atomic activation -> real route ->
   restart -> semantic export/re-import -> failure preservation -> secret-surface chain;
10. only if all positive corpora and hard batch criteria pass, perform final MIG-01.8/MIG-01 closure,
    progress/confidence/debt reconciliation, and exact-head gates.

Until the real owner backup exists, the correct remaining blocker is the external Corpus B input,
not Popup/Options or more speculative repository scaffolding.
