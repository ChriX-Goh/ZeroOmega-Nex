# Active Original ↔ Nex Parity Audit Index

## Authority

This file is the moving execution index under `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`. Exact moving Head and workflow conclusions are read from Draft PR #11 and GitHub Checks rather than copied here.

## Current repository state

- Branch: `feat/m8-profile-workflow`.
- PR: #11, Draft.
- Active candidate: none.
- Failed candidate: `M8-OWNER-QC-1`.
- Provisional total progress: 47% (unrounded 46.7%; confidence band 42%–50%).
- Active journey: Order 1 at 35%.
- Merge, release and candidate generation remain prohibited.

The retained runtime has one background Action writer, browser-global baseline, per-tab overrides, serialized startup/activation, clean-install System initialization, runtime localization, evidence-bounded Original-observable projection and Inspect through the same executor.

## Represented Toolbar families

The unified Original-observable projection currently represents:

- Direct and System;
- Fixed proxy and bypass;
- one-level Switch → Direct/Fixed;
- nested Switch 01I;
- immediate Virtual → Direct/Fixed proxy/bypass;
- nested Virtual 01J;
- attached Rule List 01H;
- URL-backed PAC static Toolbar state 01K;
- temporary-rule Toolbar state 01L;
- external-control Toolbar state 01M;
- mixed Virtual → Switch 01O.

The Action boundary separately represents renderer fallback 01N. Real Chromium and Firefox Action E2E covers every represented family. Native Chromium Inspect covers overlay set, clear, base restoration and tab isolation.

## Active delivery sequence

1. **Order 1 — installation/startup/Toolbar:** 35%. 01H–01O strict subsets are captured, mapped and automated; remaining families, headed pixels where APIs are insufficient and owner acceptance remain.
2. **Order 2 — original export → direct Nex use:** blocked by `KG-IMPORT-001` and `KG-IMPORT-COLOR-001`.
3. **Order 3 — Popup:** broad hierarchy/state mismatch remains open; Toolbar 01L/01M does not close complete Popup interaction.
4. **Order 4 — Options / Apply / Discard:** broad layout/workflow/text mismatch remains open.
5. **Order 5 — complete profile journeys:** historical implementation inventory still requires complete-journey re-audit.
6. **Order 6 — export/restart/rollback/ownership/authentication:** partial engineering assets exist; owner-complete behavior is unproved.
7. **Order 7 — localization/density/visual alignment:** paired original comparison and owner acceptance remain open.

## Permanent original evidence harness

The read-only `.github/workflows/original-toolbar-evidence.yml` workflow:

- downloads and verifies the official ZeroOmega v3.5.0 Chromium package;
- accepts one scenario ID, comma-separated IDs or `all`;
- uses an isolated Chromium profile for every scenario;
- creates/applies profiles through original runtime APIs;
- supports bounded per-capture commands, ownership probes and renderer probes;
- captures runtime state and `_actionForUrl` into a JSON Artifact;
- cannot commit or push.

Scenario registry:

- `nested-switch` → 01I;
- `nested-virtual` → 01J;
- `pac` → 01K;
- `temporary-rule` → 01L;
- `external-control` → 01M;
- `renderer-fallback` → 01N;
- `virtual-switch` → 01O.

Pull requests execute `all`. New result families extend this registry and runner rather than adding one workflow per trace.

## Original evidence registry

### Baseline and one-level profiles

- `AUDIT_EVIDENCE_01C_ORIGINAL_CHROMIUM_RUNTIME.md` — Chromium baseline.
- `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md` — Firefox baseline.
- `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md` — one-level Switch.
- `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md` — immediate Virtual.

### Attached Rule List 01H

`AUDIT_EVIDENCE_01H_ORIGINAL_ATTACHED_RULE_LIST_RESULTS.md` captures matched/default AutoProxy results into Direct/Fixed, `(RL) `, `(default)`, hidden attached identity, Badge and color behavior.

### Nested Switch 01I

`AUDIT_EVIDENCE_01I_ORIGINAL_NESTED_SWITCH_RESULTS.md` captures one outer Switch entering one inner Switch. Every selected Switch edge is visible in order; the outer Switch remains current and supplies current/inner color; the final route supplies result/Badge/result color.

### Nested Virtual 01J

`AUDIT_EVIDENCE_01J_ORIGINAL_NESTED_VIRTUAL_RESULTS.md` captures two-level Virtual into Direct/Fixed proxy/bypass. The outer transition is hidden, the immediate target/default is visible according to the captured contract and final/current colors are result-dependent.

### URL-backed PAC 01K

`AUDIT_EVIDENCE_01K_ORIGINAL_PAC_RESULTS.md` captures the original static PAC Action contract: current/result profile is the applied PAC profile, detail is the exact PAC URL, Badge is profile-derived and no per-URL PAC return value is shown.

### Temporary rule 01L

`AUDIT_EVIDENCE_01L_ORIGINAL_TEMPORARY_RULE_RESULTS.md` captures one temporary host rule over an empty base Switch, matched Fixed result, unmatched two-default path and retained empty hidden overlay after the last rule is removed.

### External control 01M

`AUDIT_EVIDENCE_01M_ORIGINAL_EXTERNAL_CONTROL_RESULTS.md` captures one Fixed profile losing control to one competing extension: Direct warning content, `Dire` Badge, `#da4f49` warning background, automatic Fixed content recovery and warning-color latch.

### Renderer fallback 01N

`AUDIT_EVIDENCE_01N_ORIGINAL_RENDERER_FALLBACK.md` captures privacy-style dynamic icon failure, no `setIcon` write, repeated same-color retry, five-size recovery, byte-identical manifest PNGs and the full-write → `19`/`38` browser compatibility retry.

