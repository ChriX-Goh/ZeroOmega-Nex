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
| --- | --- | --- |
| Profile model and PAC compilation | `omega-pac/src/profiles.coffee` | `3b49c00a135244e2ff2b4c4383247893ffd5ca6d` |
| Condition model and matching | `omega-pac/src/conditions.coffee` | `2346b2a99fc0e0b066509c9d916374bc17973c90` |
| Rule-list formats | `omega-pac/src/rule_list.coffee` | `16fd69fd85479012712f0c6710b22d77c938299b` |
| Default schema-v2 options | `omega-target/src/default_options.coffee` | `0cd5c86523fdaa088b98c4d197643c758054683e` |
| Loading, upgrades, headers, sync filtering, and options | `omega-target/src/options.coffee` | `82a5a09d428ca20bb2d9d5009f3a4751f4f4a612` |
| Backup, local restore, online restore, and sync controller | `omega-web/src/omega/controllers/io.coffee` | `be1e16ad9b841c0803d55b7ffcd06e16b42c83a5` |
| Complete import/export and sync UI fields | `omega-web/src/partials/io.jade` | `2a84a8a6552e768900a425536326dc9f4f429811` |
| UI option source, apply confirmation, and PAC export | `omega-web/src/omega/controllers/master.coffee` | `d4973c0ce27e65419fc0b442fb45966cb44bbdc3` |
| Advanced-condition checkbox shape | `omega-web/src/partials/ui.jade` | `3a5b8141b9bb58ee08fffac6e61e968ab9ebf1b4` |
| Switch editor, condition groups, and rule-list exporters | `omega-web/src/omega/controllers/switch_profile.coffee` | `5cea8b58746cbcb592c9cdeadb687fa70a975824` |
| Switch editor template and full-URL warnings | `omega-web/src/partials/profile_switch.jade` | `80377d2134f5f553d64d887269c192e07c9880ff` |
| UI built-in constants and built-in settings route | `omega-web/src/omega/app.coffee` | `f419935474c1b45636c5d201f84a0216b6d5421e` |
| Built-in color customization controller | `omega-web/src/omega/controllers/builtin.coffee` | `e7e4afda978e9ed59e60a0a52bde70621e9e2e1d` |
| Built-in System and Direct color-picker UI | `omega-web/src/partials/builtin.jade` | `a4976f96e99bfae197a90a022f8a58bcebd4113c` |
| Web-to-background option bridge | `omega-target-chromium-extension/src/coffee/omega_target_web.coffee` | `4e5ca6d86998d4a044c05ebb3e845b5c3eeeab86` |
| Browser option state, temporary rules, and monitoring | `omega-target-chromium-extension/src/module/options.coffee` | `163c9835834ad06d698be2c3d9f1b1de2057d461` |
| Sync staging and backend dispatch | `omega-target-chromium-extension/src/module/sync_storage.coffee` | `fe9dadef484b7d65e63de1fa4eab5b2e7a2422f7` |
| Gist JSON synchronization | `omega-target-chromium-extension/src/module/sync/sync_impl_gist.coffee` | `c54e2f125a5654233053e0c1ec64d693eb1f729a` |
| WebDAV JSON synchronization | `omega-target-chromium-extension/src/module/sync/sync_impl_webdav.coffee` | `147720afa1828bf69bb5ebb814080a14ba3b14f1` |
| Browser proxy application and auth preflight | `omega-target-chromium-extension/src/module/proxy/proxy_impl_settings.coffee` | `d38e3dcbfea6c89a06d21fd8ed9ee76f37329af8` |
| Proxy credential listener and slot selection | `omega-target-chromium-extension/src/module/proxy/proxy_auth.coffee` | `3f9acc2a6f1908ac17eb75ae933ab9b02d32ecb2` |

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
2. Diff all source areas listed above.
3. Update profile, condition, settings, credential, header, backup, restore, sync, built-in appearance, editor/export, and derived-field inventories.
4. Add fixtures for every newly discovered public shape.
5. Record changed compatibility decisions in `docs/DECISIONS.md`.
6. Do not change importer behavior until differential tests exist.
