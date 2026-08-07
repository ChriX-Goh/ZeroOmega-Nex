# MIG-01 Corpus B Owner Intake

Status: repository-controlled readiness only. This does not provide Corpus B and does not close `MIG-01`.

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

Until a real owner export reaches this path, `MIG-01.8` stays blocked, product completion remains
`45.15%` (reported `45%`), owner retest remains prohibited, PR #11 remains Draft, and release remains
`NO-GO`.
