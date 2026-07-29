# Milestone Status

## Reading rule

This document summarizes project-wide milestone state. It intentionally avoids naming the moving branch Head.

For exact Milestone 8 commits, workflow runs, current blockers, and the immediate next action, read:

1. Draft PR [#11](https://github.com/ChriX-Goh/ZeroOmega-Nex/pull/11).
2. [`MILESTONE_8_STATUS.md`](./MILESTONE_8_STATUS.md).
3. [`ORIGINAL_KNOWLEDGE_GRAPH.md`](./ORIGINAL_KNOWLEDGE_GRAPH.md) and [`UI_AUDIT_MATRIX.md`](./UI_AUDIT_MATRIX.md).

No build is a replacement candidate unless PR #11 explicitly declares a consolidated candidate with a fresh artifact digest and QC checklist.

## Repository baseline

`main` contains the completed and verified foundation plus Milestones 1 through 7. Milestone 7 merged through PR #10 at commit `e3f7725d77d78922589b7c113ffbab806b188ae3`.

The pre-normalization main commit remains preserved at `archive/main-before-stack-normalization`.

## Completed milestones

| Milestone                                  | Result                                                                                                                       | Integration record |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 0 — Foundation and governance              | Charter, architecture, compatibility contract, delivery plan, decisions, and agent operating rules                           | PR #1              |
| 1 — Monorepo and deterministic tooling     | pnpm/TypeScript/WXT/Svelte shell, dual-browser builds, CI, manifest guards, and owner smoke tests                            | PR #2              |
| 2 — Legacy inventory and fixture corpus    | Fixed ZeroOmega v3.5.0/schema-v2 compatibility surface, positive/negative/scale fixtures, and route vectors                  | PR #4              |
| 3 — ProfileSpec v1                         | Versioned public model, JSON Schema, semantic validation, deterministic serialization, revisions, and migration framework    | PR #6              |
| 4 — ZeroOmega importer                     | Bounded JSON/base64 import, complete profile/condition mapping, secret isolation, and structured migration reports           | PR #7              |
| 5 — Reference interpreter                  | Auditable condition, profile-graph, Fixed, Switch, and Rule List route oracle with deterministic traces                      | PR #8              |
| 6 — PAC compiler and verifier              | Deterministic PAC generation, capability analysis, differential verification, budgets, hashing, and immutable snapshots      | PR #9              |
| 7 — Browser adapters and atomic activation | Chromium/Firefox installation, confirmation, rollback, restart recovery, ownership checks, and optional proxy authentication | PR #10             |

### Stable architectural outcomes

- Ordinary navigation uses verified browser-native PAC rather than an extension-side global request decision listener.
- No `proxy.onRequest` handler or required `<all_urls>` host permission is used.
- Draft, candidate, Applied revision, verified snapshot, installed state, and browser-confirmed active state remain distinct.
- Failed compilation or installation cannot silently replace the previous confirmed state.
- Secrets remain outside ProfileSpec, PAC, ordinary exports, diagnostics, and rendered UI.
- Firefox and Chromium are separate capability targets with independent builds and tests.

## Active — Milestone 8

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**State:** Draft; no installable release candidate

### Objective

Rebuild the familiar ZeroOmega v3.5.0 UI and profile workflow on top of the new typed configuration, compiler, snapshot, and browser-adapter architecture.

### Verified delivered scope

- Full-tab Options information architecture with Settings, Profiles, and Actions.
- Fixed, Switch, PAC, and Virtual normal profile creation; imported/attached Rule List compatibility.
- Fixed Profile fallback/HTTP/HTTPS/FTP table, advanced protocols, bypass, inherited placeholders, and background-owned authentication.
- Switch compact rule table, grouped conditions, Draft/Apply validation boundary, reversible source mode, reload restoration, and real drag ordering.
- Attached Rule List ownership, create/update/schedule/rename/duplicate/delete/detach lifecycle.
- Independent Rule List Config/URL/Text editor with bounded download and retained cache semantics.
- PAC URL/header/download/cache/Clear behavior, top-level raw PAC activation, and original `auth.all` mapping.
- Popup switching, result routes, current-site permanent rules, browser-session temporary rules, proxy-ownership blockers, and Chromium external-profile import.
- Source-backed Inspect context menus, result badge/title evaluation, and real native Chromium menu E2E.
- Explicit-session bounded request diagnostics with privacy and storage limits.
- Original schema-v2 Options `.bak` export and browser export → clear → restore → byte-identical export round trip.
- Original schema-v1 → v2 upgrade, referenced `auto_detect` → WPAD PAC migration, and disabled sync-runtime cleanup.
- File, pasted JSON/base64, and bounded online HTTP(S) backup review with explicit inactive or immediate-Apply import actions.
- Virtual reference migration, general Replace Profile dialog, typed deletion protection, and profile-level PAC/Rule List exports.
- Warning-fatal Svelte checks with zero current warnings.
- Direct typed English, Simplified Chinese, and Traditional Chinese presentation across normal Options, profiles, Popup, Temporary Rules, Network, Import, History, Theme, lifecycle dialogs, dynamic messages, and ARIA.
- Machine-generated locale inventory with zero untranslated user-visible candidates plus permanent parity/localization guards.
- Exact-Head visual evidence: light/dark × zh-CN/zh-TW across Options General, Fixed Profile, Import/Export, Popup, Temporary Rules, and Network, with 24 per-image hashes plus artifact/manifest digests.
- Real Chromium/Firefox Basic proxy authentication: localized UI credential save, permission grant, verified Apply/activation, genuine 407 challenge, `onAuthRequired` response, and successful target navigation.

### Current closure blockers

- Repository-owner visual-artifact review, real complex backup, and final installable-candidate acceptance.

### Immediate direction

The exact-Head visual matrix and controlled Chromium/Firefox proxy-407 path are automated and integrity-checked. Milestone 8 now moves to one repository-owner visual/complex-backup acceptance pass and formal consolidated-candidate preparation.

## Partially pulled forward — Milestone 9

Milestone 8 already contains substantial Milestone 9 infrastructure because the restored UI depends on it:

- Bounded manual and scheduled Rule Source/PAC updates.
- Failure-preserves-cache behavior.
- Optional host permission, timeout, byte limit, request-header secret isolation, and atomic CAS replacement.
- Explicit, bounded, session-only request diagnostics.

Milestone 9 is not closed. Remaining planned work includes the user-entered URL decision-test tool, exportable secret-free diagnostic bundle, and final error-code/operational hardening.

## Pending — Milestone 10

Packaging and beta hardening have not started as a formal release phase. Existing CI packages are verification artifacts, not release candidates.

Remaining gates include installation/upgrade/downgrade tests, real migration samples, performance baselines, privacy and permission rationale, release notes, blocker classification, and limited beta acceptance.

## Conditional future milestones

Milestone 11 Rust/WASM work starts only when profiling proves that replacing a typed TypeScript module improves total system behavior without losing differential parity.

Milestone 12 native-engine work remains optional. The browser-only product must remain fully usable and safely recoverable without it.

## Owner-QC boundary

Intermediate slices remain self-verified through exact-Head CI, fixtures, static audits, Chromium/Firefox automation, and parity documentation. The repository owner is asked to install and inspect only a consolidated candidate, except where an irreducible capability or product decision requires direct judgment.
