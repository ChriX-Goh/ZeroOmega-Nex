# Session 18 MIG-01.8D Knowledge Graph — Corpus B Checkout Containment

This graph continues the single authorized product WIP, `MIG-01` real original-export migration.
`MIG-01.8D` is repository-controlled owner-handoff containment hardening only. It does not provide
Corpus B, does not close the parent batch, and does not change product completion.

## 1. Authoritative starting state

The continuation started from final `MIG-01.8C` Head
`c9c90b3ef92e87e7587f9602ea56d363844a5d4b`.

At that exact Head:

- PR #11: open, Draft, unmerged, mergeable;
- CI `31199594801`: SUCCESS;
- Browser E2E `31199594737`: SUCCESS;
- Parity Documentation `31199594825`: SUCCESS;
- Milestone 8 Visual Evidence `31199594945`: SUCCESS;
- Original Nex UI Evidence `31199594393`: SUCCESS;
- Original Toolbar Evidence `31199594634`: SUCCESS;
- Chromium `92936112924`: SUCCESS;
- Firefox `92936112976`: SUCCESS;
- Chromium native inspect `92936112952`: SUCCESS;
- Firefox policy-owned popup `92936112990`: SUCCESS;
- migration-secret-leak-gate `92937030164`: SUCCESS;
- leak scanner: no controlled sentinel across 15 diagnostics files and 2 browser job logs;
- Chromium diagnostics artifact `9002294091`, SHA-256
  `28503d393ae5aaa2f49f8083fbeaf12758b0978c2fa8ddac5e1ac8c6735719c8`;
- Firefox diagnostics artifact `9002353720`, SHA-256
  `e21607dc311f11a96d54eac16de6431cd6ab49b883134a472cf401a01227af66`;
- product completion `45.15%` -> reported `45%`;
- evidence confidence `43%`–`50%`;
- release `NO-GO`;
- latest owner result Firefox FAIL, 2026-08-02;
- owner micro-slice retest prohibited;
- only product WIP: parent `MIG-01`;
- phase `MIG_01_8C_FAILURE_SURFACES_HARDENED_BLOCKED_REAL_OWNER_BAK`.

## 2. Corpus B blocker revalidation

The session did not assume that Corpus B was still missing merely because prior sessions said so.
Available user file sources were searched for ZeroOmega, Owner Corpus B, and `.bak` candidates. The
results contained old project reports or unrelated material, not a real owner ZeroOmega export.

Connected Gmail was also searched:

- `has:attachment filename:bak -in:spam -in:trash` -> no messages;
- `(ZeroOmega OR SwitchyOmega) has:attachment -in:spam -in:trash` -> no messages;
- broader ZeroOmega/SwitchyOmega/Omega Options search -> only project/GitHub notifications, no owner
  backup attachment.

Therefore the blocker is genuine: no available connected source supplies the representative owner
`.bak`. Repository fixtures remain ineligible substitutes.

## 3. Why no speculative browser work was opened

`MIG-01.8C` already established the stop rule: without the real owner corpus, do not invent a generic
owner-browser oracle or synthetic owner fixture. Existing A/C/D browser assertions are intentionally
corpus-specific. Generalizing them before seeing B would guess the owner's topology and weaken the
purpose of the representative corpus.

The next useful repository-controlled work therefore had to improve the safety or determinism of the
actual external handoff, not broaden product scope.

## 4. Newly discovered contract/enforcement mismatch

The owner intake documentation already instructed operators to keep the sanitized candidate and the
preflight report outside the checkout. The implementation, however, only enforced repository
containment for the raw owner backup.

Before `MIG-01.8D`:

- `inspect` rejected a raw owner `.bak` inside the repository;
- `verify` accepted a sanitized owner `.bak` inside the repository;
- `preflight` accepted a sanitized owner `.bak` inside the repository;
- `preflight` also accepted its report output path inside the repository.

