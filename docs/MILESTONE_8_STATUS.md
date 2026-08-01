# Milestone 8 Status — Original-Compatible Rewrite

## Authority

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This file is the single hand-maintained Milestone 8 progress and blocker summary. Exact moving Head and workflow conclusions are read from Draft PR #11 and GitHub Checks rather than copied here.

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft  
**Active candidate:** none  
**Last candidate:** `M8-OWNER-QC-1` — `FAILED` on 2026-07-30  
**Provisional total progress:** 47% (unrounded 46.7%; confidence band 42%–50%)  
**Active journey:** Order 1 — installation/startup/Toolbar, 35%

Milestone 8 is not complete or release-ready. The former `98%` and broad `DONE` counts measured an incomplete automated contract and were invalidated by repository-owner trial.

## Product contract

ZeroOmega Nex is a bottom-layer rewrite of ZeroOmega v3.5.0, not a modernization redesign. Supported original exports must import directly and become immediately usable. Experienced original users must not be forced to rebuild profiles, reinterpret settings or learn a replacement workflow. Visible differences require exact evidence, a minimized browser limitation and repository-owner acceptance.

## Verified Order 1 engineering slice

The retained Toolbar architecture currently includes:

- one background owner for all real Action writes;
- a browser-global Action baseline followed by per-tab overrides;
- serialized startup and profile-workflow transitions;
- clean-install initialization to the original System route;
- one browser-independent Original-observable projection between internal graph decisions and Action rendering;
- Direct, System and Fixed proxy/bypass;
- exact one-level Switch → Direct/Fixed;
- the exact two-level nested Switch 01I subset;
- exact immediate Virtual → Direct/Fixed proxy/bypass;
- the exact two-level nested Virtual 01J subset;
- the exact attached Rule List 01H subset;
- the exact URL-backed PAC Toolbar 01K subset;
- original-derived title, detail, four-code-unit Badge, color and suffix behavior for represented shapes;
- Chromium and Firefox real Action acceptance for represented states;
- internal-page/default fallback, tab isolation and Chromium Inspect set/clear/base restoration/isolation;
- fail-closed behavior for result shapes outside captured evidence.

These are slice-level engineering results. They do not close Order 1 or `KG-ICON-001`. Total progress remains 47% and Order 1 remains 35%.

## Parameterized original evidence harness

The permanent read-only `Original Toolbar Evidence` workflow:

- downloads the exact official ZeroOmega v3.5.0 Chromium package;
- verifies its fixed SHA-256 before execution;
- accepts one scenario ID, comma-separated IDs or `all`;
- runs each scenario in an isolated real Chromium profile;
- creates and applies profiles through the original runtime APIs;
- captures original `_actionForUrl` output and runtime state into one auditable JSON Artifact;
- cannot commit, push or modify the branch.

The registry now contains `nested-switch`, `nested-virtual` and `pac`. Pull requests execute `all`, so a newly registered scenario cannot remain unexecuted by default.

## Nested Switch 01I checkpoint

`AUDIT_EVIDENCE_01I_ORIGINAL_NESTED_SWITCH_RESULTS.md` establishes and the unified projection verifies:

1. outer matched rule → inner matched rule → Fixed proxy;
2. outer matched rule → inner default → Direct;
3. outer default → Direct through the existing one-level Switch contract.

Every selected Switch edge appears in order. The applied outer Switch remains current; the final route controls result name, Badge and outer color; the applied outer Switch supplies the Action inner/current color.

Outer default → inner Switch, deeper chains, nested bypass and nested Rule List/Virtual/PAC remain fail-closed.

## Nested Virtual 01J checkpoint

`AUDIT_EVIDENCE_01J_ORIGINAL_NESTED_VIRTUAL_RESULTS.md` establishes and the unified projection verifies:

1. outer Virtual → inner Virtual → built-in Direct;
2. outer Virtual → inner Virtual → one Fixed proxy;
3. outer Virtual → inner Virtual → that Fixed profile's captured `localhost` bypass.

The current name contains only the applied outer Virtual and immediate inner Virtual. The outer default transition is hidden; the inner default transition is visible. Direct/proxy uses the inner Virtual current color, while Fixed bypass uses the final Fixed current color and literal `DIRECT` detail.

More than two Virtual levels, Virtual → Switch/Rule List/PAC/System, cycles, multiple bypass entries, scheme-specific mappings and target-dependent results remain fail-closed.

