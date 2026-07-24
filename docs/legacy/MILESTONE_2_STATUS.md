# Milestone 2 Research Status

Branch: `research/m2-legacy-inventory`

This branch is stacked on the Milestone 1 engineering shell. It may be reviewed in parallel, but it must not merge until Milestone 1 closes.

## Completed in this research slice

- Pinned upstream compatibility baseline to ZeroOmega `v3.5.0`.
- Recorded source file paths and Blob SHAs.
- Inventoried all ten recognized profile type identifiers.
- Inventoried all twelve recognized condition type identifiers.
- Recorded ordered SwitchProfile semantics.
- Recorded Switchy and AutoProxy rule-list parsing families.
- Classified top-level options, profile fields, fetched data, generated data, runtime state, and secrets.
- Inventoried proxy credential slots, fallback selection, and request-attempt behavior.
- Inventoried PAC and rule-list custom download headers.
- Defined secret-handling requirements that intentionally differ from upstream plaintext behavior.
- Inventoried generic synchronization filtering and IndexedDB staging.
- Inventoried Gist and WebDAV plaintext JSON upload behavior and account-state fields.
- Classified temporary-profile state and network-monitor records as runtime-only data.
- Defined Nex boundaries for public ProfileSpec, generated content, runtime state, account settings, and secrets.
- Added positive fixtures for profile types, condition types, rule-list formats, credentials, and headers.
- Added twelve intentionally invalid fixtures with exact expected failure reasons.
- Added missing-reference, duplicate/reserved-name, key/name mismatch, unknown-type, unredacted-secret, wrong-schema, empty-config, corrupt-JSON, and cycle checks.
- Added profile-reference cycle detection.
- Added structural/reference validation for positive fixture JSON.
- Added credential-slot and sensitive-header redaction validation.
- Added research branches to the normal CI verification path.
- Passed the full stacked CI pipeline after the storage/sync boundary work.

## Still required before Milestone 2 completes

- Pass the final read-only CI after field classification and negative-fixture expansion.
- Locate and inventory every UI backup/export transformation.
- Built-in profile customization shape.
- Additional Gist/WebDAV UI configuration boundaries, if any.
- IDN, IPv4, IPv6, port, and malformed bypass fixtures.
- Large representative configuration fixture.
- Decision vectors for every supported condition and rule-list construct.
- Current-browser permission and lifecycle evidence for authenticated proxy support.
- Resolve the remaining `investigate` classifications or explicitly defer them with downgrade/reject decisions.

## Merge gate

This branch remains Draft research. No ProfileSpec or importer implementation belongs here. Milestone 3 design begins only after the inventory and fixture corpus are complete and Milestone 1 is accepted.