Even a properly sanitized owner candidate can still contain owner-private profile labels or opaque
non-secret values that are safe for controlled processing but should not become checkout material.
An accidental checkout-local file can enter Git status, editor/workspace indexing, search, staging,
diagnostics, or later human commits. The safe JSON report likewise has no reason to live in the
repository during owner handoff.

This made checkout containment a direct handoff requirement rather than speculative new product work.

## 5. MIG-01.8D acceptance contract

The slice was intentionally narrow:

```text
raw owner .bak
  -> must remain outside repository

sanitized owner .bak used by verify
  -> must remain outside repository

sanitized owner .bak used by preflight
  -> must remain outside repository

preflight report output
  -> must remain outside repository

structure-only manifest
  -> unchanged by 8D; existing policy remains authoritative
```

No migration semantics, importer mapping, extension runtime, routing, Popup, Options, or browser
oracle changes were authorized.

## 6. Implementation

### `scripts/owner-corpus-b-intake.mjs`

`verifyCommand` now fails before reading the sanitized candidate when the candidate resolves inside
the repository:

```text
sanitized owner backup must stay outside the repository
```

The check reuses the same repository-path containment predicate already used for raw inspection.

### `scripts/owner-corpus-b-preflight.mjs`

The wrapper now imports the existing repository containment predicate and fails before importer
execution when either condition is true:

- sanitized candidate resolves inside the repository;
- preflight report path resolves inside the repository.

The public static messages are:

```text
sanitized owner backup must stay outside the repository
preflight report must stay outside the repository
```

These remain compatible with the `MIG-01.8C` failure-surface privacy rule: the rejected path itself is
not echoed.

### Permanent tests

`packages/legacy-zeroomega/src/owner-corpus-b-intake.test.ts` now proves through the public CLI that a
checkout-local sanitized candidate is rejected and that its absolute repository path is absent from
stderr.

`scripts/owner-corpus-b-preflight.test.ts` now proves through the public wrapper that:

1. a checkout-local sanitized candidate is rejected before importer execution;
2. a checkout-local report output is rejected before importer execution;
3. a private sentinel embedded in the forbidden report filename is not echoed.

The prior 8A/8B/8C owner-handoff tests remain in the same focused suite.

## 7. Real red gate and correction

The first temporary verifier run was not hidden or reclassified as infrastructure noise.

- run `31201402944`;
- job `92941999823`;
- result: FAILURE.

It failed at the patch-helper execution step before any product file was patched or any focused test
ran. The helper source contained an unescaped nested template literal in generated test code:

```text
resolve(`${privateSegment}.json`)
```

inside the helper's own template string. Node therefore rejected the temporary helper syntactically.
The containment implementation and acceptance assertions had not yet been exercised.

The correction changed only the temporary helper's generated expression to string concatenation. No
containment assertion was removed, weakened, skipped, or converted to a mock.

## 8. Successful focused and full verification

Corrected temporary verifier:

- run `31201698166`;
- job `92942971830`;
- result: SUCCESS.

The workflow used Node 24, pnpm 11.4.0, frozen dependencies and repository-locked Prettier. It deleted
both temporary helper files before focused or full verification.

Focused command:

```bash
pnpm exec vitest run \
  packages/legacy-zeroomega/src/owner-corpus-b-intake.test.ts \
  scripts/owner-corpus-b-preflight.test.ts \
  --reporter=verbose
```

Focused results:

- 2/2 test files passed;
- 15/15 tests passed;
- intake CLI: 9 tests;
- repository preflight: 6 tests;
- new checkout-containment tests all passed.

The same clean working tree then completed `pnpm run verify`:

- architecture guard passed;
- UI/parity/localization guards passed;
- ESLint passed;
- Prettier passed;
- all package TypeScript checks passed;
- Svelte check: 0 errors, 0 warnings;
- root Vitest: 118/118 files, 594/594 tests passed;
- component Vitest: 1/1 file, 25/25 tests passed;
- Chromium production build passed;
- Firefox production build passed;
- manifest checks passed;
- CSP audit passed across 18 built JavaScript files;
- staging/archive passed.

