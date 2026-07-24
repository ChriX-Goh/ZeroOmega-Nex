# ProfileSpec v1 Design

## Purpose

ProfileSpec is the stable, versioned representation of user intent in ZeroOmega Nex. It is independent from ZeroOmega's schema-v2 storage shape, browser proxy APIs, generated PAC scripts, caches, diagnostics, and future native-engine snapshots.

## Canonical ordering

The `profiles`, `proxyEndpoints`, and `ruleSources` arrays are ordered. Profile display order is the order of the `profiles` array. Switch rules are evaluated in array order and the first matching rule wins.

Object keys are canonicalized lexicographically during serialization. Arrays are never sorted automatically because their order carries user intent.

## Built-in routes

Direct and system behavior are route targets rather than ordinary user profiles:

- `{ "kind": "direct" }`
- `{ "kind": "system" }`

Their optional colors are stored under `settings.interface.builtInProfiles`. This avoids name collisions and accidental profile-reference cycles while preserving the familiar built-in entries.

## Stable identifiers

All profiles, endpoints, rule sources, rules, bypass entries, documents, and revisions use stable IDs. Display names are editable and are never used as references.

## Secret boundary

ProfileSpec contains references to secrets, never secret values:

- Proxy passwords use `passwordSecretRef`.
- Sensitive rule-source headers use `{ "kind": "secret", "secretRef": "..." }`.
- Remote synchronization credentials use `settings.sync.secretRef`.

The validation layer rejects obvious password, token, cookie, and authorization values embedded in ordinary extension metadata.

## Profile variants

ProfileSpec v1 defines:

- `fixed`
- `switch`
- `rule-list`
- `pac`
- `auto-detect`

Legacy Direct/System profiles map to built-in route targets. Legacy VirtualProfile maps to a switch profile while retaining its source type in `legacy.profileType`.

## Condition variants

The twelve ZeroOmega v3.5.0 condition families have explicit counterparts:

- `true`
- `false`
- `url-regex`
- `url-wildcard`
- `host-regex`
- `host-wildcard`
- `bypass`
- `keyword`
- `ip`
- `host-levels`
- `weekday`
- `time`

Source patterns remain available for compatibility reporting. Normalized indexes and compiled expressions are runtime artifacts and do not belong in ProfileSpec.

## Structural and semantic validation

`profile-spec-v1.schema.json` is a JSON Schema 2020-12 contract. It rejects unknown top-level fields, malformed discriminated unions, invalid scalar ranges, and extension keys that are not namespaced.

The TypeScript semantic validator additionally checks:

- duplicate IDs and profile names;
- missing endpoint, source, startup, quick-switch, and profile references;
- profile-reference cycles;
- host, URL, IP prefix, regular-expression, range, and timestamp semantics;
- sensitive literal headers and remote-sync secret boundaries;
- generated, runtime, and secret-like data hidden inside extension metadata;
- browser-target-dependent behavior as explicit warnings rather than silent acceptance.

## Extensions

Unknown safe metadata may be retained only in namespaced extension objects. Importers must not place generated data, executable behavior, permissions, runtime state, or secrets in these objects.

## Serialization

`serializeProfileSpec` validates before writing, canonicalizes object keys, preserves arrays, and emits a trailing newline by default. Identical user intent therefore produces deterministic bytes suitable for revision comparison and later content hashing.

`parseProfileSpec` never throws for malformed JSON or unsupported versions. It returns structured issues and the exact migration steps applied.

## Migration framework

ProfileSpec migrations are explicit directed steps with `fromVersion`, `toVersion`, and a pure migration function. The runner detects missing steps, cycles, invalid intermediates, and thrown migration errors before validating the final v1 document.

The v1 migration registry is intentionally empty because `1.0` is the first public schema. Future schema changes append migration steps rather than weakening v1 validation.

## Lifecycle

A ProfileSpec document is immutable once stored as a revision. `createProfileSpecRevision` deep-clones the current document, applies an optional edit to the clone, creates a child revision whose `parentId` points to the previous revision, and rejects the result unless it remains valid.

Runtime activation points to a separately compiled immutable snapshot. Editing ProfileSpec never mutates the currently active runtime snapshot.
