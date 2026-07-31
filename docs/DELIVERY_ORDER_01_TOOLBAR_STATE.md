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

The current Nex branch now has the source-derived pure models, exact OffscreenCanvas renderer, browser Action adapter, compiled original localization adapter, Action executor, race-safe per-tab coordinator, exact target manifest/static assets, a real browser API construction boundary and a narrow successful-activation notification. A repository-backed resolver is verified for Direct, System and source-certain Fixed-to-proxy results. None of these slices is registered as the sole background Action owner yet; Fixed bypass/Direct and all inclusive-profile traces remain fail-closed until the original `matchProfile.results` display trace is reproduced.

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
  M[Target manifest / locale / exact static assets] --> B[Nex background]
  API[Real browser Action / i18n / tabs construction] --> EXEC[Verified Action executor]
  PURE[Pure original toolbar models] --> EXEC
  EXEC --> COORD[Race-safe per-tab coordinator]
  WF[Profile workflow] --> NOTICE[Successful activation notification]
  NOTICE -. not connected .-> COORD
  RES[Repository-backed resolver: Direct / System / Fixed proxy] --> COORD
  B -. coordinator not registered .-> COORD
  TEMP[Temporary rules] -. trace not converged .-> COORD
  OWN[Ownership / external control] -. trace not converged .-> COORD
  INSPECT[Inspect runtime] -. still writes Action directly .-> EXEC
```

Confirmed remaining gaps:

- the verified browser API boundary and coordinator are not registered in `background.ts`;
- activation notification exists but is not connected to `refreshAll({ clearIconCache: true })`;
- Direct and System are source/runtime-backed; a static Fixed profile is resolved only when the final route remains its proxy endpoint;
- Fixed bypass/Direct, Switch, Rule List, Virtual, PAC, temporary-rule and Inspect details still lack a complete original `matchProfile.results` display adapter;
- Inspect remains a competing direct title/Badge writer;
- no Nex real-browser acceptance yet asserts per-tab Action title/icon/Badge transitions.

## 5. Original ↔ Nex state matrix

| ID       | Original observable state                                             | Original evidence                  | Current Nex                                                                                                            | Current edge                                 | Closure requirement                                                 |
| -------- | --------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target fallback assets/title/Popup/shortcut/permission defaults implemented; runtime default clearing still open | `PARTIAL`                                    | real target manifest plus default/internal-page Action verification |
| `TB-002` | Toolbar click opens target-specific original Popup; shortcut exists   | packages, Chromium/Firefox runtime | Popup exists but complete target Action contract not integrated                                                        | `PARTIAL`                                    | verify click, Popup and shortcut in both targets                    |
| `TB-003` | Direct/System/Fixed static profile uses one color                     | source; Direct/System runtime      | pure color model only                                                                                                  | `PARTIAL`                                    | connect model to real Action and capture user Fixed state           |
| `TB-004` | Inclusive Switch/PAC default uses Direct/current two-color state      | source                             | pure color decision exists; runtime state uncaptured                                                                   | `PARTIAL` / `UNKNOWN`                        | capture original default and implement Action output                |
| `TB-005` | Current tab result equals current static profile: one-color result    | source                             | pure presentation model only                                                                                           | `PARTIAL`                                    | two-browser tab-local Action verification                           |
| `TB-006` | Switch/PAC resolves to another profile: two-color result/current icon | source                             | no runtime coordinator                                                                                                 | `MISSING_IN_NEX`; original runtime `UNKNOWN` | capture two URLs/results, then implement exact transition           |
| `TB-007` | Direct result receives Direct color                                   | source; Direct runtime title       | pure Direct color state exists                                                                                         | `PARTIAL`                                    | real icon/title verification in both targets                        |
| `TB-008` | Virtual shows Virtual name plus resolved target                       | source                             | route activation exists; toolbar mapping absent                                                                        | `MISSING_IN_NEX`                             | capture original and implement nested effective target state        |
| `TB-009` | Attached Rule List contributes prefix/details                         | source                             | internal Rule List support; Action details absent                                                                      | `MISSING_IN_NEX`                             | capture original wording/state and integrate result trace           |
| `TB-010` | Temporary rule contributes prefix/details and result colors           | source                             | temporary-rule runtime exists; Action integration absent                                                               | `MISSING_IN_NEX`                             | add/replace/remove rule with immediate tab-local transition         |
| `TB-011` | Optional localized result-profile Badge, max four code units          | source                             | pure Badge model exists                                                                                                | `PARTIAL`                                    | import preference and verify visible Badge in both targets          |
| `TB-012` | Inspect sets tab-specific `#`, result color and Inspect title         | source                             | Inspect directly mutates Action with Nex fallback                                                                      | `BROKEN_IN_NEX`                              | make Inspect coordinator input; verify set/clear/isolation          |
| `TB-013` | External proxy state changes title/short title and Badge              | source; basic System runtime       | ownership blocker exists; complete Action state absent                                                                 | `MISSING_IN_NEX`                             | capture transitions and integrate without invented panels           |
| `TB-014` | Internal/unsupported URL clears result and uses default state         | source; basic runtime capture      | no coordinator                                                                                                         | `MISSING_IN_NEX`                             | verify no stale state in both targets                               |
| `TB-015` | Tab URL update recalculates result                                    | source                             | no equivalent Action path                                                                                              | `MISSING_IN_NEX`                             | same-tab navigation changes visible state                           |
| `TB-016` | Tab activation restores each tab’s own state                          | source; basic two-tab runtime      | no equivalent coordinator                                                                                              | `MISSING_IN_NEX`                             | two result-different tabs retain isolation                          |
| `TB-017` | Profile change invalidates cache and resets tabs                      | source                             | activation does not drive unified toolbar refresh                                                                      | `MISSING_IN_NEX`                             | Popup/Options profile change refreshes all affected tabs            |
| `TB-018` | Dynamic drawing failure uses static fallback                          | source                             | dynamic renderer not connected                                                                                         | `MISSING_IN_NEX`                             | forced failure preserves usable original-compatible fallback        |

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
9. Firefox 153+ audit navigation method after its Marionette restriction;
10. any modern-browser limitation that truly requires a minimized, owner-approved divergence.

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

