# MIG-01 Corpus B Owner Intake

Status: repository-controlled `MIG-01.8A` intake readiness, `MIG-01.8B` importer-preflight
readiness, `MIG-01.8C` failure-surface hardening, and `MIG-01.8D` checkout containment are
implemented. This does not provide Corpus B and does not close `MIG-01`.

## Purpose

Corpus B must be a sanitized ZeroOmega v3.5.0 owner export representative of the owner's real daily
configuration. Repository fixtures cannot substitute for it. The handoff path is fail-closed and must
not place owner working data in the repository checkout.

The owner handoff is:

1. inspect the raw owner `.bak` outside the repository and write a structure-only manifest;
2. make a separately sanitized copy outside the repository;
3. verify that sanitized copy against the manifest;
4. run the real repository importer preflight while the candidate and report remain outside the
   checkout;
5. branch only on the real preflight result.

The tool never auto-rewrites the raw configuration. Sanitization remains an explicit copy/edit step
so profile semantics are not guessed away.

## Raw inspection

Keep the raw export outside the checkout, then run:

```bash
node scripts/owner-corpus-b-intake.mjs inspect \
  /absolute/private/path/owner.bak \
  /absolute/private/path/corpus-b-structure.json
```

The command refuses a raw input path inside the repository. The manifest contains no profile names,
hosts, URLs, condition values, credentials, header values, PAC source, Rule List source, or raw-file
hash. It records only aggregate dimensions plus a SHA-256 structural fingerprint whose canonical
form removes sensitive/network values while retaining topology and behavior-bearing shape.

The fingerprint binds profile insertion order/families, reference topology, startup and Quick Switch
routes, colors, condition/rule ordering, proxy schemes/ports, masked PAC and Rule List syntax shape,
operational numeric/boolean settings, and credential/header slot shape.

## Sanitized candidate verification

Keep the sanitized copy outside the checkout, then run:

```bash
node scripts/owner-corpus-b-intake.mjs verify \
  /absolute/private/path/sanitized-owner.bak \
  /absolute/private/path/corpus-b-structure.json
```

`MIG-01.8D` makes the outside-checkout requirement executable: `verify` refuses a sanitized owner
backup whose resolved path is inside the repository.

Verification also fails when:

- the structural fingerprint or aggregate dimensions changed;
- proxy credentials are not literal `<redacted>` placeholders;
- secret-like fields or sensitive request headers remain usable;
- host/URL-bearing fields still contain routable/private identifiers;
- condition, Rule List or PAC text contains non-reserved domain/IP identifiers;
- URL-bearing fields retain credentials, query/fragment data, or a path other than `/redacted`.

Allowed network identifiers are limited to loopback, RFC documentation IP ranges, and reserved
`example.com`/`example.net`/`example.org`, `.invalid`, `.test`, and `.localhost` names.

A pass means only that the sanitized file is structurally representative of the inspected raw file
and safe enough to enter controlled acceptance work. It does not prove migration compatibility.

## Repository importer preflight

After verification, keep both candidate and report outside the checkout:

```bash
node scripts/owner-corpus-b-preflight.mjs \
  /absolute/private/path/sanitized-owner.bak \
  /absolute/private/path/corpus-b-structure.json \
  /absolute/private/path/corpus-b-preflight.json
```

`MIG-01.8D` rejects either of these checkout-local cases before importer execution:

- sanitized candidate inside the repository;
- preflight report output inside the repository.

The structure-only manifest policy is unchanged by 8D.

The wrapper re-runs the 8A structure/safety gate, then invokes the repository's existing
`importZeroOmegaBackup` implementation through the dedicated Vitest/Vite runner. No second importer,
transpiled copy, or owner-specific migration implementation is maintained by the preflight tool.

The report contains only aggregate dimensions, importer summary counts, static machine issue codes,
issue scope/profile ordinal, candidate family/protocol counts, startup/Quick Switch shape,
secret-material kind counts, and the final decision. It omits profile names, hosts, URLs, condition
values, PAC/Rule List source, issue messages, source paths, credentials, secret values, and raw backup
content.

The public command remains fail-closed:

- `ready-for-browser-chain` -> exit `0`;
- `blocked` -> exit `2` for import rejection, rejected item, or downgrade;
- `review-required` -> exit `3` for target-dependent evidence;
- malformed/unknown execution state -> exit `1`.

Exit `0` only authorizes deriving the smallest Corpus-B-specific browser oracle from the real
sanitized topology. Exit `2` reopens the actual import/mapping layer. Exit `3` requires explicit
target/platform evidence before a browser-chain claim.

## Public failure/privacy boundary

`MIG-01.8C` prevents the public CLI surface from leaking owner-local filesystem identifiers on
unexpected failures:

- known intake/preflight domain failures retain static actionable messages;
- unexpected filesystem/process/runner failures collapse to generic no-local-path messages;
- internal preflight runner stdout/stderr is not inherited;
- unknown decision values are not echoed;
- structural metric mismatches use static domain errors.

`MIG-01.8D` extends the same boundary to checkout containment. The static rejection messages do not
echo the forbidden path, including a private filename used as the report target.

These hardenings change repository-side handoff tooling and tests only. They do not alter the
migration importer, extension runtime, Popup, Options, profile schema, route semantics, or the
four-corpus acceptance contract.

## Final Corpus B acceptance

After intake and importer preflight pass the applicable gates, Corpus B must still complete the same
hard parent journey in both packaged browsers:

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

`MIG-01.8A` closed the fail-closed inspect/verify intake and finished exact-head validation at
`9e540c16710908b6b3cc1dca128d873377e9066c`.

`MIG-01.8B` added the real-importer safe preflight. Focused run `31196519081` / job `92925932840`
passed 3/3 focused tests; the root suite passed 118/118 files and 589/589 tests, component 25/25. Its
final state-sync Head `e286fb17c7b92e1db371f4805a4ce7787326a2bd` passed all six permanent gates.

`MIG-01.8C` hardened failure surfaces. Focused run `31199092414` / job `92934450626` passed 12/12
focused tests; root 118/118 files and 591/591 tests; component 25/25. Final Head
`c9c90b3ef92e87e7587f9602ea56d363844a5d4b` passed all six permanent gates. Its Browser E2E kept
Chromium `92936112924`, Firefox `92936112976`, native inspect `92936112952`, Firefox policy popup
`92936112990`, and migration-secret-leak-gate `92937030164` green. The scanner passed across 15
diagnostics files and 2 browser job logs.

`MIG-01.8D` closes the checkout-containment mismatch. The first temporary verifier run
`31201402944` / job `92941999823` failed before patch application because the temporary helper itself
contained an unescaped nested template literal. No focused test had run. The helper syntax was fixed
without changing or weakening any containment assertion.

Corrected verifier run `31201698166` / job `92942971830` completed SUCCESS after deleting the
temporary workflow and helper before testing:

- focused owner handoff suite: 2/2 files, 15/15 tests passed;
- intake CLI: 9 tests;
- repository preflight: 6 tests;
- root suite: 118/118 files, 594/594 tests passed;
- component suite: 25/25 tests passed;
- lint, formatting, all package checks, Chromium/Firefox builds, manifest inspection, CSP audit,
  staging, and archive checks passed.

The clean 8D code Head is `788304f9a6f9f3c504d55e6d2a09074c1c582e1f`; both temporary
helper paths are absent from that tree.

Until a real owner export reaches this path, `MIG-01.8` stays blocked, product completion remains
`45.15%` (reported `45%`), evidence confidence remains `43%`–`50%`, owner retest remains prohibited,
PR #11 remains Draft, and release remains `NO-GO`.
