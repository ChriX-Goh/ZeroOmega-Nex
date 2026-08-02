# ZeroOmega Original ↔ Nex Delivery Knowledge Graph

## 0. Authority and current truth

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. `DELIVERY_PLAN.md` defines delivery order and acceptance. `MILESTONE_8_STATUS.md` is the single hand-maintained progress summary. Draft PR #11 and GitHub Checks provide exact moving Head and workflow conclusions.

This graph records product contracts, implementation boundaries, Original ↔ Nex mappings, evidence, defects and acceptance dependencies. It deliberately separates valid engineering infrastructure from original-facing product parity.

Current truth:

- project progress: 48% (47.9%; confidence 43%–50%);
- Order 1 entry experience: 45%;
- latest owner result: `FAIL`, Firefox, 2026-08-02;
- active acceptance/release candidate: none;
- retired acceptance build: `d57449bb74d9fedb53602af9b1e908ae18d700b9`;
- owner retest, merge and release: prohibited;
- Firefox is the primary browser-facing validation target;
- Chromium is the required cross-browser confirmation.

The historical `98%`, broad `DONE` counts and superseded `52% / Order 1 80%` readiness claim are invalid.

## 1. Status and edge vocabulary

Statuses:

- `SOURCE_CAPTURED` — exact original source/package/runtime/data evidence exists.
- `NEX_CAPTURED` — current Nex source and real behavior are independently captured.
- `MAPPED` — an explicit Original ↔ Nex relationship and gap classification exists.
- `IMPLEMENTED` — code exists but required verification is incomplete.
- `VERIFIED_AUTOMATION` — deterministic tests and required browser automation pass.
- `VERIFIED_REAL_DATA` — representative original data passes complete real journeys.
- `OWNER_ACCEPTED` — repository owner accepts the exact original-facing journey/build.
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

Only `OWNER_ACCEPTED` closes a product journey. The closure path is:

`Original source/runtime -> original input data -> paired Original/Nex mapping -> implementation -> deterministic tests -> Firefox -> Chromium -> owner result`

## 2. Product contract graph

`OriginalProductContract`

- `DirectMigrationContract`
  - supported original export decoding;
  - original names, colors, ordering, identity, startup and Quick Switch;
  - Fixed/Switch/PAC/Virtual/Rule List/bypass/temporary-rule semantics;
  - supported authentication metadata;
  - immediate use, restart and semantic export round trip.
- `NoRelearningContract`
  - terminology, hierarchy, action order, defaults, validation timing, Apply/Discard and information density;
  - old users must not learn a replacement workflow.
- `ToolbarContract`
  - original Ω geometry, title/detail/Badge/colors;
  - global baseline and per-tab state;
  - nested/mixed profile paths;
  - temporary rules, Inspect, external control and renderer failure.
- `PopupContract`
  - original profile ordering and labels;
  - Direct/System/proxy/auto switch visibility;
  - result selectors, site actions, temporary rules, ownership blocking and Options entry;
  - no Nex branding or engineering state.
- `OptionsContract`
  - original default About landing page;
  - original sidebar/profile hierarchy;
  - editors, Apply/Discard, validation, import/export and ordinary settings;
  - no top-level snapshot History, capability research or persistent Draft status unless original evidence requires them.
- `CrossBrowserReliabilityContract`
  - Firefox-first browser-facing validation;
  - Chromium confirmation;
  - startup/restart/rollback, permissions, ownership and browser capability differences.
- `PresentationContract`
  - original-facing density, wording, layout, dialogs, icons and visual hierarchy.
- `EngineeringSeparationContract`
  - checkpoints, revisions, compilation, snapshots, graph traces, capability studies and delivery status belong in code/tests/docs only;
  - ordinary UI must not expose rewrite internals.

## 3. Semantic architecture graph

### `LegacyBoundary`

- bounded original backup decoder/importer;
- metadata classification and credential isolation;
- `KG-IMPORT-COLOR-001`: valid original `#RGB` must normalize to equivalent canonical `#RRGGBB` at the import boundary.

