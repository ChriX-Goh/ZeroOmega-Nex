# ZeroOmega Original ↔ Nex Delivery Knowledge Graph

## 0. Authority and scope

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. `DELIVERY_PLAN.md` defines delivery order and acceptance. `MILESTONE_8_STATUS.md` is the single hand-maintained progress summary. Draft PR #11 and GitHub Checks provide exact moving Head and workflow conclusions.

This graph records stable product nodes, semantic architecture nodes, Original ↔ Nex mappings, evidence edges, defects and acceptance dependencies. It is not a competing constitution or moving-SHA database.

## 1. Status and edge vocabulary

Statuses:

- `SOURCE_CAPTURED` — exact original source/package/runtime/data evidence exists.
- `NEX_CAPTURED` — current Nex source and real behavior are independently captured.
- `MAPPED` — an explicit Original ↔ Nex relationship and gap classification exists.
- `IMPLEMENTED` — code exists but required verification is incomplete.
- `VERIFIED_AUTOMATION` — deterministic tests and required browser automation pass.
- `VERIFIED_REAL_DATA` — representative original data passes complete real journeys.
- `OWNER_ACCEPTED` — repository owner accepts the exact build/journey.
- `FAILED` — a demonstrated defect or journey failure exists.
- `UNKNOWN` — evidence is incomplete.

Edges:

- `EXACT_EQUIVALENT`;
- `MODERNIZED_EQUIVALENT`;
- `INTENTIONAL_DIVERGENCE`;
- `MISSING_IN_NEX`;
- `BROKEN_IN_NEX`;
- `EXTRA_IN_NEX`;
- `UNJUSTIFIED_INVENTION`;
- `UNKNOWN`.

Only `OWNER_ACCEPTED` closes a product journey. Every product node closes through:

`Original source/runtime -> original input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

## 2. Layer A — product contract graph

`OriginalProductContract`

- `DirectMigrationContract`
  - supported original export decoding;
  - original names, colors, ordering, identity, startup and Quick Switch;
  - Fixed/Switch/PAC/Virtual/Rule List/bypass/temporary-rule semantics;
  - supported authentication metadata;
  - immediate use, restart and semantic export round trip.
- `NoRelearningContract`
  - terminology, hierarchy, action order, defaults, validation timing, Apply/Discard and information density.
- `ToolbarContract`
  - Ω geometry, title/detail/Badge/colors;
  - global baseline and per-tab state;
  - nested and mixed profile paths;
  - Rule List prefixes/defaults;
  - PAC static Action state;
  - temporary rules, Inspect, external control and renderer failure.
- `PopupContract`
  - Quick Switch hierarchy, result selectors, current-site actions, temporary rules and ownership blocking.
- `OptionsContract`
  - profile navigation, editors, Apply/Discard, validation, import/export and history.
- `CrossBrowserReliabilityContract`
  - Chromium/Firefox capability differences, startup/restart/rollback, permissions and ownership.
- `PresentationContract`
  - original-facing density, wording, layout, dialogs and visual hierarchy.

Layer-A closure requires complete journeys and owner acceptance. Slice-level Toolbar automation cannot independently close these nodes.

## 3. Layer B — semantic architecture graph

### `LegacyBoundary`

- bounded decoder/importer and metadata classification;
- no credential leakage into ordinary profile documents;
- `KG-IMPORT-COLOR-001`: normalize valid original `#RGB` to equivalent canonical `#RRGGBB` at the import boundary.

### `ProfileSpecBoundary`

- stable IDs and ordered Direct/System/Fixed/Switch/PAC/Virtual/Rule List/AutoDetect profiles;
- startup, Quick Switch, validation, migration and serialization;
- internal representation may differ, but exported observable semantics must remain original-compatible.

### `PolicyOracle`

- request normalization;
- ordered rules;
- recursive graph resolution;
- cycle/depth protection;
- arbitrary PAC remains `target-dependent/indeterminate` and is delegated to the browser PAC runtime.

### `OriginalObservableProjection`

Node: `KG-TRACE-001`.

Responsibilities:

