# ZeroOmega Schema Version 2 Inventory

Status: source-derived inventory for Milestone 2. No importer behavior is implemented in this branch.

## 1. Container shape

A schema-v2 export is a JSON object:

- `schemaVersion` identifies the public schema.
- Keys beginning with `+` contain user profiles.
- Keys beginning with `-` contain user-facing options.
- Built-in `direct` and `system` profiles exist in the model but are normally not stored as ordinary `+` entries.
- Profile references are stored by display name rather than stable ID.

This name-based reference model requires the Nex importer to assign stable IDs before resolving references.

## 2. Profile type identifiers

The upstream source recognizes ten identifiers backed by six core handlers.

| Legacy identifier          | Core semantics                                                    | Stored fields observed or required                                                             | Initial classification                                                       |
| -------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `SystemProfile`            | Release extension control to browser/system proxy                 | `name`, `profileType`, `color` for built-in model                                              | Built-in; map to platform control mode                                       |
| `DirectProfile`            | Always return direct connection                                   | `name`, `profileType`, `color` for built-in model                                              | Built-in; exact                                                              |
| `FixedProfile`             | Per-scheme or fallback proxy with bypass rules                    | `fallbackProxy`, `proxyForHttp`, `proxyForHttps`, `proxyForFtp`, `bypassList`, optional `auth` | User intent; exact where browser supports endpoint                           |
| `PacProfile`               | User-supplied or downloaded PAC                                   | `pacUrl`, `pacScript`                                                                          | User intent plus fetched content; capability/security review required        |
| `AutoDetectProfile`        | Alias of `PacProfile`                                             | Usually `pacUrl`, historically WPAD                                                            | Legacy alias; preserve source type in import metadata                        |
| `SwitchProfile`            | Ordered rules followed by default profile                         | `rules`, `defaultProfileName`                                                                  | User intent; rule order is binding                                           |
| `VirtualProfile`           | Alias of `SwitchProfile`, also used as missing-reference fallback | `rules`, `defaultProfileName`                                                                  | Legacy alias; import explicitly, never create silently for broken references |
| `RuleListProfile`          | Downloaded/local rule list mapped to match/default profiles       | `format`, `sourceUrl`, `ruleList`, `matchProfileName`, `defaultProfileName`                    | User intent plus fetched/derived data                                        |
| `SwitchyRuleListProfile`   | Alias of `RuleListProfile` with `Switchy` format default          | Same as rule-list profile                                                                      | Legacy alias                                                                 |
| `AutoProxyRuleListProfile` | Alias of `RuleListProfile` with `AutoProxy` format default        | Same as rule-list profile                                                                      | Legacy alias                                                                 |

Common profile fields:

- `name`: user-visible reference name.
- `profileType`: identifier above.
- `color`: UI identity and compatibility field.
- `revision`: upstream conflict/sync revision; preserve during import metadata but do not use as Nex revision identity.

### Fixed proxy endpoint shape

An endpoint is represented as:

```json
{
  "scheme": "http | https | socks4 | socks5",
  "host": "proxy.example",
  "port": 8080
}
```

`fallbackProxy` applies when no scheme-specific endpoint exists. The legacy PAC result mapping is:

- `http` → `PROXY`
- `https` → `HTTPS`
- `socks4` → `SOCKS`
- `socks5` → `SOCKS5`

Authentication shape still requires a dedicated source/UI inventory. The profile matcher checks keys corresponding to per-scheme properties, `fallbackProxy`, and `all`; no Nex credential model should be inferred before fixtures confirm serialized values.

## 3. Condition type identifiers

| Condition               | Primary fields                        | Observable semantics                                                            | Initial backend expectation                          |
| ----------------------- | ------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| `TrueCondition`         | no required pattern                   | Always matches                                                                  | Exact                                                |
| `FalseCondition`        | optional `pattern` used as annotation | Never matches                                                                   | Exact                                                |
| `UrlRegexCondition`     | `pattern`                             | JavaScript regular expression against full request URL                          | Target-dependent for HTTPS path visibility           |
| `UrlWildcardCondition`  | `pattern`                             | Shell wildcard converted to regular expression against URL; `                   | ` separates alternatives                             | Target-dependent for HTTPS path visibility |
| `HostRegexCondition`    | `pattern`                             | JavaScript regular expression against hostname                                  | Exact subject to safe-regex policy                   |
| `HostWildcardCondition` | `pattern`                             | Legacy wildcard rules, including special `*.`, `**.`, and leading-dot behavior  | Exact after dedicated vectors                        |
| `BypassCondition`       | `pattern`                             | Chrome-style bypass syntax: host, wildcard, scheme, port, IP/CIDR, or `<local>` | Exact only after normalization/platform tests        |
| `KeywordCondition`      | `pattern`                             | HTTP-only substring match against URL                                           | Target-dependent; legacy HTTP restriction is binding |
| `IpCondition`           | `ip`, `prefixLength`                  | Match literal IPv4/IPv6 host inside subnet                                      | Capability-tested PAC/native implementation          |
| `HostLevelsCondition`   | `minValue`, `maxValue`                | Match hostname dot-count range                                                  | Exact                                                |
| `WeekdayCondition`      | `days` or `startDay`, `endDay`        | Local-time weekday match                                                        | Exact with explicit local-time semantics             |
| `TimeCondition`         | `startHour`, `endHour`                | Local-time hour range, inclusive                                                | Exact with explicit local-time semantics             |

### Important legacy semantics

