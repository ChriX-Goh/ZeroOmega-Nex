# Milestone 8 Status — Familiar UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft pending repository-owner installation and manual QC  
**Frozen implementation head:** `335229f762e6353ec14e57b5cc2695b6395d175c`  
**Full CI:** run `30170265014` passed on 2026-07-25  
**Browser E2E:** run `30170265029` passed for Chromium and Firefox  
**Installable artifact:** `browser-builds`, artifact `8622723587`, SHA-256 `914428216f5fd3c8b9aaf5db4c7dd898b14868efc2c1e2d344a0adf96622b126`

This file is the durable execution context for Milestone 8. Repository contributors must use it together with `docs/milestone-8-ui-contract.md`, `docs/MILESTONE_8_RELEASE_CANDIDATE.md`, `docs/DELIVERY_PLAN.md`, and `docs/DECISIONS.md`; chat history is not a source of truth.

## Non-negotiable invariants

1. The UI never calls browser proxy APIs or persistent secret storage directly.
2. UI components submit typed commands to the background control plane.
3. Draft, candidate, applied revision, verified snapshot, installed state, and browser-confirmed active state remain distinct.
4. Import never activates automatically.
5. Popup switching uses the Applied revision only; unsaved Draft data cannot affect traffic.
6. PAC/profile activation, Direct/System transitions, authentication preparation, confirmation, state commit, and rollback form one recoverable control-plane operation.
7. Secret values never enter ProfileSpec, ordinary exports, migration reports, logs, command responses, or rendered UI.
8. Normal routing never uses an extension-side global proxy decision callback.
9. Temporary CI workflows or patch scripts must be removed after their product change is committed.
10. Every implementation slice is committed to GitHub and its resulting Head CI must pass before the next slice is treated as complete.

## Delivered and verified

### Working-copy and Apply model

- Dedicated `@zeroomega-nex/profile-workflow` package.
- Applied, Draft, candidate, pending Apply, last-result, selection, and generation state.
- Compare-and-swap persistence, dirty detection, Revert, immutable child revisions, restart and corruption handling.
- Atomic candidate validation, PAC compilation, browser-safe runtime verification, browser installation, confirmation, applied-state commit, and rollback.
- Node/CI differential PAC execution remains separate from extension runtime reference-safety verification because MV3 CSP forbids dynamic code execution.

### Profile management and editors

- Familiar profile navigation, colors, selection, rename, independent duplication, deletion, orphan-resource cleanup, and route-reference repair.
- Fixed, Switch, Rule List, PAC, and Auto Detect editors and creation flows.
- Ordered Switch rules covering every supported condition kind, enable/disable, note, duplicate, delete, and move operations.
- Startup route, release-control restoration, ordered Quick Switch routes, and popup enable/refresh preferences.

### Popup and browser activation

- Popup reads Applied configuration only, checks revision freshness, and displays browser-confirmed active state.
- Verified profile-route activation through PAC.
- Native Direct/System activation with confirmation, rollback, crash recovery, restart restoration, and persisted active mode.
- Route-scoped HTTP/HTTPS authentication planning and transactional listener/binding preparation.
- Reachable authenticated SOCKS routes are rejected explicitly in browser-only mode.
- Direct/System transitions and startup restoration coordinate authentication and proxy state transactionally.

### Legacy import

- ZeroOmega/SwitchyOmega schema-version-2 JSON and base64 analysis.
- Deterministic compatibility totals and migration-detail review.
- Candidate remains inactive until accepted into Draft and later Applied separately.
- Import acceptance uses a typed background command with expected-generation compare-and-swap semantics.
- Imported document identity is normalized to the current workflow document and applied revision.
- Secret values are persisted only by the background transaction and restored after conflicts or storage failures.
- Options components do not access persistent secret storage, and responses/UI exclude secret values.

### Snapshot and revision history

- Immutable ProfileSpec revision archive with legacy active-revision fallback and corruption rejection.
- Verified PAC snapshot index with legacy active/last-known-good fallback and corruption rejection.
- Read-only redacted history returns source revision, route, target, compiler, hashes, statistics, warnings, active markers, and verification mode without PAC source or secrets.
- History explicitly distinguishes Node differential execution, extension reference-safety plus browser confirmation, and legacy verification records.
- Two-step snapshot rollback restores the exact archived revision, PAC snapshot, authentication bindings, and browser proxy state through one compensating transaction.
- Missing revisions, cross-document records, incompatible browser targets, dirty Draft state, activation failure, and compare-and-swap conflict are rejected or rolled back.

### Acceptance hardening

- Architecture guard prevents Options/Popup direct access to browser proxy, authentication, messaging bypass, and persistent storage APIs.
- Visible keyboard focus and narrow-screen single-column layouts are enforced by permanent UI guards.
- Svelte server-render component tests cover Popup, Switch editor, Rule List editor, import review, and history/rollback surfaces.
- Options surfaces background failures globally instead of hiding initialization errors behind profile-selection branches.
- ProfileSpec validation is generated at build time; final browser bundles are inspected for MV3-forbidden dynamic code execution.
- Permanent Browser E2E workflow tests real unpacked Chromium and temporary-installed Firefox extensions.
- Chromium and Firefox both completed profile edit, Apply, history inspection, Popup open, and Direct switch on the frozen implementation head.
- Firefox runtime identifiers are normalized before entering ProfileSpec metadata, and Firefox E2E grants private-window access explicitly through WebDriver BiDi.

## Remaining closure

Automated Milestone 8 implementation and acceptance checks are complete. The only remaining closure gate is repository-owner installation and manual QC of the consolidated artifact documented in `docs/MILESTONE_8_RELEASE_CANDIDATE.md`.

The PR remains Draft until that QC is recorded. A QC failure requires a new implementation head, complete CI and Browser E2E rerun, and a newly frozen artifact digest.

## Current next action

Install the frozen Chromium and Firefox packages from artifact `8622723587` and execute the repository-owner checklist in `docs/MILESTONE_8_RELEASE_CANDIDATE.md`. Do not mark PR #11 ready for review until both browser checks pass or an explicit scoped exception is documented.