### `ProfileSpecBoundary`

- stable IDs and ordered Direct/System/Fixed/Switch/PAC/Virtual/Rule List/AutoDetect profiles;
- internal representation may differ but observable semantics must remain original-compatible;
- official default user profiles:
  - `proxy`, color `#99ccee`;
  - `auto switch`, color `#99dd99`;
- original built-in colors:
  - Direct `#aaaaaa`;
  - System `#000000`.

### `PolicyOracle`

- request normalization;
- ordered rules;
- recursive graph resolution;
- cycle/depth protection;
- arbitrary PAC remains target-dependent and is delegated to browser PAC runtime.

### `OriginalObservableProjection` — `KG-TRACE-001`

Responsibilities:

- convert internal decisions into original current/result/detail/Badge/color/icon inputs;
- hide rewrite-only graph identities and transitions;
- preserve original immediate-target visibility rules;
- project captured PAC, temporary-overlay and ownership states;
- reject uncaptured shapes rather than inventing explanations.

Represented runtime families:

- Direct/System;
- Fixed proxy/bypass;
- one-level Switch;
- attached Rule List 01H;
- nested Switch 01I;
- immediate and nested Virtual 01J;
- URL-backed PAC 01K;
- temporary rule 01L;
- external control 01M;
- renderer fallback 01N;
- Virtual → Switch 01O.

### `ActionBoundary`

- one background Action writer;
- global baseline plus per-tab coordinator;
- startup/navigation/profile/ownership refresh;
- stale-update suppression;
- Inspect through the same executor;
- dynamic original Ω renderer and browser fallback.

### `UserInterfaceBoundary`

- Popup and Options consume background/profile-workflow APIs;
- UI must not directly clear or mutate browser storage;
- reset-options uses background `replace-draft` and `apply` commands;
- Popup profile selection is independent from the keyboard Quick Switch enable switch;
- capability logic remains in compiler/runtime rather than ordinary Fixed UI.

### `OriginalToolbarEvidenceBoundary` — `KG-EVIDENCE-HARNESS-001`

- permanent read-only original-package workflow;
- exact official v3.5.0 Chromium package hash;
- isolated runtime scenarios;
- original `_actionForUrl`, ownership and renderer probes;
- JSON evidence through 01O.

### `OriginalNexUiEvidenceBoundary` — `KG-ORIGINAL-UI-EVIDENCE-001`

- permanent read-only paired UI workflow;
- downloads and verifies official v3.5.0;
- builds exact Nex Head;
- same browser version, locale, viewport and theme;
- paired default Popup and Options screenshots;
- rendered text, text-line differences, page dimensions and hashes;
- Nex-only screenshots cannot close parity.

### `NexEvidenceBoundary`

- deterministic unit/component tests;
- architecture and original-parity guards;
- Firefox and Chromium E2E;
- normal browser restart restoration;
- native Chromium Inspect;
- paired Original/Nex UI evidence;
- future real original-export corpus.

## 4. Owner failure graph

`FirefoxOwnerRun-2026-08-02`

`Firefox install -> icon changed -> ordinary Popup/Options inspection -> structural mismatch -> OWNER FAIL`

Demonstrated defects:

- `KG-UI-001`: Options defaulted to Proxy rather than About; hierarchy and geometry diverged.
- `KG-EXTRA-001`: History, persistent Draft/application status and large helper descriptions were extra.
- `KG-INVENTION-001`: protocol-capability research and Nex branding lacked original provenance.
- `KG-FLOW-001`: default profiles, Popup order and interaction logic differed.
- `KG-ICON-001`: visible entry journey remained inconsistent despite runtime Action automation.
- `KG-GOV-READINESS-001`: engineering closure was incorrectly reported as product readiness.
- `KG-ACCEPTANCE-SCRIPT-001`: Chromium-oriented helper did not provide a valid Firefox-first acceptance workflow.

Consequences:

