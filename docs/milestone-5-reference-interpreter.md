# Milestone 5 — Reference policy interpreter

Status: implementation complete; exact final-Head verification pending.

## Purpose

The reference interpreter is the correctness-first executable definition of ZeroOmega Nex routing semantics. It is deliberately independent from browser proxy APIs, PAC generation, extension storage, and UI code.

Future PAC, browser, WASM, and native backends must produce equivalent differential records for the same ProfileSpec and request vectors.

## Request model

A request supplies:

- full URL;
- host;
- scheme;
- optional explicit port;
- optional local weekday;
- optional local hour.

Time-dependent conditions return `indeterminate` when their explicit clock input is missing or invalid. They never silently fall through as nonmatches.

## Condition semantics

The interpreter executes all ProfileSpec condition families:

- true and false;
- URL regular expression and wildcard;
- host regular expression and wildcard;
- bypass;
- HTTP-only keyword;
- IPv4 and IPv6 prefix;
- host level range;
- local weekday;
- local hour range, including ranges crossing midnight.

Target-dependent support is propagated for cases such as HTTPS full-URL matching and Unicode host representation.

## Profile graph semantics

The graph evaluator supports:

- Direct and System built-in routes;
- ordered SwitchProfile first-match and default behavior;
- recursive profile references;
- FixedProfile bypass processing before endpoint selection;
- HTTP/WS, HTTPS/WSS, FTP, and fallback endpoint slots;
- direct routing when a FixedProfile intentionally has no mapping for a scheme;
- disabled-profile rejection;
- missing-profile and missing-endpoint rejection;
- deterministic maximum-depth enforcement;
- runtime cycle detection even when an invalid ProfileSpec bypasses normal validation.

Arbitrary PAC execution and browser auto-detection remain explicit target-dependent, indeterminate boundaries. The reference interpreter does not invent behavior for them.

## Rule-list semantics

Supported formats:

- AutoProxy plain and imported base64 content;
- SwitchyOmega modern conditions with explicit result profiles and notes;
- Switchy legacy wildcard and regular-expression sections.

AutoProxy and legacy Switchy exclusive rules are evaluated before normal rules while preserving order inside each priority group. Modern SwitchyOmega rules preserve source order. The pinned leading-`!` plus `@with result` parsing quirk is intentionally reproduced and covered by the committed oracle.

## Decision traces

Every decision can record:

- entered profile path;
- ordered Switch and RuleList rule checks;
- source lines and priority groups;
- bypass checks;
- selected endpoint;
- direct/system terminal route;
- target-dependent or indeterminate reason;
- invalid reference, cycle, or depth error.

## Differential records

The backend-neutral record contains:

- schema version and vector ID;
- resolved, indeterminate, or invalid status;
- exact or target-dependent support;
- sanitized terminal route;
- profile path;
- matched rule IDs;
- normalized trace.

Proxy credentials, secret references, request headers, PAC bodies, and unrelated ProfileSpec data are excluded from the differential record.

## Verification corpus

The implementation executes the immutable Milestone 2 condition and rule-list decision vectors through the real ZeroOmega importer and ProfileSpec model. Additional regression and property tests cover:

- nested graph routing;
- fixed bypass and endpoint selection;
- cycles, missing references, disabled profiles, and depth limits;
- deterministic output and source immutability;
- 128 generated domain-suffix cases;
- every address in an IPv4 `/24` plus adjacent exclusions;
- 200 repeated graph decisions without ProfileSpec mutation;
- credential-free differential serialization.

Final acceptance requires the exact documentation Head to pass frozen dependency installation, architecture and UI guards, ESLint, Prettier, strict TypeScript, all tests, Chromium and Firefox MV3 builds, manifest audits, and packaged artifact upload.
