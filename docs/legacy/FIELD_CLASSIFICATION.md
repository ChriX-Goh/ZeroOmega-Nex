# Legacy Field Classification

Status: working Milestone 2 contract for ZeroOmega `v3.5.0` schema-v2 data.

## 1. Classification values

- `map`: convert into a first-class Nex ProfileSpec or user-setting field.
- `preserve`: retain as namespaced legacy metadata because it may matter for diagnostics or future export.
- `secret-ref`: import into secret storage and place only an opaque reference in ordinary configuration.
- `ignore-generated`: omit from normal imported configuration because it is reproducible downloaded or compiled data.
- `ignore-runtime`: omit because it belongs to a browser session, device, sync transaction, or diagnostic run.
- `downgrade`: convert to safer or narrower behavior and show a migration warning.
- `reject`: do not activate because safe or deterministic representation is unavailable.
- `investigate`: source evidence or fixtures are still incomplete.

## 2. Root option object

| Legacy field family     | Classification | Nex treatment                                                                                  |
| ----------------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `schemaVersion`         | `map`          | Validate as legacy input version; do not reuse as Nex schema version                           |
| `+<profile name>` keys  | `map`          | Preserve order and assign stable Nex IDs before resolving references                           |
| `-<setting>` keys       | per-field      | Map only inventoried settings; preserve or reject unknown settings explicitly                  |
| Unknown non-prefixed key | `preserve`     | Keep in namespaced import metadata unless later classified as runtime or unsafe                 |

## 3. Common profile fields

| Field         | Classification | Nex treatment                                                                                  |
| ------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `name`        | `map`          | Preserve display name exactly while assigning an independent stable ID                         |
| `profileType` | `map`          | Convert through the explicit legacy profile-type matrix                                        |
| `color`       | `map`          | Preserve familiar UI identity                                                                  |
| `revision`    | `preserve`     | Keep as legacy metadata; never use as Nex revision identity                                     |
| `builtin`     | `investigate`  | Determine whether it belongs to public backup data or derived built-in presentation             |
| `syncOptions` | `ignore-runtime` | Legacy upgrade removes stale values; do not map into profile semantics                         |
| `syncError`   | `ignore-runtime` | Diagnostic/runtime state                                                                        |
| Unknown field | `preserve`     | Preserve opaque data unless it is secret, generated, executable, or unsafe                     |

## 4. FixedProfile

| Field            | Classification | Nex treatment                                                                                  |
| ---------------- | -------------- | ---------------------------------------------------------------------------------------------- |
| `fallbackProxy`  | `map`          | Convert endpoint scheme, host, and port                                                        |
| `proxyForHttp`   | `map`          | Convert endpoint scheme, host, and port                                                        |
| `proxyForHttps`  | `map`          | Convert endpoint scheme, host, and port                                                        |
| `proxyForFtp`    | `map`          | Preserve legacy intent; browser capability may downgrade unsupported FTP-specific behavior      |
| `bypassList`     | `map`          | Preserve ordered conditions and normalize through tested bypass semantics                       |
| `auth` slot map  | `secret-ref`   | Store credential values outside normal ProfileSpec; retain slot association                     |
| Unknown auth slot | `investigate` | Preserve disabled metadata or reject after final compatibility review                           |

Endpoint subfields:

| Field    | Classification | Nex treatment                                                     |
| -------- | -------------- | ----------------------------------------------------------------- |
| `scheme` | `map`          | Validate against supported legacy endpoint schemes                |
| `host`   | `map`          | Normalize carefully while preserving original text for reporting  |
| `port`   | `map`          | Require an integer in valid network-port range                    |

Credential subfields:

| Field      | Classification | Nex treatment                                                               |
| ---------- | -------------- | --------------------------------------------------------------------------- |
| `username` | `secret-ref`   | Move to secret storage; redact from UI summaries, logs, export, and sync    |
| `password` | `secret-ref`   | Move to secret storage; redact from UI summaries, logs, export, and sync    |

## 5. PacProfile and AutoDetectProfile

| Field        | Classification    | Nex treatment                                                                                   |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------- |
| `pacUrl`     | `map`             | Preserve source URL subject to protocol, permission, and security validation                    |
| `pacScript`  | conditional       | `map` when user-authored or no source URL exists; otherwise `ignore-generated` with fallback evidence |
| `headers`    | mixed             | Header names map; sensitive values become `secret-ref`                                           |
| `lastUpdate` | `ignore-generated` | Recomputed update metadata                                                                      |
| `sha256`     | `ignore-generated` | Recomputed verification/cache metadata                                                          |
| Auto-detect alias identity | `preserve` | Map behavior to PAC source while preserving original type in legacy metadata                  |

