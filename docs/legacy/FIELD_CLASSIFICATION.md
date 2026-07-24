# Legacy Field Classification

Status: final Milestone 2 contract for ZeroOmega `v3.5.0` schema-v2 data.

## 1. Classification values

- `map`: convert into a first-class Nex ProfileSpec or user-setting field.
- `preserve`: retain as namespaced legacy metadata because it may matter for diagnostics or future export.
- `secret-ref`: import into secret storage and place only an opaque reference in ordinary configuration.
- `ignore-generated`: omit from normal imported configuration because it is reproducible downloaded, derived, or compiled data.
- `ignore-runtime`: omit because it belongs to a browser session, device, sync transaction, or diagnostic run.
- `target-dependent`: represent the source semantics, but require backend capability evidence before exact activation.
- `separate account`: store in optional provider-neutral synchronization account settings outside ProfileSpec.
- `separate runtime`: store only through an explicit active-state policy outside ProfileSpec.
- `operation-only`: one-time UI/operation input that is not persistent profile or account intent.
- `downgrade`: convert to safer or narrower behavior and show a migration warning.
- `reject`: preserve source evidence but block activation because safe or deterministic representation is unavailable.

No pinned v3.5.0 field remains classified as `investigate`.

## 2. Root option object

| Legacy field family | Classification | Nex treatment |
| --- | --- | --- |
| `schemaVersion` | `map` | Validate as legacy input version; do not reuse as Nex schema version |
| `+<profile name>` keys | `map` | Preserve order and assign stable Nex IDs before resolving references |
| `-<setting>` keys | per-field | Apply the explicit setting decisions below |
| Unknown non-prefixed key | conditional | Preserve safe metadata; reject routing/executable/network behavior; isolate secrets |

## 3. Common profile fields

| Field | Classification | Nex treatment |
| --- | --- | --- |
| `name` | `map` | Preserve display name exactly while assigning an independent stable ID |
| `profileType` | `map` | Convert through the explicit legacy profile-type matrix |
| `color` | `map` | Preserve familiar UI identity |
| `revision` | `preserve` | Keep as legacy metadata; never use as Nex revision identity |
| `builtin` | conditional | Verify built-in appearance metadata; reject attempts to make an ordinary profile authoritative |
| `syncOptions` | `ignore-runtime` | Legacy upgrade residue; not profile semantics |
| `syncError` | `ignore-runtime` | Diagnostic/runtime state |
| Unknown field | conditional | Preserve safe metadata; isolate secrets; quarantine generated values; reject executable/routing behavior |

## 4. FixedProfile

| Field | Classification | Nex treatment |
| --- | --- | --- |
| `fallbackProxy` | `map` | Convert endpoint scheme, host, and port |
| `proxyForHttp` | `map` | Convert endpoint scheme, host, and port |
| `proxyForHttps` | `map` | Convert endpoint scheme, host, and port |
| `proxyForFtp` | `map` | Preserve intent; browser capability may downgrade FTP-specific behavior |
| `bypassList` | `map` | Preserve order and normalize through tested Bypass semantics |
| `auth` slot map | `secret-ref` | Store credential values outside ProfileSpec while retaining endpoint-slot association |
| Unknown auth slot | `reject` | Preserve inactive metadata and block use until a defined endpoint association exists |

Endpoint subfields:

| Field | Classification | Nex treatment |
| --- | --- | --- |
| `scheme` | `map` | Validate against supported legacy endpoint schemes |
| `host` | `map` | Preserve original text and produce explicit normalized representation |
| `port` | `map` | Require an integer in `1..65535`; never infer a fallback from malformed input |

Credential subfields:

| Field | Classification | Nex treatment |
| --- | --- | --- |
| `username` | `secret-ref` | Move to secret storage; redact from UI summaries, logs, export, and sync |
| `password` | `secret-ref` | Move to secret storage; redact from UI summaries, logs, export, and sync |

Browser-only authentication is capability-gated. HTTP/HTTPS proxy challenges are supported by the later authentication adapter; SOCKS credentials remain unsupported without a verified native backend.

## 5. PacProfile and AutoDetectProfile

| Field | Classification | Nex treatment |
| --- | --- | --- |
| `pacUrl` | `map` | Preserve source URL subject to protocol, permission, and security validation |
| `pacScript` | conditional | `map` when user-authored/no source URL; otherwise `ignore-generated` with recovery evidence |
| `headers` | mixed | Header names map; sensitive values become `secret-ref` |
| `lastUpdate` | `ignore-generated` | Recomputed update metadata |
| `sha256` | `ignore-generated` | Recomputed verification/cache metadata |
| Auto-detect alias identity | `preserve` | Map behavior to PAC source while preserving original legacy type |

PAC scripts are executable policy data and remain inactive until validation and capability review complete.

## 6. SwitchProfile and VirtualProfile

