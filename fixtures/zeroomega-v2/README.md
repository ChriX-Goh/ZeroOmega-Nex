# ZeroOmega Schema-v2 Fixtures

These files are independently constructed compatibility fixtures pinned to ZeroOmega `v3.5.0`. They contain no usable user credentials, live proxy endpoints, private URLs, or copied implementation code.

## Positive files

- `minimal-profile-types.json` covers every profile type identifier recognized by the v3.5.0 profile model.
- `minimal-condition-types.json` covers every condition type identifier recognized by the v3.5.0 condition model.
- `rule-list-formats.json` covers SwitchyOmega Conditions, legacy Switchy, plain AutoProxy, and base64 AutoProxy source shapes.
- `credentials-and-headers.redacted.json` covers credential slots and download headers using literal `<redacted>` placeholders.
- `builtin-profile-colors.json` covers the UI-emitted `-builtinProfiles` shape for Direct and System appearance colors without treating it as routing policy.
- `network-edge-conditions.json` covers Unicode/ASCII IDN forms, IPv4/IPv6 subnets, prefix-zero rules, endpoint ports, `<local>`, scheme/port Bypass, CIDR, bracketed IPv6, and ambiguous malformed Bypass inputs.
- `large-representative.json` is a generated, committed scale fixture with 36 profiles, 1,024 ordered SwitchProfile rules, and 1,024 rule-list data entries.

## Invalid files

The `invalid/` directory contains intentionally malformed or unsafe configurations. `expectations.json` records the exact failure reason each case must trigger.

Covered failures include:

- Missing profile references.
- Profile-reference cycles.
- Profile key/name mismatches.
- Duplicate and reserved profile names.
- Unknown profile and condition types.
- Unredacted proxy credentials and sensitive headers.
- Unsupported schema versions.
- Empty profile collections.
- Corrupt JSON.

## Fixture roles

Fixtures are not examples of recommended user configuration. Their purpose is to:

1. Prevent a profile or condition type from disappearing during schema design.
2. Provide stable importer snapshot inputs.
3. Seed reference-interpreter and PAC differential vectors.
4. Capture edge behavior without using real user backups.
5. Verify that sensitive fields remain redacted in the repository.
6. Prove that unsafe or ambiguous input fails for a precise reason.
7. Keep presentation-only built-in customization separate from routing semantics.
8. Preserve network edge cases without prematurely declaring target-dependent behavior exact.
9. Exercise large-import and future compiler paths with deterministic scale.

## Rules

- Keep positive fixtures at `schemaVersion: 2`.
- Use reserved `.invalid` domains and documentation IP ranges.
- Keep profile object keys and `name` fields aligned unless a fixture explicitly tests mismatch behavior.
- Keep malformed inputs inside `invalid/` rather than corrupting positive fixtures, except when a source-shape fixture intentionally records a legacy-accepted ambiguous value for migration reporting.
- Add an expectation whenever an invalid fixture is added.
- Add a short rationale here whenever a fixture represents behavior not obvious from the upstream source.
- Do not include usable secrets, tokens, usernames, passwords, Gist IDs, WebDAV credentials, or private rule URLs.
- Credential fields and sensitive header values in positive fixtures must use the exact placeholder `<redacted>`.
- Built-in customization fixtures may contain only the UI-emitted appearance fields `name`, `profileType`, `color`, and `builtin`; routing fields are forbidden.
- Network fixtures must use documentation address ranges and keep Unicode and ASCII IDN source forms visible separately.
- Do not hand-edit `large-representative.json`; change its generator, regenerate it, and pass exact-byte validation.

## Validation status

The positive-fixture validator checks JSON structure, schema version, recognized profile and condition types, profile references, reference cycles, credential slots, credential redaction, header shape, and sensitive-header redaction. Focused validators check built-in appearance isolation and network-edge coverage, including IDN pairing, IP families, prefix bounds, endpoint ports, and the exact ambiguous Bypass corpus. The large-fixture validator rebuilds the expected file, compares exact bytes, verifies dimensions, and enforces its size budget. The invalid-fixture harness separately confirms every negative case fails for its expected reason. Decision-vector expectations will be added during the remaining Milestone 2 work.
