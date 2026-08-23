# Session 17 MIG-01.8B Knowledge Graph — Owner Importer Preflight

This graph continues the single authorized product WIP, `MIG-01` real original-export migration.
`MIG-01.8B` is repository-controlled readiness work only. It does not provide Corpus B, does not
close the parent batch, and does not change product completion.

## 1. Session-start authoritative state

The continuation started from final `MIG-01.8A` Head
`9e540c16710908b6b3cc1dca128d873377e9066c`.

At that exact Head:

- CI `31191561012`: SUCCESS;
- Browser E2E `31191561172`: SUCCESS;
- Parity Documentation `31191561019`: SUCCESS;
- Milestone 8 Visual Evidence `31191560959`: SUCCESS;
- Original Nex UI Evidence `31191561478`: SUCCESS;
- Original Toolbar Evidence `31191561840`: SUCCESS;
- Chromium `92909358045`, Firefox `92909358821`, and downstream
  `migration-secret-leak-gate` `92910375448`: SUCCESS;
- product completion: `45.15%` -> reported `45%`;
- release: `NO-GO`;
- PR #11: Draft/open/unmerged;
- owner latest result: Firefox FAIL, 2026-08-02;
- owner retest: prohibited;
- only product WIP: parent `MIG-01`;
- Corpus B: external blocker, real sanitized representative owner `.bak` absent.

`MIG-01.8A` already supplied a fail-closed raw-inspect/sanitized-verify path. It intentionally did not
auto-sanitize or fabricate owner data.

## 2. Why MIG-01.8B was the next highest-value slice

The existing packaged original-migration E2E scripts are deliberately specific to Corpus A or C/D.
They hard-code known profile names, colors, route hosts, PAC/Rule List behavior, and expected route
oracles. Generalizing those assertions before a real Corpus B exists would guess the owner's actual
topology and defeat the purpose of a representative owner corpus.

However, once a sanitized owner `.bak` passes `MIG-01.8A`, the repository can already run its real
`importZeroOmegaBackup` implementation. The missing bridge was a safe, deterministic way to expose
that real importer's blockers without copying owner-private names, hosts, URLs, source paths, or
messages into a report.

Therefore `MIG-01.8B` was scoped as:

```text
external raw owner .bak
  -> MIG-01.8A inspect
  -> external structure-only manifest
  -> separately sanitized owner .bak
  -> MIG-01.8A verify
  -> MIG-01.8B real importer preflight
  -> safe aggregate machine report
     -> BLOCKED / REVIEW-REQUIRED / READY-FOR-BROWSER-CHAIN
```

It does not modify the importer and does not create a generic browser oracle.

## 3. Implemented files

### `scripts/owner-corpus-b-preflight-core.ts`

Uses the existing `packages/legacy-zeroomega` importer through the normal source entry point and a
fixed deterministic import context.

The report includes only:

- importer source/encoding;
- aggregate report counts;
- static issue machine code/status;
- issue scope and optional source-profile ordinal;
- candidate profile-kind/protocol/rule-source counts;
- startup-route kind and Quick Switch shape;
- secret-material count/kind;
- final preflight decision.

It intentionally omits:

- profile names;
- endpoint hosts;
- URLs;
- condition values;
- PAC/Rule List source;
- issue messages;
- source paths;
- credentials/secrets;
- raw backup content/hash.

### `scripts/owner-corpus-b-preflight.mjs`

Public Node wrapper. It re-runs the `MIG-01.8A` safety/structure verification, invokes the dedicated
repository runner, reads the safe report, and applies fail-closed process exit semantics.

### `scripts/owner-corpus-b-preflight.runner.mjs`

Runs only under the dedicated Vitest/Vite environment, re-verifies intake, calls the TypeScript core,
and writes the JSON report.

### `scripts/owner-corpus-b-preflight.vitest.config.ts`

Provides the minimal Node/Vite resolution environment needed to execute the existing TypeScript
workspace importer without adding `tsx`, generated JS copies, or a second implementation.

### `scripts/owner-corpus-b-preflight.test.ts`

Permanent black-box/integration evidence.

### `vitest.config.ts`

Root test discovery now includes `scripts/**/*.test.ts`, preventing the earlier `MIG-01.8A` class of
mistake where a script-side test file could exist without being part of the root suite.

