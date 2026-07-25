# PAC Compiler

This package compiles a selected ProfileSpec route graph into a deterministic browser-native Proxy Auto-Configuration policy.

Compilation is gated by reachability-based capability analysis:

- `exact` means the reachable graph can preserve the reference-interpreter semantics on the selected PAC target.
- `target-dependent` means the semantics are known but browser PAC inputs or representation can differ, such as HTTPS path stripping or Unicode host conversion.
- `unsupported` means PAC cannot express the requested behavior safely, such as a System route, arbitrary nested PAC profile, browser auto-detection, unavailable rule-source content, or an invalid reference graph.

Unsupported or target-dependent behavior is never silently rewritten as `DIRECT` or another proxy route. Proxy credentials are not embedded in PAC output; the later browser adapter handles authentication separately.

The generator emits one deterministic function per reachable profile. Switch and rule-list conditions are expanded at compile time, while a self-contained PAC runtime implements wildcard, regular-expression, bypass, IPv4/IPv6 prefix, weekday, and local-hour matching. The artifact enforces configurable profile, condition, and script-size budgets and can be executed by the isolated test harness before browser installation.

Generated PAC uses conservative function/`var` syntax and carries no module imports, browser-extension APIs, ProfileSpec JSON, credentials, or request-header values.

Compiler tests execute generated PAC from imported ZeroOmega switch, fixed, authenticated-proxy, and inline AutoProxy fixtures. Download-backed rule sources remain blocked until their content has been fetched and verified into the candidate snapshot.

A runtime snapshot is created only after differential vectors match the reference interpreter. It records SHA-256 hashes for the canonical ProfileSpec and PAC script, the source revision, selected route, target, compiler version, verification counts, explicit creation time, and a deterministic snapshot identity.