- the `d57449b` acceptance package is retired;
- `KG-OWNER-ORDER1-001` result is `FAIL`, not `NOT RUN`;
- Order 1 reopened from 80% to 45%;
- no user retest is requested during correction;
- new work must use paired original evidence rather than Nex-only screenshots.

## 5. First original-facing correction slice

Node: `KG-ORIGINAL-UI-CORRECTION-001`.

Status: `IMPLEMENTED`, pre-commit diagnostic `VERIFIED_AUTOMATION`; permanent exact-Head gates pending final normal commit.

Implemented edges:

- original default `proxy` and `auto switch` restored;
- Direct/System built-in colors restored;
- original-facing product name `ZeroOmega` restored;
- Options default route changed to About;
- ordinary History navigation removed;
- persistent Draft/application status prose removed;
- Fixed protocol-capability table removed from ordinary UI;
- compiler/runtime capability logic retained;
- Popup Nex branding removed;
- Popup profile selection decoupled from keyboard Quick Switch setting;
- reset-options returned behind background workflow boundary;
- Firefox E2E validates About first, then `proxy`;
- Chromium follows as confirmation;
- activation/authentication/rollback/custom Toolbar tests use explicit fixtures rather than installation defaults;
- standard CI restored after atomic migration;
- temporary migration/export/diagnostic resources removed.

Explicit non-claims:

- Popup is not yet exact;
- Options shell is not yet exact;
- About content is not yet exact;
- result-selector provenance remains open;
- sidebar width/grouping/labels and editor density remain open;
- this slice does not increase progress above 48% / Order 1 45%.

## 6. Order graph

### `Order0Governance`

- `KG-CONTRACT-001`: constitution authoritative — `VERIFIED_AUTOMATION`.
- `KG-GOV-HEAD-001`: moving Head read from PR/Checks.
- `KG-GOV-WORKFLOW-001`: permanent workflows read-only.
- `KG-GOV-READINESS-001`: `FAILED`; engineering evidence must never be presented as owner readiness again.
- `KG-GOV-GRAPH-001`: graph/status synchronized by the current correction transaction.

### `Order1EntryJourney`

Parent: `KG-ICON-001` — `FAILED`.

Progress: 45%.

Valid supporting runtime nodes:

- `KG-TRACE-001` — represented runtime families `VERIFIED_AUTOMATION`.
- `KG-ATTACHED-RULELIST-001` — 01H strict subset verified.
- `KG-SWITCH-NESTED-001` — 01I strict subset verified.
- `KG-VIRTUAL-NESTED-001` — 01J strict subset verified.
- `KG-PAC-TRACE-001` — 01K static subset verified.
- `KG-TEMP-RULE-001` — 01L strict subset verified.
- `KG-EXTERNAL-CONTROL-001` — 01M strict subset verified.
- `KG-ACTION-FALLBACK-001` — 01N strict subset verified.
- `KG-VIRTUAL-SWITCH-001` — 01O strict subset verified.

Open entry nodes:

- `KG-ORIGINAL-UI-EVIDENCE-001` — active.
- `KG-POPUP-STRUCTURE-001` — `FAILED`.
- `KG-OPTIONS-STRUCTURE-001` — `FAILED`.
- `KG-OPTIONS-ABOUT-001` — `PARTIAL`.
- `KG-UI-DENSITY-001` — `FAILED`.
- `KG-ENGINEERING-LEAK-001` — first known leaks removed; complete surface audit open.
- `KG-FIREFOX-ENTRY-001` — owner failed; automated corrected journey pending exact Head.
- `KG-CHROMIUM-ENTRY-001` — confirmation pending after Firefox.
- `KG-OWNER-ORDER1-001` — `FAILED`; no retest scheduled.

Original-invalid edge: Switch → System is rejected by original and is not a missing parity feature.

### `Order2DirectMigrationJourney`

- `KG-IMPORT-001`: `FAILED`;
- `KG-IMPORT-COLOR-001`: open;
- requires representative real original exports, direct import, activation, browsing, restart, semantic export, Firefox, Chromium and owner acceptance.