No package dependency, extension runtime, Popup, Options, profile schema, browser adapter, migration
importer, or product behavior changed.

## 4. Safe decision contract

The preflight decision is intentionally stricter than “the importer returned a candidate”:

```text
import failure / rejected item / downgrade
  -> blocked
  -> readyForBrowserChain=false
  -> process exit 2

target-dependent item
  -> review-required
  -> readyForBrowserChain=false
  -> process exit 3

no rejected + no downgraded + no target-dependent
  -> ready-for-browser-chain
  -> readyForBrowserChain=true
  -> process exit 0

malformed/unknown execution state
  -> process exit 1
```

This prevents shell/CI automation from treating a target-dependent configuration as accepted merely
because the importer produced a candidate.

## 5. Real red gates and corrections

The implementation was not declared green from code inspection.

### 5.1 Root test discovery

`vitest.config.ts` previously included package/extension tests but not `scripts/**/*.test.ts`.
`MIG-01.8B` explicitly adds scripts-side test discovery, and later full-suite evidence proves the
preflight test is executed.

### 5.2 Formatting gate

Initial implementation Head `9025a98725b3ac9bdc319a595e86704d2aa11133` failed formal CI
`31194973155` at Prettier after lint passed. A manual formatting attempt at `44e1c372...` still failed
Prettier. Locked repository Prettier 3.8.3 was then used rather than guessing formatting.

### 5.3 Bot-push evidence trap

The temporary locked formatter produced clean bot commit
`eb9c852f13582e7ffc14405c34986529860645bf`, but PR workflows showed `action_required` rather than
executing. That commit was not treated as CI evidence. The same tree was re-committed by the project
identity to trigger the normal permanent gates.

### 5.4 Fail-open review-required defect

Intermediate clean Head `59692a61ac51be7b05802969063f22cb3843f95d` passed all six permanent
workflows, but code review found that the public wrapper returned exit 0 for `review-required` even
while the report said `readyForBrowserChain=false`.

That would allow a shell/CI caller to auto-advance a target-dependent owner configuration. The
wrapper was changed to return exit 3 for review-required and fail for unknown decisions.

### 5.5 Real importer behavior corrected the test oracle

The first focused run after adding exit 3 was not forced green. Temporary verifier run
`31196367245` / job `92925446564` produced 3 passes and 1 failure.

The failure proved that the C/D-derived owner-like sample itself legitimately produces
`review-required` from the real importer. The old smoke test expected exit 0, so the test oracle was
wrong. The new exit-3 behavior was correct.

The suite was reduced to three non-overlapping assertions rather than weakening the gate.

## 6. Focused and full repository evidence

Temporary focused verifier run `31196519081`, job `92925932840`, completed SUCCESS. The workflow
self-deleted only after all checks passed.

Focused preflight evidence:

- `scripts/owner-corpus-b-preflight.test.ts`: 1/1 file PASS;
- 3/3 tests PASS;
- real importer owner-like sample -> `review-required` with no private name/host/PAC path in report;
- missing private target -> `blocked` with no private target/name/host in report;
- public wrapper -> safe report + exit 3 for review-required.

The same job then completed full `pnpm verify`:

- architecture guard: PASS;
- UI compatibility guard: PASS;
- parity docs: PASS;
- localization: PASS;
- ESLint: PASS;
- Prettier: PASS;
- all package/type checks: PASS;
- root Vitest: **118/118 files, 589/589 tests PASS**;
- permanent root log explicitly includes `scripts/owner-corpus-b-preflight.test.ts (3 tests)`;
- component Vitest: **25/25 tests PASS**;
- Chromium build: PASS;
- Firefox build: PASS;
- manifest inspection: PASS;
- CSP audit: PASS;
- build staging/archive: PASS.

The temporary verifier was removed in the same successful job before its result was pushed. It is not
part of the clean product tree.

## 7. Clean code/evidence Head

The verified clean tree was re-emitted as normal project commit
`9d54074ef35ee4ce0bf8afaccb4588eddf072195` because GitHub does not use bot-pushed commits as normal
PR workflow evidence.

Relative to `MIG-01.8A` final Head `9e540c16710908b6b3cc1dca128d873377e9066c`, the clean code tree
contains only six net files:

- added `scripts/owner-corpus-b-preflight-core.ts`;
- added `scripts/owner-corpus-b-preflight.mjs`;
- added `scripts/owner-corpus-b-preflight.runner.mjs`;
- added `scripts/owner-corpus-b-preflight.test.ts`;
- added `scripts/owner-corpus-b-preflight.vitest.config.ts`;
- modified `vitest.config.ts` to discover scripts tests.

No temporary workflow remains in the tree.

Permanent evidence available before this state-sync commit:

- CI `31196832518`: SUCCESS;
- Browser E2E `31196831096`: SUCCESS;
- Parity Documentation `31196831805`: SUCCESS;
- Milestone 8 Visual Evidence `31196831069`: SUCCESS;
- Original Nex UI Evidence `31196831963`: SUCCESS;
- Chromium job `92926983784`: SUCCESS;
- Firefox job `92926983708`: SUCCESS;
- downstream `migration-secret-leak-gate` `92927933594`: SUCCESS;
- leak scanner: 15 diagnostics files + 2 browser job logs, no controlled sentinel;
- Chromium diagnostics artifact `9001189254`, SHA-256
  `b40da2b2855427f155991aaeaff28e88f58ada6b27b299c7a1fea910db5f99da`;
- Firefox diagnostics artifact `9001246138`, SHA-256
  `ab141831f04448475356f710b1192e425387fce5a86a94fc47ad2888ae034c41`.

The Original Toolbar run `31196832363` had not entered project evidence code when this state-sync
commit was prepared; it remained inside Playwright Chromium installation. It is not counted as a
success claim. The final state-sync Head must pass all six permanent workflows again.

## 8. Current graph after MIG-01.8B implementation

```text
ZeroOmega Nex
  -> MIG-01 real original-export golden path [only product WIP]
    -> Corpus A [complete]
    -> Corpus C [complete]
    -> Corpus D [complete]
    -> large original-runtime representative [complete]
    -> MIG-01.6 failure preservation [complete]
    -> MIG-01.7 semantic/idempotence/secret surface [complete]
    -> MIG-01.8A owner raw/sanitized intake readiness [complete]
    -> MIG-01.8B real-importer safe preflight readiness [implemented]
       -> intake verify again
       -> real importZeroOmegaBackup
       -> safe aggregate report
       -> exit 2 BLOCKED
       -> exit 3 REVIEW-REQUIRED
       -> exit 0 READY-FOR-BROWSER-CHAIN
    -> Corpus B [external blocker: real owner representative .bak absent]
    -> MIG-01.8 final browser acceptance/closure [blocked on Corpus B]
```

## 9. Closure boundary

`MIG-01.8B` does not make a synthetic corpus count as Corpus B and does not prove that an unknown
owner configuration imports successfully. Its value is that the first real owner candidate can now
fail at the correct layer and produce a safe machine report immediately.

No product-progress point is added. Product completion remains exactly `45.15%` (reported `45%`).
Release remains `NO-GO`; PR #11 remains Draft; owner micro-slice retest remains prohibited.

## 10. Next handoff

Do not genericize the browser migration E2E before a real Corpus B exists.

When the real owner export is available:

1. keep the raw `.bak` outside the repository;
2. run `owner-corpus-b-intake.mjs inspect`;
3. create a separately sanitized copy without changing behavior-bearing topology;
4. run `owner-corpus-b-intake.mjs verify`;
5. run `owner-corpus-b-preflight.mjs` and inspect only the safe report;
6. if exit 2, fix only the real rejected/downgraded migration layer exposed by Corpus B;
7. if exit 3, resolve only the real target-dependent items with explicit target/platform evidence;
8. only on exit 0, derive the minimum Corpus-B-specific/data-driven route oracle from the actual
   sanitized topology;
9. run Chromium + Firefox full direct-import -> atomic-activation -> real-route -> restart -> semantic
   export/re-import -> failure-preservation -> secret-surface chain;
10. if all four positive corpora and hard batch criteria pass, perform the final `MIG-01.8` exact-head
    gates, progress/confidence/debt update, and close parent `MIG-01`.

Until then, the correct blocker remains the real owner backup itself, not Popup/Options or unrelated
repository work.
