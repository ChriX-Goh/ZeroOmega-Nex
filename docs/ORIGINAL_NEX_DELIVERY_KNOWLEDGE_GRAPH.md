# ZeroOmega Original ↔ Nex Delivery Knowledge Graph

## 0. Authority and scope

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract.

`DELIVERY_PLAN.md` is the authoritative delivery-order and acceptance plan.

`MILESTONE_8_STATUS.md` is the single hand-maintained Milestone 8 progress and blocker summary. Draft PR #11 and GitHub Checks provide the exact moving Head and exact-Head engineering conclusions.

This document is the Original ↔ Nex knowledge graph. It contains stable product nodes, semantic architecture nodes, mapping relationships, evidence identifiers, gap classifications and acceptance dependencies. It must not become a competing product constitution, delivery plan or moving Head database.

## 1. Graph status vocabulary

- `SOURCE_CAPTURED`: exact original source, package, runtime, UI or data evidence exists.
- `NEX_CAPTURED`: current Nex source and real behavior are independently captured.
- `MAPPED`: an explicit Original ↔ Nex relationship and gap classification exists.
- `IMPLEMENTED`: code exists, but parity is not fully verified.
- `VERIFIED_AUTOMATION`: deterministic contract tests and required browser automation pass.
- `VERIFIED_REAL_DATA`: representative real original data and real browser journeys pass.
- `OWNER_ACCEPTED`: the repository owner accepts the exact journey/build.
- `FAILED`: a demonstrated mismatch or defect exists.
- `UNKNOWN`: evidence is incomplete and must not be treated as equivalent.

Only `OWNER_ACCEPTED` closes a product journey.

Mapping edge types:

- `EXACT_EQUIVALENT`: same observable behavior and compatible data result.
- `MODERNIZED_EQUIVALENT`: internals changed, but the user contract remains equivalent.
- `INTENTIONAL_DIVERGENCE`: a necessary, minimized, evidenced and owner-accepted difference.
- `MISSING_IN_NEX`: required original behavior is absent.
- `BROKEN_IN_NEX`: behavior exists but produces an incompatible result.
- `EXTRA_IN_NEX`: Nex adds visible behavior not present in the original.
- `UNJUSTIFIED_INVENTION`: visible behavior was created without original evidence or accepted divergence.
- `UNKNOWN`: relationship cannot yet be established.

## 2. Required evidence relationship

Every parity node closes through this directed chain:

`Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

Required evidence fields:

1. Original version, source file, symbol/controller/template or official package identity.
2. Original runtime screenshot, recording, Action state or reproducible steps.
3. Original visible hierarchy, text, default, validation timing and state transition.
4. Original data shape before and after the operation.
5. Nex source file and real runtime behavior.
6. Explicit mapping edge and gap classification.
7. Missing, broken, extra or invented Nex behavior.
8. Expected user-visible result without implementation jargon.
9. Deterministic contract test tied to original evidence.
10. Chromium and Firefox evidence where browser-sensitive.
11. Representative real original export where configuration is involved.
12. `DR-xxxx` record for every accepted visible difference.
13. Repository-owner result: `PASS`, `FAIL` or `NOT RUN`.

Synthetic fixtures, generated Nex-only screenshots, green CI or high test counts cannot independently close a node.

## 3. Layer A — product contract graph

The contract details live in `PRODUCT_CONSTITUTION.md`. This graph records the required observable domains and dependencies.

`OriginalProductContract`

- `DirectMigrationContract`
  - supported original export decoding
  - names, colors, ordering and identity
  - startup and Quick Switch state
  - profile references and nested graphs
  - Fixed endpoints and bypass
  - Switch conditions, defaults and attached Rule Lists
  - PAC URL/raw source/update/cache state
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
  - nested profile result paths
  - attached Rule List prefixes/defaults
  - temporary-rule and Inspect overlays
  - external-control state
  - renderer fallback
- `PopupContract`
  - dimensions and density
  - profile list ordering and colors
  - selected/current/result profile state
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
  - English, Simplified Chinese and Traditional Chinese terminology
  - light and dark presentation
  - density, spacing, grouping, iconography and focus
  - bounded browser-controlled pixel tolerance

## 4. Layer B — semantic architecture graph

`NexArchitecture`

- `LegacyBoundary`
  - bounded JSON/base64 decoder
  - schema upgrade where required
  - original export importer
  - generated/runtime field classification
  - safe opaque legacy metadata
  - secret extraction and references
  - deterministic compatibility report
  - open node `KG-IMPORT-COLOR-001`: normalize original `#RGB` to equivalent canonical `#RRGGBB`