- convert internal graph decisions into original current/result/detail/Badge/color/icon inputs;
- hide rewrite-only graph identities and transitions;
- preserve original immediate-target visibility rules;
- project captured PAC, temporary-overlay and ownership static Action states;
- reject uncaptured shapes rather than inventing explanations.

Current represented route families:

- Direct/System;
- Fixed proxy/bypass;
- one-level Switch;
- nested Switch 01I;
- immediate Virtual;
- nested Virtual 01J;
- attached Rule List 01H;
- URL PAC 01K;
- temporary rule 01L;
- external control 01M;
- mixed Virtual → Switch 01O.

Renderer fallback 01N belongs primarily to `ActionBoundary`, not route projection.

### `TemporaryOverlayBoundary`

- session-persisted hidden Switch state;
- empty overlay remains active after final rule removal;
- normal runtime inspection reports visible base route;
- Toolbar-only inspection supplies synthetic graph to Original projection;
- all mutations refresh the existing Action coordinator;
- no second Action writer.

### `ExternalControlBoundary`

- real browser proxy control level enters Toolbar runtime view;
- `proxy.settings.onChange` refreshes existing coordinator;
- captured competing-extension state projects built-in Direct warning content;
- restored ownership returns normal profile content;
- warning-red Badge background remains latched for captured runtime lifetime;
- Popup ownership blocking remains a separate surface.

### `RendererFallbackBoundary`

- one shared `300 × 300` OffscreenCanvas;
- output sizes `16`, `19`, `24`, `32`, `38`;
- only successful dynamic images enter color cache;
- privacy-style failure returns no dynamic icon and remains retryable;
- absent image causes no browser `setIcon` call;
- manifest/current icon remains fallback boundary;
- rejected full dynamic write retries `19`/`38` ImageData;
- E2E instrumentation exists only in explicitly gated test builds.

### `OriginalEvidenceBoundary`

Node: `KG-EVIDENCE-HARNESS-001`.

- one permanent read-only original-package workflow;
- exact official v3.5.0 Chromium package hash;
- isolated scenario profiles;
- original runtime commands and `_actionForUrl`;
- bounded ownership/renderer probes;
- auditable JSON Artifact;
- pull requests execute all registered scenarios.

### `ActionBoundary`

- one background writer;
- global Action baseline;
- per-tab coordinator;
- stale-update suppression;
- startup/navigation/profile/ownership refresh;
- Inspect overlay through the same executor;
- dynamic Ω renderer and browser compatibility fallback.

### `NexEvidenceBoundary`

- deterministic unit/component tests;
- shared cross-browser profile-trace fixture;
- focused ownership and renderer E2E;
- Chromium/Firefox full E2E;
- normal browser close/relaunch with restored Applied ProfileSpec, active route, endpoint and Action state;
- native Chromium Inspect;
- visual evidence;
- exact `browser-builds` acceptance artifact;
- future real original-export corpus and owner acceptance.

Stable dependency:

`OriginalProductContract -> OriginalObservableProjection -> ActionBoundary/UserInterfaceBoundary`

Internal `GraphTrace`, hidden temporary identities and arbitrary PAC execution must not leak into visible explanations.

## 4. Layer C — acceptance journey graph

### `Order0Governance`

- `KG-CONTRACT-001`: constitution is authoritative — `VERIFIED_AUTOMATION`.
- `KG-GOV-HEAD-001`: exact moving Head read from PR/Checks — `VERIFIED_AUTOMATION`.
- `KG-GOV-WORKFLOW-001`: permanent workflows are read-only — `VERIFIED_AUTOMATION`.
- `KG-GOV-GRAPH-001`: current graph/status/index are synchronized — `VERIFIED_AUTOMATION` after exact-head checks.
- Green automation cannot declare product completion.

### `Order1ToolbarJourney`

Parent: `KG-ICON-001` — complete journey `FAILED` until consolidated owner acceptance.

Supporting nodes:

- `KG-EVIDENCE-HARNESS-001`
  - status: `VERIFIED_AUTOMATION`;
  - registry through 01O;
  - pull requests run `all`.
- `KG-TRACE-001`
  - status: `VERIFIED_AUTOMATION` for represented route families;
  - remaining route/lifecycle shapes: `UNKNOWN`.
