# Delivery Order 01 — Original-Compatible Toolbar State

## 0. Authority and current result

This document is the first executable child order of `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`.

- Original authority: `zero-peak/ZeroOmega`, tag `v3.5.0`.
- Original source evidence: `AUDIT_EVIDENCE_01_ORIGINAL_TOOLBAR.md`.
- Official package evidence: `AUDIT_EVIDENCE_01_ORIGINAL_RELEASE.md`.
- Chromium runtime evidence: `AUDIT_EVIDENCE_01C_ORIGINAL_CHROMIUM_RUNTIME.md`.
- Firefox runtime evidence: `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`.
- Compiled target constants: `AUDIT_EVIDENCE_01E_ORIGINAL_TARGET_CONSTANTS.md`.
- Nex audited branch: `feat/m8-profile-workflow`.
- Defect: `KG-ICON-001`.
- Current journey progress: 35%.
- Current delivery status: `FAILED`.
- Owner result: `FAIL` from the 2026-07-30 trial; corrected build `NOT RUN`.

The current Nex branch now registers one background owner for all real browser Action writes. The owner composes the repository-backed resolver, race-safe per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Background startup proactively initializes a clean installation to the original System route, restores existing state without duplicate activation and refreshes all tabs after successful activation or recovery. The coordinator additionally handles tab creation and Firefox completed-navigation events whose URL appears only on the tab object. Resolver coverage is verified for Direct, System, Fixed proxy and Fixed bypass results; Inspect no longer competes as a second title/Badge writer.

### Exact verified checkpoint — 2026-08-01

Clean Head `c37f56e818bb73806f2a42a70dc941d5e5d76e9a` passed all permanent gates after the Firefox new-tab Action fix and temporary-file cleanup:

- CI `30659255772`;
- Browser E2E `30659255691`;
- Parity Documentation `30659255845`;
- Milestone 8 Visual Evidence `30659255790`.

The permanent Browser E2E run directly verifies per-tab title, Badge and Popup in both Chromium and Firefox for System → Direct → Fixed proxy / Fixed bypass. Firefox additionally proves that newly created tabs and completed navigations receive computed Action state instead of remaining at the manifest loading title. Native Chromium Inspect passed in the same run.

No candidate may be generated

No candidate may be generated from this order until the exact corrected build receives repository-owner `PASS`.

## 1. Original user contract

The original toolbar is a live view of the current profile, current tab URL and actual result profile. It is not a static launcher.

The observable contract includes:

1. original static fallback Ω assets and localized loading title;
2. profile-colored Ω rendering;
3. one-color rendering when selected and result profiles are equivalent;
4. two-color rendering when an inclusive profile resolves to another result;
5. per-tab icon, title and optional Badge state;
6. refresh on tab URL update and tab activation;
7. refresh of affected tabs when current profile changes;
8. Direct, System, Fixed, Switch, PAC and Virtual behavior;
9. attached Rule List and temporary-rule result details;
10. Inspect title and `#` Badge state;
11. external proxy/control state;
12. fallback and stale-state clearing on browser-internal or unsupported URLs;
13. Chromium/Firefox differences where the original packages behave differently.

An experienced original user reads active and result state directly from the toolbar. Nex must preserve that mental model without exposing Draft, Applied revision, snapshot or other rewrite-internal terminology.

## 2. Evidence graph

```mermaid
graph TD
  SRC[Original v3.5.0 source] --> GEOM[Exact Ω geometry]
  SRC --> STATE[Profile/result/title/Badge rules]
  PKG[Official Chromium and Firefox packages] --> MANIFEST[Target-specific manifest contract]
  PKG --> RUNTIME[Real installed runtime evidence]
  GEOM --> PURE[Nex pure toolbar models]
  STATE --> PURE
  RUNTIME --> MATRIX[18-row Original ↔ Nex matrix]
  PURE --> ADAPTER[Browser Action adapter]
  MATRIX --> ADAPTER
  ADAPTER --> COORD[Per-tab coordinator]
  COORD --> INPUTS[Profile / route / temp rule / Inspect / ownership]
  INPUTS --> REAL[Chromium and Firefox real-browser verification]
  REAL --> OWNER[Repository-owner PASS]
```