| Field | Classification | Nex treatment |
| --- | --- | --- |
| `rules` | `map` | Preserve array order exactly |
| `defaultProfileName` | `map` | Resolve to a stable ID after all profiles are inventoried |
| Rule `condition` | `map` | Convert through the explicit condition matrix |
| Rule `profileName` | `map` | Resolve to stable ID; missing reference blocks activation |
| Rule `note` | `map` | Preserve user annotation |
| Virtual alias identity | `preserve` | Map to ordered decision profile while preserving original type |
| Fabricated missing-reference VirtualProfile | `reject` | Never silently create a replacement for a broken reference |

Profile-reference cycles are rejected before compilation.

## 7. RuleListProfile aliases

| Field | Classification | Nex treatment |
| --- | --- | --- |
| `format` | `map` | Validate as Switchy or AutoProxy |
| `sourceUrl` | `map` | Preserve source URL with protocol and permission validation |
| `ruleList` | conditional | `map` when local/user-authored; otherwise `ignore-generated` with recovery handling |
| `matchProfileName` | `map` | Resolve to stable profile ID |
| `defaultProfileName` | `map` | Resolve to stable profile ID |
| `headers` | mixed | Header names map; sensitive values become `secret-ref` |
| `lastUpdate` | `ignore-generated` | Recomputed update metadata |
| `sha256` | `ignore-generated` | Recomputed verification/cache metadata |
| `pacScript` | `ignore-generated` | Temporary compiled artifact |
| Legacy alias identity | `preserve` | Preserve SwitchyRuleListProfile or AutoProxyRuleListProfile origin |

Embedded rule-list content must be parsed before activation because it can introduce additional profile references.

## 8. Condition fields

| Condition type | Classification | Nex treatment |
| --- | --- | --- |
| `TrueCondition` | `map` | Exact catch-all |
| `FalseCondition` | `map` | Exact never-match; preserve annotation pattern |
| `HostWildcardCondition` | `map` | Preserve legacy wildcard semantics through vectors |
| `HostRegexCondition` | `map` | Validate with a safe deterministic regular-expression policy |
| `UrlWildcardCondition` | `target-dependent` | Map with capability report; HTTPS path behavior may need narrow Firefox handling |
| `UrlRegexCondition` | `target-dependent` | Map with capability report; never justify a global request listener |
| `BypassCondition` | `map` | Normalize host, wildcard, scheme, port, IP/CIDR, and `<local>` forms through fixtures |
| `KeywordCondition` | `target-dependent` | Preserve legacy HTTP-only semantics or show explicit downgrade |
| `IpCondition` | `map` | Validate family and prefix length; literal matching performs no DNS resolution |
| `HostLevelsCondition` | `map` | Preserve hostname dot-count range semantics |
| `WeekdayCondition` | `map` | Preserve explicit local-time day semantics |
| `TimeCondition` | `map` | Preserve inclusive local-hour semantics |
| Unknown condition | `reject` | Preserve source in report but block activation |
| Invalid legacy regex | `downgrade` | Disable with warning instead of silently substituting never-match behavior |

IDN display text is preserved and canonical ASCII labels are produced separately. Exact Unicode/Punycode backend equivalence is `target-dependent` and requires Chromium/Firefox differential vectors.

## 9. Download headers

| Field or case | Classification | Nex treatment |
| --- | --- | --- |
| Header `name` | `map` | Validate syntax and browser-controlled restrictions |
| Non-sensitive header `value` | `map` | Preserve with count and size limits |
| Sensitive header `value` | `secret-ref` | Store separately and redact everywhere else |
| Empty header name | `downgrade` | Ignore with migration warning, matching observed request behavior |
| Duplicate exact header name | `map` | Preserve order and report that the final value wins |
| Forbidden or unsafe header | `reject` | Preserve inactive metadata and precise reason |
| Header value containing newline | `reject` | Block request-smuggling input |

## 10. Top-level user settings

| Key | Classification | Nex treatment |
| --- | --- | --- |
| `-enableQuickSwitch` | `map` | Preserve quick-switch preference |
| `-refreshOnProfileChange` | `map` | Preserve as explicit optional behavior |
| `-startupProfileName` | `map` | Resolve to stable ID |
| `-quickSwitchProfiles` | `map` | Preserve order; unresolved entries require warning |
| `-revertProxyChanges` | `map` | Preserve intent through platform adapter |
| `-confirmDeletion` | `map` | UI preference |
| `-showInspectMenu` | `map` | UI/integration preference subject to available permissions |
| `-addConditionsToBottom` | `map` | Rule-editor preference |
| `-showResultProfileOnActionBadgeText` | `map` | UI preference |
| `-showExternalProfile` | `map` | UI/platform preference |
| `-downloadInterval` | `map` | Convert minutes into Nex rule-source scheduling policy |
| `-monitorWebRequests` | `downgrade` | Import disabled with warning; diagnostics remain explicit and bounded |
| `-customCss` | `preserve` | Keep as inactive UI migration metadata; do not execute by default |
| `-exportLegacyRuleList` | `map` | Boolean export-format preference only; legacy output requires lossless representability |
| `-showConditionTypes` | `map` | Normalize legacy numeric `0/1` to advanced-editor preference; never affect routing |
| `-builtinProfiles` | `map` | Extract valid Direct/System colors into appearance settings |
| Unknown setting | conditional | Preserve safe metadata; isolate secrets; reject behavior-changing unknowns |