### Virtual → Switch 01O

`AUDIT_EVIDENCE_01O_ORIGINAL_VIRTUAL_SWITCH_RESULTS.md` captures:

- applied outer Virtual → immediate inner Switch;
- inner matched host rule → Fixed;
- inner matched host rule → Direct;
- inner default → Direct;
- current name `outer Virtual [inner Switch]`;
- hidden outer Virtual transition;
- visible inner matched/default transition;
- inner Switch current/inner color;
- final route result/Badge/result color.

## Current Nex runtime

Confirmed in deterministic tests and real-browser matrices:

- Direct/System/Fixed proxy and bypass;
- one-level and nested Switch 01I;
- immediate and nested Virtual 01J;
- attached Rule List 01H;
- URL-backed PAC 01K;
- temporary-rule matched/unmatched/removed 01L;
- external-control baseline/takeover/release/reapply 01M;
- renderer repeated failure/recovery 01N;
- Virtual → Switch Fixed/Direct/default 01O;
- internal-page/default fallback, tab isolation and native Inspect.

The shared `scripts/nex-toolbar-profile-trace-scenarios.mjs` fixture drives Chromium and Firefox nested Switch, nested Virtual, PAC, temporary-rule and Virtual → Switch Action E2E in one applied document. The test observes real browser Action title, Badge and popup rather than invoking projectors directly.

Focused external-control E2E loads Nex and a real second proxy extension. Focused renderer E2E uses a build-gated hidden probe to force privacy-style pixels and observe the real renderer/Action boundary. Normal builds do not register that probe channel.

## Architecture checkpoints

### Temporary overlay

- session state records overlay activity independently of rule count;
- removing the final rule retains the empty overlay;
- normal runtime inspection keeps visible base identity;
- Toolbar-only inspection supplies the synthetic graph;
- mutations refresh the existing single Action writer;
- unsupported shapes fail closed.

### External control

- Toolbar reads the real browser control level;
- `proxy.settings.onChange` refreshes the existing coordinator;
- exact competing-extension ownership projects captured Direct warning state;
- restored ownership returns profile content;
- warning-red remains latched for the captured runtime lifetime;
- Popup ownership blocking remains a separate surface.

### Renderer fallback

- successful icon sets alone enter cache;
- failed colors remain retryable;
- first error only is reported;
- absent image causes no `setIcon` call;
- full dynamic rejection retries with `19`/`38`;
- E2E instrumentation is absent from normal builds.

### Virtual → Switch

- dedicated subprojector accepts one colored Virtual targeting one colored ordinary Switch;
- only exact resolved traces are accepted;
- matched host-wildcard → Direct/Fixed and Direct default are represented;
- Fixed requires one HTTP fallback endpoint, no bypass and no scheme override;
- deeper/mixed/attached shapes fail closed;
- the subprojector is composed before generic nested-Virtual fallback.

## Automation note

On the first Chromium attempt for the 01O Head, the older full E2E timed out before profile-trace while waiting for an unrelated external-profile Popup row. Re-running that single Chromium job without code changes passed the full E2E and every subsequent Toolbar step. Firefox, native Inspect and all other workflows passed. The final Browser E2E workflow conclusion is success; no product or test relaxation was introduced for that transient timeout.

## Closed evidence-proven correction

`KG-VIRTUAL-BYPASS-DETAIL-001` is `EXACT_EQUIVALENT` and `VERIFIED_AUTOMATION`: immediate Virtual → Fixed bypass uses literal `DIRECT` in projector, deterministic test and both browser expectations. Fixed-profile bypass remains a separate localized contract.

## Remaining Order 1 unknown or missing shapes

- nested Switch beyond 01I;
- nested Virtual beyond 01J;
- Virtual → Switch beyond 01O, including deeper Switch, bypass and attached/mixed targets;
- attached Rule List beyond 01H;
- PAC lifecycle beyond 01K;
- temporary-rule lifecycle beyond 01L;
- external-control lifecycle beyond 01M;
- renderer failures beyond 01N;
- headed pixels where Action API state is insufficient;
- consolidated repository-owner acceptance.

Switch → System is not missing because the original runtime rejects it.

## Active blockers

- `KG-ICON-001` — complete Toolbar journey: `FAILED`.
- `KG-IMPORT-001` — original export direct use: `FAILED`.
- `KG-IMPORT-COLOR-001` — original `#RGB` normalization: open.
- `KG-UI-001` — Options/Popup presentation and hierarchy: `FAILED`.
- `KG-EXTRA-001` — extra descriptions/workflow: `FAILED`.
- `KG-INVENTION-001` — visible behavior without provenance: `FAILED`.
- `KG-FLOW-001` — complete interaction parity: `FAILED`.
- `KG-GOV-001` — final owner-acceptance governance: open.

## Next fixed edge

Capture the next high-value unrepresented mixed/nested or attached original family, map only the proven shape, verify deterministic and shared Chromium/Firefox behavior, then consolidate Order 1 for repository-owner acceptance. Headed pixel capture remains reserved for states that Action APIs cannot prove.

## Execution rule

For every node:

1. capture original source/runtime;
2. capture Nex independently;
3. publish Original ↔ Nex mapping and gap classification;
4. implement only the mapped contract;
5. verify deterministic tests and real Chromium/Firefox behavior;
6. require repository-owner `PASS` before closing the journey.

Synthetic fixtures, green CI, Nex-only screenshots or test volume cannot independently close a product node.
