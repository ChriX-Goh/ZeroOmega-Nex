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
- same browser version, requested locale, viewport and theme;
- paired default Popup and Options screenshots;
- rendered text, saved body DOM, normalized anchors, page dimensions and hashes;
- browser language signals, document language, extension UI language and packaged locale directories;
- clean `en-US` / `zh-CN` / `zh-TW` Original ↔ Nex default-text matrix;
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

Status: bounded correction slice `VERIFIED_AUTOMATION`; owner acceptance remains absent and the complete entry journey remains open.

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

## 5A. Subsequent entry and reliability convergence

### `KG-ENTRY-CONVERGENCE-002`

Status: `VERIFIED_AUTOMATION` for the bounded default-entry slice.

Evidence-backed corrections:

- production Popup and Options default to English under `en-US`, `zh-CN` and `zh-TW`, matching official v3.5.0;
- explicit Browser E2E builds retain Simplified Chinese on Chromium and Traditional Chinese on Firefox;
- Popup built-ins render as `[Direct]` and `[System Proxy]`;
- Options sidebar brand is the original `Zero Omega`, while the About product name remains `ZeroOmega`;
- English navigation restores `Import/Export` and `Builtin`;
- About restores the independently generated 32×32 blue Omega product icon;
- About action/status icons, official links, author/license attribution and open-source credit are present;
- default Popup and Options text now match the original matrix except the truthful Nex version and original hidden-modal text;
- known History, Draft, capability-research and Nex-brand leaks remain absent.

Verified default-presentation subsets:

- `KG-OPTIONS-DEFAULT-LAYOUT-001` — default About sidebar, navigation, product, action, notice and license geometry: `VERIFIED_AUTOMATION`;
- `KG-POPUP-DEFAULT-GEOMETRY-001` — default Popup shell, rows, typography, selected state, separators and Options action: `VERIFIED_AUTOMATION`;
- `KG-POPUP-DEFAULT-ICONS-001` — clean-room default leading/trailing icons, wrench and active outline: `VERIFIED_AUTOMATION`.

Remaining presentation gaps:

- expanded Popup states, result selectors, site actions, temporary rules and ownership surfaces;
- Options profile editors, dialogs, validation timing and non-default density;
- complete cross-surface interaction and owner-acceptance audit.

### `KG-STARTUP-OWNERSHIP-001`

Status: `VERIFIED_AUTOMATION` on ordinary Head `92feff8c28fd01740d58bfb144aa5361aa85180f`.

Root-cause chain:

`external Fixed accepted -> detached startup recovery races Popup commands -> delayed System write -> ownership candidate disappears`

Verified correction:

- complete proxy startup recovery runs inside the profile-workflow command queue;
- runtime messages wait for authentication, pending recovery, temporary-rule reconciliation, external-state preservation, snapshot restoration, conditional startup activation and Toolbar refresh;
- explicit restore dispositions prevent preserved external state from falling through to the default System route;
- a blocking unit test proves concurrent messages cannot cross the startup recovery barrier;
- Chromium main E2E passed on the first attempt and continued through every Toolbar specialist step;
- Firefox main E2E and all Toolbar specialist steps remained green.

This closes the demonstrated automation defect but does not alter owner acceptance or project progress.

### `KG-OPTIONS-DEFAULT-LAYOUT-001`

Status: `VERIFIED_AUTOMATION` on ordinary Head `816388cf5f019ebd44e758149f36d99fa2507193`.

- paired computed metrics align default About navigation, actions, notices and license geometry;
- sidebar background, boundary, typography and vertical rhythm match the official default surface;
- default content/text remains aligned except the truthful Nex version;
- this node does not cover profile editors, dialogs or validation behavior.

### `KG-POPUP-DEFAULT-GEOMETRY-001`

Status: `VERIFIED_AUTOMATION` on ordinary Head `d24da81362bb3f5c2382e156cb7bf39d54721231`.