`-showConditionTypes` is automatically overridden in the editor when existing advanced rules require visibility. `-exportLegacyRuleList` never changes stored rules or runtime policy and falls back to modern export with warning when legacy output would be lossy.

## 11. Built-in profile appearance

| Field or case | Classification | Nex treatment |
| --- | --- | --- |
| `-builtinProfiles['+direct'].color` | `map` | Map to Direct appearance color with default fallback |
| `-builtinProfiles['+system'].color` | `map` | Map to System appearance color with default fallback |
| Built-in `name`, `profileType`, `builtin` | `preserve` | Verify for reporting but never accept as routing authority |
| Unknown built-in key | `preserve` | Keep inactive metadata and warn; do not create a built-in route |
| Routing-like field in customization | `reject` | Block attempts to alter routing through appearance data |
| Missing or invalid built-in color | `downgrade` | Use Nex default and report invalid customization |

Built-in color changes are UI-only and must not compile or activate a runtime snapshot.

## 12. Synchronization and account state

| Field | Classification | Nex treatment |
| --- | --- | --- |
| `syncBackendType` | `separate account` | Provider type `gist` or `webdav` outside ProfileSpec |
| `gistId` | `separate account` | Translate legacy name into provider-neutral remote URI |
| `gistToken` | `secret-ref` | Separate account secret; never normal export or sync payload |
| `syncUsername` | `separate account` | Optional WebDAV username |
| `useBuiltInSync` | `operation-only` | One-time enable/conflict action choice; not persistent profile/account intent |
| `syncBackendTypeManuallySet` | `ignore-runtime` | Controller-only backend-detection flag |
| `gistUrl` | `ignore-generated` | Derived display link |
| `backendTypes` | program constant | Not user data |
| `syncOptions` | `ignore-runtime` | Device synchronization state |
| `lastGistCommit` | `ignore-runtime` | Remote revision cursor |
| `lastGistState` | `ignore-runtime` | Last operation status |
| `lastGistSync` | `ignore-runtime` | Last operation timestamp |
| `alertType` | `ignore-runtime` | Derived presentation state |
| `enableOptionsSyncing` | `ignore-runtime` | In-progress UI flag |
| `web.restoreOnlineUrl` | separate restore UI state | Convenience value unrelated to sync account or ProfileSpec |

No additional durable Gist/WebDAV UI field exists in the pinned controller/template pair. Import never silently reconnects or enables a remote backend.

## 13. Temporary and diagnostic state

| Field or data family | Classification | Nex treatment |
| --- | --- | --- |
| `tempProfileState` | `ignore-runtime` | Session/device-only temporary routing state |
| `_tempProfile` | `ignore-runtime` | May be explicitly converted by the user later |
| `_tempProfileActive` | `ignore-runtime` | Do not restore from ordinary backup |
| Per-tab request monitor records | `ignore-runtime` | Never ProfileSpec |
| Request error counters and badge state | `ignore-runtime` | Recomputed UI/session data |
| `currentProfileName` | `separate runtime` | Restore only through explicit last-active-state policy |
| `isSystemProfile` | `separate runtime` | Device-specific active-state marker |
| `proxyNotControllable` | `ignore-runtime` | Browser/platform condition |

## 14. Generated content recovery rule

`ignore-generated` does not mean immediate deletion. During import:

1. Keep generated content inside the inactive import transaction.
2. Validate the source URL and attempt a controlled refresh.
3. Use newly verified content when refresh succeeds.
4. Offer legacy cache only as a clearly identified recovery candidate when refresh fails.
5. Never activate stale cached content silently.

## 15. Unknown and future-release fields

The target is pinned to v3.5.0. Unknown fields are handled by risk, not by name guessing:

- safe presentation/metadata: `preserve` in namespaced inactive metadata;
- secret-like: `secret-ref` or `reject` when purpose is unclear;
- generated/cache: quarantine inside the inactive transaction until classified;
- routing, executable, permission, or network behavior: `reject` activation;
- unclear runtime/account state: keep outside ProfileSpec or reject.

A future ZeroOmega release requires a baseline update and new fixtures before importer behavior changes.

## 16. Closure

Every known v3.5.0 field now has a migration, capability, or rejection decision. The machine-readable fixture `fixtures/capabilities/legacy-final-field-decisions.json` must keep `remainingInvestigateFields` empty.
