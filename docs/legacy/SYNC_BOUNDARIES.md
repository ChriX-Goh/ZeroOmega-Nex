# Legacy Storage and Synchronization Boundaries

Status: source-derived inventory for ZeroOmega `v3.5.0`.

## 1. Why this boundary matters

A compatible importer must distinguish four different classes of data:

1. User configuration that expresses routing intent.
2. Reproducible downloaded or compiled data.
3. Runtime state tied to one browser session or device.
4. Secrets required to access proxies, subscriptions, Gist, or WebDAV.

ZeroOmega stores these classes in related objects, but ZeroOmega Nex must not copy them into one public configuration document.

## 2. Canonical local option object

The legacy options manager treats `_options` as the complete persistent option map. It contains:

- `schemaVersion`.
- User profiles under `+<profile name>` keys.
- User-facing settings under `-<setting>` keys.
- Downloaded rule-list and PAC content attached to profiles.
- Profile authentication and custom download headers when configured.
- Revision and update metadata.

`getAll()` returns this object directly. Reset/import accepts JSON or base64-encoded JSON and writes the parsed object into local option storage after schema upgrade.

This is the primary source shape for a legacy backup, but the exact UI export transform remains a separate open inventory item.

## 3. Generic synchronization transform

Before values enter the synchronization store, the legacy transform applies only these exclusions:

- Drop the top-level `-customCss` value.
- For a profile that has an update URL, drop:
  - `lastUpdate`
  - `ruleList`
  - `pacScript`
  - `sha256`

Other profile fields are copied unchanged by the observed generic transform.

Consequences:

- Proxy endpoint configuration remains synchronized.
- Profile `auth` remains synchronized by this transform.
- Custom profile `headers` remain synchronized by this transform.
- Profile names, colors, revisions, references, source URLs, and user settings remain synchronized.
- Downloaded content for remotely updatable profiles is expected to be fetched again on another device.

No encryption or secret-redaction step was found in the observed generic option transform or backend serialization path.

## 4. Synchronization staging

The browser sync implementation does not use browser `storage.sync` as the remote transport. It stages transformed options in an IndexedDB store and then pushes the complete staged object to the selected backend.

Observed behavior:

- Every changed key is stored as a normal key-value pair.
- Pushes serialize the complete current staging store.
- Pulls replace or diff local staging entries against the remote JSON object.
- A five-minute alarm checks remote changes while synchronization is enabled.
- Commit and error metadata are stored separately as runtime state.

This means backend upload security determines the confidentiality of the remote option document.

## 5. Gist backend

The Gist backend:

- Stores synchronization configuration separately as Gist ID and token state.
- Sends the token through an HTTP Authorization header.
- Reads and writes a file named `ZeroOmega.json`.
- Uploads the complete option object as pretty-printed JSON.
- Uses Gist commit versions for change tracking.

The observed backend does not encrypt the JSON content before upload.

Security implication:

If transformed profile data still contains `auth` or sensitive subscription headers, those values are serialized into the remote JSON document. Whether a Gist is public or secret does not make plaintext secret storage equivalent to encrypted secret storage.

## 6. WebDAV backend

The WebDAV backend:

- Stores URI, username, and token separately as synchronization state.
- Negotiates Basic or Bearer authentication.
- Creates a `zeroomega/` directory.
- Uploads option snapshots as `zeroomega-<commit>.json`.
- Stores the current commit identifier in `zeroomega-commit.txt`.
- Deletes the previous snapshot after a successful replacement.

The observed backend does not encrypt option JSON before upload.

The WebDAV connection may itself use HTTPS, but transport encryption does not protect secrets from the configured WebDAV server, server administrators, backups, or later server compromise.

## 7. Synchronization account state

The following values belong to account/runtime state rather than portable proxy ProfileSpec:

- `gistId`
- `gistToken`
- `syncUsername`
- `syncBackendType`
- `syncOptions`
- `lastGistCommit`
- `lastGistState`
- `lastGistSync`