- Unknown condition types throw an error in the upstream matcher.
- Invalid regular expressions become a never-match expression rather than rejecting the configuration.
- `HostWildcardCondition` is not ordinary glob syntax and needs its own test table.
- `<local>` matches `127.0.0.1`, `::1`, and hosts without a dot.
- `BypassCondition` may include a scheme and port and may therefore compile against URL instead of host.
- `IpCondition` distinguishes IPv4 and IPv6 and supports prefix length zero.
- Weekday and time rules use the browser's local clock, not UTC.

Nex must decide each invalid-input behavior explicitly rather than reproducing it accidentally.

## 4. Switch profile rules

A switch rule has this public shape:

```json
{
  "condition": {
    "conditionType": "HostWildcardCondition",
    "pattern": "*.example.com"
  },
  "profileName": "proxy",
  "note": "optional user note"
}
```

Rules are evaluated in array order. The first match wins. If no rule matches, `defaultProfileName` is selected.

Compatibility requirements:

- Preserve array order exactly.
- Preserve `note` and source text where present.
- Resolve `profileName` and `defaultProfileName` only after all profiles receive stable IDs.
- Missing references must produce a migration error or explicit disabled item. Nex must not silently fabricate a `VirtualProfile` fallback.
- Cycles must be detected before compilation.

## 5. Rule-list formats

The upstream supports two named formats.

### `AutoProxy`

- Detects plain `[AutoProxy` headers or base64 text beginning with the encoded header prefix.
- Decodes base64 before parsing when detected.
- Ignores blank lines, comments beginning with `!`, and section headers.
- `@@` rules target the default profile and are moved before normal rules.
- `/.../` becomes `UrlRegexCondition`.
- `||domain` becomes `HostWildcardCondition` with `*.domain`.
- `|prefix` becomes a URL wildcard with trailing `*`.
- Lines without `*` become `KeywordCondition`.
- Other wildcard lines become HTTP URL wildcard rules.

### `Switchy`

Supports:

1. Modern `[SwitchyOmega Conditions]` format.
2. Legacy `#BEGIN` format with `WILDCARD` and `REGEXP` sections.
3. `@with result` / `@with results` rules carrying explicit result profile names.
4. `@note` metadata for the next rule.
5. Exclusive rules marked with `!`.

Rule-list parsing can introduce references to profiles beyond `matchProfileName` and `defaultProfileName`, so reference discovery must parse content before activation.

## 6. Top-level settings discovered

### Defined by default options

| Key                                   | Default | Classification                                                     |
| ------------------------------------- | ------: | ------------------------------------------------------------------ |
| `-enableQuickSwitch`                  | `false` | User preference                                                    |
| `-refreshOnProfileChange`             |  `true` | User preference; behavior must be reconsidered, not blindly copied |
| `-startupProfileName`                 |   empty | User intent                                                        |
| `-quickSwitchProfiles`                |    `[]` | Ordered user intent                                                |
| `-revertProxyChanges`                 |  `true` | User preference/platform behavior                                  |
| `-confirmDeletion`                    |  `true` | UI preference                                                      |
| `-showInspectMenu`                    |  `true` | UI/integration preference                                          |
| `-addConditionsToBottom`              | `false` | UI editing preference                                              |
| `-showResultProfileOnActionBadgeText` | `false` | UI preference                                                      |
| `-showExternalProfile`                |  `true` | UI/platform preference                                             |
| `-downloadInterval`                   |  `1440` | Rule-source update preference, minutes                             |

### Seen in current code or recent schema-v2 exports

These require source-by-source classification before importer completion:

- `-builtinProfiles`
- `-customCss`
- `-exportLegacyRuleList`
- `-monitorWebRequests`
- `-showConditionTypes`

`-monitorWebRequests` is migration data only. Nex diagnostics are opt-in and bounded; importing `true` must not enable permanent all-request monitoring.

## 7. User intent, fetched data, and derived data

### Stable user intent candidates

- Profile identity, display order, name, color, and type.
- Proxy endpoints and bypass rules.
- Switch rules, notes, order, and profile references.
- Rule-list source URL, format, match/default targets, and custom request headers once inventoried.
- PAC source URL or explicitly embedded user PAC.
- Startup and quick-switch choices.

### Fetched or cached content

- `ruleList`
- downloaded `pacScript`
- `lastUpdate`
- `sha256`

The upstream sync transform excludes `lastUpdate`, `ruleList`, `pacScript`, and `sha256` for URL-updatable profiles. This is evidence that these fields are not always canonical user intent, but backup/export behavior still needs fixture confirmation.

### Runtime/platform state kept outside options

The upstream options manager also uses separate state keys, including current profile, system-profile status, first-run state, sync status, Gist credentials, backend type, and related sync metadata. These must not be mistaken for schema-v2 profile data.

## 8. Import classification vocabulary

Every discovered field must receive one status before Milestone 2 closes:

- `map`: convert to a first-class ProfileSpec field.
- `preserve`: retain as namespaced opaque legacy metadata.
- `ignore-generated`: exclude because it is reproducible cache/runtime output.
- `downgrade`: transform with a visible semantic warning.
- `reject`: unsafe or impossible to represent; block activation with precise reason.
- `investigate`: not yet enough evidence.

## 9. Open inventory items

- Serialized authentication values and browser credential behavior.
- Custom headers for rule-list downloads introduced before v3.5.0.
- Exact backup/export inclusion rules versus sync filtering.
- `-builtinProfiles` customization shape.
- Gist/WebDAV sync configuration boundaries and secret handling.
- Temporary rules, network monitor data, and whether any appear in user exports.
- IDN normalization differences between Chromium and Firefox.
- PAC profile behavior for `file:` URLs and browser-specific PAC installation.
- Real-world malformed or stale references.

No importer schema should be finalized until these items have source evidence and fixtures.