## 3. Captured original facts

### 3.1 Exact renderer and fallback

Source evidence fixes the normalized Ω renderer:

- center `(0.5, 0.5)`;
- outer center-line radius `0.375`;
- outer stroke width `0.25`;
- inner radius `0.25`;
- one-color state removes the inner circle with `destination-out`;
- two-color state fills the inner circle with the current-profile color while the outer ring uses result color;
- dynamic output sizes: 16, 19, 24, 32 and 38;
- dynamic draw failure falls back to original static action assets.

This geometry is no longer `UNKNOWN` and must not be redesigned.

### 3.2 Per-tab and transition contract

Original source proves:

- `tabs.onUpdated` and `tabs.onActivated` trigger recalculation;
- state is calculated per tab URL;
- icon, title and Badge are tab-specific;
- stale Badge state is cleared;
- unsupported/internal URLs restore default state;
- profile change clears icon cache and resets tabs;
- Inspect is tab-specific and uses `#` Badge plus result color;
- result-profile Badge names are localized for built-ins and truncated to four JavaScript code units.

### 3.3 Official package/runtime evidence

Exact official v3.5.0 packages and hashes are durable in `AUDIT_EVIDENCE_01_ORIGINAL_RELEASE.md`.

Basic runtime states have been captured independently in both targets:

- initial/System;
- Direct;
- second tab;
- inactive first tab;
- browser-internal page;
- installed Options;
- installed Popup.

Firefox evidence additionally proves that its manifest declares `popup/index.html`, while per-tab `action.getPopup()` returned `popup-iframe.html`. Nex must follow observed target behavior rather than flattening both targets into one inferred manifest contract.

### 3.4 Exact `actionForUrl` result-trace contract

The original Chromium target source at tag `v3.5.0` proves that visible details are generated from the full `options.matchProfile(request)` result trace, not merely from the final route:

- a default transition appends localized `(default)` plus `=> <result profile>`;
- an empty Direct result appends the localized Direct-result detail and marks the result as Direct;
- a string trace appends `<source string> => <result>`;
- a condition trace appends `<condition pattern/string> => <result>`;
- temporary rules prepend the localized temporary-rule prefix;
- attached hidden Rule Lists prepend the localized attached-rule prefix;
- if no trace detail exists, the original prints the current profile itself;
- title substitutions remain current name, result name and the complete multiline details string.

Consequences for Nex:

1. final route equality is insufficient to reconstruct the original title;
2. Fixed bypass, Switch, attached Rule List, temporary-rule and Virtual traces must retain display-capable condition/source data;
3. unsupported trace shapes must return unresolved/default state rather than simplified invented wording;
4. current source-certain resolver coverage is limited to Direct, System and Fixed profiles whose evaluated result remains that Fixed profile's proxy endpoint.

## 4. Current Nex graph

```mermaid
graph TD
  M[Target manifest / locale / exact static assets] --> B[Registered Nex background]
  API[Real browser Action / i18n / tabs / OffscreenCanvas] --> EXEC[Verified Action executor]
  PURE[Pure original toolbar models] --> EXEC
  WF[Profile workflow] --> NOTICE[Successful activation / startup notification]
  NOTICE --> COORD[Race-safe per-tab coordinator]
  RES[Repository resolver: Direct / System / Fixed proxy / Fixed bypass] --> COORD
  INSPECT[Inspect runtime] --> OVERLAY[Single-writer Inspect overlay]
  OVERLAY --> EXEC
  COORD --> EXEC
  EXEC --> ACTION[Real per-tab browser Action]
  ACTION --> CHROME[Permanent Chromium two-tab Action E2E]
  ACTION --> FIREFOX[Permanent Firefox two-tab Action E2E]
  TEMP[Temporary rules] -. trace adapter open .-> COORD
  OWN[Ownership / external control] -. transition adapter open .-> COORD
  INCLUSIVE[Switch / PAC / Virtual / attached Rule List] -. full trace open .-> COORD
```

