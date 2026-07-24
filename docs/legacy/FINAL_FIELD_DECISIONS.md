# Final Legacy Field Decisions

Status: Milestone 2 closeout decisions pinned to ZeroOmega `v3.5.0`.

This document resolves the remaining `investigate` items. Later milestones may refine implementation details, but no field in the pinned schema remains unclassified.

## 1. `-showConditionTypes`

### Source shape

The UI checkbox writes numeric values:

- checked: `1`;
- unchecked: `0`.

The SwitchProfile editor interprets a value greater than zero as a request to expose the advanced condition groups. The value is an editor-presentation preference, not a routing-policy input.

### Automatic override

When a profile already contains a condition outside the basic set, the editor automatically exposes advanced condition types even when the stored preference is zero. This prevents an existing advanced rule from becoming uneditable.

The basic editor set contains:

- `HostWildcardCondition`;
- `UrlWildcardCondition`;
- `UrlRegexCondition`;
- `FalseCondition`.

The advanced editor additionally exposes:

- `HostRegexCondition`;
- `HostLevelsCondition`;
- `IpCondition`;
- `KeywordCondition`;
- `WeekdayCondition`;
- `TimeCondition`.

### Nex classification

`map` as a UI preference named conceptually `showAdvancedConditionTypes`.

Migration rules:

1. Accept numeric `0` and `1` exactly.
2. Accept legacy boolean values only with a normalization warning.
3. Treat other values as invalid UI preference data and fall back to automatic mode.
4. Automatically expose advanced editing whenever imported rules require it.
5. Never remove, downgrade, disable, or reinterpret a rule because this preference is off.
6. Exclude this preference from policy hashes and runtime snapshots.

## 2. `-exportLegacyRuleList`

### Exact effect

This boolean controls only the format of the user-triggered Rule List export button for a SwitchProfile.

When false, export uses the modern SwitchyOmega format:

- filename: `OmegaRules_<profile>.sorl`;
- content generated through the SwitchyOmega conditions composer;
- explicit result profiles and broader condition representation are available.

When true and only basic condition editing is active, export uses the old Proxy Switchy format:

- filename: `SwitchyRules_<profile>.ssrl`;
- `#BEGIN`, `[wildcard]`, `[regexp]`, and `#END` sections;
- `HostWildcardCondition`, `UrlWildcardCondition`, and `UrlRegexCondition` are converted;
- a leading `!` represents a rule targeting the current default result profile.

### Advanced-condition safety behavior

When legacy export is requested but advanced condition types are present or displayed, the UI selects the modern exporter and marks the export action with a warning. The preference therefore does not guarantee that a legacy file will be emitted when the profile cannot be represented safely.

### Nex classification

`map` as an export/UI preference named conceptually `preferLegacyRuleListExport`.

Migration rules:

1. Normalize to boolean.
2. Do not include it in routing policy, compiler input, or runtime snapshot hashes.
3. Never let the preference alter stored rules.
4. Permit legacy export only after a lossless representability check.
5. Fall back to modern export with a visible compatibility report when unsupported conditions, notes, or result semantics would be lost.
6. Keep compiled PAC export and editable Rule List export as separate operations.

## 3. Gist and WebDAV UI fields

The pinned synchronization UI exposes exactly these user inputs:

| UI value | Stored state/backend argument | Classification |
| --- | --- | --- |
| Backend selection `gist` or `webdav` | `syncBackendType` | separate sync-account setting |
| Gist ID/URL or WebDAV base URI | `gistId` | separate sync-account setting; legacy name retained only for import |
| Gist token or WebDAV password/token | `gistToken` | `secret-ref` |
| WebDAV username | `syncUsername` | separate sync-account setting |
| Use built-in sync enhancement | `useBuiltInSync` argument | one-time operation choice, not ProfileSpec |

Derived or transient UI values:

| Value | Decision |
| --- | --- |
| `syncBackendTypeManuallySet` | local controller state only; `ignore-runtime` |
| `gistUrl` | derived display URL; `ignore-generated` |
| `backendTypes` | program constant; not user data |
| `lastGistSync` | operation timestamp; `ignore-runtime` |
| `lastGistState` | operation status; `ignore-runtime` |
| `alertType` | derived presentation state; `ignore-runtime` |
| `enableOptionsSyncing` | in-progress UI flag; `ignore-runtime` |
| `syncOptions` | device/backend state; `ignore-runtime` |
| `web.restoreOnlineUrl` | separate restore-page convenience state; not sync-account data |

No additional durable Gist/WebDAV UI configuration field is present in the pinned controller/template pair.

Nex requirements:

- sync-account configuration remains outside ProfileSpec;
- tokens/passwords become secret references;
- import never silently reconnects or enables a remote backend;
- `useBuiltInSync` is not preserved as a long-lived routing or account preference unless a future Nex sync design gives it a defined meaning;
- legacy field names are translated into provider-neutral account fields.

## 4. Platform-specific IDN normalization

The pinned condition layer does not define an independent cross-browser IDN canonicalization algorithm. Therefore exact Unicode/Punycode equivalence is not a schema fact that Milestone 2 can assert.

### Final classification

`target-dependent`, explicitly deferred to browser-adapter differential testing rather than left as `investigate`.

Nex normalization contract:

1. Preserve the original user string.
2. Produce a canonical ASCII domain through one documented normalization library/policy.
3. Store normalized labels separately from display text.
4. Compare the reference interpreter, PAC execution, Chromium, and Firefox with the existing IDN vectors.
5. Report any target difference before activation.
6. Never silently rewrite the displayed source rule.

This is a resolved defer: the importer can represent the data, while exact backend capability remains a later acceptance gate.

## 5. Unknown or release-specific fields

The target is explicitly pinned to ZeroOmega `v3.5.0`. Fields discovered only in another release do not become implicit schema-v2 behavior.

Final handling policy:

- unknown safe presentation/metadata field: `preserve` in namespaced inactive legacy metadata and warn;
- unknown secret-like field: `secret-ref` or reject when its purpose cannot be determined safely;
- unknown generated/cache field: preserve only inside the inactive import transaction until classified;
- unknown routing, executable, permission, or network-behavior field: `reject` activation;
- unknown top-level runtime/account state: keep outside ProfileSpec or reject when the boundary is unclear.

A future ZeroOmega release requires the documented baseline-update procedure and new fixtures. The importer must not guess based on field names.

## 6. Closure result

For the pinned v3.5.0 compatibility surface:

- every known profile field has a migration class;
- every known condition field has a migration or target-capability class;
- all known top-level user settings are mapped, preserved, downgraded, rejected, or placed outside ProfileSpec;
- generated data, runtime state, synchronization account settings, and secrets have explicit boundaries;
- no field remains classified as `investigate`.

Milestone 3 may now design ProfileSpec from these fixed decisions once the Milestone 1 merge gate is satisfied.

## 7. Pinned source evidence

- `omega-web/src/partials/ui.jade` — numeric `0`/`1` advanced-condition preference.
- `omega-web/src/omega/controllers/switch_profile.coffee` — basic/advanced groups, automatic advanced-mode activation, modern/legacy export handlers, warning fallback, and output filenames.
- `omega-web/src/partials/io.jade` — complete synchronization input and status UI.
- `omega-web/src/omega/controllers/io.coffee` — state loading, backend detection, account arguments, `useBuiltInSync`, and status handling.

No ProfileSpec or importer implementation is introduced by this closeout document.
