# ProfileSpec v1 Design

## Purpose

ProfileSpec is the stable, versioned representation of user intent in ZeroOmega Nex. It is independent from ZeroOmega's schema-v2 storage shape, browser proxy APIs, generated PAC scripts, caches, diagnostics, and future native-engine snapshots.

## Canonical ordering

The `profiles`, `proxyEndpoints`, and `ruleSources` arrays are ordered. Profile display order is the order of the `profiles` array. Switch rules are evaluated in array order and the first matching rule wins.

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

## Extensions

Unknown safe metadata may be retained only in namespaced extension objects. Importers must not place generated data, executable behavior, permissions, runtime state, or secrets in these objects.

## Lifecycle

A ProfileSpec document is immutable once stored as a revision. Editing creates a new revision with a new `revision.id` and an optional `revision.parentId`. Runtime activation points to a separately compiled immutable snapshot.
