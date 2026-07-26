# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft; original-parity implementation continues
**Last fully verified parity implementation head:** `bb3fa10871e5ee62fd231e79c56998bba2046e76`
**Verification:** CI `30183999834`, Browser E2E `30183999830`, Parity Documentation `30183999833` passed
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
- Fixed, Switch, Rule List, PAC, and Auto Detect profiles retain dedicated profile editors.
- Built-in Direct and System colors have their own page instead of appearing as fake user profiles.
- Product identity is updated to Milestone 8.

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

- Permanent UI guard enforces original navigation groups, independent settings/profile pages, full-tab Options, file-first one-step migration, system theme support, responsive layout, keyboard focus, rollback confirmation, and global error visibility.
- Svelte checks report zero errors and zero warnings.
- Root suite passes 274 unit/integration tests and 6 Svelte component-rendering tests.
- Chromium and Firefox production builds, manifests, MV3 CSP inspection, architecture guards, formatting, lint, packaging, and all workspace checks pass.
- Chromium real-browser E2E verifies Automatic and Dark theme behavior, profile edit and Apply, snapshot history, Popup Direct switching, upload of the original schema-v2 fixture, and `Import and use now` activation.
- Firefox real-browser E2E verifies profile edit and Apply, history navigation under the restored layout, Popup Direct switching, normalized runtime identity, and required private-window access.

## Remaining closure

PR #11 is not a replacement release candidate. The original v3.5.0 source-backed audit remains the acceptance authority, and every incomplete `MUST_MATCH` row keeps the PR Draft.

Current blockers include:

- original per-scheme Fixed editor and authentication layout,
- original compact Switch table, source mode, and attached Rule List workflow,
- dedicated Rule List and PAC download/update semantics,
- full Options `.bak` export and a real original backup round-trip,
- complete Simplified/Traditional Chinese coverage,
- Popup result-profile, current-site, temporary-rule, external-ownership, and bounded diagnostic functions.

## Current next action

Continue verified parity slices on `feat/m8-profile-workflow`. The semantic placeholder cleanup is the current slice; Fixed Profile parity follows after its exact Head passes CI, Browser E2E, and Parity Documentation. Do not request repository-owner installation until a new consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.
