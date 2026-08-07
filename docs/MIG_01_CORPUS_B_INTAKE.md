# MIG-01 Corpus B Owner Intake

Status: repository-controlled `MIG-01.8A` intake readiness closed at code/evidence Head `ba009829d4b94a4e9505891301f246b5877a7f2b`. This does not provide Corpus B and does not close `MIG-01`.

## Purpose

Corpus B must be a sanitized ZeroOmega v3.5.0 owner export representative of the owner's real daily
configuration. Repository fixtures cannot substitute for it. The intake path makes that external
handoff fail-closed without copying the raw owner backup into the repository or weakening the
four-corpus acceptance contract.

The intake has two stages:

1. inspect the raw owner `.bak` outside the repository and write a structure-only manifest;
2. verify a separately sanitized `.bak` against that manifest before it can become the Corpus B
   candidate.

The tool never auto-rewrites the raw configuration. Sanitization remains an explicit copy/edit step
so profile semantics are not guessed away.

## Raw inspection

Keep the raw export outside the checkout, then run:

```bash
node scripts/owner-corpus-b-intake.mjs inspect /absolute/private/path/owner.bak /absolute/private/path/corpus-b-structure.json
```

The command refuses a raw input path inside the repository. The manifest contains no profile names,
hosts, URLs, condition values, credentials, header values, PAC source, Rule List source, or raw-file
hash. It records only aggregate dimensions plus a SHA-256 structural fingerprint whose canonical
form removes sensitive/network values while retaining topology and behavior-bearing shape.

The fingerprint binds:

- profile insertion order and profile families;
- profile-reference topology, including startup and Quick Switch routes;
- colors;
- condition types and ordered rule shape;
- proxy schemes and ports while excluding host values;
- ordered PAC line syntax shape after masking identifiers and literal values;
- ordered Rule List line/category syntax shape after masking identifiers and literal values;
- numeric and boolean operational settings;
- credential/header slot shape.

## Sanitized candidate verification

After making a sanitized copy, run:

```bash
node scripts/owner-corpus-b-intake.mjs verify /path/to/sanitized-owner.bak /path/to/corpus-b-structure.json
```

Verification fails when:

- the structural fingerprint or aggregate dimensions changed;
- proxy credentials are not literal `<redacted>` placeholders;
- secret-like fields or sensitive request headers remain usable;
- host/URL-bearing fields still contain routable/private identifiers;
- condition, Rule List or PAC text contains non-reserved domain/IP identifiers;
- URL-bearing fields retain credentials, query/fragment data, or a path other than `/redacted`.

Allowed network identifiers are limited to loopback, RFC documentation IP ranges, and reserved
`example.com`/`example.net`/`example.org`, `.invalid`, `.test`, and `.localhost` names.

A pass means only that the sanitized file is structurally representative of the inspected raw file
and safe enough to enter repository-controlled acceptance work. It does not prove migration
compatibility.

## Final Corpus B acceptance

After intake passes, Corpus B must still complete the same hard parent journey in both packaged
browsers:

```text
direct import
-> inactive validation
-> atomic activation
-> real route decisions
-> browser restart
-> semantic re-export
-> re-import / re-export idempotence
-> failure preservation
-> secret-surface gates
```

Any real owner field that exposes an unsupported, downgraded, silently reinterpreted, or
behavior-changing path reopens the relevant MIG-01 implementation layer. The repository must not
edit the sanitized backup merely to make Nex pass.

## Repository-controlled readiness evidence

The final clean implementation Head `ba009829d4b94a4e9505891301f246b5877a7f2b` contains no
MIG-01.8A temporary workflow or patch helper. Relative to the preceding fully-green Head
`feb17e5b41d33e1cc6e8dd31cd95b79e47d86643`, its net scope is limited to the intake CLI, its
permanent Vitest CLI integration coverage, one production-tsconfig test exclusion, this contract,
and one bounded no-UI-change note in each canonical parity document.

Focused intake evidence first passed in hardening run `31190627930` / job `92906223632`: seven of
seven CLI integration tests passed. The same job then completed the full `pnpm verify`, including
117 test files and 586 tests, 25 component tests, lint, formatting, package type checks, both browser
builds, manifest inspection, CSP audit, staging and archive checks.

All six permanent workflows then passed again on the exact clean implementation Head:

- CI `31190899945`: SUCCESS;
- Browser E2E `31190899444`: SUCCESS;
- Parity Documentation `31190900419`: SUCCESS;
- Milestone 8 Visual Evidence `31190900037`: SUCCESS;
- Original Nex UI Evidence `31190900825`: SUCCESS;
- Original Toolbar Evidence `31190899947`: SUCCESS.

The exact-head Browser E2E retained the previously closed migration/security chain: Chromium job
`92907128431` SUCCESS, Firefox job `92907128519` SUCCESS, and downstream
`migration-secret-leak-gate` job `92908097019` SUCCESS. The scanner reported that the controlled
sentinels were absent across 15 diagnostics files and both browser job logs. Exact-head diagnostics:

- Chromium artifact `8998841691`, SHA-256
  `bd5ad643a45bbf4ce08a9e70c1f25f67cba5ecf97a69704beec34f29143f0258`;
- Firefox artifact `8998854117`, SHA-256
  `0c0ff13349a18ff9b3b49fa91bebe0e29ffdcebf671d068771f4d89534a82e45`.

Until a real owner export reaches this path, `MIG-01.8` stays blocked, product completion remains
`45.15%` (reported `45%`), owner retest remains prohibited, PR #11 remains Draft, and release remains
`NO-GO`.