- 430px content shell, four default actions, 14px/21px typography, 31px rows and compact separators align with Original;
- active outline, Options row and result-control absence match the default System state;
- this node does not cover expanded site/temporary/ownership/result-selector states.

### `KG-POPUP-DEFAULT-ICONS-001`

Status: `VERIFIED_AUTOMATION` on ordinary Head `cb58afaf10714d1ea7219f8871f511b06375cac2`.

- all leading icon boxes, trailing Direct/System globes and Options wrench retain original coordinates and 14px geometry;
- the evidence-selected mixed clean-room glyph set keeps the visually improved power/retweet/wrench paths and the better-performing transfer/globe paths;
- all six permanent gates passed on the first ordinary run;
- Chromium waited for persisted System activation and completed every specialist step without reruns.

These bounded nodes close the default-entry presentation defects in automation only. They do not close the complete journeys or owner acceptance.

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
- `KG-POPUP-STRUCTURE-001` — `PARTIAL`; default text/order/geometry/icons verified, expanded states and complete interactions remain open.
- `KG-OPTIONS-STRUCTURE-001` — `PARTIAL`; default About hierarchy/layout verified, editors/dialogs and non-default interactions remain open.
- `KG-OPTIONS-ABOUT-001` — default content and layout subset `VERIFIED_AUTOMATION`; owner acceptance and adjacent Options surfaces remain open.
- `KG-OPTIONS-DEFAULT-LAYOUT-001` — paired default layout `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-GEOMETRY-001` — paired default geometry `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-ICONS-001` — paired clean-room icon subset `VERIFIED_AUTOMATION`.
- `KG-UI-DENSITY-001` — `FAILED`.
- `KG-ENGINEERING-LEAK-001` — first known leaks removed; complete surface audit open.
- `KG-FIREFOX-ENTRY-001` — corrected automated journey `VERIFIED_AUTOMATION`; latest owner result remains `FAIL`.
- `KG-CHROMIUM-ENTRY-001` — corrected journey and specialist confirmation `VERIFIED_AUTOMATION`.
- `KG-STARTUP-OWNERSHIP-001` — first-attempt dual-browser automation verified.
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

Subsequent captures additionally prove:

- exact default text parity across `en-US`, `zh-CN` and `zh-TW`;
- original sidebar spelling `Zero Omega` and About product spelling `ZeroOmega`;
- bracketed built-ins and the official About information structure;
- the 32×32 blue Omega About product icon;
- default Options layout and default Popup geometry/icons are now paired and computed-metric verified;
- remaining differences are predominantly expanded-state coverage, editor/dialog density, glyph micro-detail and truthful version text.

The bounded default-entry correction and startup ownership repair are automated and exact-Head verified, but expanded surfaces, complete interactions and owner acceptance remain open.

## 8. Active defect graph

- `KG-ICON-001` — complete visible entry journey: `FAILED`.
- `KG-POPUP-STRUCTURE-001` — default hierarchy/text/geometry/icons verified; expanded states: `PARTIAL`.
- `KG-OPTIONS-STRUCTURE-001` — default hierarchy/About layout verified; editors/dialogs: `PARTIAL`.
- `KG-OPTIONS-DEFAULT-LAYOUT-001` — default About presentation: `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-GEOMETRY-001` — default Popup geometry: `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-ICONS-001` — default Popup clean-room icons: `VERIFIED_AUTOMATION`.
- `KG-STARTUP-OWNERSHIP-001` — serialized startup/external ownership: `VERIFIED_AUTOMATION`.
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
default entry Heads 816388cf / d24da813 / cb58afaf
  -> six permanent gates green without reruns
  -> default Options layout verified
  -> default Popup geometry and icons verified
  -> expand paired evidence to active Fixed/Switch and site-action Popup states
  -> audit temporary-rule and ownership Popup surfaces
  -> capture original profile-editor/dialog density
  -> Firefox first
  -> Chromium confirmation
  -> owner acceptance only after the expanded journey closes
```

No user retest, merge or release is authorized. Progress remains 48% total and 45% for Order 1 until paired evidence demonstrates additional complete original-facing closure.
