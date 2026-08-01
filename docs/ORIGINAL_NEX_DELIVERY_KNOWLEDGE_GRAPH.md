# ZeroOmega Original ↔ Nex Delivery Knowledge Graph

## 0. Authority and scope

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract.

`DELIVERY_PLAN.md` is the authoritative delivery-order and acceptance plan.

`MILESTONE_8_STATUS.md` is the single hand-maintained Milestone 8 progress and blocker summary. Draft PR #11 and GitHub Checks provide the exact moving Head and exact-Head engineering conclusions.

This document is the Original ↔ Nex knowledge graph. It contains stable product nodes, semantic architecture nodes, mapping relationships, evidence identifiers, gap classifications, and acceptance dependencies. It must not become a competing product constitution, delivery plan, or moving Head database.

## 1. Graph status vocabulary

- `SOURCE_CAPTURED`: exact original source, package, runtime, UI, or data evidence exists.
- `NEX_CAPTURED`: current Nex source and real behavior are independently captured.
- `MAPPED`: an explicit Original ↔ Nex relationship and gap classification exists.
- `IMPLEMENTED`: code exists, but parity is not fully verified.
- `VERIFIED_AUTOMATION`: deterministic contract tests and required automation pass.
- `VERIFIED_REAL_DATA`: representative real original data and real browser journeys pass.
- `OWNER_ACCEPTED`: the repository owner accepts the exact journey/build.
- `FAILED`: a demonstrated mismatch or defect exists.
- `UNKNOWN`: evidence is incomplete and must not be treated as equivalent.

Only `OWNER_ACCEPTED` closes a product journey.

Mapping edge types:

- `EXACT_EQUIVALENT`: same observable behavior and compatible data result.
- `MODERNIZED_EQUIVALENT`: internals changed, but the user contract remains equivalent.
- `INTENTIONAL_DIVERGENCE`: a necessary, minimized, evidenced, owner-accepted difference.
- `MISSING_IN_NEX`: required original behavior is absent.
- `BROKEN_IN_NEX`: behavior exists but produces an incompatible result.
- `EXTRA_IN_NEX`: Nex adds visible behavior not present in the original.
- `UNJUSTIFIED_INVENTION`: visible behavior was created without original evidence or accepted divergence.
- `UNKNOWN`: relationship cannot yet be established.

## 2. Required evidence relationship

Every parity node closes through this directed chain:

`Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

Required evidence fields:

1. Original version, source file, symbol/controller/template, or official package identity.
2. Original runtime screenshot, recording, Action state, or reproducible steps.
3. Original visible hierarchy, text, default, validation timing, and state transition.
4. Original data shape before and after the operation.
5. Nex source file and real runtime behavior.
6. Explicit mapping edge and gap classification.
7. Missing, broken, extra, or invented Nex behavior.
8. Expected user-visible result without implementation jargon.
9. Deterministic contract test tied to the original evidence.
10. Chromium and Firefox evidence where browser-sensitive.
11. Representative real original export where configuration is involved.
12. `DR-xxxx` record for every accepted visible difference.
13. Repository-owner result: `PASS`, `FAIL`, or `NOT RUN`.

Synthetic fixtures, generated screenshots of Nex alone, green CI, or high test counts cannot independently close a node.

## 3. Layer A — product contract graph

The contract details live in `PRODUCT_CONSTITUTION.md`. This graph records the required observable domains and their dependencies.

`OriginalProductContract`

- `DirectMigrationContract`
  - supported schema-v2 export decoding
  - names, colors, ordering, and identity
  - startup and Quick Switch state
  - profile references and nested graphs
  - Fixed proxy endpoints and bypass
  - Switch conditions, defaults, and attached Rule Lists
  - PAC URL, raw PAC, update/cache state
  - Virtual targets and nested references
  - temporary/site-rule semantics
  - supported authentication metadata under the secret boundary
  - safe opaque metadata preservation
  - immediate usability after import
  - restart and semantic export round trip
- `NoRelearningContract`
  - original terminology
  - original page and Popup hierarchy
  - original action order and placement
  - original defaults and validation timing
  - original Apply/Discard semantics
  - original profile lifecycle
  - original information density and help-text quantity
- `ToolbarContract`
  - original Ω geometry and state colors
  - title and multiline result details
  - four-code-unit result Badge behavior
  - global baseline and per-tab state
  - internal-page/default inheritance
  - temporary-rule and Inspect overlays
  - external-control state
  - renderer fallback
- `PopupContract`
  - dimensions and density
  - profile list ordering and colors
  - selected, current, and result profile state
  - current-site and temporary-rule actions
  - ownership and error states
  - close behavior
- `OptionsContract`
  - navigation hierarchy
  - page boundaries
  - controls and grouping
  - dialogs and destructive actions
  - validation timing
  - Apply/Discard and reload restoration
  - profile and rule lifecycle
- `CrossBrowserReliabilityContract`
  - Chromium capability and ownership
  - Firefox capability and private-window boundary
  - atomic activation and confirmation
  - rollback and last-confirmed-state recovery
  - competing extension or policy control
  - proxy authentication isolation
- `PresentationContract`
  - English, Simplified Chinese, and Traditional Chinese terminology
  - light and dark presentation
  - density, spacing, grouping, iconography, and focus
  - bounded browser-controlled pixel tolerance

## 4. Layer B — semantic architecture graph

`NexArchitecture`

- `LegacyBoundary`
  - bounded JSON/base64 decoder
  - schema-v1 to schema-v2 upgrade where required
  - schema-v2 importer
  - generated/runtime field classification
  - safe opaque legacy metadata
  - secret extraction and references
  - deterministic compatibility report
- `ProfileSpecBoundary`
  - stable IDs and ordered profiles
  - built-in Direct and System routes
  - Fixed, Switch, PAC, Virtual, Rule List, and AutoDetect variants
  - startup and Quick Switch state
  - versioned schema and semantic validation
  - deterministic serialization and migrations
- `PolicyOracle`
  - URL/host/scheme/port normalization
  - condition evaluation
  - ordered rule evaluation
  - recursive profile graph resolution
  - cycle and depth protection
  - route result and internal graph trace
- `OriginalObservableProjection`
  - required node `KG-TRACE-001`
  - converts internal graph/runtime results into original-observable result semantics
  - produces Toolbar title, detail, Badge, colors, icon inputs, and Popup result state
  - hides internal transitions that the original does not expose
  - rejects unknown shapes rather than inventing simplified wording
- `PacDataPlane`
  - capability analysis
  - deterministic PAC generation
  - safe escaping and budgets
  - differential verification against the policy oracle
  - immutable runtime snapshot
  - browser-native installation
- `BrowserControlBoundary`
  - Chromium proxy adapter
  - Firefox proxy adapter
  - level-of-control discovery
  - candidate installation and confirmation
  - atomic active-state update
  - rollback and startup recovery
  - narrowly scoped proxy authentication
- `ActionBoundary`
  - one background writer
  - global baseline
  - per-tab coordinator
  - stale-result suppression
  - navigation and lifecycle invalidation
  - Inspect overlay input
  - renderer and static fallback
- `UserInterfaceBoundary`
  - Popup projection
  - Options projection
  - dialogs and profile editors
  - internal candidate/compile/snapshot states hidden behind the original-facing workflow
- `EvidenceBoundary`
  - parameterized original runtime harness
  - deterministic fixture vectors
  - Chromium extension E2E
  - Firefox extension E2E
  - paired visual evidence
  - real-export corpus
  - owner acceptance package

Stable architecture principle:

`OriginalProductContract -> OriginalObservableProjection -> UserInterfaceBoundary/ActionBoundary`

The internal `PolicyOracle` trace must not be exposed directly as user-facing wording.

## 5. Layer C — acceptance journey graph

The authoritative order and full acceptance criteria live in `DELIVERY_PLAN.md`.

`Order0Governance`

- depends on `ProductConstitution`
- nodes:
  - `KG-CONTRACT-001`: one authoritative product constitution
  - `KG-GOV-SOURCE-001`: stable milestone history separated from current status
  - `KG-GOV-HEAD-001`: exact Head and CI read from PR metadata and GitHub Checks
  - `KG-GOV-WORKFLOW-001`: permanent CI is read-only
  - `KG-GOV-PLAN-001`: journey-based delivery plan
  - `KG-GOV-GRAPH-001`: knowledge graph contains mappings/evidence rather than a competing contract
- current checkpoint:
  - constitution created
  - Agent, Charter, Compatibility, Delivery Plan, milestone status, verification boundary, and PR contract aligned
  - failed write-enabled and per-trace attached-Rule-List workflows/scripts removed
  - permanent gates pass on the governance checkpoint

`Order1ToolbarJourney`

- depends on `Order0Governance`
- active node: `KG-ICON-001`
- supporting nodes:
  - `KG-EVIDENCE-HARNESS-001`: one parameterized original result-evidence harness
  - `KG-TRACE-001`: one Original-observable result trace model
  - `KG-SWITCH-NESTED-001`: nested Switch/profile results
  - `KG-VIRTUAL-NESTED-001`: nested Virtual and Virtual -> Switch/Rule List/PAC
  - `KG-ATTACHED-RULELIST-001`: attached Rule List prefixes, matched lines, defaults, and details
  - `KG-PAC-TRACE-001`: PAC effective route and observable result traces
  - `KG-TEMP-RULE-001`: temporary/site-rule state through the single writer
  - `KG-EXTERNAL-CONTROL-001`: ownership loss and recovery
  - `KG-ACTION-FALLBACK-001`: forced renderer failure and static fallback
  - `KG-TOOLBAR-PIXEL-001`: headed evidence only where Action API state is insufficient
  - `KG-OWNER-ORDER1-001`: consolidated exact-build owner acceptance
- retained implemented slice:
  - one Action writer
  - global baseline and per-tab overrides
  - clean-install System initialization
  - serialized startup/profile-workflow commands
  - Direct, System, Fixed proxy/bypass
  - exact Switch -> Direct/Fixed
  - immediate Virtual -> Direct/Fixed proxy/bypass
  - internal/default fallback
  - two-tab isolation
  - Inspect set/clear/restoration/isolation
  - Chromium and Firefox Action acceptance for represented shapes
- original-invalid edge:
  - Switch -> System is rejected by the original runtime and is not a missing feature

`Order2DirectMigrationJourney`

- depends on `KG-OWNER-ORDER1-001`
- active blocker: `KG-IMPORT-001`
- nodes:
  - official/default export
  - sanitized owner daily-use export
  - nested Switch/Virtual/Rule List export
  - PAC/update/cache/authentication-metadata export
  - malformed/cyclic/oversized/unsupported negative corpus
  - semantic manifest comparison
  - atomic activation and browser confirmation
  - restart recovery
  - semantic re-export
  - Chromium acceptance
  - Firefox acceptance
  - owner acceptance

`Order3PopupJourney`

- blocker relationship: `KG-FLOW-001`
- depends on `KG-TRACE-001` and accepted migration data
- includes Popup hierarchy, switching, selected/current/result state, temporary/site-rule actions, ownership state, and close behavior

`Order4OptionsJourney`

- active blockers: `KG-UI-001`, `KG-EXTRA-001`, `KG-INVENTION-001`
- includes navigation, dialogs, profile list, action hierarchy, validation timing, Apply/Discard, reload restoration, deletion, and reference replacement

`Order5ProfileLifecycleJourney`

- includes Fixed, Switch, PAC, Virtual, Rule List, AutoDetect where supported, create/edit/rename/duplicate/delete, references, ordering, cache/update, and activation

`Order6ReliabilityJourney`

- includes export, restart, rollback, storage/PAC failure injection, ownership, Chromium/Firefox capability differences, proxy 407 authentication, ordinary website 401 isolation, and secret scanning

`Order7PresentationJourney`

- includes localization, density, paired Original ↔ Nex screenshots, icons, colors, focus, keyboard behavior, responsive boundaries, and bounded browser-controlled pixels

`Order8FinalCandidate`

- depends on every required journey being `OWNER_ACCEPTED`
- produces exact Chromium/Firefox artifacts, hashes, migration evidence, reliability evidence, accepted divergence list, release notes, and final owner `PASS`

## 6. Active defect and gap graph

`KG-GOV-001`

- area: completion and acceptance governance
- original requirement: completion reflects actual parity and owner acceptance
- historical defect: automation closure was promoted to `98%` and broad `DONE` counts
- current edge: `BROKEN_IN_NEX -> remediation in Order0Governance`
- status: `IMPLEMENTED` governance correction; exact journey closure requires all core authority conflicts removed

`KG-ICON-001`

- area: Toolbar, title, Badge, icon, result detail, and per-tab state
- original requirement: visible state follows current selected/result/runtime situation
- current edge: `MODERNIZED_EQUIVALENT` for represented Direct/System/Fixed/Switch/immediate-Virtual shapes; `MISSING_IN_NEX` or `UNKNOWN` for remaining trace families
- status: `FAILED` as a complete journey; partial engineering slice retained

`KG-IMPORT-001`

- area: original export migration
- original requirement: direct import and immediate use
- current edge: importer architecture exists, but representative owner real-export journey remains unproved or failed
- status: `FAILED`

`KG-UI-001`

- area: Options/Popup layout, density, dialogs, controls, and hierarchy
- current edge: broad `BROKEN_IN_NEX`
- status: `FAILED`

`KG-EXTRA-001`

- area: descriptions, help boxes, summaries, and extra workflow
- current edge: `EXTRA_IN_NEX`
- status: `FAILED`

`KG-INVENTION-001`

- area: visible behavior without original provenance or accepted divergence
- current edge: `UNJUSTIFIED_INVENTION`
- status: `FAILED`

`KG-FLOW-001`

- area: complete feature, action, default, and state-transition parity
- current edge: multiple mixed `BROKEN_IN_NEX`, `MISSING_IN_NEX`, and `UNKNOWN` relationships
- status: `FAILED`

## 7. Attached Rule List evidence checkpoint

`AUDIT_EVIDENCE_01H_ORIGINAL_ATTACHED_RULE_LIST_RESULTS.md` contains exact original evidence for attached Rule List Toolbar result behavior.

The attempted one-time implementation applicator did not land product code because verification stopped before commit/push. Its write-enabled workflow, per-trace audit workflow, and temporary scripts were removed.

Graph relationship:

`OriginalAttachedRuleListEvidence (SOURCE_CAPTURED) -> KG-TRACE-001 (required) -> KG-ATTACHED-RULELIST-001 (not implemented) -> KG-ICON-001 -> KG-OWNER-ORDER1-001`

Attached Rule List must be implemented through the unified Original-observable trace layer, not through another dedicated self-writing workflow.

## 8. Progress and completion boundary

Current numerical progress, confidence band, active journey percentage, and blocker summary are maintained in `MILESTONE_8_STATUS.md` and calculated by `PROJECT_PROGRESS_MODEL.md`.

This graph must not increase progress because of:

- commit count;
- changed lines;
- test count;
- green CI alone;
- Nex-only screenshots;
- an implemented architecture node without complete journey evidence.

The project is complete only when every required journey node is `OWNER_ACCEPTED`, representative real original exports work directly, unjustified visible behavior is removed, necessary differences are accepted under `DR-xxxx`, and one exact final candidate receives repository-owner `PASS`.