PAC scripts are executable policy data. Import keeps them inactive until validation and capability review complete.

## 6. SwitchProfile and VirtualProfile

| Field                | Classification | Nex treatment                                                                                 |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `rules`              | `map`          | Preserve array order exactly                                                                  |
| `defaultProfileName` | `map`          | Resolve to a stable ID after all profiles are inventoried                                      |
| Rule `condition`     | `map`          | Convert through explicit condition matrix                                                     |
| Rule `profileName`   | `map`          | Resolve to stable ID; missing reference blocks activation                                      |
| Rule `note`          | `map`          | Preserve user annotation                                                                      |
| Virtual alias identity | `preserve`   | Map to ordered decision profile while preserving original legacy type                         |
| Fabricated missing-reference VirtualProfile | `reject` | Nex never silently creates a replacement for a broken reference                   |

Profile-reference cycles are rejected before compilation.

## 7. RuleListProfile aliases

| Field                | Classification    | Nex treatment                                                                                  |
| -------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `format`             | `map`             | Validate as Switchy or AutoProxy                                                               |
| `sourceUrl`          | `map`             | Preserve source URL with protocol and permission validation                                    |
| `ruleList`           | conditional       | `map` when local/user-authored; otherwise `ignore-generated` with last-known candidate handling |
| `matchProfileName`   | `map`             | Resolve to stable profile ID                                                                   |
| `defaultProfileName` | `map`             | Resolve to stable profile ID                                                                   |
| `headers`            | mixed             | Header names map; sensitive values become `secret-ref`                                         |
| `lastUpdate`         | `ignore-generated` | Recomputed update metadata                                                                     |
| `sha256`             | `ignore-generated` | Recomputed verification/cache metadata                                                         |
| `pacScript`          | `ignore-generated` | Temporary compiled artifact                                                                    |
| Legacy alias identity | `preserve`        | Preserve SwitchyRuleListProfile or AutoProxyRuleListProfile origin                             |

Rules embedded in `ruleList` may introduce extra profile references. They must be parsed before candidate activation.

## 8. Condition fields

| Condition type            | Classification | Nex treatment                                                                                       |
| ------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `TrueCondition`           | `map`          | Exact catch-all                                                                                     |
| `FalseCondition`          | `map`          | Exact never-match; preserve annotation pattern                                                      |
| `HostWildcardCondition`   | `map`          | Preserve legacy wildcard semantics through dedicated vectors                                       |
| `HostRegexCondition`      | `map`          | Validate with a safe deterministic regular-expression policy                                       |
| `UrlWildcardCondition`    | target-dependent | Map with capability report; full HTTPS path behavior may require narrow Firefox handling          |
| `UrlRegexCondition`       | target-dependent | Map with capability report; never justify a global request listener                               |
| `BypassCondition`         | `map`          | Normalize host, wildcard, scheme, port, IP/CIDR, and local-host forms through fixtures              |
| `KeywordCondition`        | target-dependent | Preserve legacy HTTP-only semantics or show explicit downgrade                                    |
| `IpCondition`             | `map`          | Validate address family and prefix length                                                           |
| `HostLevelsCondition`     | `map`          | Preserve dot-count range semantics                                                                  |
| `WeekdayCondition`        | `map`          | Preserve local-time day semantics                                                                   |
| `TimeCondition`           | `map`          | Preserve inclusive local-hour semantics                                                             |
| Unknown condition         | `reject`       | Preserve source in migration report but block activation                                            |
| Invalid legacy regex      | `downgrade`    | Prefer explicit disabled-rule warning rather than silently substituting never-match behavior        |

## 9. Download headers

| Field or case                  | Classification | Nex treatment                                                                                  |
| ------------------------------ | -------------- | ---------------------------------------------------------------------------------------------- |
| Header `name`                  | `map`          | Validate syntax and browser-controlled restrictions                                            |
| Non-sensitive header `value`   | `map`          | Preserve with total count and size limits                                                      |
| Sensitive header `value`       | `secret-ref`   | Store separately and redact everywhere else                                                    |
| Empty header name              | `downgrade`    | Ignore with migration warning, matching observed legacy request behavior                       |
| Duplicate exact header name    | `map`          | Preserve order and report that the final value wins                                            |
| Forbidden or unsafe header     | `reject`       | Preserve inactive metadata and precise reason                                                  |
| Header value containing newline | `reject`      | Block request-smuggling input                                                                  |

## 10. Top-level user settings

