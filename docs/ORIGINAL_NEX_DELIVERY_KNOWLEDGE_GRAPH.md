# ZeroOmega Original ↔ Nex Delivery Knowledge Graph

## 0. Authority and scope

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. `DELIVERY_PLAN.md` defines delivery order and acceptance. `MILESTONE_8_STATUS.md` is the single hand-maintained progress summary. Draft PR #11 and GitHub Checks provide exact moving Head and workflow conclusions.

This graph records stable product nodes, semantic architecture nodes, Original ↔ Nex mappings, evidence edges, defects and acceptance dependencies. It is not a competing product constitution or moving SHA database.

## 1. Status and edge vocabulary

Statuses:

- `SOURCE_CAPTURED` — exact original source/package/runtime/data evidence exists.
- `NEX_CAPTURED` — current Nex source and real behavior are independently captured.
- `MAPPED` — explicit Original ↔ Nex relationship and gap classification exists.
- `IMPLEMENTED` — code exists but required verification is incomplete.
- `VERIFIED_AUTOMATION` — deterministic tests and required browser automation pass.
- `VERIFIED_REAL_DATA` — representative original data passes complete real journeys.
- `OWNER_ACCEPTED` — repository owner accepts the exact build/journey.
- `FAILED` — a demonstrated defect or journey failure exists.
- `UNKNOWN` — evidence is incomplete.

Edges: `EXACT_EQUIVALENT`, `MODERNIZED_EQUIVALENT`, `INTENTIONAL_DIVERGENCE`, `MISSING_IN_NEX`, `BROKEN_IN_NEX`, `EXTRA_IN_NEX`, `UNJUSTIFIED_INVENTION`, `UNKNOWN`.

Only `OWNER_ACCEPTED` closes a product journey. Every node closes through:

`Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

## 2. Layer A — product contract graph

`OriginalProductContract`

- `DirectMigrationContract`
  - supported original export decoding;
  - names, colors, ordering, identity, startup and Quick Switch;
  - Fixed/Switch/PAC/Virtual/Rule List/bypass/temporary-rule semantics;
  - supported authentication metadata;
  - immediate use, restart and semantic export round trip.
- `NoRelearningContract`
  - terminology, hierarchy, action order, defaults, validation timing, Apply/Discard and information density.
- `ToolbarContract`
  - Ω geometry, title/detail/Badge/colors;
  - global baseline and per-tab state;
  - nested profile paths, Rule List prefixes/defaults;
  - PAC profile state;
  - temporary-rule, Inspect, external-control and renderer fallback.
- `PopupContract`, `OptionsContract`, `CrossBrowserReliabilityContract`, `PresentationContract` remain complete-journey nodes.

## 3. Layer B — semantic architecture graph

`NexArchitecture`

- `LegacyBoundary`
  - bounded decoder/importer, metadata classification and secret references;
  - `KG-IMPORT-COLOR-001`: normalize original `#RGB` to equivalent `#RRGGBB`.
- `ProfileSpecBoundary`
  - stable IDs, ordered Direct/System/Fixed/Switch/PAC/Virtual/Rule List/AutoDetect profiles;
  - startup/Quick Switch, validation, migration and serialization.
- `PolicyOracle`
  - request normalization, ordered rules, recursive graph resolution, cycle/depth protection;
  - arbitrary PAC remains `target-dependent/indeterminate` and is delegated to a browser PAC runtime.
- `OriginalObservableProjection`
  - node `KG-TRACE-001`;
  - converts internal decisions into original current/result/detail/Badge/color/icon inputs;
  - hides rewrite internals and rejects unverified shapes;
  - may project captured original static Action states from specific PAC and temporary-overlay runtime shapes without exposing internal graph objects.
- `TemporaryOverlayBoundary`
  - session-persisted hidden Switch state;
  - empty active overlay retained after last-rule removal;
  - normal runtime inspection reports the visible base route;
  - Toolbar-only inspection exposes the active synthetic graph to the Original-observable projector;
  - all mutations refresh the existing single Action writer.
- `OriginalEvidenceBoundary`
  - node `KG-EVIDENCE-HARNESS-001`;
  - one permanent read-only original-package workflow;
  - fixed official v3.5.0 Chromium package hash;
  - isolated scenario profiles, original runtime commands and `_actionForUrl`, JSON Artifact.
- `ActionBoundary`
  - one background writer, global baseline, per-tab coordinator, stale suppression, lifecycle refresh, Inspect overlay and renderer fallback.
- `NexEvidenceBoundary`
  - deterministic tests, shared profile-trace fixtures, Chromium/Firefox E2E, native Inspect, visual evidence, future real exports and owner acceptance.

Stable dependency:

`OriginalProductContract -> OriginalObservableProjection -> ActionBoundary/UserInterfaceBoundary`

