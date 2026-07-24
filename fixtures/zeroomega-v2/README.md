# ZeroOmega Schema-v2 Fixtures

These files are independently constructed compatibility fixtures pinned to ZeroOmega `v3.5.0`. They contain no user credentials, live proxy endpoints, private URLs, or copied implementation code.

## Files

- `minimal-profile-types.json` covers every profile type identifier recognized by the v3.5.0 profile model.
- `minimal-condition-types.json` covers every condition type identifier recognized by the v3.5.0 condition model.
- `rule-list-formats.json` covers SwitchyOmega Conditions, legacy Switchy, plain AutoProxy, and base64 AutoProxy source shapes.

## Fixture roles

Fixtures are not examples of recommended user configuration. Their purpose is to:

1. Prevent a profile or condition type from disappearing during schema design.
2. Provide stable importer snapshot inputs.
3. Seed reference-interpreter and PAC differential vectors.
4. Capture edge behavior without using real user backups.

## Rules

- Keep `schemaVersion` equal to `2`.
- Use reserved `.invalid` domains and documentation IP ranges.
- Keep profile object keys and `name` fields aligned unless the fixture explicitly tests mismatch behavior.
- Add malformed inputs under a future `invalid/` directory rather than corrupting positive fixtures.
- Add a short rationale here whenever a fixture represents behavior not obvious from the upstream source.
- Do not include secrets, tokens, usernames, passwords, Gist IDs, WebDAV credentials, or private rule URLs.

## Validation status

At this stage the files are JSON-valid and source-shape fixtures. Semantic validation and decision-vector expectations will be added during the remaining Milestone 2 work.
