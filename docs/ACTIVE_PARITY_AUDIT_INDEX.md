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

The retained runtime has one background Action writer, a browser-global baseline, per-tab overrides, serialized startup and activation, clean-install System initialization, runtime localization, exact rendering and an Inspect overlay through the same executor.

The unified Original-observable projection currently represents:

- Direct and System;
- Fixed proxy and bypass;
- exact one-level Switch → Direct/Fixed;
- exact nested Switch 01I subset;
- exact immediate Virtual → Direct/Fixed proxy/bypass;
- exact nested Virtual 01J subset;
- exact attached Rule List 01H subset;
- exact URL-backed PAC Toolbar 01K subset.

Real Chromium and Firefox Action E2E covers represented shapes. Native Chromium Inspect covers set, clear, base restoration and tab isolation.

## Active delivery sequence

1. **Order 1 — installation/startup/Toolbar:** 35%. PAC static Toolbar state is captured; remaining Rule List, temporary-rule, external-control, fallback/pixel evidence and owner acceptance remain.
2. **Order 2 — original export → direct Nex use:** blocked by `KG-IMPORT-001` and `KG-IMPORT-COLOR-001`.
3. **Order 3 — Popup:** broad hierarchy and state mismatch remains open.
4. **Order 4 — Options / Apply / Discard:** broad layout, workflow and text mismatch remains open.
5. **Order 5 — complete profile journeys:** historical implementation inventory remains pending complete journey re-audit.
6. **Order 6 — export/restart/rollback/ownership/authentication:** partial engineering assets exist; owner-complete behavior is unproved.
7. **Order 7 — localization/density/visual alignment:** paired original comparison and owner acceptance remain open.

## Permanent original evidence harness

The read-only `.github/workflows/original-toolbar-evidence.yml` workflow:

- downloads and SHA-256 verifies the official ZeroOmega v3.5.0 Chromium package;
- accepts one scenario ID, comma-separated IDs or `all`;
- uses an isolated Chromium profile for every scenario;
- creates and applies profiles through the original runtime APIs;
- captures original runtime state and `_actionForUrl` output into an auditable JSON Artifact;
- cannot commit or push.

The scenario registry contains:

- `nested-switch` → evidence 01I;
- `nested-virtual` → evidence 01J;
- `pac` → evidence 01K.

Pull requests execute `all`. New result families must extend this registry and runner instead of creating another per-trace workflow.

## Captured original runtime

### Baseline and one-level profiles

- `AUDIT_EVIDENCE_01C_ORIGINAL_CHROMIUM_RUNTIME.md` — Chromium baseline.
- `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md` — Firefox baseline.
- `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md` — one-level Switch.
- `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md` — immediate Virtual.

### Attached Rule List 01H

Matched/default AutoProxy results into Direct/Fixed, `(RL) `, `(default)`, hidden attached profile, Badge and color behavior are captured and verified.

### Nested Switch 01I

Outer match/default through one inner Switch is captured and verified. The final route supplies result name/Badge/outer color while the applied outer Switch supplies inner/current color.

### Nested Virtual 01J

Two-level Virtual into Direct/Fixed proxy/bypass is captured and verified, including immediate-target-only suffix, hidden outer transition, visible inner default, result-dependent current color and literal `DIRECT` bypass detail.

### URL-backed PAC 01K

`AUDIT_EVIDENCE_01K_ORIGINAL_PAC_RESULTS.md` establishes:

- one URL-backed PAC with cached script;
- the PAC returns an HTTP proxy for one tab URL and Direct for another;
- the original Action is identical for both URLs;
- current/result name is the PAC profile;
- detail is the exact PAC source URL;
- Badge is derived from the PAC profile name;
- both colors come from the PAC profile, producing a one-color icon;
- no per-URL PAC route result is exposed by the Toolbar.

## Current Nex runtime

Confirmed in real browsers:

- Direct/System/Fixed proxy and bypass;
- one-level Switch and nested Switch 01I;
- immediate Virtual and nested Virtual 01J;
- attached Rule List 01H;
- URL-backed PAC static Toolbar state 01K;
- internal-page/default fallback and tab isolation;
- Chromium Inspect overlay restoration/isolation.

The shared `scripts/nex-toolbar-profile-trace-scenarios.mjs` fixture drives Chromium and Firefox nested Switch, nested Virtual and PAC Action E2E in one applied document. For PAC, two tabs whose script returns different routes must still show the same original Action state.

## Closed evidence-proven correction

`KG-VIRTUAL-BYPASS-DETAIL-001` is `EXACT_EQUIVALENT` and `VERIFIED_AUTOMATION`: immediate Virtual → Fixed bypass uses literal `DIRECT` in the projector, deterministic test and both browser expectations. Fixed profile bypass remains a separate localized contract.

## Remaining Order 1 unknown or missing shapes

- nested Switch beyond 01I;
- nested Virtual beyond 01J, including Virtual → Switch/Rule List/PAC;
- attached Rule List beyond 01H;
- PAC lifecycle beyond 01K: inline/uncached/update/error/header/auth/fallback states;
- temporary-rule state;
- external-controller transitions and recovery;
- renderer fallback and headed pixels where Action API state is insufficient;
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

Capture either the highest-value remaining attached Rule List boundary or the original temporary-rule Toolbar transition. Extend the same evidence harness, implement only the captured subset, verify deterministic/Chromium/Firefox behavior, then continue external-control and renderer-fallback evidence.

## Execution rule

For each node:

1. capture original source and runtime;
2. capture Nex independently;
3. publish the Original ↔ Nex mapping and gap classification;
4. implement only the mapped contract;
5. verify deterministic tests and real Chromium/Firefox behavior;
6. require repository-owner `PASS` before closing the journey.

Synthetic fixtures, green CI, Nex-only screenshots or test volume cannot independently close a product node.
