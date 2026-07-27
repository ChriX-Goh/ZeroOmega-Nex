# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft; original-parity implementation continues  
**Current product implementation head:** `15f835e88cb7d3237a3fe9a9271a578893dc7010`  
**Latest integration verification:** run `30232967645` passed full `pnpm verify` and Chromium E2E before committing the responsive attached-header correction, permanent guards, and parity evidence  
**Last completed exact-Head verification:** `196f7d332894b4e1dfa36a888494189c9856ab2f`; CI `30215434190`, Browser E2E `30215434168`, Parity Documentation `30215434165` passed
**Installable release candidate:** none; all previously frozen artifacts are obsolete  
**Current-head rule:** read PR #11 and the exact GitHub Actions runs; never infer completion from this document alone

All previously frozen Milestone 8 candidates and artifacts failed or were superseded by source-backed parity review. They must not be installed, accepted, or used as evidence of functional completeness.

This file is the durable execution context for Milestone 8. Repository contributors must use it together with `docs/milestone-8-ui-contract.md`, `docs/MILESTONE_8_RELEASE_CANDIDATE.md`, `docs/DELIVERY_PLAN.md`, and `docs/DECISIONS.md`; chat history is not a source of truth.

## Non-negotiable invariants

1. The Options experience follows the original ZeroOmega/SwitchyOmega information architecture closely enough that an existing user does not need to relearn where settings and profiles live.
2. Options opens as a complete browser tab, with persistent left navigation and a separate right-hand page for the selected settings area or profile.
3. Global settings never appear inside a profile editor merely to save implementation effort.
4. The UI never calls browser proxy APIs or persistent secret storage directly; components submit typed commands to the background control plane.
5. Draft, candidate, applied revision, verified snapshot, installed state, and browser-confirmed active state remain distinct internally.
6. Selecting a backup file never changes traffic by itself. Explicit `Import and use now` performs import and normal verified Apply as one user action.
7. Popup switching uses the Applied revision only; unsaved Draft data cannot affect traffic.
8. Secret values never enter ProfileSpec, ordinary exports, migration reports, logs, command responses, or rendered UI.
9. Temporary CI workflows or patch scripts must be removed after their product change is committed.
10. Every implementation slice is committed to GitHub and its resulting Head CI must pass before the slice is treated as complete.

## Delivered and verified

### Original-compatible Options architecture

- Options declares `manifest.open_in_tab=true` and opens as a complete browser tab rather than a constrained embedded dialog.
- Persistent left navigation restores the original three-group model: Settings, Profiles, and Actions.
- Settings contains independent Interface, General, Import / Export, Theme, and Snapshot History pages.
- Profiles contains Built-in Profiles, one entry per user profile, and one `New profile…` entry.
- Actions contains persistent Apply changes and Discard changes controls plus Draft status.
- The right-hand editor renders only the selected page. Startup and Quick Switch settings no longer appear inside every profile.
- Fixed, Switch, Rule List, PAC, Virtual, and legacy Auto Detect data retain type-aware handling.
- Built-in Direct and System colors have their own page instead of appearing as fake user profiles.
- Product identity is updated to Milestone 8.

### New Profile and Virtual parity slice

- Normal creation uses the original four choices: Fixed, Switch, PAC, and Virtual.
- The modal validates blank, reserved, duplicate, and hidden names before creation.
- Rule List remains an imported/attached type rather than a normal New Profile choice.
- Legacy schema-v1 Auto Detect upgrades into PAC behavior instead of appearing as a new v3.5.0 profile type.
- Virtual profiles participate in schema validation, reference graphs, cycle checks, migration, routing, PAC compilation, authentication reachability, duplication, deletion, reference replacement, Options editing, and tests.

### Fixed Profile parity slice

- The editor follows the original fallback, HTTP, HTTPS, and FTP proxy-row structure.
- Advanced rows expose SOCKS4, SOCKS5, and bypass settings without replacing the main table.
- HTTP, HTTPS, and FTP rows inherit fallback host and port through placeholders rather than persisted duplicate values.
- Authentication is configured per endpoint through the background-owned secret flow.
- Newly created and freshly installed Fixed profiles start blank; fake loopback proxy endpoints are no longer written into user configuration.
- Blank Fixed profiles are valid before configuration and resolve safely through the existing Direct fallback behavior.
- PAC/Rule List source switching and request-header creation no longer persist `example.invalid`, instructional rule text, or `User-Agent: ZeroOmega Nex` as user data.
- Exact-Head verification at `e8f4ecf7c1583c1ed723eeda06724110f72cf74c` passed CI `30187574395`, Browser E2E `30187574392`, and Parity Documentation `30187574414`.