Confirmed remaining gaps:

- Switch, PAC, Virtual, attached Rule List, temporary-rule and external-control states still need the complete original `matchProfile.results` display trace;
- Chromium and Firefox now have direct per-tab Action acceptance for System, Direct, Fixed proxy and Fixed bypass; Chromium additionally verifies optional four-code-unit Badge truncation;
- exact headed toolbar pixels and forced dynamic-draw fallback remain open where source/unit evidence is insufficient;
- complete owner-facing Order 1 acceptance remains `NOT RUN`, so no row is owner-complete.

## 5. Original ↔ Nex state matrix

| ID       | Original observable state                                             | Original evidence                  | Current Nex                                                                                                                                        | Current edge                                 | Closure requirement                                                    |
| -------- | --------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------- |
| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target assets/title/Popup/shortcut/permissions are active; clean startup reaches System and both targets read real per-tab title/Badge/Popup | `PARTIAL`                                    | add explicit Nex internal-page assertions, then owner review           |
| `TB-002` | Toolbar click opens target-specific original Popup; shortcut exists   | packages, Chromium/Firefox runtime | target Popup contracts and per-tab `getPopup()` are verified across System, Direct and Fixed states in Chromium and Firefox                        | `PARTIAL`                                    | verify real toolbar click and shortcut behavior                        |
| `TB-003` | Direct/System/Fixed static profile uses one color                     | source; Direct/System runtime      | one background owner applies Direct/System/Fixed states; Chromium and Firefox verify real titles, Badge clearing and Popup for all three routes    | `PARTIAL`                                    | verify exact visible icon pixels and owner review                      |
| `TB-004` | Inclusive Switch/PAC default uses Direct/current two-color state      | source                             | pure color decision exists; runtime state uncaptured                                                                                               | `PARTIAL` / `UNKNOWN`                        | capture original default and implement Action output                   |
| `TB-005` | Current tab result equals current static profile: one-color result    | source                             | Chromium and Firefox real Action acceptance verify a Fixed proxy result on one tab while another tab resolves through Fixed bypass                 | `PARTIAL`                                    | verify visible icon result and owner review                            |
| `TB-006` | Switch/PAC resolves to another profile: two-color result/current icon | source                             | no runtime coordinator                                                                                                                             | `MISSING_IN_NEX`; original runtime `UNKNOWN` | capture two URLs/results, then implement exact transition              |
| `TB-007` | Direct result receives Direct color                                   | source; Direct runtime title       | Direct is activated through the real workflow and reflected across two Chromium tabs; renderer/color contract remains source/unit-backed           | `PARTIAL`                                    | capture visible icon pixels or another browser-readable equivalent     |
| `TB-008` | Virtual shows Virtual name plus resolved target                       | source                             | route activation exists; toolbar mapping absent                                                                                                    | `MISSING_IN_NEX`                             | capture original and implement nested effective target state           |
| `TB-009` | Attached Rule List contributes prefix/details                         | source                             | internal Rule List support; Action details absent                                                                                                  | `MISSING_IN_NEX`                             | capture original wording/state and integrate result trace              |
| `TB-010` | Temporary rule contributes prefix/details and result colors           | source                             | temporary-rule runtime exists; Action integration absent                                                                                           | `MISSING_IN_NEX`                             | add/replace/remove rule with immediate tab-local transition            |
| `TB-011` | Optional localized result-profile Badge, max four code units          | source                             | Chromium Fixed acceptance enables the preference and reads Badge `Tool` for `Toolbar Proxy`; Firefox verifies stale/empty Badge clearing           | `PARTIAL`                                    | verify imported preference and Firefox enabled-Badge truncation        |
| `TB-012` | Inspect sets tab-specific `#`, result color and Inspect title         | source                             | Inspect feeds a single-writer overlay; native Chromium menu E2E and overlay lifecycle tests pass                                                   | `PARTIAL`                                    | add direct real Action set/clear/isolation capture                     |
| `TB-013` | External proxy state changes title/short title and Badge              | source; basic System runtime       | ownership blocker exists; complete Action state absent                                                                                             | `MISSING_IN_NEX`                             | capture transitions and integrate without invented panels              |
| `TB-014` | Internal/unsupported URL clears result and uses default state         | source; basic runtime capture      | coordinator owns fallback/default clearing; Built-in route handling is registered                                                                  | `PARTIAL`                                    | add explicit Nex internal-page Action assertions in both targets       |
| `TB-015` | Tab URL update recalculates result                                    | source                             | registered coordinator listens to URL updates; real result-different same-tab navigation remains unasserted                                        | `PARTIAL`                                    | navigate one tab across proxy/bypass URLs and read Action transitions  |
| `TB-016` | Tab activation restores each tab’s own state                          | source; basic two-tab runtime      | Chromium and Firefox Action E2E verify simultaneous Fixed proxy and Fixed bypass state on two tab IDs                                              | `PARTIAL`                                    | run focused owner review                                               |
| `TB-017` | Profile change invalidates cache and resets tabs                      | source                             | System → Direct → Fixed activation refreshes both Chromium tabs through the real successful-activation callback                                    | `PARTIAL`                                    | cover import/temp-rule/external-control refresh inputs                 |
| `TB-018` | Dynamic drawing failure uses static fallback                          | source                             | exact renderer is connected to the real executor and fallback behavior is unit-tested                                                              | `PARTIAL`                                    | force a real browser draw failure and confirm original static fallback |