Status: `PARTIAL`, construction boundary complete but not registered.

Implemented and tested:

- one browser-API boundary for `setIcon`, `setTitle`, `setBadgeText`, `setBadgeBackgroundColor` and `setPopup`;
- every application rewrites all tab-visible fields to clear stale state;
- rejected dynamic ImageData falls back to the supplied original static icon paths;
- exact original default/result/detail localization keys with the original three-substitution title order and fail-closed missing-message behavior;
- one isolated executor that composes pure tab state → original localization → exact renderer → Action presentation;
- real `browser.action`, `browser.i18n`, `browser.tabs` and OffscreenCanvas construction using the exact Badge color, runtime Popup and fallback paths;
- exact compiled locale messages, target-specific manifest hook, static Action assets, permission and shortcut contract.

Remaining:

- register one background owner for the constructed executor;
- invoke it only through the per-tab coordinator;
- remove competing Inspect writes after Inspect becomes a resolver input;
- prove visible target Action mutations in Chromium and Firefox.

No browser API mutation occurs inside the pure state model.

### `TO-05` — per-tab coordinator

Status: `PARTIAL`, isolated implementation and resolver slices verified.

Implemented and tested:

- idempotent registration and removal of URL-update and tab-activation listeners;
- per-tab promise queues, refresh sequences and lifecycle invalidation;
- stale async result suppression before Action mutation;
- unresolved-state fallback to the localized default state;
- resolver/Action error reporting with tab and URL context;
- all-tab refresh with optional icon-cache invalidation;
- omission of tabs without an ID;
- repository-backed Direct/System state resolution;
- source-certain static Fixed-to-proxy resolution using the existing reference interpreter;
- explicit fail-closed behavior for Fixed bypass and unsupported profile trace shapes.

Remaining:

- reproduce the original multiline `matchProfile.results` display trace;
- support Fixed bypass, Switch, Rule List, Virtual, PAC and temporary-rule results without simplified wording;
- bind the real coordinator to startup, tab events, successful activation and recovery;
- represent Inspect and external control as coordinator inputs;
- prove tab isolation and stale-state clearing against visible Action state in Chromium and Firefox.

### `TO-06` — workflow/runtime integration

Status: `PARTIAL`, notification seam implemented but not connected.

Implemented and tested:

- profile-workflow runtime emits a narrow callback only after a successful command returns `appliedSnapshotId`;
- Draft edits, reads and failed commands do not trigger toolbar refresh;
- real browser API construction and state resolver can be composed without registering another Action writer.

Remaining inputs include startup restoration, successful activation refresh, temporary rules, Inspect, ownership/external control, rollback and recovery. Background registration remains intentionally blocked until the result-trace adapter and single-writer transition are safe.

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