### `Order3PopupJourney`

- depends on `KG-POPUP-STRUCTURE-001`, `KG-FLOW-001`, temporary rules and ownership;
- Toolbar Action evidence does not close Popup hierarchy or interactions.

### `Order4OptionsJourney`

- depends on `KG-OPTIONS-STRUCTURE-001`, `KG-UI-001`, `KG-EXTRA-001`, Apply/Discard, dialogs and validation timing;
- first correction slice removes major inventions but full parity remains open.

### `Order5CompleteProfileJourneys`

- every profile family must pass create/import/edit/apply/activate/restart/export/delete where applicable;
- historical implementation inventory is insufficient.

### `Order6ReliabilityJourney`

- restart, rollback, ownership, authentication, denial and browser-specific capabilities require complete original-facing evidence.

### `Order7PresentationJourney`

- paired Original/Nex evidence, density cleanup and owner acceptance required.

### `Order8FinalCandidate`

- depends on all previous orders and explicit owner authorization;
- no candidate exists.

## 7. Evidence edges

Runtime evidence retained:

- 01F one-level Switch;
- 01G immediate Virtual;
- 01H attached Rule List;
- 01I nested Switch;
- 01J nested Virtual;
- 01K URL PAC;
- 01L temporary rule;
- 01M external control;
- 01N renderer fallback;
- 01O Virtual → Switch;
- dual-browser restart;
- native Chromium Inspect.

New UI evidence edge:

`official v3.5.0 package -> paired same-environment Popup/Options capture -> text/dimension/hash comparison -> defect mapping -> bounded correction -> Firefox -> Chromium`

First capture proved:

- Original Options default About versus Nex Proxy;
- Original `proxy` and `auto switch` versus missing `auto switch`;
- extra History/Draft/capability UI;
- Popup branding/order/geometry divergence.

First correction removes those specific inventions but does not close the complete comparison.

## 8. Active defect graph

- `KG-ICON-001` — complete visible entry journey: `FAILED`.
- `KG-POPUP-STRUCTURE-001` — Popup original hierarchy/geometry: `FAILED`.
- `KG-OPTIONS-STRUCTURE-001` — Options original hierarchy/geometry: `FAILED`.
- `KG-UI-001` — layout/density/dialog/control hierarchy: `FAILED`.
- `KG-EXTRA-001` — unnecessary descriptions/workflow: `FAILED`.
- `KG-INVENTION-001` — visible behavior without provenance: `FAILED`.
- `KG-FLOW-001` — complete interaction parity: `FAILED`.
- `KG-ENGINEERING-LEAK-001` — known leaks corrected; full audit open.
- `KG-IMPORT-001` — direct original export use: `FAILED`.
- `KG-IMPORT-COLOR-001` — shorthand original colors: open.
- `KG-GOV-READINESS-001` — readiness overclaim: `FAILED`, guarded by new reporting rules.
- `KG-GOV-001` — final evidence and owner acceptance: open.

## 9. Directed dependency graph

```text
PRODUCT_CONSTITUTION
  -> OriginalProductContract
  -> OriginalToolbarEvidenceBoundary
  -> OriginalNexUiEvidenceBoundary
  -> Order0Governance
  -> Order1EntryJourney
       -> ActionBoundary
       -> UserInterfaceBoundary
       -> KG-ORIGINAL-UI-CORRECTION-001
       -> KG-FIREFOX-ENTRY-001
       -> KG-CHROMIUM-ENTRY-001
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

## 10. Next fixed edge

The next edge is not owner acceptance and not another acceptance package.

```text
normal exact Head
  -> six permanent gates
  -> inspect paired Original/Nex Popup and Options evidence
  -> remove remaining unproven Popup/result-selector/Options differences
  -> Firefox corrected entry E2E
  -> Chromium confirmation
  -> expand paired surface inventory
```

No user retest, merge or release is authorized. Progress remains 48% total and 45% for Order 1 until paired evidence demonstrates additional complete original-facing closure.