### Switch Profile rule-table and add-rule semantics

- The vertical Nex rule-card editor has been replaced by one compact table with Sort, Condition type, Condition details, Result profile, Actions, and optional Note columns.
- Basic conditions and advanced Host, URL, and Special condition groups drive the type selectors and expandable help area.
- Pattern, IP network, host-level, weekday, and local-time conditions use dedicated inline controls. Nex-only regular-expression flags are retained only as imported legacy state and require explicit normalization before source editing.
- Native drag handles and keyboard Up/Down controls preserve first-match order.
- Delete, clone, and note actions are inline; the default profile is a separate table-bottom row. Imported Nex-only disabled state is retained only for explicit normalization.
- Full-URL rules expose a capability warning.
- The Options editor always appends a new rule. The first rule uses the current default route; later rows copy the final rule as their template.
- `addConditionsToBottom` belongs to Popup/current-site condition injection and does not change the Options editor button.
- Rule-table integration run `30188210782` passed full repository verification before product commit `6a147772ad5a60e9db45c12194440d5d715ce7ff`.
- Source re-audit correction run `30207888281` passed full repository verification before product commit `740bd175a887dcf1c0339d0a72825864d632934e`.
- Exact-Head verification at `12275f8b42a296e8cf6823120cf65236e3389a06` passed CI `30207977729`, Browser E2E `30207977745`, and Parity Documentation `30207977744`.

### Draft and Apply validation boundary

- ProfileSpec validation now exposes explicit `strict` and `draft` modes.
- Draft mode preserves strict JSON structure, unique IDs, references, cycle detection, sensitive-data rejection, and other document invariants.
- Switch condition semantic errors such as an empty text pattern, an unfinished regular expression, invalid IP/prefix, duplicate weekday, or reversed host-level range remain visible as warnings while editing.
- Applied state, imported data, immutable revisions, candidate creation, PAC compilation, and Apply remain strictly validated.
- Draft-specific clone and serialization APIs prevent strict persistence paths from being weakened accidentally.
- Workflow Draft storage accepts structurally valid incomplete conditions; strict storage paths still reject them.
- Apply rejects an invalid Draft before browser activation and leaves the Draft available for correction.
- New textual Switch conditions start with an empty pattern. Adding a later textual condition copies the preceding row and clears its pattern, matching the original editor.
- Unit tests cover strict-versus-Draft validation, Draft persistence, structurally invalid rejection, strict candidate creation, and pre-activation Apply refusal.
- Permanent compatibility guards require the validation boundary and reject regressions to example condition data.
- Integration run `30210366430` passed the full repository verification before product commit `e428e0702fcba56e4ee3a55f0d9f184134efc107`.
- Exact-Head verification at `371acd582ad0372477560036778f9188cdba1104` passed CI `30210603889`, Browser E2E `30210603887`, and Parity Documentation `30210603935`.

### Switch graphical/source editor slice

- Added bidirectional parsing and composition for the original result-enabled SwitchyOmega Conditions format.
- Source uses `[SwitchyOmega Conditions]`, `@with result`, per-rule `+result profile`, optional `@note`, and a final `* +default profile` rule.
- All supported original condition forms, built-in routes, user-profile references, default-route shorthand, comments, notes, and stable rule identities are covered by unit tests.
- Invalid source remains open with structured line errors. Switching back, leaving the profile, browser history navigation, Duplicate/Delete, and Apply run the same guard before continuing.
- Local source edits participate in global Apply/Discard even before they are parsed into the persisted Draft; Discard remounts the editor without forcing invalid source through the workflow.
- Rule cloning now preserves notes exactly. Normal UI no longer exposes Nex-only per-rule enabled or regex-flags controls; imported legacy state requires an explicit Normalize action before reversible source editing.
- Permanent compatibility guards and component-rendering coverage require the source editor and the App-level action boundary.
- Integration run `30215295471` passed full repository verification before product commit `5bf115091cc46e81347f851610f92343dc3a2ead`.
- Exact-Head verification at `196f7d332894b4e1dfa36a888494189c9856ab2f` passed CI `30215434190`, Browser E2E `30215434168`, and Parity Documentation `30215434165`.

### Attached Rule List core lifecycle