- `KG-ATTACHED-RULELIST-001`
  - 01H subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - remaining shapes: `UNKNOWN`.
- `KG-SWITCH-NESTED-001`
  - 01I subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - deeper/other results: `UNKNOWN`.
- `KG-VIRTUAL-NESTED-001`
  - 01J subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - deeper/mixed targets: `UNKNOWN`.
- `KG-VIRTUAL-BYPASS-DETAIL-001`
  - literal `DIRECT`: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`.
- `KG-PAC-TRACE-001`
  - 01K URL-backed static Action subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - inline/cache/update/error/header/auth/fallback lifecycle: `UNKNOWN`.
- `KG-TEMP-RULE-001`
  - 01L one-host-rule/empty-base-Switch/Fixed-target subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - other conditions/families/restart/error/complete Popup: `UNKNOWN`.
- `KG-EXTERNAL-CONTROL-001`
  - 01M one-Fixed/one-competitor subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - policy/not-controllable/non-Fixed/race/restart/complete recovery: `UNKNOWN`.
- `KG-ACTION-FALLBACK-001`
  - 01N alpha-rejection/no-write/retry/recovery subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - arbitrary context/double-write/restart/headed post-success state: `UNKNOWN`.
- `KG-VIRTUAL-SWITCH-001`
  - 01O one-Virtual/one-Switch matched Fixed, matched Direct and Direct default subset: `EXACT_EQUIVALENT`, `VERIFIED_AUTOMATION`;
  - deeper Switch, bypass, attached and mixed targets: `UNKNOWN`.
- `KG-ORDER1-ACCEPTANCE-BUILD-001`
  - one exact PR Head passes CI, Browser E2E, Original Toolbar Evidence, Milestone 8 Visual Evidence and Parity Documentation;
  - Chromium and Firefox verify clean startup, user-edited Fixed proxy/bypass, represented route families, ownership, renderer fallback and normal close/relaunch restoration;
  - status: `VERIFIED_AUTOMATION`;
  - exact `browser-builds` artifact is ready for one owner run.
- `KG-TOOLBAR-PIXEL-001`
  - automated source, Action API and renderer evidence is complete for represented states;
  - physical visible Ω/title/Badge/detail review remains part of owner acceptance.
- `KG-OWNER-ORDER1-001`
  - one-pass acceptance contract exists in `DELIVERY_ORDER_01_OWNER_ACCEPTANCE.md`;
  - acceptance build ready;
  - owner result: `NOT RUN`.

Order 1 progress: 80%. `KG-ICON-001` remains `FAILED` until explicit owner `PASS`.

Original-invalid edge: Switch → System is rejected by original and is not a missing parity feature.

### `Order2DirectMigrationJourney`

- parent `KG-IMPORT-001`: `FAILED`;
- `KG-IMPORT-COLOR-001`: open;
- requires real original exports, semantic comparison, immediate activation, restart, re-export, Chromium/Firefox and owner acceptance.

### `Order3PopupJourney`

- parent dependencies: `KG-FLOW-001`, `KG-UI-001`, `KG-EXTRA-001`, ownership and temporary-rule nodes;
- Toolbar evidence does not close Popup hierarchy, dialogs or complete interactions.

### `Order4OptionsJourney`

- Apply/Discard, editor hierarchy, validation timing, text density and original workflow remain owner-incomplete.

### `Order5CompleteProfileJourneys`

- every profile family must be exercised through create/import/edit/apply/activate/restart/export/delete where applicable;
- historical code inventory is insufficient.

### `Order6ReliabilityJourney`

- restart, rollback, ownership, authentication, permission denial and browser-specific capabilities require complete exact-build evidence.

### `Order7PresentationJourney`

- paired original/Nex visual evidence and owner acceptance are required.

### `Order8FinalCandidate`

- depends on all previous journeys and explicit owner authorization;
- no candidate exists.

## 5. Evidence graph

### Baseline

- `AUDIT_EVIDENCE_01_ORIGINAL_RELEASE.md`;
- `AUDIT_EVIDENCE_01C_ORIGINAL_CHROMIUM_RUNTIME.md`;
- `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`.

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
`-> KG-ATTACHED-RULELIST-001 (MAPPED strict subset)`  
`-> specialized projector (IMPLEMENTED)`  
`-> deterministic + Chromium + Firefox (VERIFIED_AUTOMATION)`  
`-> KG-ICON-001 (open)`

### Nested Switch 01I

`OriginalNestedSwitch01I (SOURCE_CAPTURED)`  
`-> KG-EVIDENCE-HARNESS-001`  
`-> KG-SWITCH-NESTED-001 (MAPPED strict subset)`  
`-> specialized projector`  
`-> deterministic + shared Chromium/Firefox profile-trace E2E`  
`-> KG-ICON-001 (open)`

### Nested Virtual 01J

`OriginalNestedVirtual01J (SOURCE_CAPTURED)`  
`-> KG-EVIDENCE-HARNESS-001`  
`-> KG-VIRTUAL-NESTED-001 (MAPPED strict subset)`  
`-> specialized projector`  
`-> deterministic + shared Chromium/Firefox profile-trace E2E`  
`-> KG-ICON-001 (open)`

### URL-backed PAC 01K

`OriginalUrlPac01K (SOURCE_CAPTURED)`  
`-> KG-EVIDENCE-HARNESS-001 scenario pac`  
`-> KG-PAC-TRACE-001 (MAPPED strict subset)`  
`-> static PAC Action projector`  
`-> deterministic + Chromium + Firefox profile-trace E2E`  
`-> KG-ICON-001 (open)`

### Temporary rule 01L

`OriginalTemporaryRule01L (SOURCE_CAPTURED)`  
`-> hidden session overlay + Toolbar-only synthetic graph`  
`-> KG-TEMP-RULE-001 (MAPPED strict subset)`  
`-> deterministic model/runtime/projector tests`  
`-> Chromium/Firefox real runtime-message E2E`  
`-> KG-ICON-001 (open)`

### External control 01M

`OriginalExternalControl01M (SOURCE_CAPTURED)`  
`-> real ownership inspection + Direct warning projection + latch`  
`-> KG-EXTERNAL-CONTROL-001 (MAPPED strict subset)`  
`-> deterministic test`  
`-> dual-extension Chromium/Firefox E2E`  
`-> KG-ICON-001 (open)`

### Renderer fallback 01N

`OriginalRendererFallback01N (SOURCE_CAPTURED)`  
`-> successful-only cache + no-op absent image + 19/38 retry`  
`-> KG-ACTION-FALLBACK-001 (MAPPED strict subset)`  
`-> deterministic renderer/adapter/probe tests`  
`-> forced-failure Chromium/Firefox E2E`  
`-> KG-ICON-001 (open)`

### Virtual → Switch 01O

`OriginalVirtualSwitch01O (SOURCE_CAPTURED)`  
`-> KG-EVIDENCE-HARNESS-001 scenario virtual-switch`  
`-> KG-VIRTUAL-SWITCH-001 (MAPPED strict subset)`  
`-> projectOriginalVirtualSwitchTrace (IMPLEMENTED)`  
`-> deterministic match-Fixed/match-Direct/default-Direct/fail-closed tests`  
`-> shared Chromium profile-trace E2E (VERIFIED_AUTOMATION)`  
`-> shared Firefox profile-trace E2E (VERIFIED_AUTOMATION)`  
`-> KG-ICON-001 (open)`

01O represented contract:

- one colored outer Virtual targeting one colored ordinary Switch;
- outer Virtual transition hidden;
- current name `outer [inner]`;
- matched host-wildcard → Direct or one Fixed HTTP fallback;
- inner Direct default;
- inner Switch supplies current/inner color;
- final route supplies result/Badge/result color;
- no bypass, attached Rule List, deeper Switch or other mixed target.

### Consolidated Order 1 acceptance build

`Original evidence through 01O (SOURCE_CAPTURED)`  
`-> Original-observable mappings (MAPPED)`  
`-> Toolbar/runtime implementation (IMPLEMENTED)`  
`-> deterministic tests (VERIFIED_AUTOMATION)`  
`-> Chromium full + Toolbar + restart + represented traces (VERIFIED_AUTOMATION)`  
`-> Firefox full + Toolbar + restart + represented traces (VERIFIED_AUTOMATION)`  
`-> native Chromium Inspect + visual evidence + parity documentation (VERIFIED_AUTOMATION)`  
`-> exact browser-builds artifact`  
`-> KG-OWNER-ORDER1-001 (NOT RUN)`  
`-> KG-ICON-001 (FAILED until PASS)`

The restart edge proves one user-edited Fixed profile survives normal browser close/relaunch with its Applied ProfileSpec, active route, endpoint and real Toolbar Action state on both browsers.

## 6. Directed dependency graph

```text
PRODUCT_CONSTITUTION
  -> Order0Governance
  -> Order1ToolbarJourney
       -> KG-EVIDENCE-HARNESS-001
       -> KG-TRACE-001
       -> KG-ATTACHED-RULELIST-001 (01H)
       -> KG-SWITCH-NESTED-001 (01I)
       -> KG-VIRTUAL-NESTED-001 (01J)
       -> KG-PAC-TRACE-001 (01K)
       -> KG-TEMP-RULE-001 (01L)
       -> KG-EXTERNAL-CONTROL-001 (01M)
       -> KG-ACTION-FALLBACK-001 (01N)
       -> KG-VIRTUAL-SWITCH-001 (01O)
       -> KG-ORDER1-ACCEPTANCE-BUILD-001
       -> KG-TOOLBAR-PIXEL-001
       -> KG-OWNER-ORDER1-001
  -> Order2DirectMigrationJourney
       -> KG-IMPORT-001
       -> KG-IMPORT-COLOR-001
  -> Order3PopupJourney
  -> Order4OptionsJourney
  -> Order5CompleteProfileJourneys
  -> Order6ReliabilityJourney
  -> Order7PresentationJourney
  -> Order8FinalCandidate