The verifier then committed and pushed clean bot Head
`788304f9a6f9f3c504d55e6d2a09074c1c582e1f`.

Both temporary paths are absent from that clean Head:

- `.github/scripts/mig-01-8d-patch.mjs` -> 404;
- `.github/workflows/mig-01-8d-containment-temp.yml` -> 404.

The clean code changes are limited to the two owner-handoff CLI files and their two permanent test
files.

## 9. Product effect

`MIG-01.8D` closes a repository-controlled privacy/containment readiness gap. It does not prove any
new migration field, route, browser behavior, restart behavior, or semantic round trip for the owner
corpus.

Therefore:

- product completion remains exactly `45.15%`;
- reported completion remains `45%`;
- evidence confidence remains `43%`–`50%`;
- release remains `NO-GO`;
- owner retest remains prohibited;
- PR #11 remains Draft;
- WIP remains one parent batch, `MIG-01`;
- real Corpus B remains the external blocker.

No product progress points are awarded for this safety/readiness slice.

## 10. Current knowledge graph

```text
MIG-01 real original-export golden path [OPEN, WIP=1]
|
+-- Corpus A original/default [CLOSED]
+-- Corpus C/D original-runtime representative complexity [CLOSED]
+-- failure preservation / negative corpus [CLOSED repository evidence]
+-- semantic round trip / secret gates [CLOSED repository evidence]
+-- Corpus B owner representative [BLOCKED external input]
    |
    +-- 8A structure-only inspect + sanitized verify [READY]
    +-- 8B real importer safe preflight [READY]
    +-- 8C failure-surface privacy [HARDENED]
    +-- 8D checkout containment [HARDENED]
    |
    +-- real owner .bak [ABSENT]
    +-- B-specific browser oracle [NOT AUTHORIZED UNTIL REAL B]
    +-- Chromium full parent journey [BLOCKED]
    +-- Firefox full parent journey [BLOCKED]
```

## 11. Authorized next handoff

When the real owner ZeroOmega v3.5.0 export becomes available:

1. keep the raw `.bak` outside the repository;
2. run `owner-corpus-b-intake.mjs inspect` to create the structure-only manifest;
3. make a separate sanitized copy outside the repository;
4. run `owner-corpus-b-intake.mjs verify`; 8D rejects checkout-local sanitized input;
5. run `owner-corpus-b-preflight.mjs` with candidate/report outside the repository; 8D rejects
   checkout-local candidate/report paths;
6. branch on the real preflight result:
   - exit `2`: fix the actual rejected/downgraded implementation layer;
   - exit `3`: obtain explicit Chromium/Firefox target-dependent evidence;
   - exit `0`: derive the smallest B-specific/data-driven browser oracle from the actual sanitized
     topology;
7. execute direct import -> inactive validation -> atomic activation -> real route decisions ->
   restart -> semantic export -> re-import/re-export idempotence -> failure preservation -> secret
   gates in Chromium and Firefox;
8. only after the A/B/C/D hard contract passes may `MIG-01.8`/`MIG-01` closure, progress, confidence,
   and debt be reconsidered.

If the real owner `.bak` is still absent after 8D, stop repository implementation. Do not create an
`8E` generic browser harness, do not manufacture an owner fixture, and do not return to Popup/Options.

## 12. Final evidence still required after state sync

This document records the verified clean 8D code Head. The final state-sync Head is authoritative
only after all six permanent PR workflows pass on that exact Head:

- CI;
- Browser E2E;
- Parity Documentation;
- Milestone 8 Visual Evidence;
- Original Nex UI Evidence;
- Original Toolbar Evidence.

The final handoff must also re-record Chromium/Firefox Browser E2E jobs and downstream migration
secret-leak evidence for that exact state-sync Head.