The internal `GraphTrace`, hidden temporary profile identity and arbitrary PAC execution must not be invented as user-facing explanations.

## 4. Original-observable represented shapes

`KG-TRACE-001` is `IMPLEMENTED` and `VERIFIED_AUTOMATION` for:

- Direct and System;
- Fixed proxy and bypass;
- one-level Switch → Direct/Fixed;
- nested Switch 01I subset;
- immediate Virtual → Direct/Fixed proxy/bypass;
- nested Virtual 01J subset;
- attached Rule List 01H subset;
- URL-backed PAC Toolbar 01K subset;
- temporary-rule Toolbar 01L subset.

Other result/lifecycle shapes remain `UNKNOWN` or `MISSING_IN_NEX` and must fail closed.

## 5. Layer C — acceptance journey graph

### `Order0Governance`

- `KG-CONTRACT-001`, `KG-GOV-HEAD-001`, `KG-GOV-WORKFLOW-001`, `KG-GOV-GRAPH-001`: `VERIFIED_AUTOMATION`.
- Green automation cannot declare product completion.

### `Order1ToolbarJourney`

Parent node: `KG-ICON-001` — complete journey `FAILED`.

Supporting nodes:

- `KG-EVIDENCE-HARNESS-001`
  - `VERIFIED_AUTOMATION`;
  - registry: `nested-switch`, `nested-virtual`, `pac`, `temporary-rule`;
  - pull requests run `all`.
- `KG-TRACE-001`
  - `VERIFIED_AUTOMATION` for represented shapes.
- `KG-SWITCH-NESTED-001`
  - 01I: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - remaining shapes: `UNKNOWN`.
- `KG-VIRTUAL-NESTED-001`
  - 01J: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - deeper/mixed targets: `UNKNOWN`.