Nex classification:

- Remote backend type and non-secret endpoint identity may belong to a separate account-settings model.
- Tokens and WebDAV credentials are secrets and must never enter normal ProfileSpec.
- Commit, status, conflict, and last-sync values are runtime metadata.
- Importing a legacy backup must not silently enable remote synchronization.

## 8. Temporary rules and session state

The browser-specific implementation stores temporary-rule state under `tempProfileState` in browser session storage. It includes:

- A temporary SwitchProfile-like object.
- Whether that temporary profile is active.

This state is reconstructed after extension background initialization but is not part of the normal option map.

Nex classification:

- Temporary rules are session/device state, not ordinary exported ProfileSpec.
- A future explicit “save temporary rules” command may convert selected entries into user configuration.
- Importing legacy options must not invent or activate temporary rules unless a separately identified session-state export is supplied.

## 9. Network-monitor state

The legacy request monitor and its per-tab data are runtime-only browser state. They are created when monitoring is enabled or when a network-inspection UI connects.

The option `-monitorWebRequests` can request that behavior, but the collected request records themselves are not canonical profile configuration.

Nex classification:

- Legacy `-monitorWebRequests`: `downgrade` to disabled with a migration warning.
- Per-request/per-tab monitor data: `ignore-runtime`.
- Diagnostics in Nex remain opt-in, time-limited, bounded, and separate from ProfileSpec.

## 10. Nex public-data classification

| Legacy field family                                 | Nex treatment                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Profile structure, names, colors, ordering          | `map`                                                                         |
| Proxy endpoints, bypass rules, rule sources         | `map`                                                                         |
| Startup and quick-switch choices                    | `map`                                                                         |
| Downloaded `ruleList` or remote `pacScript`         | `ignore-generated` when a valid source URL exists; preserve candidate on loss |
| `lastUpdate` and `sha256`                           | `ignore-generated`                                                            |
| Profile `revision`                                  | `preserve` as legacy metadata; do not use as Nex revision ID                  |
| Proxy usernames and passwords                       | import into secret storage and replace with credential references             |
| Sensitive custom header values                      | import into secret storage and replace with secret references                 |
| Gist/WebDAV backend tokens and passwords            | separate account-secret storage; never ProfileSpec                            |
| Sync commit, conflict, status, and timestamp fields | `ignore-runtime`                                                              |
| Temporary profile/session state                     | `ignore-runtime` unless explicitly converted by the user                      |
| Network-monitor records                             | `ignore-runtime`                                                              |
| `-monitorWebRequests`                               | `downgrade` to disabled with warning                                          |
| `-customCss`                                        | preserve only as optional UI migration metadata; never executable remote code |

The final ProfileSpec vocabulary may rename these statuses, but the data boundaries are binding.

## 11. Required Nex migration behavior

1. Parse legacy options as untrusted input.
2. Detect credential and sensitive-header values before displaying or logging imported content.
3. Show a secret-import warning and require explicit acknowledgement.
4. Store imported secret values through a secret-storage abstraction.
5. Replace inline values with opaque references in the candidate ProfileSpec.
6. Keep remote synchronization disabled after import.
7. Exclude secret values from ordinary export and sync.
8. Exclude generated and runtime fields from normal export.
9. Retain enough legacy metadata to explain each omission or downgrade.
10. Never upload a migrated configuration to a remote backend until the user configures a new Nex sync policy.

## 12. Export boundary still open

The source reviewed here establishes local option and synchronization behavior. It does not yet prove the exact field filtering used by every UI backup/export path.

Until that path is inventoried:

- Assume a legacy backup may contain plaintext credentials and headers.
- Treat every imported file as sensitive.
- Do not claim that legacy export and legacy synchronization include exactly the same fields.
- Keep the “export-versus-sync” Milestone 2 item open.
