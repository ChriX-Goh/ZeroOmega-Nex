# Active Original ↔ Nex Parity Audit Index

## Authority

`PRODUCT_CONSTITUTION.md` is authoritative. `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` defines stable nodes and dependencies. `MILESTONE_8_STATUS.md` is the hand-maintained project summary. Draft PR #11 and GitHub Checks provide the exact moving Head and workflow conclusions.

## Current repository state

- Branch: `feat/m8-profile-workflow`.
- PR: #11, Draft.
- Active candidate: none.
- Failed candidate: `M8-OWNER-QC-1`.
- Provisional total progress: 47% (46.7%; confidence band 42%–50%).
- Active journey: Order 1 at 35%.
- Merge, release and ordinary candidate generation: prohibited.

## Current architecture

The retained runtime has:

- one background Action writer;
- one browser-global baseline plus per-tab overrides;
- serialized startup, activation and Action refresh;
- clean-install System initialization;
- repository-backed original-observable projection;
- exact renderer/localization and compatibility fallback;
- Inspect through the same executor;
- temporary-rule and ownership inputs through the same coordinator;
- fail-closed behavior for uncaptured trace shapes.

## Represented Toolbar families

The unified projection is `VERIFIED_AUTOMATION` for:

- Direct and System;
- Fixed proxy and bypass;
- one-level Switch → Direct/Fixed;
- attached Rule List 01H;
- nested Switch 01I;
- immediate Virtual → Direct/Fixed proxy/bypass;
- nested Virtual 01J;
- URL-backed PAC static Toolbar state 01K;
- temporary-rule Toolbar state 01L;
- external-control Toolbar state 01M;
- mixed Virtual → Switch 01O.

The Action boundary separately covers renderer fallback 01N. Real Chromium and Firefox Action E2E covers every represented family. Native Chromium Inspect covers set, clear, base restoration and tab isolation.

Switch → System is not missing because the original runtime rejects it.

## Permanent original evidence harness

`.github/workflows/original-toolbar-evidence.yml`:

- downloads and verifies the official ZeroOmega v3.5.0 Chromium package;
- runs every scenario in an isolated browser profile;
- creates and applies profiles through original runtime APIs;
- captures runtime state, `_actionForUrl`, bounded ownership probes and renderer probes;
- uploads JSON evidence;
- has read-only repository permission.

Scenario registry:

- `nested-switch` → 01I;
- `nested-virtual` → 01J;
- `pac` → 01K;
- `temporary-rule` → 01L;
- `external-control` → 01M;
- `renderer-fallback` → 01N;
- `virtual-switch` → 01O.

Pull requests run `all`.

## Evidence registry

### Baseline

- `AUDIT_EVIDENCE_01_ORIGINAL_TOOLBAR.md`;
- `AUDIT_EVIDENCE_01_ORIGINAL_RELEASE.md`;
- `AUDIT_EVIDENCE_01C_ORIGINAL_CHROMIUM_RUNTIME.md`;
- `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`;
- `AUDIT_EVIDENCE_01E_ORIGINAL_TARGET_CONSTANTS.md`;
- `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md`;
- `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md`.

### Extended Toolbar evidence

- 01H — attached Rule List matched/default results, prefixes, hidden identity, Badge and colors;
- 01I — one outer Switch entering one inner Switch;
- 01J — two-level Virtual into Direct/Fixed proxy/bypass;
- 01K — URL-backed PAC static current/result/detail/Badge/icon contract;
- 01L — one temporary host rule, unmatched path and retained empty overlay;
- 01M — competing-extension takeover, Direct warning state, recovery and warning-color latch;
- 01N — privacy-style draw failure, no write, retry, five-size recovery and `19`/`38` fallback retry;
- 01O — outer Virtual entering one ordinary Switch with Fixed/Direct/default results.

## Current Nex runtime evidence

Deterministic and real-browser matrices cover:

- represented profile/result families above;
- internal-page/default fallback;
- same-tab proxy ↔ bypass and represented inclusive transitions;
- two-tab isolation;
- startup and activation refresh;
- temporary-rule mutation refresh;
- ownership takeover/recovery refresh;
- native Chromium Inspect;
- renderer repeated failure/recovery.

`scripts/nex-toolbar-profile-trace-scenarios.mjs` drives shared Chromium/Firefox profile-trace acceptance. Focused E2E separately verifies external control and renderer fallback against real browser APIs. Test-only renderer instrumentation is absent from normal builds.

## Active delivery sequence

1. **Order 1 — installation/startup/Toolbar:** 35%. Engineering coverage is broad enough to enter closure mode; owner acceptance remains open.
2. **Order 2 — original export → direct Nex use:** blocked by `KG-IMPORT-001` and `KG-IMPORT-COLOR-001`.
3. **Order 3 — Popup and temporary/site-rule journey:** broad hierarchy and complete interaction parity remain open.
4. **Order 4 — Options / Apply / Discard:** broad layout, workflow, dialog and text parity remain open.
5. **Order 5 — complete profile/lifecycle journeys:** historical implementation requires complete-journey re-audit.
6. **Order 6 — export/restart/rollback/ownership/authentication:** engineering assets exist; accepted complete behavior is unproved.
7. **Order 7 — localization/density/visual alignment:** paired original comparison and owner acceptance remain open.

## Remaining bounded Order 1 shapes

These remain fail closed and are deferred unless the consolidated ordinary-use journey exposes them:

- nested Switch beyond 01I;
- nested Virtual beyond 01J;
- Virtual → Switch beyond 01O;
- attached Rule List beyond 01H;
- PAC lifecycle beyond 01K;
- temporary-rule lifecycle beyond 01L;
- external-control lifecycle beyond 01M;
- renderer failures beyond 01N.

Their full lifecycle belongs to later Orders 3, 5 or 6. They are no longer an open-ended mandate to keep expanding Order 1.

## Active blockers

- `KG-ICON-001` — complete Toolbar journey: `FAILED` until owner acceptance.
- `KG-IMPORT-001` — original export direct use: `FAILED`.
- `KG-IMPORT-COLOR-001` — original `#RGB` normalization: open.
- `KG-UI-001` — Options/Popup presentation and hierarchy: `FAILED`.
- `KG-EXTRA-001` — extra descriptions/workflow: `FAILED`.
- `KG-INVENTION-001` — visible behavior without provenance: `FAILED`.
- `KG-FLOW-001` — complete interaction parity: `FAILED`.
- `KG-GOV-001` — final owner-acceptance governance: open.

## Order 1 closure mode

New original evidence families are prohibited unless:

1. the consolidated ordinary-use journey reaches an unresolved state;
2. existing Nex output disagrees with captured original behavior;
3. the gap risks data loss, unsafe proxy state, credential exposure or failed recovery;
4. the state is required by the ordinary Order 1 acceptance path.

An exotic graph combination alone remains fail closed and moves to its later delivery order.

## Next fixed edge

Build one consolidated Chromium/Firefox Order 1 acceptance journey from existing evidence. Add only missing normal-restart and ordinary user-Fixed coverage, produce one exact acceptance build/evidence manifest, fix blockers found by that journey, then request repository-owner `PASS`. After Order 1 acceptance, begin Order 2 real-export migration and `KG-IMPORT-COLOR-001`.

## Execution rule

Every product node closes through:

`Original source/runtime -> original input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

Synthetic fixtures, green CI, Nex-only screenshots or test volume cannot independently close a product journey.