- `ProfileSpecBoundary`
  - stable IDs and ordered profiles
  - built-in Direct and System routes
  - Fixed, Switch, PAC, Virtual, Rule List and AutoDetect variants
  - startup and Quick Switch state
  - versioned schema and semantic validation
  - deterministic serialization and migrations
- `PolicyOracle`
  - URL/host/scheme/port normalization
  - condition evaluation
  - ordered rule evaluation
  - recursive profile graph resolution
  - cycle and depth protection
  - final route plus internal `GraphTrace`
- `OriginalObservableProjection`
  - node `KG-TRACE-001`
  - converts internal decisions into original-observable current/result/profile/detail/Badge/color/icon inputs
  - browser-independent and consumed by the single Toolbar Action adapter
  - hides internal rewrite states that the original does not expose
  - rejects unknown shapes rather than inventing simplified wording
  - preserves distinct result-profile and Action-current color semantics
  - represented shapes:
    - Direct and System
    - Fixed proxy and bypass
    - exact one-level Switch -> Direct/Fixed
    - exact 01I two-level nested Switch subset
    - exact immediate Virtual -> Direct/Fixed proxy/bypass
    - exact 01H attached Rule List subset
  - status: `IMPLEMENTED` and `VERIFIED_AUTOMATION` for represented shapes
  - remaining status: `UNKNOWN` or `MISSING_IN_NEX` for shapes outside the captured subsets, nested Virtual, PAC, temporary rule, external control and other result families
- `OriginalEvidenceBoundary`
  - node `KG-EVIDENCE-HARNESS-001`
  - one permanent read-only workflow
  - exact official v3.5.0 Chromium package and fixed SHA-256
  - scenario ID, comma-separated IDs or `all`
  - isolated browser profile per scenario
  - original `addProfile`, `applyProfile` and `_actionForUrl` bridge
  - auditable runtime JSON Artifact
  - status: `IMPLEMENTED` and `VERIFIED_AUTOMATION`
  - current scenario registry: `nested-switch`
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
  - internal candidate/compile/snapshot states hidden behind original-facing workflow
- `NexEvidenceBoundary`
  - deterministic contract tests
  - shared profile-trace scenario definitions
  - Chromium extension/Toolbar E2E
  - Firefox extension/Toolbar E2E
  - native Inspect E2E
  - paired visual evidence
  - future real-export corpus
  - future owner acceptance package

Stable architecture principle:

`OriginalProductContract -> OriginalObservableProjection -> UserInterfaceBoundary/ActionBoundary`

The internal `PolicyOracle` trace must not be exposed directly as user-facing wording.

## 5. Layer C — acceptance journey graph

The authoritative order and full acceptance criteria live in `DELIVERY_PLAN.md`.

### `Order0Governance`

- depends on `ProductConstitution`
- nodes:
  - `KG-CONTRACT-001`: one authoritative product constitution
  - `KG-GOV-SOURCE-001`: stable milestone history separated from current status
  - `KG-GOV-HEAD-001`: exact Head and CI read from PR metadata and GitHub Checks
  - `KG-GOV-WORKFLOW-001`: permanent CI and evidence workflows are read-only
  - `KG-GOV-PLAN-001`: journey-based delivery plan
  - `KG-GOV-GRAPH-001`: knowledge graph contains mappings/evidence rather than a competing contract
- status: `IMPLEMENTED` and `VERIFIED_AUTOMATION`
- ongoing constraint: green automation cannot declare product completion or a release candidate

### `Order1ToolbarJourney`

- depends on `Order0Governance`
- active parent node: `KG-ICON-001`
- supporting nodes:
  - `KG-EVIDENCE-HARNESS-001`: parameterized original result-evidence harness — `VERIFIED_AUTOMATION`
  - `KG-TRACE-001`: Original-observable projection — `VERIFIED_AUTOMATION` for represented shapes
  - `KG-SWITCH-NESTED-001`: exact 01I subset — `VERIFIED_AUTOMATION`; remaining nested Switch shapes `UNKNOWN`
  - `KG-VIRTUAL-NESTED-001`: nested Virtual and Virtual -> Switch/Rule List/PAC — open
  - `KG-ATTACHED-RULELIST-001`: exact 01H subset — `VERIFIED_AUTOMATION`; remaining shapes `UNKNOWN`
  - `KG-PAC-TRACE-001`: PAC effective route and observable result traces — open
  - `KG-TEMP-RULE-001`: temporary/site-rule state through the single writer — open
  - `KG-EXTERNAL-CONTROL-001`: ownership loss and recovery — open
  - `KG-ACTION-FALLBACK-001`: forced renderer failure and static fallback — open
  - `KG-TOOLBAR-PIXEL-001`: headed evidence where Action API state is insufficient — open
  - `KG-OWNER-ORDER1-001`: consolidated exact-build owner acceptance — not run