- `KG-VIRTUAL-BYPASS-DETAIL-001`
  - literal `DIRECT`: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`.
- `KG-ATTACHED-RULELIST-001`
  - 01H: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - remaining shapes: `UNKNOWN`.
- `KG-PAC-TRACE-001`
  - 01K URL-backed static Action subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - inline/cache/update/error/header/auth/fallback lifecycle: `UNKNOWN`.
- `KG-TEMP-RULE-001`
  - 01L one-host-rule/empty-base-Switch/Fixed-target subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - multiple rules, other profile families, restart/error lifecycle and complete Popup journey: `UNKNOWN`.
- `KG-EXTERNAL-CONTROL-001` — open.
- `KG-ACTION-FALLBACK-001` — open.
- `KG-TOOLBAR-PIXEL-001` — open where Action API is insufficient.
- `KG-OWNER-ORDER1-001` — not run.

Original-invalid edge: Switch → System is rejected by original and is not missing.

### `Order2DirectMigrationJourney`

- parent `KG-IMPORT-001`: `FAILED`;
- `KG-IMPORT-COLOR-001`: open;
- requires real original exports, semantic comparison, activation, restart, re-export, Chromium/Firefox and owner acceptance.

### `Order3PopupJourney` through `Order8FinalCandidate`

Popup, Options, complete profile lifecycle, reliability, presentation and final candidate remain dependent on their existing `KG-FLOW-001`, `KG-UI-001`, `KG-EXTRA-001`, `KG-INVENTION-001`, migration and owner-acceptance nodes.

## 6. Evidence registry and mapping edges

### Baseline

- `AUDIT_EVIDENCE_01_ORIGINAL_RELEASE.md`
- `AUDIT_EVIDENCE_01C_ORIGINAL_CHROMIUM_RUNTIME.md`
- `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`

### One-level Switch 01F

`OriginalSwitch01F (SOURCE_CAPTURED)`  
`-> KG-TRACE-001 (IMPLEMENTED)`  
`-> Chromium/Firefox Action E2E (VERIFIED_AUTOMATION)`

### Immediate Virtual 01G

`OriginalImmediateVirtual01G (SOURCE_CAPTURED)`  
`-> KG-TRACE-001 (IMPLEMENTED)`  
`-> KG-VIRTUAL-BYPASS-DETAIL-001 (EXACT_EQUIVALENT)`  
`-> Chromium/Firefox Action E2E (VERIFIED_AUTOMATION)`

### Attached Rule List 01H

`OriginalAttachedRuleList01H (SOURCE_CAPTURED)`  
`-> KG-ATTACHED-RULELIST-001 (MAPPED subset)`  
`-> unified subprojector (IMPLEMENTED)`  
`-> deterministic + Chromium + Firefox (VERIFIED_AUTOMATION)`  
`-> KG-ICON-001 (open)`

Represented: match/default to Direct/Fixed. Unrepresented: parent rules, exclusive/multi-line/non-AutoProxy, bypass, fallthrough, chains and other nesting.

### Nested Switch 01I

`OriginalNestedSwitch01I (SOURCE_CAPTURED)`  
`-> KG-EVIDENCE-HARNESS-001 (VERIFIED_AUTOMATION)`  
`-> KG-SWITCH-NESTED-001 (MAPPED subset)`  
`-> unified subprojector (IMPLEMENTED)`  
`-> deterministic + shared Chromium/Firefox profile-trace E2E (VERIFIED_AUTOMATION)`  
`-> KG-ICON-001 (open)`

### Nested Virtual 01J

`OriginalNestedVirtual01J (SOURCE_CAPTURED)`  
`-> KG-EVIDENCE-HARNESS-001 (VERIFIED_AUTOMATION)`  
`-> KG-VIRTUAL-NESTED-001 (MAPPED subset)`  
`-> unified subprojector (IMPLEMENTED)`  
`-> deterministic + Chromium + Firefox profile-trace E2E (VERIFIED_AUTOMATION)`  
`-> KG-ICON-001 (open)`

### URL-backed PAC 01K

`OriginalUrlBackedPac01K (SOURCE_CAPTURED)`  
`-> KG-EVIDENCE-HARNESS-001 scenario pac (VERIFIED_AUTOMATION)`  
`-> KG-PAC-TRACE-001 (MAPPED subset)`  
`-> URL-backed PAC subprojector (IMPLEMENTED)`  
`-> deterministic tests (VERIFIED_AUTOMATION)`  
`-> shared Chromium profile-trace E2E (VERIFIED_AUTOMATION)`  
`-> shared Firefox profile-trace E2E (VERIFIED_AUTOMATION)`  
`-> KG-ICON-001 (open)`

Represented:

- enabled URL-backed PAC with cached script;
- no headers, credentials or fallback;
- PAC returning explicit HTTP proxy for one URL and Direct for another;
- identical original Action for both URLs;
- current/result name = PAC profile;
- detail = exact PAC source URL;
- Badge = PAC profile name truncated to four code units;
- one-color PAC icon.

Unrepresented:

- inline-only or uncached PAC;
- download, cache, update and invalid-script states;
- custom headers, credentials and fallback profiles;
- SOCKS/HTTPS chains;
- complete PAC lifecycle.

### Temporary rule 01L

`OriginalTemporaryRule01L (SOURCE_CAPTURED)`  
`-> KG-EVIDENCE-HARNESS-001 scenario temporary-rule (VERIFIED_AUTOMATION)`  
`-> KG-TEMP-RULE-001 (MAPPED subset)`  
`-> session-preserved hidden overlay + specialized projector (IMPLEMENTED)`  
`-> deterministic model/runtime/Toolbar tests (VERIFIED_AUTOMATION)`  
`-> shared Chromium profile-trace E2E (VERIFIED_AUTOMATION)`  
`-> shared Firefox profile-trace E2E (VERIFIED_AUTOMATION)`  
`-> KG-ICON-001 (open)`

Represented:

- one `*.temp-rule.test` temporary host rule;
- one empty colored base Switch with default Direct;
- one colored Fixed HTTP proxy target without bypass;
- matched Fixed result with localized temporary prefix;
- unmatched overlay fallthrough with two visible default transitions;
- deletion of the last rule while the empty hidden overlay remains active;
- visible base-profile identity, result-dependent Badge/colors and immediate single-writer refresh.

Unrepresented:

- multiple temporary rules, ordering and replacement;
- other condition types;
- other base/target profile families and nested graphs;
- restart restoration and browser-session boundaries;
- invalid routes, activation failure and rollback;
- complete Popup temporary-rule interaction and owner acceptance.

## 7. Active defect graph

- `KG-ICON-001`: complete Toolbar journey — `FAILED`.
- `KG-IMPORT-001`: direct original export use — `FAILED`.
- `KG-IMPORT-COLOR-001`: original shorthand colors — open.
- `KG-UI-001`: layout/density/dialog/control hierarchy — `FAILED`.
- `KG-EXTRA-001`: unnecessary descriptions/workflow — `FAILED`.
- `KG-INVENTION-001`: visible behavior without provenance — `FAILED`.
- `KG-FLOW-001`: complete interaction parity — `FAILED`.
- `KG-GOV-001`: final evidence and owner acceptance — open.

## 8. Progress and next edge

Formal progress remains 47% total and 35% for Order 1. `KG-TEMP-RULE-001` is verified for the strict 01L Toolbar subset; the complete temporary-rule/Popup lifecycle remains open.

The next fixed edge is:

`external-control original source/runtime -> KG-EXTERNAL-CONTROL-001 mapping -> implementation -> deterministic tests -> Chromium -> Firefox`

No candidate, merge or release is authorized.
