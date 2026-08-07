# MIG-01 Corpus B Owner Intake

Status: repository-controlled `MIG-01.8A` intake readiness, `MIG-01.8B` importer-preflight
readiness, and `MIG-01.8C` failure-surface hardening are implemented. This does not provide Corpus B
and does not close `MIG-01`.

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

## Failure-surface privacy boundary

`MIG-01.8C` closes a remaining handoff leak path that was outside the safe JSON report itself. Before
this hardening, top-level CLI catches could print arbitrary Node `Error.message` values, and the
preflight wrapper inherited the internal Vitest runner's stdout/stderr. A missing or unwritable file
could therefore expose an owner-local absolute path even though the machine report contained no raw
owner values.

The public handoff now applies these rules:

- known intake/preflight domain failures retain static actionable messages;
- unexpected filesystem, process, or runner failures collapse to a generic no-local-path message;
- the internal preflight runner's stdout/stderr is not inherited by the public wrapper;
- unknown decision values are not echoed;
- structural metric mismatches use a static domain error rather than an assertion dump.

This hardening changes only repository-side owner handoff tooling and tests. It does not alter the
migration importer, extension runtime, Popup, Options, profile schema, route semantics, or the
four-corpus acceptance contract.

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

`MIG-01.8B` added only repository tooling and test discovery: the preflight core/wrapper/runner,
dedicated runner config, permanent preflight test, and root Vitest inclusion for
`scripts/**/*.test.ts`. No extension runtime, Popup, Options, profile schema, migration importer, or
product behavior changed.

Focused verifier run `31196519081` / job `92925932840` completed SUCCESS after the fail-closed exit
semantics were corrected:

- focused `scripts/owner-corpus-b-preflight.test.ts`: 3/3 tests passed;
- complete root suite: 118/118 test files, 589/589 tests passed;
- component suite: 25/25 tests passed;
- lint, formatting, all package type checks, Chromium/Firefox builds, manifest inspection, CSP audit,
  staging, and archive checks passed.

The final `MIG-01.8B` state-sync Head `e286fb17c7b92e1db371f4805a4ce7787326a2bd` then passed all
six permanent workflows: CI `31197715431`, Browser E2E `31197714807`, Parity Documentation
`31197714512`, Milestone 8 Visual Evidence `31197714372`, Original Nex UI Evidence `31197714273`,
and Original Toolbar Evidence `31197714940`. Its Browser E2E retained Chromium `92929940148`,
Firefox `92929939885`, and migration-secret-leak-gate `92930941936` as SUCCESS.

`MIG-01.8C` focused verifier run `31199092414` / job `92934450626` also completed SUCCESS. The
verifier deleted its own patch helper and temporary workflow before running tests. Evidence:

- focused owner handoff security suite: 2/2 files, 12/12 tests passed;
- intake CLI coverage increased to 8 tests;
- preflight coverage increased to 4 tests;
- root suite: 118/118 files, 591/591 tests passed;
- component suite: 25/25 tests passed;
- lint, formatting, all package type checks, Chromium/Firefox builds, manifest inspection, CSP audit,
  staging, and archive checks passed;
- new black-box assertions prove that a missing raw owner path and an internal runner write failure do
  not echo owner-local path sentinels to public stderr.

The verifier produced clean tree `cd34189dc3fabb0e877f5fc107253052e5af14a4` in bot commit
`97dc79611d97b91707864344c5634424580f5255`; both temporary helper paths are absent from that tree.
The identical clean tree is re-emitted under the normal project identity before permanent exact-head
gates are counted.

Until a real owner export reaches this path, `MIG-01.8` stays blocked, product completion remains
`45.15%` (reported `45%`), owner retest remains prohibited, PR #11 remains Draft, and release remains
`NO-GO`.
