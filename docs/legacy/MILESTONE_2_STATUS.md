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
- Classified initial top-level options, fetched data, derived data, and runtime state.
- Inventoried proxy credential slots, fallback selection, and request-attempt behavior.
- Inventoried PAC and rule-list custom download headers.
- Defined secret-handling requirements that intentionally differ from upstream plaintext behavior.
- Inventoried generic synchronization filtering and IndexedDB staging.
- Inventoried Gist and WebDAV JSON upload behavior and account-state fields.
- Classified temporary-profile state and network-monitor records as runtime-only data.
- Defined Nex boundaries for public ProfileSpec, generated content, runtime state, and secrets.
- Added positive fixtures for profile types, condition types, rule-list formats, credentials, and headers.
- Added structural/reference validation for fixture JSON.
- Added credential-slot and sensitive-header redaction validation.
- Added research branches to the normal CI verification path.
- Passed the full stacked CI pipeline with four fixture files containing twenty-one profiles.

## Still required before Milestone 2 completes

- Re-run and pass full CI after the storage/sync boundary documentation.
- Locate and inventory every UI backup/export transformation.
- Built-in profile customization shape.
- Additional Gist/WebDAV UI configuration and secret-handling boundaries, if any.
- IDN, IPv4, IPv6, port, and malformed bypass fixtures.
- Missing reference, cycle, duplicate/mismatched name, and corrupt input fixtures.
- Large representative configuration fixture.
- Decision vectors for every supported condition and rule-list construct.
- Current-browser permission and lifecycle evidence for authenticated proxy support.
- Final `map`, `preserve`, `ignore-generated`, `downgrade`, `reject`, or runtime-only status for every field.

## Merge gate

This branch remains Draft research. No ProfileSpec or importer implementation belongs here. Milestone 3 design begins only after the inventory and fixture corpus are complete and Milestone 1 is accepted.
