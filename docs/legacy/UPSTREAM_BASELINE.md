# ZeroOmega Legacy Baseline

## Pinned upstream

The compatibility inventory is pinned to:

- Repository: `zero-peak/ZeroOmega`
- Release: `v3.5.0`
- Release commit: `05cbb30`
- Release date: 2026-05-17
- Public option schema: `schemaVersion: 2`

`master` is not the compatibility authority. New upstream releases must be reviewed through a separate inventory update and decision record.

## Primary source files

| Concern | Upstream path | Blob SHA at v3.5.0 |
|---|---|---|
| Profile model and PAC compilation | `omega-pac/src/profiles.coffee` | `3b49c00a135244e2ff2b4c4383247893ffd5ca6d` |
| Condition model and matching | `omega-pac/src/conditions.coffee` | `2346b2a99fc0e0b066509c9d916374bc17973c90` |
| Rule-list formats | `omega-pac/src/rule_list.coffee` | `16fd69fd85479012712f0c6710b22d77c938299b` |
| Default schema-v2 options | `omega-target/src/default_options.coffee` | `0cd5c86523fdaa088b98c4d197643c758054683e` |
| Loading, upgrading, sync filtering, and option behavior | `omega-target/src/options.coffee` | `82a5a09d428ca20bb2d9d5009f3a4751f4f4a612` |

## Clean-room boundary

ZeroOmega Nex is a new implementation. Upstream source is used to discover public configuration semantics and construct interoperability tests.

Allowed compatibility work:

- Record public field names and accepted values.
- Construct independently written JSON fixtures.
- Describe observable matching and migration behavior.
- Compare route decisions using test vectors.

Prohibited shortcuts:

- Copy CoffeeScript implementation into Nex.
- Port old request-time architecture line by line.
- Reuse generated PAC code without independent design and tests.
- Treat undocumented cache/runtime fields as stable user intent without classification.

## Update procedure

When a new ZeroOmega release becomes a target:

1. Record the new tag, commit, and relevant Blob SHAs.
2. Diff the five source areas above.
3. Update profile, condition, settings, and derived-field inventories.
4. Add fixtures for every newly discovered public shape.
5. Record changed compatibility decisions in `docs/DECISIONS.md`.
6. Do not change importer behavior until differential tests exist.
