# Session 17 MIG-01.8A Knowledge Graph — Corpus B Owner Intake Readiness

Date: 2026-08-07

This document is the latest ZeroOmega handoff supplement after `SESSION_17_KNOWLEDGE_GRAPH.md`.
It preserves WIP=1 on the single parent `MIG-01` and records the repository-controlled work that was
possible after MIG-01.7 closed while the real owner representative Corpus B remained unavailable.

## 1. Session-entry truth

The prior final clean Head was `feb17e5b41d33e1cc6e8dd31cd95b79e47d86643`.
MIG-01.7B and the repository-controlled scope of MIG-01.7 were already closed there with all six
permanent workflows green, including dual-browser sensitive migration evidence and the downstream
secret-log/diagnostics scanner.

The batch contract still requires positive Corpus A/B/C/D. Corpus B is specifically a sanitized
owner daily-use ZeroOmega v3.5.0 original export preserving representative topology and behavior.
Repository-generated or synthetic fixtures are forbidden as a substitute.

Repository search plus File Library search found no real owner `.bak`. Existing audit material also
records that the representative owner original export was never supplied. Therefore Corpus B was
confirmed as a real external-data blocker rather than an indexing or context-recovery mistake.

Product completion remained exactly `45.15%` (reported `45%`), owner retest remained prohibited,
PR #11 remained Draft, and release remained `NO-GO`.

## 2. Highest-value next slice

Because Corpus B itself could not be manufactured, the highest-value repository-controlled work was
selected as `MIG-01.8A`: make the owner-Corpus-B handoff fail-closed and immediately executable when
the real file arrives.

The slice deliberately did not add a sanitizer that guesses replacements. Its boundary is:

```text
raw owner .bak kept outside repository
-> structure-only inspect manifest
-> separately sanitized candidate
-> fail-closed structural + privacy verification
-> only then eligible for the existing dual-browser MIG-01 acceptance chain
```

Passing intake does not prove migration compatibility and does not authorize owner retest.

## 3. Implemented intake contract

New `scripts/owner-corpus-b-intake.mjs` provides:

```text
inspect <raw-owner.bak> <structure-manifest.json>
verify <sanitized-owner.bak> <structure-manifest.json>
```

Raw inspection refuses a raw input path inside the repository. The manifest deliberately omits raw
profile names, hosts, URLs, condition values, credentials, header values, PAC source, Rule List
source and raw-file hash. It stores only aggregate dimensions and a SHA-256 over a masked structural
representation.

The structural fingerprint binds profile insertion order/families, profile-reference topology,
startup and Quick Switch routes, colors, condition types/order, proxy schemes/ports, ordered PAC
syntax shape, ordered Rule List syntax/category shape, numeric/boolean operational settings, and
credential/header slot shape.

Verification rejects structural drift and fails closed on usable credentials, secret-like values,
sensitive header values, non-reserved domain/IP identifiers, usable network endpoints, URL userinfo,
URL query/fragment data, private URL paths, and non-documentation IPv6 targets. Reserved test targets
remain limited to loopback, RFC documentation ranges and documentation/reserved DNS names.

`docs/MIG_01_CORPUS_B_INTAKE.md` is the operational contract.

## 4. Coverage defect discovered and corrected

The first intake test was created as `owner-corpus-b-intake.test.mjs`. Explicit Vitest execution
proved that the repository test configuration did not collect `.test.mjs`; therefore earlier global
test success could not be cited as intake coverage.

The uncollected file was removed. Permanent coverage is now
`packages/legacy-zeroomega/src/owner-corpus-b-intake.test.ts`.

Because this is a Node CLI black-box integration test while the production legacy package tsconfig
intentionally excludes Node builtin types, `packages/legacy-zeroomega/tsconfig.json` excludes only
this one test from production package `tsc`. No `@ts-nocheck`, lint suppression or new Node type
production dependency remains. Vitest still collects and runs the test permanently.

## 5. Security hardening discovered during self-review

Before closure, the first implementation was rejected as too weak in two areas:

1. PAC and Rule List structural fingerprints were too aggregate and could miss order/syntax drift;
2. URL userinfo/query/hash/path and IPv6 privacy boundaries were not strict enough.

The implementation was hardened to preserve ordered masked syntax shape and to reject those network
privacy surfaces. Tests were repeatedly redesigned so safety cases hold structure constant and vary
only the sensitive value; this prevents a structural-fingerprint rejection from falsely appearing to
prove the privacy gate.

## 6. Focused and full verification evidence

Temporary hardening run `31190627930`, job `92906223632`, completed SUCCESS before its helper files
were removed.

Focused permanent CLI integration coverage passed `7/7`:

1. value-free manifest + structurally equivalent safe candidate;
2. profile-family structural drift rejection;
3. ordered Rule List and PAC syntax drift rejection;
4. usable credentials/non-reserved endpoint rejection without structural drift;
5. URL credentials/query/fragment/private-path rejection without structural drift;
6. non-documentation IPv6 rejection while preserving PAC syntax shape;
7. raw owner backup inside repository refusal.