- retained implemented slice:
  - one Action writer
  - global baseline and per-tab overrides
  - clean-install System initialization
  - serialized startup/profile-workflow commands
  - Direct, System and Fixed proxy/bypass
  - exact one-level Switch -> Direct/Fixed
  - exact 01I two-level nested Switch subset
  - immediate Virtual -> Direct/Fixed proxy/bypass
  - exact 01H attached Rule List subset
  - result/current two-color semantics
  - internal/default fallback
  - two-tab isolation
  - Inspect set/clear/restoration/isolation
  - Chromium and Firefox real Action acceptance for represented shapes
- status: complete journey remains `FAILED`; partial nodes above are retained
- original-invalid edge:
  - Switch -> System is rejected by the original runtime and is not a missing feature

### `Order2DirectMigrationJourney`

- depends on `KG-OWNER-ORDER1-001`
- active blocker: `KG-IMPORT-001`
- supporting nodes:
  - `KG-IMPORT-COLOR-001`: original shorthand color normalization — open
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
- status: `FAILED`

### `Order3PopupJourney`

- blocker relationship: `KG-FLOW-001`
- depends on `KG-TRACE-001` and accepted migration data
- includes Popup hierarchy, switching, selected/current/result state, temporary/site-rule actions, ownership state and close behavior

### `Order4OptionsJourney`

- active blockers: `KG-UI-001`, `KG-EXTRA-001`, `KG-INVENTION-001`
- includes navigation, dialogs, profile list, action hierarchy, validation timing, Apply/Discard, reload restoration, deletion and reference replacement

### `Order5ProfileLifecycleJourney`

- includes Fixed, Switch, PAC, Virtual, Rule List and AutoDetect where supported
- includes create/edit/rename/duplicate/delete, references, ordering, cache/update and activation

### `Order6ReliabilityJourney`

- includes export, restart, rollback, storage/PAC failure injection, ownership, Chromium/Firefox capability differences, proxy 407 authentication, ordinary website 401 isolation and secret scanning

### `Order7PresentationJourney`

- includes localization, density, paired Original ↔ Nex screenshots, icons, colors, focus, keyboard behavior, responsive boundaries and bounded browser-controlled pixels

### `Order8FinalCandidate`

- depends on every required journey being `OWNER_ACCEPTED`
- produces exact Chromium/Firefox artifacts, hashes, migration evidence, reliability evidence, accepted divergence list, release notes and final owner `PASS`

## 6. Evidence registry and mapping edges

### Package and baseline runtime

- `AUDIT_EVIDENCE_01_ORIGINAL_RELEASE.md`
  - official v3.5.0 Chromium and Firefox package identity and hashes
- `AUDIT_EVIDENCE_01C_ORIGINAL_CHROMIUM_RUNTIME.md`
  - original Chromium baseline Action runtime
- `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`
  - original Firefox baseline Action runtime

### One-level Switch

- evidence: `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md`
- edge:
  - `OriginalSwitchResult (SOURCE_CAPTURED)`
  - `-> KG-TRACE-001 (IMPLEMENTED)`
  - `-> Chromium/Firefox Action E2E (VERIFIED_AUTOMATION)`
- represented:
  - matched/default -> Direct
  - matched -> Fixed proxy
  - original-invalid Switch -> System rejection

### Immediate Virtual

- evidence: `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md`
- edge:
  - `OriginalImmediateVirtualResult (SOURCE_CAPTURED)`
  - `-> KG-TRACE-001 (IMPLEMENTED)`
  - `-> Chromium/Firefox Action E2E (VERIFIED_AUTOMATION)`
- represented:
  - Virtual -> Direct
  - Virtual -> Fixed proxy/bypass
  - original target suffix and suppressed Virtual default line

### Attached Rule List 01H

- evidence: `AUDIT_EVIDENCE_01H_ORIGINAL_ATTACHED_RULE_LIST_RESULTS.md`
- edge:
  - `OriginalAttachedRuleList01H (SOURCE_CAPTURED)`
  - `-> KG-ATTACHED-RULELIST-001 (MAPPED)`
  - `-> unified projection subprojector (IMPLEMENTED)`
  - `-> deterministic tests (VERIFIED_AUTOMATION)`
  - `-> Chromium Action E2E (VERIFIED_AUTOMATION)`
  - `-> Firefox Action E2E (VERIFIED_AUTOMATION)`
  - `-> KG-ICON-001 (still open)`
