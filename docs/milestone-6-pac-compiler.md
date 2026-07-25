# Milestone 6 — Deterministic PAC compiler and verifier

Status: implementation complete; exact final documentation Head verification pending.

## Purpose

The PAC compiler converts a selected, validated ProfileSpec route graph into a self-contained browser-native `FindProxyForURL` policy. Expensive parsing, reference resolution, rule-list expansion, capability analysis, and verification happen before browser installation rather than on each request in extension JavaScript.

## Capability gate

Analysis visits only profiles, endpoints, and rule sources reachable from the selected start route.

Classifications:

- `exact`: generated PAC can preserve the reference-interpreter semantics for the selected target;
- `target-dependent`: semantics are known, but target PAC inputs or representation may differ;
- `unsupported`: PAC cannot safely express the reachable behavior.

The following cases block exact compilation unless explicitly accepted as target-dependent:

- HTTPS full-URL regular expressions and wildcards whose result can depend on stripped path/query data;
- Unicode host representation requiring target verification.

The following cases block PAC compilation:

- System route selection;
- arbitrary nested PAC profiles;
- browser auto-detection;
- missing or disabled profiles;
- missing endpoints or rule sources;
- reference cycles;
- download-backed rule sources whose verified content is not available in the candidate snapshot.

Unreachable unsupported profiles do not block an otherwise valid selected graph.

## Deterministic generator

The generator emits:

- one stable function per reachable Fixed, Switch, or RuleList profile;
- compile-time expanded Switchy and AutoProxy rules;
- a conservative function/`var` PAC runtime;
- a single `FindProxyForURL(url, host)` entry point.

Runtime helpers implement:

- host and URL wildcards;
- regular expressions;
- scheme and port extraction;
- `<local>`, host, scheme/port, IPv4, IPv6, and CIDR bypass matching;
- IPv4 and IPv6 condition matching;
- host-level ranges;
- local weekday and hour ranges, including midnight crossing.

Endpoint directives use `PROXY`, `HTTPS`, `SOCKS4`, or `SOCKS5`. Credentials and secret references are never embedded in PAC output; authentication remains a browser-adapter responsibility.

## Safety and budgets

Generation includes:

- JavaScript string literal escaping;
- proxy-host injection rejection;
- IDN-to-ASCII normalization for proxy endpoints;
- IPv6 endpoint bracketing;
- profile-count, condition-count, and script-byte hard limits;
- near-limit warnings;
- no partial artifact on failure.

Generated output contains no module imports, browser-extension APIs, ProfileSpec JSON, credentials, request headers, or arbitrary imported PAC bodies.

## Execution harness

The test harness evaluates the complete generated script and verifies that it defines `FindProxyForURL`.

Local weekday and local hour can be injected through a deterministic Date constructor. Time-sensitive vectors therefore do not depend on the GitHub runner's current clock or timezone.

## Differential verifier

Each vector is executed through:

1. the Milestone 5 reference profile graph;
2. the generated PAC script;
3. normalization to `DIRECT`, `PROXY`, `HTTPS`, `SOCKS4`, or `SOCKS5` output.

Differences produce structured mismatch records with vector ID, support classification, expected result, actual result, and reason.

The verifier executes all committed Milestone 2 condition and RuleList decision vectors. A deliberately corrupted PAC artifact is also tested to prove mismatches are detected rather than silently accepted.

## Runtime snapshots

A runtime snapshot is created only after compilation and all supplied differential vectors pass.

It records:

- deterministic snapshot identity;
- explicit creation time;
- source document and revision IDs;
- canonical ProfileSpec SHA-256;
- selected start route;
- PAC target and compiler version;
- generated script SHA-256;
- capability and warnings;
- compilation statistics;
- verification vector and match counts;
- the verified PAC script.

Changing only `createdAt` does not alter content identity. Changing ProfileSpec content or generated PAC changes the relevant hashes and deterministic snapshot identity.

## Scale verification

The committed 36-profile / 1,024-rule legacy fixture is imported and compiled from `switch-00`.

Reachability pruning produces:

- 25 reachable profiles;
- 24 endpoints;
- 200 compiled conditions;
- no unrelated remote RuleList profiles in the PAC graph.

The generated script executes representative proxy and direct decisions. Applying an intentionally lower rule budget produces a deterministic compilation failure.

## Acceptance

Final acceptance requires the exact documentation Head to pass:

- frozen dependency installation;
- architecture and UI guards;
- ESLint and Prettier;
- strict TypeScript;
- the complete test suite;
- Chromium and Firefox Manifest V3 builds;
- manifest audits;
- packaged artifact upload;
- changed-file audit proving no temporary write-enabled workflow remains.
