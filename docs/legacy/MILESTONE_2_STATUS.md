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
- Added positive fixtures for profile types, condition types, rule-list formats, credentials, and headers.
- Added structural/reference validation for fixture JSON.
- Added credential-slot and sensitive-header redaction validation.
- Added research branches to the normal CI verification path.
- Passed the full stacked CI pipeline before the credential/header expansion.

## Still required before Milestone 2 completes

- Re-run and pass full CI with the credential/header fixture expansion.
- Complete export-versus-sync field inclusion inventory.
- Built-in profile customization shape.
- Gist and WebDAV sync boundaries and secret classification.
- Temporary rules and network-monitor storage boundaries.
- IDN, IPv4, IPv6, port, and malformed bypass fixtures.
- Missing reference, cycle, duplicate/mismatched name, and corrupt input fixtures.
- Large representative configuration fixture.
- Decision vectors for every supported condition and rule-list construct.
- Current-browser permission and lifecycle evidence for authenticated proxy support.
- Final `map`, `preserve`, `ignore-generated`, `downgrade`, or `reject` status for every field.

## Merge gate

This branch remains Draft research. No ProfileSpec or importer implementation belongs here. Milestone 3 design begins only after the inventory and fixture corpus are complete and Milestone 1 is accepted.