- represented:
  - match -> Fixed
  - no match -> default Direct
  - match -> Direct
  - no match -> default Fixed
- unrepresented:
  - parent rules
  - exclusive/multi-line/non-AutoProxy
  - Fixed bypass/fallthrough/chains/nesting

### Nested Switch 01I

- evidence: `AUDIT_EVIDENCE_01I_ORIGINAL_NESTED_SWITCH_RESULTS.md`
- original workflow evidence:
  - official package and fixed SHA-256
  - parameterized scenario `nested-switch`
  - isolated real Chromium runtime
  - original runtime JSON Artifact
- edge:
  - `OriginalNestedSwitch01I (SOURCE_CAPTURED)`
  - `-> KG-EVIDENCE-HARNESS-001 (VERIFIED_AUTOMATION)`
  - `-> KG-SWITCH-NESTED-001 (MAPPED for 01I subset)`
  - `-> unified projection subprojector (IMPLEMENTED)`
  - `-> deterministic tests (VERIFIED_AUTOMATION)`
  - `-> shared Nex profile-trace scenario (IMPLEMENTED)`
  - `-> Chromium Action E2E (VERIFIED_AUTOMATION)`
  - `-> Firefox Action E2E (VERIFIED_AUTOMATION)`
  - `-> KG-ICON-001 (still open)`
- represented:
  - outer matched -> inner matched -> Fixed proxy
  - outer matched -> inner default -> Direct
  - outer default -> Direct through existing one-level contract
- exact observable consequences:
  - applied outer Switch remains current
  - every selected nested edge is displayed in order
  - intermediate target is the inner Switch name
  - final result controls result name, Badge and outer result color
  - applied outer Switch controls Action inner/current color
- unrepresented:
  - outer default -> inner Switch
  - more than two Switch levels
  - nested Fixed bypass
  - nested attached Rule List/Virtual/PAC
  - indeterminate or target-dependent results

## 7. Active defect and gap graph

### `KG-GOV-001`

- area: completion and acceptance governance
- historical defect: incomplete automation was promoted to `98%` and broad `DONE` counts
- current edge: `BROKEN_IN_NEX -> MODERNIZED_EQUIVALENT governance model`
- status: `IMPLEMENTED` and `VERIFIED_AUTOMATION`; ongoing discipline remains mandatory

### `KG-EVIDENCE-HARNESS-001`

- area: reusable original runtime evidence collection
- previous defect: one workflow/script pair per trace created noise and write-risk
- current edge: `EXTRA_IN_NEX governance workflow -> MODERNIZED_EQUIVALENT parameterized read-only harness`
- status: `IMPLEMENTED` and `VERIFIED_AUTOMATION`
- next dependency: add nested Virtual and later result families to the scenario registry

### `KG-TRACE-001`

- area: internal graph/runtime result to original-observable result projection
- requirement: one stable semantic boundary produces original-facing results without exposing rewrite state
- current edge: `MODERNIZED_EQUIVALENT` for represented shapes
- status: `VERIFIED_AUTOMATION` for represented shapes; `UNKNOWN` elsewhere
- regression evidence: deterministic tests caught and repaired an incorrect collapse of Direct result color and Switch current-profile inner-ring color

### `KG-SWITCH-NESTED-001`

- area: nested Switch observable result chain
- current edge:
  - `MODERNIZED_EQUIVALENT` for exact 01I subset
  - `UNKNOWN` for all other nested Switch shapes
- status: partial `VERIFIED_AUTOMATION`; complete node remains open

### `KG-ATTACHED-RULELIST-001`

- area: hidden attached Rule List result projection
- current edge:
  - `MODERNIZED_EQUIVALENT` for exact 01H subset
  - `UNKNOWN` for all other attached shapes
- status: partial `VERIFIED_AUTOMATION`; complete node remains open

### `KG-VIRTUAL-NESTED-001`

- area: nested Virtual and Virtual -> Switch/Rule List/PAC
- current edge: `UNKNOWN`
- status: open

### `KG-PAC-TRACE-001`

- area: PAC effective route and original-observable result
- current edge: `UNKNOWN` or `MISSING_IN_NEX`
- status: open

### `KG-TEMP-RULE-001`

- area: temporary/site-rule state through the single Action writer
- current edge: `UNKNOWN`
- status: open

