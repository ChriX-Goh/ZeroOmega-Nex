# Original ZeroOmega parity matrix

This file is now the compact index. The canonical, continuously maintained evidence is:

- [`ORIGINAL_KNOWLEDGE_GRAPH.md`](./ORIGINAL_KNOWLEDGE_GRAPH.md) — source-backed product and behavior graph.
- [`UI_AUDIT_MATRIX.md`](./UI_AUDIT_MATRIX.md) — row-by-row UI/function classification and implementation status.

Baseline: `zero-peak/ZeroOmega v3.5.0`, captured by workflow run `30181773502`, artifact `8625759489`.

## Current high-level status

| Area                       | Status  | Blocking facts                                                                                    |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| Navigation / theme / icons | Partial | Structure is usable; translations remain incomplete                                               |
| New Profile                | Broken  | Original has Fixed/Switch/PAC/Virtual; Nex exposes the wrong five-type taxonomy                   |
| Fixed Profile              | Broken  | Original per-scheme table/auth layout is absent                                                   |
| Switch Profile             | Broken  | Original rule table, help, source editor and attached RuleList workflow are absent                |
| Rule List Profile          | Partial | Editor is structurally different and incorrectly exposed as a normal new type                     |
| PAC Profile                | Partial | URL/download/header/auth semantics are incomplete; invalid example URLs become data               |
| Virtual Profile            | Missing | Type, editor and reference replacement are absent                                                 |
| Full backup export         | Missing | No `.bak` full-options export                                                                     |
| Original backup import     | Broken  | Real owner export failed; current fixtures do not prove compatibility                             |
| Localization               | Partial | Editors, options, errors, placeholders and defaults still contain English                         |
| Popup original functions   | Partial | Basic switching works; result profile, current-site rules, temp rules and diagnostics are missing |

## Closure rule

PR #11 remains Draft while any `MUST_MATCH` row in the canonical UI audit is `PARTIAL`, `MISSING`, `BROKEN`, or `UNVERIFIED`. Every parity-sensitive implementation commit must update both canonical documents and its test evidence.