| Key                                   | Classification | Nex treatment                                                                                     |
| ------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `-enableQuickSwitch`                  | `map`          | Preserve quick-switch preference                                                                  |
| `-refreshOnProfileChange`             | `map`          | Preserve as explicit optional behavior                                                            |
| `-startupProfileName`                 | `map`          | Resolve to stable ID                                                                              |
| `-quickSwitchProfiles`                | `map`          | Preserve order, remove unresolved entries only with warning                                       |
| `-revertProxyChanges`                 | `map`          | Preserve intent through platform adapter                                                          |
| `-confirmDeletion`                    | `map`          | UI preference                                                                                     |
| `-showInspectMenu`                    | `map`          | UI/integration preference subject to available permissions                                        |
| `-addConditionsToBottom`              | `map`          | Rule-editor preference                                                                            |
| `-showResultProfileOnActionBadgeText` | `map`          | UI preference                                                                                     |
| `-showExternalProfile`                | `map`          | UI/platform preference                                                                            |
| `-downloadInterval`                   | `map`          | Convert minutes into Nex rule-source scheduling policy                                            |
| `-monitorWebRequests`                 | `downgrade`    | Import as disabled and show warning; diagnostics remain explicit and bounded                       |
| `-customCss`                          | `preserve`     | Keep as optional inactive UI migration metadata; do not execute by default                         |
| `-exportLegacyRuleList`               | `investigate`  | Determine whether it affects only export presentation or persistent rule semantics                |
| `-showConditionTypes`                 | `map` or `preserve` | UI presentation preference pending exact current shape                                        |
| `-builtinProfiles`                    | `investigate`  | Inventory customization shape and interaction with built-in direct/system profiles                |
| Unknown setting                       | `preserve`     | Keep namespaced metadata unless unsafe; never silently enable behavior                             |

## 11. Synchronization and account state

| Field                | Classification   | Nex treatment                                                                    |
| -------------------- | ---------------- | -------------------------------------------------------------------------------- |
| `gistId`             | separate account | Do not include in ProfileSpec; may map to optional sync-account settings         |
| `gistToken`          | `secret-ref`     | Separate account secret; never normal export or sync payload                     |
| `syncUsername`       | separate account | Separate account settings                                                        |
| WebDAV token/password | `secret-ref`    | Separate account secret                                                          |
| `syncBackendType`    | separate account | Optional account setting; never routing profile data                             |
| `syncOptions`        | `ignore-runtime` | Device synchronization state                                                     |
| `lastGistCommit`     | `ignore-runtime` | Remote revision cursor                                                           |
| `lastGistState`      | `ignore-runtime` | Last operation status                                                            |
| `lastGistSync`       | `ignore-runtime` | Last operation timestamp                                                         |

Import never silently re-enables a legacy remote sync backend.

## 12. Temporary and diagnostic state

| Field or data family                  | Classification | Nex treatment                                                               |
| ------------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `tempProfileState`                    | `ignore-runtime` | Session/device-only temporary routing state                               |
| `_tempProfile`                        | `ignore-runtime` | May be explicitly converted by the user later                              |
| `_tempProfileActive`                  | `ignore-runtime` | Do not restore from ordinary backup                                        |
| Per-tab request monitor records       | `ignore-runtime` | Never ProfileSpec                                                           |
| Request error counters and badge state | `ignore-runtime` | Recomputed UI/session data                                                |
| `currentProfileName`                  | separate runtime | Restore only through explicit last-active-state policy, not imported routing definition          |
| `isSystemProfile`                     | separate runtime | Device-specific active-state marker                                        |
| `proxyNotControllable`                | `ignore-runtime` | Browser/platform condition                                                  |

## 13. Generated content recovery rule

`ignore-generated` does not mean “delete immediately.” During import:

1. Keep generated content inside the inactive import transaction.
2. Validate the declared source URL and attempt a controlled refresh.
3. If refresh succeeds, use newly verified content and discard the legacy cache.
4. If refresh fails, offer the legacy cached content as a clearly identified recovery candidate.
5. Never activate stale cached content silently.

## 14. Remaining classification blockers

- Exact UI backup/export transformation and whether it serializes all `_options` fields unchanged.
- Full `-builtinProfiles` shape and supported customization semantics.
- Exact `-showConditionTypes` shape.
- Current-browser permissions and private-window behavior for proxy authentication.
- Platform-specific IDN normalization.
- Whether any release-specific fields are injected outside the pinned source paths.

Milestone 2 cannot mark field classification complete until these items are resolved or explicitly deferred with a rejection/downgrade decision.