### `KG-EXTERNAL-CONTROL-001`

- area: browser proxy ownership loss and recovery
- current edge: `UNKNOWN`
- status: open

### `KG-ACTION-FALLBACK-001`

- area: dynamic renderer failure and static fallback
- current edge: `UNKNOWN`
- status: open

### `KG-TOOLBAR-PIXEL-001`

- area: headed Toolbar pixels where Action API state is insufficient
- current edge: `UNKNOWN`
- status: open

### `KG-ICON-001`

- area: complete Toolbar icon/title/Badge/detail/per-tab journey
- current edge:
  - `MODERNIZED_EQUIVALENT` for represented shapes
  - `MISSING_IN_NEX` or `UNKNOWN` for remaining trace families
- status: `FAILED` as a complete journey; verified engineering slices retained

### `KG-IMPORT-001`

- area: original export migration
- original requirement: direct import and immediate use
- current edge: importer architecture exists, but representative owner real-export journey remains failed or unproved
- status: `FAILED`

### `KG-IMPORT-COLOR-001`

- area: original profile color import
- original evidence: valid shorthand colors such as `#5b5` and `#d63`
- current defect: ProfileSpec accepts canonical six-digit colors while the importer copies shorthand unchanged
- required edge: original `#RGB ->` visually identical canonical `#RRGGBB`
- status: open under `KG-IMPORT-001`

### `KG-UI-001`

- area: Options/Popup layout, density, dialogs, controls and hierarchy
- current edge: broad `BROKEN_IN_NEX`
- status: `FAILED`

### `KG-EXTRA-001`

- area: descriptions, help boxes, summaries and extra workflow
- current edge: `EXTRA_IN_NEX`
- status: `FAILED`

### `KG-INVENTION-001`

- area: visible behavior without original provenance or accepted divergence
- current edge: `UNJUSTIFIED_INVENTION`
- status: `FAILED`

### `KG-FLOW-001`

- area: complete feature, action, default and state-transition parity
- current edge: mixed `BROKEN_IN_NEX`, `MISSING_IN_NEX` and `UNKNOWN`
- status: `FAILED`

## 8. Current dependency graph

```text
PRODUCT_CONSTITUTION
  -> Order0Governance [VERIFIED_AUTOMATION]
      -> KG-EVIDENCE-HARNESS-001 [VERIFIED_AUTOMATION]
      -> KG-TRACE-001 [partial VERIFIED_AUTOMATION]
          -> one-level Switch [VERIFIED_AUTOMATION]
          -> immediate Virtual [VERIFIED_AUTOMATION]
          -> KG-ATTACHED-RULELIST-001 / 01H [partial VERIFIED_AUTOMATION]
          -> KG-SWITCH-NESTED-001 / 01I [partial VERIFIED_AUTOMATION]
          -> KG-VIRTUAL-NESTED-001 [OPEN]
          -> KG-PAC-TRACE-001 [OPEN]
          -> KG-TEMP-RULE-001 [OPEN]
          -> KG-EXTERNAL-CONTROL-001 [OPEN]
      -> KG-ACTION-FALLBACK-001 [OPEN]
      -> KG-TOOLBAR-PIXEL-001 [OPEN]
      -> KG-ICON-001 [FAILED AS COMPLETE JOURNEY]
          -> KG-OWNER-ORDER1-001 [NOT RUN]
              -> Order2DirectMigrationJourney
                  -> KG-IMPORT-001 [FAILED]
                  -> KG-IMPORT-COLOR-001 [OPEN]
```

Next graph expansion:

`Original Toolbar Evidence scenario registry -> nested Virtual evidence -> explicit mapping -> unified projection -> deterministic tests -> shared Chromium/Firefox profile-trace E2E -> owner journey`

## 9. Progress and completion boundary

Current numerical progress, confidence band, active journey percentage and blocker summary are maintained in `MILESTONE_8_STATUS.md` and calculated by `PROJECT_PROGRESS_MODEL.md`.

The evidence harness, 01H attached Rule List subset and 01I nested Switch subset do not independently increase the formal progress percentage because:

- complete Order 1 is still open;
- several result families remain unknown;
- full Toolbar pixels/fallback and consolidated owner acceptance remain open;
- real original export migration remains failed;
- Popup, Options, complete profile journeys, reliability and presentation remain incomplete.

The project reaches 100% only when all required original nodes are mapped, representative real original exports work directly, complete Chromium and Firefox journeys pass, unjustified visible workflow is removed, necessary differences are accepted and one exact final candidate receives repository-owner `PASS`.
