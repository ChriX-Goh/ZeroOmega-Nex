# MIG-01 Corpus B Owner Intake

Status: repository-controlled `MIG-01.8A` intake readiness and `MIG-01.8B` importer-preflight
readiness are implemented. This does not provide Corpus B and does not close `MIG-01`.

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

## Repository importer preflight

After the sanitized copy passes intake verification, run the repository importer preflight while the
candidate and report remain outside the checkout:

```bash
node scripts/owner-corpus-b-preflight.mjs \
  /path/to/sanitized-owner.bak \
  /path/to/corpus-b-structure.json \
  /path/to/corpus-b-preflight.json
```

The wrapper re-runs the `MIG-01.8A` structure/safety gate, then invokes the repository's existing
`importZeroOmegaBackup` implementation through a dedicated Vitest/Vite runner. No second importer,
transpiled copy, or owner-specific migration logic is maintained by the preflight tool.

The generated report is intentionally safe to review. It contains aggregate dimensions, importer
summary counts, static machine issue codes, issue scope/profile ordinal, candidate family/protocol
counts, startup/Quick Switch shape, secret-material kind counts, and the final decision. It omits
profile names, hosts, URLs, condition values, PAC/Rule List source, issue messages, source paths,
credentials, secret values, and raw backup content.

The public command is fail-closed:

- `ready-for-browser-chain` -> exit `0`: no rejected, downgraded, or target-dependent importer item;
- `blocked` -> exit `2`: import rejection, rejected item, or downgrade exists;
- `review-required` -> exit `3`: target-dependent evidence exists and must not auto-advance;
- malformed/unknown execution state -> exit `1`.

A safe report does not prove browser compatibility. `exit 0` only authorizes building the smallest
Corpus-B-specific browser route oracle from the real sanitized topology. `exit 2` reopens the actual
import/mapping layer exposed by the owner corpus. `exit 3` requires explicit target/platform evidence
before any browser-chain claim.

## Final Corpus B acceptance

After intake and importer preflight pass the applicable review gates, Corpus B must still complete
the same hard parent journey in both packaged browsers:

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

`MIG-01.8A` intake readiness was closed on the clean implementation Head
`ba009829d4b94a4e9505891301f246b5877a7f2b`, with seven focused intake tests plus the six permanent
workflows green. The final exact-head validation after its state sync remained green at
`9e540c16710908b6b3cc1dca128d873377e9066c`.

`MIG-01.8B` adds only repository tooling and test discovery: the preflight core/wrapper/runner,
dedicated runner config, permanent preflight test, and root Vitest inclusion for `scripts/**/*.test.ts`.
No extension runtime, Popup, Options, profile schema, migration importer, or product behavior was
changed.

Focused verifier run `31196519081` / job `92925932840` completed SUCCESS after the fail-closed exit
semantics were corrected:

- focused `scripts/owner-corpus-b-preflight.test.ts`: 3/3 tests passed;
- complete root suite: 118/118 test files, 589/589 tests passed;
- component suite: 25/25 tests passed;
- lint, formatting, all package type checks, Chromium/Firefox builds, manifest inspection, CSP audit,
  staging, and archive checks passed.

The tests prove that a private-name/host owner-like candidate reaches the real importer and produces
only aggregate evidence; a missing private target is blocked without copying private values into the
report; and the public wrapper writes the safe report while returning exit `3` when the real importer
requires target-dependent review.

Clean user code/evidence Head `9d54074ef35ee4ce0bf8afaccb4588eddf072195` has CI
`31196832518`, Browser E2E `31196831096`, Parity Documentation `31196831805`, Milestone 8 Visual
Evidence `31196831069`, and Original Nex UI Evidence `31196831963` successful. Browser E2E retained
Chromium `92926983784`, Firefox `92926983708`, and downstream migration-secret-leak-gate
`92927933594` as SUCCESS. The scanner again reported no controlled sentinel across 15 diagnostics
files and both browser job logs. Diagnostics were:

- Chromium artifact `9001189254`, SHA-256
  `b40da2b2855427f155991aaeaff28e88f58ada6b27b299c7a1fea910db5f99da`;
- Firefox artifact `9001246138`, SHA-256
  `ab141831f04448475356f710b1192e425387fce5a86a94fc47ad2888ae034c41`.

The Original Toolbar run on that code Head was still waiting inside Playwright installation when the
state-sync commit was prepared; it had not entered project evidence code and is not counted as a
success claim. The final state-sync Head must therefore pass all six permanent workflows again before
`MIG-01.8B` is treated as the completed handoff.

Until a real owner export reaches this path, `MIG-01.8` stays blocked, product completion remains
`45.15%` (reported `45%`), owner retest remains prohibited, PR #11 remains Draft, and release remains
`NO-GO`.
