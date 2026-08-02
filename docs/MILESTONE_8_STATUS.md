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

ZeroOmega Nex is a bottom-layer rewrite of ZeroOmega v3.5.0, not a modernization redesign. Supported original exports must import directly and become immediately usable. Experienced original users must not be forced to rebuild profiles, reinterpret settings or learn a replacement workflow. Visible differences require exact original evidence, a minimized browser limitation and repository-owner acceptance.

## Verified Order 1 engineering slice

The retained Toolbar architecture currently verifies:

- one background owner for all real Action writes;
- browser-global baseline plus per-tab overrides;
- serialized startup/profile activation and clean-install System initialization;
- one browser-independent Original-observable projection between internal graph decisions and Action rendering;
- Direct, System and Fixed proxy/bypass;
- exact one-level Switch → Direct/Fixed;
- exact nested Switch 01I subset;
- exact immediate Virtual → Direct/Fixed proxy/bypass;
- exact nested Virtual 01J subset;
- exact attached Rule List 01H subset;
- exact URL-backed PAC Toolbar 01K subset;
- exact temporary-rule Toolbar 01L subset;
- exact external-control Toolbar 01M subset;
- exact renderer-fallback 01N subset;
- exact mixed Virtual → Switch 01O subset;
- original-derived title, detail, four-code-unit Badge, current/result colors and one-/two-color Ω inputs for represented shapes;
- real Chromium and Firefox Action acceptance;
- internal-page/default fallback, tab isolation and native Chromium Inspect set/clear/base restoration/isolation;
- fail-closed behavior outside captured evidence.

These are slice-level engineering results. They do not close `KG-ICON-001`, Order 1 or repository-owner acceptance. Formal progress remains 47% total and 35% for Order 1.

## Permanent original evidence harness

The read-only `Original Toolbar Evidence` workflow:

- downloads the official ZeroOmega v3.5.0 Chromium package;
- verifies fixed SHA-256 `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`;
- accepts one scenario ID, comma-separated IDs or `all`;
- runs each scenario in an isolated real Chromium profile;
- creates and applies profiles through original runtime APIs;
- captures original runtime state, `_actionForUrl`, ownership and bounded renderer probes into a JSON Artifact;
- has `contents: read` and cannot commit or push.

The permanent registry contains:

- `nested-switch` → 01I;
- `nested-virtual` → 01J;
- `pac` → 01K;
- `temporary-rule` → 01L;
- `external-control` → 01M;
- `renderer-fallback` → 01N;
- `virtual-switch` → 01O.

Pull requests execute `all`. New result families must extend this registry rather than creating one workflow per trace.

## Order 1 checkpoints

### Attached Rule List 01H

`AUDIT_EVIDENCE_01H_ORIGINAL_ATTACHED_RULE_LIST_RESULTS.md` verifies matched/default AutoProxy results into Direct/Fixed, hidden attached profile identity, `(RL) `, `(default)`, Badge and color behavior. Parent rules, exclusive/multi-line/non-AutoProxy behavior, bypass, fallthrough and deeper chains remain outside the represented subset.

### Nested Switch 01I

`AUDIT_EVIDENCE_01I_ORIGINAL_NESTED_SWITCH_RESULTS.md` verifies:

1. outer matched rule → inner matched rule → Fixed;
2. outer matched rule → inner default → Direct;
3. outer default → Direct through the one-level contract.

Every selected Switch edge appears in order. The applied outer Switch remains current; the final route supplies result name/Badge/result color; the applied outer Switch supplies current/inner color. Deeper Switch chains and nested bypass/Rule List/Virtual/PAC remain fail closed.

### Nested Virtual 01J

`AUDIT_EVIDENCE_01J_ORIGINAL_NESTED_VIRTUAL_RESULTS.md` verifies:

1. outer Virtual → inner Virtual → Direct;
2. outer Virtual → inner Virtual → Fixed proxy;
3. outer Virtual → inner Virtual → Fixed bypass.

The current name contains only the outer and immediate inner Virtual. The outer transition is hidden; the immediate target/default remains visible according to the captured contract. Deeper and mixed Virtual targets remain outside 01J.

### URL-backed PAC 01K

`AUDIT_EVIDENCE_01K_ORIGINAL_PAC_RESULTS.md` proves that the original Toolbar does not expose per-URL PAC return values for the captured URL-backed PAC profile. Both proxy and Direct PAC outcomes display the applied PAC profile as current/result, the exact PAC URL as detail, profile Badge text and one-color PAC icon. Inline/cache/update/error/header/auth/fallback lifecycle remains open.

### Temporary rule 01L

`AUDIT_EVIDENCE_01L_ORIGINAL_TEMPORARY_RULE_RESULTS.md` verifies one temporary host rule over an empty base Switch:

- matched host → one Fixed HTTP proxy with localized temporary prefix;
- unmatched host → hidden-overlay default to base Switch, then base default to Direct;
- removing the last rule retains the empty hidden overlay for the captured browser session;
- visible current identity remains the base profile;
- all mutations refresh the existing single Action writer.

Multiple rules, other profile families, restart/error lifecycle and complete Popup interaction remain open.

### External control 01M

`AUDIT_EVIDENCE_01M_ORIGINAL_EXTERNAL_CONTROL_RESULTS.md` verifies one applied Fixed profile and one competing extension:

- normal state begins with transparent Badge background;
- takeover produces built-in Direct content, `Dire` Badge and warning-red `#da4f49` background;
- release automatically restores Fixed title/detail/Badge;
- warning-red remains latched after recovery and explicit re-application in the captured runtime lifetime.

Nex reads the real browser control level and refreshes through `proxy.settings.onChange` without adding a second Action writer. Policy/not-controllable variants, multiple competitors, non-Fixed profiles and restart/latch lifetime remain open.

### Renderer fallback 01N

`AUDIT_EVIDENCE_01N_ORIGINAL_RENDERER_FALLBACK.md` verifies:

- alpha `255` privacy-style rejection returns no dynamic icon while title/detail/Badge remain available;
- failed colors are retried on later requests rather than terminally cached;
- restored pixels for the same colors return dynamic sizes `16`, `19`, `24`, `32`, `38`;
- no dynamic image causes no `setIcon` call;
- manifest/current browser icon remains untouched during failure;
- original/Nex default PNG assets are byte-identical;
- a rejected full dynamic write retries with the original `19`/`38` subset.

The E2E probe is build-gated by `WXT_ICON_RENDERER_E2E=1` and is absent from normal CI, production and native Inspect builds. Arbitrary context errors, both browser writes failing, restart behavior and headed post-success failure pixels remain open.

### Virtual → Switch 01O

`AUDIT_EVIDENCE_01O_ORIGINAL_VIRTUAL_SWITCH_RESULTS.md` verifies one applied Virtual whose immediate target is one ordinary Switch:

1. inner matched host rule → one Fixed HTTP fallback proxy;
2. inner matched host rule → Direct;
3. inner Switch default → Direct.

Exact observable contract:

- current name is `outer Virtual [immediate Switch]`;
- the outer Virtual transition line is hidden;
- the inner Switch matched/default transition is visible;
- the immediate Switch supplies current/inner icon color;
- the final Fixed or Direct route supplies result name, Badge and result/outer color;
- the outer Virtual color does not appear in this captured two-color result.

Nex accepts only the exact one-Virtual/one-Switch shape, no attached Rule List, one host-wildcard rule or Direct default, and one Fixed HTTP fallback without bypass/scheme override. Switch → Switch, bypass, PAC/System/Rule List and other mixed targets remain fail closed.

## Evidence-proven correction

`KG-VIRTUAL-BYPASS-DETAIL-001` is `EXACT_EQUIVALENT` and `VERIFIED_AUTOMATION`: immediate Virtual → Fixed bypass uses literal `DIRECT` in the projector, deterministic test and Chromium/Firefox expectations. Fixed-profile bypass remains a separately captured localized contract.

## Migration blocker

`KG-IMPORT-COLOR-001` remains open under Order 2. Original profiles validly use shorthand colors such as `#5b5` and `#d63`, while ProfileSpec expects canonical six-digit colors and the importer currently copies the original value. The import boundary must normalize `#RGB` to equivalent `#RRGGBB` and prove the result with real original exports, activation, restart and semantic re-export.

## Open Order 1 blockers

- nested Switch shapes outside 01I;
- nested Virtual shapes outside 01J;
- mixed Virtual → Switch shapes outside 01O;
- attached Rule List shapes outside 01H;
- PAC lifecycle outside 01K;
- temporary-rule lifecycle outside 01L;
- external-control lifecycle outside 01M;
- renderer failures outside 01N;
- headed Toolbar pixels where Action API state is insufficient;
- consolidated repository-owner `PASS` for the corrected Order 1 journey.

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

1. Capture the next high-value unrepresented mixed/nested or attached result family.
2. Map and implement only the exact captured subset.
3. Verify deterministic tests and shared Chromium/Firefox profile-trace E2E.
4. Capture headed pixels only where Action API state is insufficient.
5. Run consolidated repository-owner acceptance for Order 1.
6. Only after Order 1 `PASS`, begin real original-export migration corpus work, including `KG-IMPORT-COLOR-001`.

## Candidate prohibition

No candidate, merge or release may be declared from green automation alone. A candidate requires a complete exact-build evidence package and explicit repository-owner acceptance under the product constitution.
