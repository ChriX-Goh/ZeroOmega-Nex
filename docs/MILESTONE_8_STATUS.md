# Milestone 8 Status — Familiar UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft until the complete Milestone 8 acceptance contract passes  
**Last verified implementation head:** `5244c842f17eb52e58f96fa9d2388844695cc65c`  
**Verification:** GitHub Actions CI run 991 completed successfully on 2026-07-25.

This file is the durable execution context for Milestone 8. Repository contributors must use it together with `docs/milestone-8-ui-contract.md`, `docs/DELIVERY_PLAN.md`, and `docs/DECISIONS.md`; chat history is not a source of truth.

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
- Atomic candidate validation, PAC compilation, differential verification, browser installation, confirmation, applied-state commit, and rollback.

### Profile management and editors

- Familiar profile navigation, colors, selection, rename, independent duplication, deletion, orphan-resource cleanup, and route-reference repair.
- Fixed Profile editor.
- Ordered Switch Profile editor covering every supported condition kind, enable/disable, note, duplicate, delete, and move operations.
- Rule List editor for inline/URL source, format, update interval, match route, default route, and request-header references.
- PAC editor for inline/URL source, fallback route, and request-header references.
- Auto Detect editor with explicit target-dependent warning and fallback route.
- Creation flows for all five user-profile variants.

### Startup, popup, and browser activation

- Startup route and release-control restoration settings.
- Ordered Quick Switch settings and popup enable/refresh preferences.
- Popup reads Applied configuration only, checks revision freshness, and displays browser-confirmed active state.
- Verified profile-route activation through PAC.
- Native Direct/System activation with confirmation, rollback, crash recovery, restart restoration, and persisted active mode.

### Legacy import and authentication preparation

- ZeroOmega/SwitchyOmega schema-version-2 JSON and base64 analysis.
- Deterministic compatibility totals and migration-detail review.
- Candidate remains inactive until accepted into Draft and later Applied separately.
- Import acceptance uses a typed background command with expected-generation compare-and-swap semantics.
- Imported document identity is normalized to the current workflow document and applied revision.
- Secret values are persisted only by the background transaction and restored after conflicts or storage failures.
- Options components no longer access persistent secret storage.
- Command responses, reports, and rendered UI exclude secret values.
- Route-scoped authentication planning includes every reachable HTTP/HTTPS credential and excludes unreachable endpoints.
- Reachable SOCKS credentials are rejected explicitly in browser-only mode.
- Authentication binding/listener changes are transactional, permission-gated, dynamically registered, and rollback-capable.
- Authentication preparation occurs before proxy installation; proxy activation failure restores prior bindings and listener state.
- Direct/System transitions clear obsolete authentication bindings transactionally.
- Background startup restores the authentication listener before restoring the active proxy snapshot.

## Remaining Milestone 8 slices

### M8.2 — Snapshot and revision history

- Enumerate verified snapshots and ProfileSpec revisions without exposing PAC scripts or secrets by default.
- Show source revision, start route, browser target, compiler version, creation time, verification counts, warnings, and script-hash prefix.
- Mark active and last-known-good snapshots.
- Reject missing or corrupted records.
- Rollback through the same atomic activation transaction as normal activation.

### M8.3 — Acceptance hardening

- Add an architecture guard proving Options/Popup components do not access proxy or persistent-secret browser APIs.
- Keyboard navigation and visible focus behavior.
- Responsive layout checks.
- Component tests for editors, popup, import review, busy/failure/conflict states, and destructive confirmation.
- Chromium and Firefox browser automation for Apply, popup switch, import-to-Draft, authentication permission failure, restart restoration, and rollback.
- Final known-limitations, permission rationale, build artifacts, and consolidated repository-owner QC package.

## Current next action

Implement M8.2 beginning with a read-only snapshot-history repository contract and typed background query. Do not expose PAC scripts or secret material in history responses. Rollback controls follow only after history parsing, corruption rejection, and active/last-known-good markers are covered by tests.
