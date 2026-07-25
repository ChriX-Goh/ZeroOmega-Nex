# PAC Compiler

This package compiles a selected ProfileSpec route graph into a deterministic browser-native Proxy Auto-Configuration policy.

Compilation is gated by reachability-based capability analysis:

- `exact` means the reachable graph can preserve the reference-interpreter semantics on the selected PAC target.
- `target-dependent` means the semantics are known but browser PAC inputs or representation can differ, such as HTTPS path stripping or Unicode host conversion.
- `unsupported` means PAC cannot express the requested behavior safely, such as a System route, arbitrary nested PAC profile, browser auto-detection, unavailable rule-source content, or an invalid reference graph.

Unsupported or target-dependent behavior is never silently rewritten as `DIRECT` or another proxy route. Proxy credentials are not embedded in PAC output; the later browser adapter handles authentication separately.