```

Order 2 must not begin before the prepared Order 1 acceptance build receives owner `PASS`, unless the repository owner explicitly reprioritizes.

## 7. Active defect graph

- `KG-ICON-001`: complete Toolbar journey — `FAILED`.
- `KG-IMPORT-001`: direct original export use — `FAILED`.
- `KG-IMPORT-COLOR-001`: shorthand original colors — open.
- `KG-UI-001`: layout/density/dialog/control hierarchy — `FAILED`.
- `KG-EXTRA-001`: unnecessary descriptions/workflow — `FAILED`.
- `KG-INVENTION-001`: visible behavior without provenance — `FAILED`.
- `KG-FLOW-001`: complete interaction parity — `FAILED`.
- `KG-GOV-001`: final evidence and owner acceptance — open.

## 8. Automation integrity

- Permanent workflows remain read-only.
- Temporary read-only source/formatter/export workflows used during investigation are deleted after their artifacts are consumed.
- Shared profile-trace E2E is used for nested/mixed route families.
- The exact Order 1 acceptance-build Head passes all five permanent gates.
- Chromium and Firefox restart acceptance runs inside the permanent Browser E2E workflow.
- Green automation establishes engineering evidence, not owner acceptance.

## 9. Progress boundary and next edge

Formal progress is 52% total (52.1%; confidence 48%–55%) and 80% for Order 1.

Change from the previous baseline: +5 rounded project points and +45 Order 1 points. No denominator correction occurred. The change is caused by one exact build closing the consolidated engineering, automation and real-browser gaps, including dual-browser normal restart restoration.

01H–01O remain strict represented subsets. Exotic uncaptured combinations remain fail closed and move to later delivery orders; they are no longer an open-ended Order 1 expansion mandate.

Next fixed edge:

`exact green browser-builds artifact -> one-pass repository-owner ordinary-use review -> PASS or first blocking mismatch`

- `PASS` -> `KG-ICON-001` and Order 1 become `OWNER_ACCEPTED` -> begin Order 2 and `KG-IMPORT-COLOR-001`.
- `FAIL` -> fix only the demonstrated blocker and directly dependent states -> produce a new exact acceptance build.

No merge or release is authorized. The prepared package is an Order 1 acceptance build, not a release candidate.