- A Switch Profile can create one hidden `__ruleListOf_<parent name>` Rule List that never appears in normal navigation, Quick Switch, Startup, or ordinary route selectors.
- Enable/disable semantics preserve the visible Switch default route exactly; match and default routes remain separately editable.
- Switchy/AutoProxy, inline/URL, downloaded read-only cache, custom request headers, and editable inline text are represented in ProfileSpec.
- Original backups reconstruct the hidden relationship and preserve downloaded URL content for offline interpretation and PAC compilation.
- Parent rename/color, duplication, direct detach, and parent deletion update or remove the hidden profile/source transactionally.
- Empty request-header rows remain valid Draft warnings, while Apply remains strict; successful background updates now refresh the visible header list through an explicit reactive dependency instead of leaving stale UI.
- Chromium E2E covers creation, hidden navigation, enable/disable, match route, text/header edits, responsive header-row rendering, confirmation, and detach; Firefox extension E2E also passes.
- Integration run `30232967645` passed full repository verification and Chromium E2E before product commit `15f835e88cb7d3237a3fe9a9271a578893dc7010`.
- Manual background download/update now uses user-granted host permission, secret header resolution, bounded isolated fetches, atomic cached-content replacement, persisted timestamps/bytes/errors, and stale calculation. Automatic interval scheduling remains separate.

### Appearance

- Theme choices are Automatic, Light, and Dark.
- Automatic is the default and follows `prefers-color-scheme` immediately.
- Explicit Light or Dark selection is stored as a device-local UI preference and does not modify ProfileSpec or routing state.
- Light and dark palettes share the same original-style layout and interaction model.

### Original backup migration

- File-first restore accepts original ZeroOmega/SwitchyOmega `.bak`, `.json`, and `.txt` exports, plus pasted JSON or base64 backup text.
- Schema-version-2 profiles, settings, Quick Switch order, startup route, built-in colors, conditions, rule lists, PAC definitions, and supported credentials are mapped through the existing deterministic importer.
- Compatibility totals and technical migration details are shown before activation.
- `Import and use now` accepts the imported configuration and immediately runs the normal verified Apply transaction.
- `Import without activating` remains available for cautious review.
- File selection and analysis alone never modify Draft or active traffic.
- Imported secret values are extracted into background-owned secret storage and excluded from ProfileSpec, reports, responses, and UI.

### Verified control plane

- Compare-and-swap working-copy persistence, immutable revisions, dirty detection, Revert, restart recovery, and corruption rejection.
- Atomic validation, PAC compilation, browser-safe runtime verification, browser installation, confirmation, applied-state commit, authentication preparation, and compensating rollback.
- Applied-only Popup quick switching with browser-confirmed active state.
- Redacted revision and PAC snapshot history with active/last-known-good markers and two-step rollback.
- Route-scoped HTTP/HTTPS authentication preparation; reachable authenticated SOCKS routes are rejected explicitly in browser-only mode.

### Automated acceptance

- Permanent UI guards enforce original navigation, full-tab Options, independent settings/profile pages, direct legacy import, automatic theme, keyboard focus, responsive layout, rollback confirmation, blank semantic defaults, Fixed Profile structure, compact Switch/source editing, Draft/Apply separation, hidden attached Rule List ownership/lifecycle, and reactive request-header rendering.
- The attached Rule List integration passed architecture guards, UI compatibility guards, all 124 parity-document rows, formatting, lint, workspace type checks, unit/integration tests, component-rendering tests, manifests, MV3 CSP inspection, Chrome/Firefox builds, packaging, and Chromium browser interaction E2E.
- Four existing Svelte accessibility warnings remain tracked; no new Svelte errors were introduced.

## Remaining closure

PR #11 is not a replacement release candidate. The original v3.5.0 source-backed audit remains the acceptance authority, and every incomplete `MUST_MATCH` row keeps the PR Draft.

Current blockers include:

- Switch source-editor localization, browser interaction E2E, and edit-mode persistence across reloads,
- attached Rule List automatic interval scheduling and startup/due-source refresh,
- Popup/current-site condition injection and its `addConditionsToBottom` ordering setting,
- complete Switch localization and Chromium drag-order E2E,
- dedicated imported Rule List and PAC download/update semantics,
- Virtual browser E2E creation and reference-migration coverage,
- full Options `.bak` export and a real original backup round-trip,
- complete Simplified/Traditional Chinese coverage,
- Popup result-profile, current-site, temporary-rule, external-ownership, and bounded diagnostic functions,
- remaining accessibility warnings in the New Profile and Fixed authentication dialogs.

## Current next action

Verify the manual background Rule List download/update service, then implement automatic interval scheduling or proceed to the next source-backed blocker according to the audit matrix. The slice must update the knowledge graph and audit matrix in the same product commit and pass full integration plus exact-Head CI, Chromium/Firefox E2E, and Parity Documentation. Do not request repository-owner installation until a new consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.
