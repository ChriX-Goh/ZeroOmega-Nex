# Milestone 2 Research Status

Branch: `research/m2-legacy-inventory`

Status: **Complete and verified; merge remains blocked by Milestone 1.**

This branch is stacked on the Milestone 1 engineering shell. It must not merge until Milestone 1 closes and the stacked branches can merge in order.

## Completed compatibility inventory

- Pinned the authority to ZeroOmega `v3.5.0`, commit `05cbb30`, schemaVersion 2, with source paths and Blob SHAs.
- Inventoried all recognized profile and condition identifiers, ordered SwitchProfile behavior, and Switchy/AutoProxy parsing families.
- Classified proxy endpoints, Bypass rules, PAC sources, rule-list sources, custom headers, credentials, generated caches, revisions, settings, and unknown fields.
- Inventoried ordinary `.bak` export, local/online destructive restore, separate PAC export, Gist/WebDAV plaintext JSON synchronization, temporary rules, monitor state, and device/runtime state.
- Inventoried `-builtinProfiles` as Direct/System appearance-only color customization.
- Inventoried IDN, IPv4/IPv6, prefix-zero, `<local>`, scheme/port Bypass, CIDR fallback, leading-dot hosts, and IPv6/port ambiguity.
- Inventoried current Chromium MV3 and Firefox MV3 proxy-authentication permissions, async response behavior, background lifecycle, private access, retry requirements, and SOCKS limitations.
- Resolved `-showConditionTypes` as numeric `0/1` editor presentation state that never changes routing.
- Resolved `-exportLegacyRuleList` as an export-format preference with modern-format warning fallback when legacy output would be lossy.
- Confirmed the complete pinned Gist/WebDAV UI input set: backend, URI, optional username, secret token/password, and operation-only `useBuiltInSync`.
- Classified IDN exactness as an explicit target-dependent browser-adapter gate rather than an unresolved schema question.
- Defined risk-based handling for unknown future-release fields.
- Closed every known v3.5.0 field with a map, preserve, secret, generated, runtime, target-dependent, downgrade, or reject decision.

## Completed fixture and validation corpus

- Hand-authored positive fixtures for profile types, condition types, rule-list formats, credentials/headers, built-in colors, and network edges.
- Twelve intentionally invalid fixtures covering missing references, cycles, names, unknown types, secrets, schema, empty configuration, and corrupt JSON.
- Deterministic committed large fixture with 36 profiles, 1,024 ordered SwitchProfile rules, and 1,024 rule-list entries, verified byte-for-byte against its generator.
- Twenty-seven condition route vectors covering all twelve condition types.
- Fourteen rule-list route vectors covering five AutoProxy/Switchy parser families.
- Machine-readable proxy-auth capability contract and validator.
- Machine-readable final-field closure contract with zero remaining `investigate` fields.
- Read-only CI integration for all fixtures, validators, Lint, formatting, strict type/Svelte checks, tests, Chromium MV3, Firefox MV3, manifest audits, and build artifacts.

## Verified slice heads

- Backup/export boundaries: `5c1070c`, CI `30076591362`.
- Built-in appearance: `d567b6b`, CI `30077286210`.
- Network-edge fixture: `a655b10`, CI `30077596224`.
- Deterministic large fixture: `26f788f`, CI `30077993487`.
- Route decision vectors: `e86a14a`, CI `30078666855`.
- Proxy-auth capability: `912f0df`, CI `30079278092`.
- Final field closure: `5da86bd`, CI `30080372767`.

## Acceptance result

Milestone 2 acceptance criteria are satisfied:

- every supported legacy type is documented;
- every discovered field has an explicit migration/capability decision;
- positive, negative, network-edge, scale, and decision-vector corpora exist;
- secret and runtime boundaries are explicit;
- no global request-time proxy matching or production proxy behavior was introduced;
- the complete research branch passes the read-only repository verification pipeline.

## Remaining project gate

Milestone 2 is complete but PR #4 remains Draft and must not merge until PR #2 completes the real-browser smoke test in Issue #3. Milestone 3 ProfileSpec design must not begin until Milestone 1 is accepted and the stacked merge order is resolved.
