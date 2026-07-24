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
- Inventoried ordinary `.bak` export, local restore, online restore, and separate PAC export behavior.
- Confirmed that ordinary backups serialize the full option container without backup-specific filtering or redaction.
- Confirmed that synchronization account state, temporary rules, monitor records, and current runtime state are outside the ordinary backup object.
- Inventoried `-builtinProfiles` as a Direct/System appearance-only color override.
- Confirmed built-in names, types, flags, and routing semantics remain program-defined and cannot be replaced by ordinary option profiles.
- Defined that built-in color changes must not recompile or reinstall routing policy in Nex.
- Passed the read-only CI pipeline for the built-in customization Head.
- Inventoried request-host, IDN, IPv4/IPv6, prefix-zero, `<local>`, scheme/port Bypass, CIDR fallback, and IPv6/port ambiguity semantics.
- Added a source-shape fixture covering Unicode/ASCII IDN forms, IP families, endpoint ports, valid Bypass forms, and legacy-accepted ambiguous Bypass inputs.
- Added focused validation for IDN pairing, IP families, prefix bounds, endpoint ports, exact Bypass corpus, and profile references.
- Passed the read-only CI pipeline for the network-edge fixture Head.
- Defined, generated, committed, and exact-byte validated a deterministic large fixture with 36 profiles, 1,024 ordered SwitchProfile rules, and 1,024 rule-list entries.
- Passed the read-only CI pipeline for the deterministic large fixture Head.
- Added declarative condition route vectors covering all twelve condition types.
- Added rule-list route vectors covering plain/base64 AutoProxy, SwitchyOmega results/notes/catch-all behavior, and legacy Switchy wildcard/regexp paths.
- Classified source-exact and target-dependent expectations explicitly.
- Added validation for vector IDs, coverage, clock inputs, result consistency, source-line provenance, parser families, and required constructs.
- Passed the read-only CI pipeline for the route-decision vector Head.
- Researched current Chromium MV3 and Firefox MV3 proxy-authentication permissions, asynchronous callback behavior, background lifecycle, private-window access, and SOCKS limitations.
- Defined optional all-host access that is requested only when authenticated HTTP/HTTPS proxy routing is activated.
- Defined exactly one allowed authentication event, `webRequest.onAuthRequired`, with proxy-only guards and no general request monitoring.
- Defined a background-suspension-safe bounded retry model without global completion/error listeners.
- Defined private credential use as disabled until both browser access and explicit user policy permit it.
- Recorded ADR-013 for the bounded proxy-authentication exception.
- Added a machine-readable capability fixture and validator covering platform permissions, listener scope, retries, private access, and secret isolation.
- Defined Nex boundaries for public ProfileSpec, generated content, runtime state, account settings, secrets, built-in appearance, network normalization, scale testing, route-oracle inputs, and authenticated-proxy capability.
- Added positive fixtures for profile types, condition types, rule-list formats, credentials, headers, built-in colors, and network edges.
- Added twelve intentionally invalid fixtures with exact expected failure reasons.
- Added missing-reference, duplicate/reserved-name, key/name mismatch, unknown-type, unredacted-secret, wrong-schema, empty-config, corrupt-JSON, and cycle checks.
- Added profile-reference cycle detection.
- Added structural/reference validation for positive fixture JSON.
- Added credential-slot and sensitive-header redaction validation.
- Added focused validation for built-in keys, immutable identity fields, colors, and absence of routing fields.
- Added research branches to the normal CI verification path.
- Passed the read-only CI pipeline for the backup/export boundary Head.

## Still required before Milestone 2 completes

- Pass read-only CI for the proxy-authentication capability slice.
- Resolve remaining `investigate` classifications or explicitly defer them with downgrade/reject decisions.
- Confirm whether any additional Gist/WebDAV UI-only field exists beyond the already inventoried state and backend configuration.

## Merge gate

This branch remains Draft research. No ProfileSpec or importer implementation belongs here. Milestone 3 design begins only after the inventory and fixture corpus are complete and Milestone 1 is accepted.
