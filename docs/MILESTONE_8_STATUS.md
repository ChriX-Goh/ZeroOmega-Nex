# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft pending repository-owner installation and manual QC  
**Frozen implementation head:** `90955b49223772a7d7df14317cd011073647055e`  
**Full CI:** run `30174300115` passed on 2026-07-26  
**Browser E2E:** run `30174300078` passed for Chromium and Firefox  
**Installable artifact:** `browser-builds`, artifact `8623785399`, SHA-256 `810b6818b746312c16089951acbf9b8f7f7b588f2205bf5fd791f6f21611d48d`

The downloaded artifact ZIP contains `browser-builds.tar.gz`; extracting it produces complete `browser-builds/chrome-mv3/` and `browser-builds/firefox-mv3/` unpacked extension directories.

The earlier candidate at `335229f762e6353ec14e57b5cc2695b6395d175c` and artifact `8622723587` failed repository-owner QC on 2026-07-26 because the layout diverged from original ZeroOmega, global settings were mixed into profile pages, the Options surface felt cramped, and user-visible bugs remained. That candidate and artifact are obsolete and must not be used for acceptance.

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

This is a replacement release candidate after the first manual QC failure. Automated checks are green, but automated success does not override the repository owner’s usability judgment or prove that every real exported backup and editor path is bug-free.

The PR remains Draft until the repository owner confirms:

- the layout is sufficiently faithful to original ZeroOmega,
- detailed configuration pages are comfortable in a full browser tab,
- a real personal ZeroOmega export imports and works without rebuilding profiles,
- Automatic, Light, and Dark appearance behave correctly,
- the previously observed bugs are either fixed or recorded precisely for the next slice.

## Current next action

Install artifact `8623785399` and execute the revised checklist in `docs/MILESTONE_8_RELEASE_CANDIDATE.md`. Do not mark PR #11 ready for review until both browser checks pass. A failure keeps the PR Draft and requires a new implementation head, complete CI/E2E rerun, and newly frozen artifact digest.
