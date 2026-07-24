# ZeroOmega Backup and Restore Boundaries

Status: source-derived inventory pinned to ZeroOmega `v3.5.0`.

## 1. Backup export path

The options UI implements backup export in `omega-web/src/omega/controllers/io.coffee`.

The observable sequence is:

1. Validate and, when necessary, apply pending UI edits through `applyOptionsConfirm()`.
2. Clone `$rootScope.options` through Angular JSON serialization.
3. Serialize the entire cloned object with `JSON.stringify`.
4. Create a UTF-8 plain-text Blob.
5. Download it as `ZeroOmegaOptions-<ISO timestamp>.bak`.

There is no call to `transformValueForSync` and no backup-specific redaction or cache filtering in this path.

## 2. Source of the exported object

`$rootScope.options` is populated from the background `getAll` call through the web bridge. The background options manager returns its canonical `_options` object.

Consequently, a legacy backup can contain every property currently stored inside the option container, including:

- `schemaVersion`;
- all ordinary `+profile` objects;
- top-level `-setting` values;
- proxy endpoints;
- ordered switch rules and profile references;
- inline proxy `auth` objects;
- custom download `headers`;
- downloaded `ruleList` content;
- downloaded or embedded `pacScript` content;
- `lastUpdate` and `sha256` cache metadata;
- custom CSS and other option-container preferences;
- unknown fields already present inside the option container.

This differs from legacy remote synchronization, where URL-updatable cache fields and custom CSS are filtered before upload.

## 3. Secrets included in backup files

Because export serializes the option container without redaction, the following values are included when present:

- proxy usernames and passwords stored under profile `auth` slots;
- sensitive custom request-header values stored under profile `headers`, including authorization or cookie values;
- any future secret-like value placed directly inside an option or profile object.

A `.bak` file must therefore be treated as a secret-bearing file even though its MIME type is plain text.

ZeroOmega Nex compatibility requirements:

1. Accept these values during explicit legacy import so the user's profile can be reconstructed.
2. Mark the import report as containing secrets.
3. Move imported secret values into the Nex secret store and replace them with opaque references.
4. Never reproduce them in ordinary ProfileSpec export, sync, logs, diagnostics, crash reports, or migration reports.
5. Require an explicit, separately protected secret-inclusive export mode if such a feature is ever added.

## 4. Data excluded from ordinary backups

Several important values are stored through the separate state API rather than in `$rootScope.options`. They are not included by the observed ordinary backup path:

- Gist ID/URI, Gist token, WebDAV username, WebDAV token/password, and selected sync backend state;
- current profile and system-profile runtime status;
- temporary-profile state stored in session storage;
- network-monitor request records and open diagnostic-port state;
- first-run flags, last sync status, last commit IDs, and similar device/runtime state;
- local page navigation state such as the last options URL.

The backup can therefore restore profiles while still being unable to recreate the complete synchronization account or current runtime session.

## 5. Apply-before-export behavior

Export calls `applyOptionsConfirm()` first.

- If the form is invalid, export is rejected.
- If there are no unsaved changes, the current background-backed options are exported.
- If there are unsaved changes, the user must confirm applying them; the patch is sent to the background before serialization continues.

The resulting file is intended to represent the UI's confirmed option state rather than an arbitrary unsaved draft.

## 6. Local restore path

Local restore reads the selected file as text and passes the text to the background `reset` operation.

The background parser accepts:

- a JSON object/string beginning with `{`; or
- a base64-encoded string that decodes to JSON.

The reset operation then:

1. parses and upgrades the supplied options;
2. disables synchronization during the reset;
3. removes the existing local option store;
4. writes the imported option object;
5. reinitializes the options manager;
6. applies the imported startup profile when one is configured.

This is a destructive full-container replacement, not a merge.

Nex must import into an inactive candidate revision and must not copy this destructive behavior directly.

## 7. Online restore path

The UI also accepts a user-provided URL, downloads it with an ordinary GET request as text, and passes the response to the same reset path.

Observed behavior:

- no backup-specific authentication model;
- no integrity hash or signature verification;
- a ten-second UI request timeout;
- the downloaded content receives the same JSON/base64 parsing and full-reset treatment as a local file.

Nex requirements:

- online import remains untrusted input;
- enforce scheme, size, redirect, timeout, and content-type policies;
- parse into an inactive candidate;
- show a migration/security report before activation;
- never allow remote content to overwrite active configuration directly.

## 8. PAC export is a separate operation

The options UI also supports exporting one selected effective profile as a generated PAC file named `OmegaProfile_<sanitized profile name>.pac`.

This is not a configuration backup. It compiles the selected profile graph and does not preserve editable Profile objects, UI settings, credentials, rule-source metadata, or synchronization state.

Nex must keep configuration export and compiled-runtime export as visibly separate operations.

## 9. Field handling consequences

| Legacy data | Present in ordinary `.bak` | Nex migration handling |
| --- | --- | --- |
| Profile names, colors, types, endpoints, ordered rules | Yes | `map` |
| Startup and quick-switch settings | Yes | `map` |
| Proxy credentials | Yes when configured | `secret-ref` after explicit import |
| Sensitive custom headers | Yes when configured | `secret-ref` after explicit import |
| Downloaded rule/PAC content and hashes | Yes when present | `ignore-generated` or retain only as quarantined import evidence until source refresh succeeds |
| Custom CSS | Yes | `map` as UI preference or explicitly preserve |
| Unknown option-container fields | Yes | classify; safe unknown fields may be `preserve` |
| Gist/WebDAV account credentials | No in the observed ordinary backup path | separate account-state migration only |
| Temporary rules and monitor records | No | `ignore-runtime` |
| Current active profile runtime state | No | do not infer from startup profile |

## 10. Pinned source evidence

- `omega-web/src/omega/controllers/io.coffee` — ordinary export, local restore, online restore, and synchronization UI state.
- `omega-web/src/omega/controllers/master.coffee` — source of `$rootScope.options`, Apply confirmation, reset call, and PAC export.
- `omega-target-chromium-extension/src/coffee/omega_target_web.coffee` — `getAll`, `patch`, and `reset` background bridge.
- `omega-target/src/options.coffee` — `getAll`, parsing, upgrade, destructive reset, synchronization filtering, and storage behavior.

No importer implementation belongs in this research milestone. This document defines the boundary that later ProfileSpec and importer work must satisfy.