No row is owner-complete. Pure unit tests and reference runtime captures do not close a row without Nex real-browser equivalence and owner acceptance.

## 6. Explicit remaining unknowns

The following remain `UNKNOWN` until captured:

1. headed toolbar pixels where source/package evidence cannot establish final rendering;
2. user-created Fixed profile runtime state;
3. Switch/PAC default and matched-result states;
4. Virtual and attached Rule List states;
5. temporary-rule state;
6. Inspect state and clearing sequence;
7. external-control transition sequence;
8. optional Badge enabled state after real original import;
9. any modern-browser limitation that truly requires a minimized, owner-approved divergence.

Unknowns are blockers, not permission to invent simplified behavior.

## 7. Engineering work order and real progress

### `TO-01` — original source/package/basic runtime capture

Status: `PARTIAL`, substantially complete.

Completed:

- exact renderer geometry and static assets;
- locale/title/Badge source facts;
- official Chromium and Firefox packages/hashes;
- basic installed runtime states and UI surfaces.

Remaining:

- Fixed, Switch/PAC, Virtual, Rule List, temporary-rule, Inspect and external-control runtime states;
- optional Badge enabled state;
- headed pixel capture only where needed.

### `TO-02` — pure toolbar state model

Status: `PARTIAL`, source-certain slice implemented and tested.

Implemented:

- original icon geometry;
- static/inclusive/Direct color decisions;
- Badge preference/localization/truncation;
- pure per-tab presentation composition.

Remaining:

- additional source/runtime cases as they are captured;
- exact target-specific title/Popup differences where the pure model should represent them.

### `TO-03` — original-compatible Ω renderer

Status: `PARTIAL`.

Exact geometry, the original single `300 × 300` OffscreenCanvas pipeline, five-size ImageData generation, color-pair caching, first-error reporting and anti-fingerprinting fallback signal are implemented and tested. Browser Action integration and target-visible icon verification remain open.

