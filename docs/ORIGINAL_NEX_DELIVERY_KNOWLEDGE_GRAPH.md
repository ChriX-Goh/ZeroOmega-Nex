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

Edges:

- `EXACT_EQUIVALENT`
- `MODERNIZED_EQUIVALENT`
- `INTENTIONAL_DIVERGENCE`
- `MISSING_IN_NEX`
- `BROKEN_IN_NEX`
- `EXTRA_IN_NEX`
- `UNJUSTIFIED_INVENTION`
- `UNKNOWN`

Only `OWNER_ACCEPTED` closes a product journey.

Every node closes through:

`Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

## 2. Layer A — product contract graph

`OriginalProductContract`

- `DirectMigrationContract`
  - supported original export decoding
  - names, colors, ordering and identity
  - startup and Quick Switch state
  - profile references and nested graphs
  - Fixed/Switch/PAC/Virtual/Rule List/bypass/temporary-rule semantics
  - supported authentication metadata
  - immediate usability after import
  - restart and semantic export round trip
- `NoRelearningContract`
  - terminology, hierarchy, action order and defaults
  - validation timing and Apply/Discard behavior
  - profile lifecycle and information density
- `ToolbarContract`
  - Ω geometry and colors
  - title, multiline detail and four-code-unit Badge
  - global baseline and per-tab state
  - nested profile result paths
  - attached Rule List prefixes/defaults
  - temporary-rule/Inspect/external-control states
  - renderer fallback and bounded pixels
- `PopupContract`
  - dimensions, density, profile order and colors
  - selected/current/result state
  - current-site and temporary-rule actions
  - ownership/error/close behavior
- `OptionsContract`
  - navigation, controls, grouping and dialogs
  - validation timing, Apply/Discard and reload restoration
  - profile/rule lifecycle
- `CrossBrowserReliabilityContract`
  - Chromium/Firefox capability and ownership
  - atomic activation, confirmation, rollback and recovery
  - authentication isolation
- `PresentationContract`
  - English, Simplified Chinese and Traditional Chinese
  - light/dark presentation
  - density, spacing, grouping, iconography and focus

## 3. Layer B — semantic architecture graph

`NexArchitecture`

- `LegacyBoundary`
  - bounded original export decoder/importer
  - generated/runtime field classification
  - safe opaque metadata and secret references
  - deterministic compatibility report
  - node `KG-IMPORT-COLOR-001`: normalize original `#RGB` to equivalent `#RRGGBB`
- `ProfileSpecBoundary`
  - stable IDs and ordered profiles
  - Direct/System plus Fixed/Switch/PAC/Virtual/Rule List/AutoDetect
  - startup/Quick Switch, validation, migrations and serialization
- `PolicyOracle`
  - normalized request
  - ordered conditions and recursive graph resolution
  - cycle/depth protection
  - final route plus internal `GraphTrace`
- `OriginalObservableProjection`
  - node `KG-TRACE-001`
  - converts internal decisions into original current/result/detail/Badge/color/icon inputs
  - hides rewrite internals and rejects unverified shapes
  - preserves distinct result color and current/profile color semantics
- `OriginalEvidenceBoundary`
  - node `KG-EVIDENCE-HARNESS-001`
  - one permanent read-only original-package workflow
  - fixed official v3.5.0 Chromium package hash
  - scenario ID, comma-separated IDs or `all`
  - isolated browser profile per scenario
  - original `addProfile`, `applyProfile` and `_actionForUrl`
  - auditable JSON Artifact
- `ActionBoundary`
  - one background writer
  - global baseline plus per-tab coordinator
  - stale-result suppression and lifecycle refresh
  - Inspect overlay and renderer/static fallback
- `NexEvidenceBoundary`
  - deterministic contract tests
  - shared browser-independent profile-trace fixtures
  - Chromium and Firefox full/Toolbar E2E
  - native Chromium Inspect
  - paired visual evidence
  - future real-export and owner-acceptance packages

Stable dependency:

`OriginalProductContract -> OriginalObservableProjection -> ActionBoundary/UserInterfaceBoundary`

The internal `GraphTrace` must never be displayed directly.

## 4. Original-observable represented shapes

`KG-TRACE-001` is `IMPLEMENTED` and `VERIFIED_AUTOMATION` for:

- Direct and System;
- Fixed proxy and bypass;
- one-level Switch → Direct/Fixed;
- nested Switch 01I subset;
- immediate Virtual → Direct/Fixed proxy/bypass, subject to `KG-VIRTUAL-BYPASS-DETAIL-001`;
- nested Virtual 01J subset;
- attached Rule List 01H subset.

Other result shapes remain `UNKNOWN` or `MISSING_IN_NEX` and must fail closed.

## 5. Layer C — acceptance journey graph

### `Order0Governance`

- `KG-CONTRACT-001` — one product constitution: `VERIFIED_AUTOMATION`.
- `KG-GOV-HEAD-001` — exact Head/checks read from GitHub: `VERIFIED_AUTOMATION`.
- `KG-GOV-WORKFLOW-001` — permanent CI/evidence workflows are read-only: `VERIFIED_AUTOMATION`.
- `KG-GOV-GRAPH-001` — graph stores mappings/evidence rather than competing progress: `VERIFIED_AUTOMATION`.

