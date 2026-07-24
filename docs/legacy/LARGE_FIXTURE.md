# Deterministic Large Legacy Fixture

Status: Milestone 2 scale corpus for ZeroOmega `schemaVersion: 2`.

## Purpose

The large fixture exists to expose importer, validator, reference-resolution, serialization, memory, and future compiler behavior that small hand-written examples cannot reveal.

It is not intended to imitate one specific user's backup. It combines representative profile and rule structures while using only reserved domains and documentation address ranges.

## Deterministic dimensions

The generator produces:

- 24 `FixedProfile` objects;
- 8 `SwitchProfile` objects;
- 4 `RuleListProfile` objects;
- 36 ordinary profiles in total;
- 128 ordered rules per SwitchProfile;
- 1,024 SwitchProfile rules in total;
- 256 data entries per rule list;
- 1,024 rule-list data entries in total;
- mixed host wildcard, host regex, URL wildcard, IPv4, and IPv6 conditions;
- HTTP, HTTPS, SOCKS4, and SOCKS5 endpoints;
- ordered bypass lists;
- startup and quick-switch references;
- non-sensitive custom download headers.

The committed JSON must remain between 200 KB and 1 MB. This is large enough to exercise nontrivial paths without turning the repository into a binary-fixture store.

## Source safety

The fixture contains:

- only `.invalid` hostnames;
- only RFC documentation IP ranges;
- no usable proxy endpoint;
- no credentials;
- no authorization, cookie, token, or private header value;
- no timestamp, random value, machine-specific identifier, or network-fetched content.

## Generation contract

`scripts/large-legacy-fixture-lib.mjs` is the single source of truth for dimensions and content.

`scripts/generate-large-legacy-fixture.mjs` writes:

```text
fixtures/zeroomega-v2/large-representative.json
```

The file is committed so future import tests can consume an ordinary static backup. It is excluded from Prettier because it is generated and its exact bytes are part of the test contract.

## Validation contract

`scripts/validate-large-legacy-fixture.mjs`:

1. rebuilds the expected serialized JSON in memory;
2. compares the committed file byte-for-byte;
3. verifies profile-type counts;
4. verifies total SwitchProfile rule count;
5. verifies rule-list line counts;
6. verifies reserved source domains;
7. enforces the fixture byte-size budget;
8. verifies startup and quick-switch anchors.

The normal legacy fixture validator separately checks all profile references, condition types, credential/header rules, and cycles.

A manual edit to the generated file therefore fails CI even when the JSON remains syntactically valid.

## Performance use

Milestone 2 does not impose unstable wall-clock limits on shared CI runners. Later milestones will use this fixture for measured budgets including:

- parse time;
- validation time;
- normalization time;
- reference-resolution time;
- PAC compilation time;
- peak memory;
- serialized snapshot size;
- incremental recompilation impact.

Performance thresholds must be established from repeatable benchmark runs rather than a single CI duration.

## Change procedure

Changing any dimension requires:

1. an explicit reason in the PR;
2. updating constants in the generator library;
3. regenerating the committed JSON;
4. updating this document and expected counts;
5. passing exact-byte validation and the full repository CI.

Do not hand-edit `large-representative.json`.