### `TO-04` — browser Action adapter

Status: `PARTIAL`, registered real browser owner with Chromium Action acceptance.

Implemented and verified:

- one browser-API boundary for icon, title, Badge/background and Popup;
- exact original localization, renderer, static fallback and manifest contract;
- one registered background executor as the sole real Action writer;
- Inspect requests are intercepted as overlays and reapplied by the same executor;
- permanent Chromium E2E reads real per-tab title, Badge and Popup for System, Direct, Fixed proxy and Fixed bypass.

Remaining:

- direct equivalent Action API acceptance in Firefox;
- headed icon pixels and forced dynamic-render fallback evidence;
- Switch/PAC/Virtual/Rule List/temp-rule/external-control states.

### `TO-05` — per-tab coordinator

Status: `PARTIAL`, registered and real-browser verified for the source-certain slice.

Implemented and verified:

- URL-update and tab-activation listeners, per-tab queues and stale-result suppression;
- all-tab refresh with icon-cache invalidation;
- repository-backed Direct, System, Fixed proxy and Fixed bypass resolution;
- per-tab Fixed proxy/bypass isolation in permanent Chromium Action E2E;
- default fallback and resolver/Action error reporting.

Remaining:

- complete original multiline trace for Switch, PAC, Virtual, attached Rule List and temporary rules;
- external-control transition input;
- explicit same-tab URL transition and direct Firefox per-tab Action acceptance.

### `TO-06` — workflow/runtime integration

Status: `PARTIAL`, real background integration complete for startup, activation and Inspect.

Implemented and verified:

- clean installations proactively initialize to the original System route without opening Popup or Options;
- concurrent initialization is deduplicated and existing state follows restore/recovery without duplicate activation;
- successful activation and startup recovery refresh all toolbar tabs;
- Inspect is a coordinator overlay rather than a competing Action writer;
- cross-document revision archives are isolated before current-document validation, preventing background initialization from breaking history reads.

Remaining inputs include temporary-rule transitions, ownership/external control, inclusive-profile trace display and equivalent direct Firefox Action acceptance.

### `TO-07` — acceptance automation and real browsers

Status: `NOT STARTED` for the corrected integrated subsystem.

Automation must assert visible browser Action state, not internal model output alone.

### `TO-08` — repository-owner acceptance

Status: `NOT RUN` for a corrected build.

Only owner `PASS` closes `KG-ICON-001`.

## 8. Verification checkpoint

Exact clean engineering checkpoint Head `e0ec31bd88ce4ff2d40937daee0b63def45fb2e8` passed:

- CI `30615270403`;
- Browser E2E `30615270448`, including Chromium, Firefox and native Inspect;
- Parity Documentation `30615270389`;
- Milestone 8 Visual Evidence `30615270430`.

This checkpoint validates the target manifest/locales/assets, real browser API construction, activation notification seam, exact renderer/executor/coordinator and the conservative Direct/System/Fixed-proxy resolver. It intentionally leaves Fixed bypass and inclusive-profile traces unresolved. It does not close a `TB-*` row because the coordinator is not registered against visible Action state and no repository-owner acceptance exists.

## 9. Current next action

1. Preserve the original `matchProfile.results` trace data needed for visible details: default transitions, condition strings, attached Rule Lists and temporary-rule prefixes.
2. Build a pure trace-to-title/result adapter and test Fixed bypass before expanding Switch/Rule List/Virtual coverage.
3. Keep PAC and auto-detect target-dependent results unresolved until an exact result source exists.
4. Establish a single Action owner by converting Inspect and external-control state into coordinator inputs.
5. Register startup/tab/activation refresh only after unsupported states can no longer overwrite valid visible state.
6. Add Chromium/Firefox two-tab Action assertions, then request repository-owner review.

Overall status remains `FAILED`, release-blocking, with no candidate permitted.
