# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft; original-parity implementation continues  
**Current product implementation head:** `0669f5636ca083090cbcd7a32dcb1dc66317157a`  
**Integration verification:** run `30187058569` passed full `pnpm verify` before committing the product slice  
**Last exact-Head verification:** `bb3fa10871e5ee62fd231e79c56998bba2046e76`; CI `30183999834`, Browser E2E `30183999830`, Parity Documentation `30183999833` passed  
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

- The editor now follows the original fallback, HTTP, HTTPS, and FTP proxy-row structure.
- Advanced rows expose SOCKS4, SOCKS5, and bypass settings without replacing the main table.
- HTTP, HTTPS, and FTP rows inherit fallback host and port through placeholders rather than persisted duplicate values.
- Authentication is configured per endpoint through the background-owned secret flow.
- Newly created and freshly installed Fixed profiles start blank; fake loopback proxy endpoints are no longer written into user configuration.
- Blank Fixed profiles are valid before configuration and resolve safely through the existing Direct fallback behavior.
- PAC/Rule List source switching and request-header creation no longer persist `example.invalid`, instructional rule text, or `User-Agent: ZeroOmega Nex` as user data.
- Permanent compatibility guards cover the original Fixed structure and the removal of semantic placeholder defaults.

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

- Permanent UI guards enforce original navigation, full-tab Options, independent settings/profile pages, direct legacy import, system theme behavior, keyboard focus, responsive layout, rollback confirmation, blank semantic defaults, and Fixed Profile structure.
- The Fixed integration verification passed architecture guards, UI compatibility guards, all 124 parity-document rows, formatting, lint, workspace type checks, unit/integration tests, component-rendering tests, manifests, MV3 CSP inspection, Chrome/Firefox builds, and packaging.
- `svelte-check` reported 0 errors and 4 accessibility warnings; the warnings remain tracked rather than represented as clean.
- The root test run passed 50 files and 299 tests; the component-rendering run passed 1 file and 10 tests.
- Chrome MV3 and Firefox MV3 production builds completed with required proxy/storage permissions, optional authentication permission, no global host access, and CSP-safe output.

## Remaining closure

PR #11 is not a replacement release candidate. The original v3.5.0 source-backed audit remains the acceptance authority, and every incomplete `MUST_MATCH` row keeps the PR Draft.

Current blockers include:

- original compact Switch table, drag ordering, grouped condition help, source mode, and attached Rule List workflow,
- dedicated Rule List and PAC download/update semantics,
- Virtual browser E2E creation and reference-migration coverage,
- full Options `.bak` export and a real original backup round-trip,
- complete Simplified/Traditional Chinese coverage,
- Popup result-profile, current-site, temporary-rule, external-ownership, and bounded diagnostic functions,
- remaining accessibility warnings in the New Profile and Fixed authentication dialogs.

## Current next action

Confirm CI, Browser E2E, and Parity Documentation on the current PR Head. Once those exact-Head checks pass, treat the Fixed slice as verified and continue with the original Switch Profile editor. Do not request repository-owner installation until a new consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.