## Attached Rule List 01H checkpoint

`AUDIT_EVIDENCE_01H_ORIGINAL_ATTACHED_RULE_LIST_RESULTS.md` establishes and the unified projection verifies:

1. matched AutoProxy line → Fixed;
2. no match → default Direct;
3. matched AutoProxy line → Direct;
4. no match → default Fixed.

The parent Switch remains current, the hidden attached profile stays hidden, `(RL) ` is limited to matched details and `(default)` is used for fallback. Parent rules, exclusive/multi-line/non-AutoProxy behavior, bypass, fallthrough, chains and uncaptured nesting remain fail-closed.

## URL-backed PAC 01K checkpoint

`AUDIT_EVIDENCE_01K_ORIGINAL_PAC_RESULTS.md` establishes a non-obvious original contract:

- the browser PAC runtime may return `PROXY ...` for one tab and `DIRECT` for another;
- the original Toolbar does not expose those per-URL PAC return values;
- both tabs show the applied PAC profile as current and result;
- the exact PAC source URL is the detail line;
- the profile name supplies Badge text;
- the PAC profile color supplies both Action colors, producing a one-color icon.

Nex preserves the strategy interpreter's `target-dependent/indeterminate` PAC decision and projects only this original static PAC Action state. It does not execute arbitrary PAC merely to manufacture a per-tab explanation.

The represented subset requires one enabled URL-backed PAC profile with a cached script, no headers, no credentials and no fallback route. Inline-only PAC, uncached URL PAC, update/download failures, headers, credentials, fallback profiles, invalid scripts and PAC lifecycle transitions remain fail-closed or open.

## Closed evidence-proven correction

`KG-VIRTUAL-BYPASS-DETAIL-001` is `EXACT_EQUIVALENT` and `VERIFIED_AUTOMATION`.

- Original immediate Virtual → Fixed bypass evidence in 01G uses `localhost => DIRECT`.
- The generic immediate Virtual projector emits the literal PAC result `DIRECT`.
- Deterministic and real Chromium/Firefox Toolbar expectations use the same literal result.
- Fixed profile bypass remains unchanged under its separately captured localized detail contract.

## Migration blocker

`KG-IMPORT-COLOR-001` remains open under Order 2. Original profiles validly use three-digit colors such as `#5b5` and `#d63`, while ProfileSpec accepts canonical six-digit colors and the legacy importer currently copies the original value unchanged. The import boundary must normalize `#RGB` to equivalent `#RRGGBB` and prove the result with real original exports, browser activation, restart and semantic re-export.

## Open Order 1 blockers

- nested Switch shapes outside 01I;
- nested Virtual and Virtual → Switch/Rule List/PAC shapes outside 01J;
- attached Rule List shapes outside 01H;
- PAC lifecycle shapes outside 01K, including inline/cache/update/error/header/auth/fallback states;
- temporary-rule transitions through the single Action writer;
- external-control transitions and recovery;
- forced dynamic-render failure and static fallback evidence;
- headed Toolbar pixels where Action API state is insufficient;
- one consolidated repository-owner `PASS` for the corrected Order 1 journey.

Switch → System is not an open parity feature because the original runtime rejects it.

## Project-wide release blockers

- `KG-ICON-001` — complete Toolbar icon/title/Badge/detail/per-tab journey;
- `KG-IMPORT-001` — real original export direct import and immediate equivalent use;
- `KG-IMPORT-COLOR-001` — shorthand original color normalization;
- `KG-UI-001` — layout, density, dialogs, controls and hierarchy;
- `KG-EXTRA-001` — unnecessary descriptions and extra workflow;
- `KG-INVENTION-001` — visible behavior without provenance or accepted difference;
- `KG-FLOW-001` — complete feature and interaction parity;
- `KG-GOV-001` — completion, evidence and owner-acceptance governance.

## Immediate execution order

1. Capture the next high-value attached Rule List or temporary-rule Toolbar boundary in the permanent original harness.
2. Continue external-control and renderer-fallback states.
3. Run one complete Chromium/Firefox Order 1 matrix and focused owner acceptance.
4. Only after Order 1 `PASS`, begin the real original-export migration corpus, including `KG-IMPORT-COLOR-001`.

## Candidate prohibition

No new candidate, merge or release may be declared from green automation alone. A candidate requires a complete exact-build evidence package and explicit repository-owner acceptance under the product constitution.
