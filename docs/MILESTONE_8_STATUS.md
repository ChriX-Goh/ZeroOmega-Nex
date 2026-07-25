# Milestone 8 Status — Familiar UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft until the complete Milestone 8 acceptance contract passes  
**Last verified implementation head before this status document:** `a5817b396f2bd27356e0a207a7d6e082dc7b2c6b`  
**Verification:** GitHub Actions CI run 901 completed successfully on 2026-07-25.

This file is the durable execution context for Milestone 8. Repository contributors must use it together with `docs/milestone-8-ui-contract.md`, `docs/DELIVERY_PLAN.md`, and `docs/DECISIONS.md`; chat history is not a source of truth.

## Non-negotiable invariants

1. The UI never calls browser proxy APIs or persistent secret storage directly.
2. UI components submit typed commands to the background control plane.
3. Draft, candidate, applied revision, verified snapshot, installed state, and browser-confirmed active state remain distinct.
4. Import never activates automatically.
5. Popup switching uses the Applied revision only; unsaved Draft data cannot affect traffic.
6. PAC/profile activation, Direct/System transitions, authentication preparation, confirmation, state commit, and rollback form one recoverable control-plane operation.
7. Secret values never enter ProfileSpec, ordinary exports, migration reports, logs, or rendered UI.
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

### Legacy import review

- ZeroOmega/SwitchyOmega schema-version-2 JSON and base64 analysis.
- Deterministic compatibility totals and migration-detail review.
- Candidate remains inactive until accepted into Draft and later Applied separately.
- Secret values are not rendered; only secret type, source path, username/header metadata, and reference are displayed.

## Context correction required before further feature expansion

The first import-review implementation writes secret values from `LegacyImportPanel.svelte` through `browser.storage.local`. Although it uses a repository adapter, the persistent browser API call still originates in UI code and violates the Milestone 8 component boundary.

This must be corrected before snapshot history work:

1. Import analysis remains pure and may run in the Options UI.
2. Accepting an import sends one typed background command containing the candidate, expected Draft generation, and secret materials.
3. The background validates the candidate, persists secrets, replaces Draft with compare-and-swap semantics, and restores or removes secret values if Draft persistence fails.
4. No Options component imports `browser` for storage access.
5. Tests cover success, generation conflict, storage failure, secret rollback, and absence of secret values in command responses.

## Remaining Milestone 8 slices

### M8.1 — Background import acceptance and authentication preparation

- Move import secret persistence behind the typed background command boundary.
- Derive HTTP/HTTPS proxy-authentication bindings from the candidate ProfileSpec.
- Synchronize bindings before activating any route that can reach authenticated endpoints.
- Dynamically register or refresh the narrow `onAuthRequired` listener when bindings transition from empty to non-empty.
- Surface `permissions-required` before activation can break browsing.
- Restore prior bindings/listener state when activation or applied-state commit fails.
- Keep SOCKS authentication explicitly unsupported in browser-only mode.

### M8.2 — Snapshot and revision history

- Enumerate verified snapshots and ProfileSpec revisions without exposing PAC scripts or secrets by default.
- Show source revision, start route, browser target, compiler version, creation time, verification counts, warnings, and script-hash prefix.
- Mark active and last-known-good snapshots.
- Reject missing or corrupted records.
- Rollback through the same atomic activation transaction as normal activation.

### M8.3 — Acceptance hardening

- Keyboard navigation and visible focus behavior.
- Responsive layout checks.
- Component tests for editors, popup, import review, busy/failure/conflict states, and destructive confirmation.
- Chromium and Firefox browser automation for Apply, popup switch, import-to-Draft, restart restoration, and rollback.
- Architecture guard proving Options/Popup components do not access proxy or persistent-secret browser APIs.
- Final known-limitations, permission rationale, build artifacts, and consolidated repository-owner QC package.

## Current next action

Implement M8.1 beginning with the background import-acceptance transaction. Do not begin snapshot history until the UI storage violation is removed and the resulting Head CI is green.