Green automation still cannot declare product completion.

### `Order1ToolbarJourney`

Parent node: `KG-ICON-001` — complete journey `FAILED`.

Supporting nodes:

- `KG-EVIDENCE-HARNESS-001`
  - status: `VERIFIED_AUTOMATION`
  - registry: `nested-switch`, `nested-virtual`
  - pull requests run `all`
- `KG-TRACE-001`
  - status: `VERIFIED_AUTOMATION` for represented shapes
- `KG-SWITCH-NESTED-001`
  - 01I subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`
  - remaining shapes: `UNKNOWN`
- `KG-VIRTUAL-NESTED-001`
  - 01J subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`
  - remaining Virtual → Switch/Rule List/PAC/System, deeper chains and cycles: `UNKNOWN`
- `KG-VIRTUAL-BYPASS-DETAIL-001`
  - immediate Virtual bypass detail: `BROKEN_IN_NEX`
  - original: literal `DIRECT`
  - current older generic path: localized standalone Direct description
  - nested 01J path: correct
- `KG-ATTACHED-RULELIST-001`
  - 01H subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`
  - remaining shapes: `UNKNOWN`
- `KG-PAC-TRACE-001` — open
- `KG-TEMP-RULE-001` — open
- `KG-EXTERNAL-CONTROL-001` — open
- `KG-ACTION-FALLBACK-001` — open
- `KG-TOOLBAR-PIXEL-001` — open where Action API is insufficient
- `KG-OWNER-ORDER1-001` — not run

Original-invalid edge: Switch → System is rejected by original and is not missing.

### `Order2DirectMigrationJourney`

- parent: `KG-IMPORT-001` — `FAILED`
- `KG-IMPORT-COLOR-001` — open
- requires real original export corpus, semantic comparison, activation, restart, re-export, Chromium/Firefox and owner acceptance

### `Order3PopupJourney`

- parent: `KG-FLOW-001`
- depends on accepted `KG-TRACE-001` data and migration
- complete hierarchy, state, current-site actions and ownership remain open

### `Order4OptionsJourney`

- blockers: `KG-UI-001`, `KG-EXTRA-001`, `KG-INVENTION-001`
- navigation, dialogs, action hierarchy, validation, Apply/Discard and lifecycle remain open

### `Order5ProfileLifecycleJourney`

Fixed, Switch, PAC, Virtual, Rule List and AutoDetect complete create/edit/reference/order/cache/activation journeys remain pending re-audit.

### `Order6ReliabilityJourney`

Export, restart, rollback, failure injection, ownership and authentication isolation remain pending owner-complete verification.

### `Order7PresentationJourney`

Localization, density, paired Original ↔ Nex evidence, focus, responsive behavior and bounded pixels remain open.

### `Order8FinalCandidate`

Depends on all required journeys reaching `OWNER_ACCEPTED`. Produces exact artifacts/hashes, migration/reliability evidence, accepted divergences, release notes and final owner `PASS`.

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
`-> Chromium/Firefox Action E2E (VERIFIED_AUTOMATION)`  
`-> KG-VIRTUAL-BYPASS-DETAIL-001 (BROKEN_IN_NEX for bypass detail only)`

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
`-> deterministic tests (VERIFIED_AUTOMATION)`  
`-> shared Nex nested Switch/Virtual fixture (IMPLEMENTED)`  
`-> Chromium Action E2E (VERIFIED_AUTOMATION)`  
`-> Firefox Action E2E (VERIFIED_AUTOMATION)`  
`-> KG-ICON-001 (open)`

Represented:

- outer Virtual → inner Virtual → Direct;
- outer Virtual → inner Virtual → Fixed proxy;
- outer Virtual → inner Virtual → Fixed bypass;
- immediate-target-only suffix;
- hidden outer transition, visible inner default;
- result-dependent profile/current color;
- literal `DIRECT` bypass detail.

Unrepresented:

- deeper Virtual chains;
- Virtual → Switch/Rule List/PAC/System;
- cycles, multiple bypass entries and scheme-specific mappings;
- temporary/external prefixes and target-dependent results.

## 7. Active defect graph

- `KG-ICON-001`: complete Toolbar journey — `FAILED`.
- `KG-VIRTUAL-BYPASS-DETAIL-001`: immediate Virtual bypass detail — `BROKEN_IN_NEX`.
- `KG-IMPORT-001`: direct original export use — `FAILED`.
- `KG-IMPORT-COLOR-001`: original shorthand colors — open.
- `KG-UI-001`: layout/density/dialog/control hierarchy — `FAILED`.
- `KG-EXTRA-001`: unnecessary descriptions/workflow — `FAILED`.
- `KG-INVENTION-001`: visible behavior without provenance — `FAILED`.
- `KG-FLOW-001`: complete interaction parity — `FAILED`.
- `KG-GOV-001`: final evidence and owner acceptance — open.

## 8. Progress and next edge

Formal progress remains 47% total and 35% for Order 1. The next fixed edge is:

`01G literal DIRECT evidence -> KG-VIRTUAL-BYPASS-DETAIL-001 repair -> deterministic tests -> Chromium -> Firefox`

After that repair, the next new original result family is PAC.

No candidate, merge or release is authorized.