The same job then completed full `pnpm verify`: lint, formatting, architecture/UI/parity/localization
guards, package type checks, 117 Vitest files / 586 tests, 25 component tests, Chromium build,
Firefox build, manifest inspection, CSP audit, staging and archive checks all passed.

## 7. Clean implementation checkpoint

All temporary MIG-01.8A workflows and patch scripts were removed. Recursive-tree search on the clean
implementation Head found no `mig-01-8a` temporary workflow and no `temp.py` helper.

Clean code/evidence Head:

`ba009829d4b94a4e9505891301f246b5877a7f2b`

Net diff from the preceding final Head `feb17e5b41d33e1cc6e8dd31cd95b79e47d86643` is only:

- add `scripts/owner-corpus-b-intake.mjs`;
- add `packages/legacy-zeroomega/src/owner-corpus-b-intake.test.ts`;
- modify `packages/legacy-zeroomega/tsconfig.json` for the single Node CLI integration-test type boundary;
- add `docs/MIG_01_CORPUS_B_INTAKE.md`;
- add one bounded no-UI-change note to `docs/ORIGINAL_KNOWLEDGE_GRAPH.md`;
- add one bounded no-UI-change note to `docs/UI_AUDIT_MATRIX.md`.

No Popup/Options product code or product UI behavior changed.

## 8. Exact-head permanent evidence

All six permanent workflows on `ba009829d4b94a4e9505891301f246b5877a7f2b` completed SUCCESS:

- CI `31190899945`;
- Browser E2E `31190899444`;
- Parity Documentation `31190900419`;
- Milestone 8 Visual Evidence `31190900037`;
- Original Nex UI Evidence `31190900825`;
- Original Toolbar Evidence `31190899947`.

Browser E2E exact-head jobs:

- Chromium `92907128431`: SUCCESS;
- Firefox `92907128519`: SUCCESS;
- Chromium native inspect `92907128543`: SUCCESS;
- Firefox policy-owned popup `92907128685`: SUCCESS;
- downstream `migration-secret-leak-gate` `92908097019`: SUCCESS.

Both main browsers retained the previously closed original-migration and sensitive-original-migration
gates. The downstream scanner again reported no controlled sentinel across 15 diagnostics files and
2 browser job logs.

Exact-head diagnostics:

- Chromium artifact `8998841691`, SHA-256
  `bd5ad643a45bbf4ce08a9e70c1f25f67cba5ecf97a69704beec34f29143f0258`;
- Firefox artifact `8998854117`, SHA-256
  `0c0ff13349a18ff9b3b49fa91bebe0e29ffdcebf671d068771f4d89534a82e45`.

## 9. Closure boundary and current graph

`MIG-01.8A` repository-controlled intake readiness is closed. Corpus B itself is **not** closed and
has not been created. The only product WIP remains parent `MIG-01`.

```text
MIG-01 real original-export golden path [WIP=1]
  -> Corpus A [complete]
  -> Corpus B [external blocker: real owner original .bak absent]
       -> MIG-01.8A intake readiness [complete]
       -> raw inspect [ready]
       -> sanitized candidate verification [ready]
       -> real dual-browser parent chain [blocked until real owner data]
  -> Corpus C [complete]
  -> Corpus D [complete]
  -> large original-runtime representative [complete]
  -> MIG-01.6 failure preservation [complete]
  -> MIG-01.7 semantic/idempotence/secret surfaces [complete]
  -> MIG-01.8 final batch closure [blocked on Corpus B]
```

Current audited state remains exactly:

- product completion `45.15%` -> reported `45%`;
- evidence confidence band `43%-50%`;
- owner latest result Firefox FAIL on 2026-08-02;
- owner retest unauthorized;
- PR #11 Draft/open/unmerged;
- release `NO-GO`;
- Popup/Options work remains frozen.

## 10. Next executable handoff

When a genuine owner ZeroOmega v3.5.0 export becomes available, do not put the raw file in the
repository. Run:

```bash
node scripts/owner-corpus-b-intake.mjs inspect /outside/repo/raw-owner.bak /outside/repo/corpus-b-structure.json
node scripts/owner-corpus-b-intake.mjs verify /path/to/sanitized-owner.bak /outside/repo/corpus-b-structure.json
```

If intake passes, immediately drive that exact sanitized candidate through the existing full parent
journey in both packaged browsers:

```text
import -> inactive validation -> atomic activation -> real route decisions -> restart
-> semantic export -> re-import/re-export idempotence -> failure preservation -> secret gates
```

If a real owner field is unsupported, downgraded, silently reinterpreted or behavior-changing, reopen
only the relevant MIG-01 implementation layer and fix the first real blocker. Do not edit the owner
candidate merely to make Nex pass. Only after Corpus B passes the four-corpus contract may MIG-01.8
perform final batch closure/progress-confidence-debt reconciliation. Owner retest and release remain
prohibited until their separate gates authorize them.
