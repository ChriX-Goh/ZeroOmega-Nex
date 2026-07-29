# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft; no installable replacement candidate  
**Integrated product Head:** `8c0d4ce735d0f59cec80442667442a8160dfc182`  
**Product integration:** run `30414496421`, rerun job `90458570753`, passed and committed the product slice  
**Estimated first replacement-release progress:** 96%  
**Current-head rule:** use PR #11 and exact GitHub Actions runs for the moving branch Head; this document records the latest accepted product checkpoint.

## Acceptance authority

Milestone 8 is accepted against:

- original source: `zero-peak/ZeroOmega v3.5.0`;
- source-capture run: `30181773502`;
- original evidence artifact: `original-zeroomega-ui-evidence-v3.5.0`, ID `8625759489`;
- original artifact SHA-256: `8403e963325a5d4fcac10fd2f3c8dac246cb720afb24f322c827d5cf8ebfdd19`;
- durable knowledge graph: `docs/ORIGINAL_KNOWLEDGE_GRAPH.md`;
- canonical UI/function matrix: `docs/UI_AUDIT_MATRIX.md`;
- architecture decisions: `docs/DECISIONS.md`;
- Session 7 checkpoint: `docs/MILESTONE_8_SESSION_7_CHECKPOINT.md`.

All previously frozen Milestone 8 candidates and artifacts are obsolete. None may be installed or used as completeness evidence.

## Objective

Rebuild the familiar ZeroOmega v3.5.0 interface and profile workflow on top of the typed ProfileSpec, deterministic PAC compiler, immutable snapshot, and atomic Chromium/Firefox browser-adapter architecture.

An experienced ZeroOmega/SwitchyOmega user should retain the familiar navigation and configuration model without inheriting the original secret-storage, browser-sync, or rollback weaknesses.

## Non-negotiable invariants

1. Options uses the original Settings / Profiles / Actions information architecture with independent right-hand pages.
2. Draft, candidate, Applied revision, verified snapshot, installed state, and browser-confirmed active state remain distinct.
3. Popup switching uses Applied state only.
4. Selecting or reviewing a backup never changes traffic.
5. Secret values remain background-owned and never enter ProfileSpec, ordinary exports, diagnostics, logs, command responses, or rendered UI.
6. Production diagnostics never auto-start and never collect headers, bodies, cookies, credentials, query strings, fragments, or response content.
7. Failed compilation, permission, installation, confirmation, or rollback cannot silently replace the previous confirmed state.
8. Chromium and Firefox remain independent capability targets with separate builds and browser tests.
9. Temporary integration patches and generated diagnostic residue must be removed after the verified product commit.
10. PR #11 remains Draft until every `MUST_MATCH` row is `DONE + VERIFIED` or receives an explicit documented scope decision, and repository-owner QC accepts one consolidated candidate.

## Verified delivered scope

### Original-compatible Options and profiles

- Full-tab Options with Settings, Profiles, and Actions.
- Independent General, Interface, Import/Export, Theme, Snapshot History, Built-in Profiles, About, New Profile, and type-specific profile pages.
- Fixed, Switch, PAC, and Virtual as the four normal creation types.
- Imported and attached Rule List compatibility without exposing Rule List as a normal creation type.
- Fixed fallback/HTTP/HTTPS/FTP table, advanced protocols, bypass, inherited placeholders, and background-owned credentials.
- Switch compact rule table, grouped conditions, Draft/Apply validation boundary, source mode, reload restoration, and persisted drag ordering.
- Complete Virtual target and reference-replacement transaction.
- Typed deletion blockers, general Replace Profile dialog, profile PAC export, and Switch Rule List export.

### Rule Source, PAC, import, and history

- Attached Rule List ownership and complete create/update/schedule/rename/duplicate/delete/detach lifecycle.
- Independent Rule List Config / URL / Text editor.
- PAC URL, request headers, bounded download, cache, Clear, inline editing, raw top-level PAC activation, and original `auth.all` isolation.
- File, pasted JSON, pasted base64, and bounded online HTTP(S) backup review.
- Original schema-v2 export plus browser export → clear → restore → byte-identical export round trip.
- Original schema-v1 upgrade, referenced Auto Detect → WPAD PAC migration, and disabled sync-runtime cleanup.
- Typed Snapshot History with real Chromium rollback converging browser, Applied, Draft, and UI state.

### Popup and auxiliary surfaces

- Applied-only Popup switching and result-profile selection.
- Permanent current-site conditions.
- Browser-session-only temporary rules and temporary-rule manager.
- Proxy ownership blockers and Chromium external-profile import.
- Inspect frame/link/media lifecycle, evaluated result badge/title, and headed native Chromium context-menu E2E.
- Explicit-session bounded request diagnostics with strict privacy and storage limits.

### Localization and visual evidence

- Direct typed English, Simplified Chinese, and Traditional Chinese across normal Options, profiles, Popup, Temporary Rules, Network, Import, History, Theme, dialogs, dynamic messages, placeholders, titles, and ARIA.
- Locale inventory reports zero untranslated user-visible candidates and is guarded by verification.
- Permanent visual workflow captures light/dark × zh-CN/zh-TW across Options General, Fixed Profile, Import/Export, Popup, Temporary Rules, and Network.
- Exact visual artifact at product Head `1eb20d1d57cc53887d5d53df7963b8e85709ea24`: run `30407814012`, artifact ID `8707237406`, artifact digest `sha256:c61b7ea58e8dccd59fb1e0a628af6b9fec2303a824ab070f730ed08d354e30f2`, manifest digest `176dcfbbb0e1c152f8c16016be98c8ffd2ca78b46fe981e56e7ce422d2160206`.

### Real Chromium and Firefox proxy authentication

Integration run `30414496421`, rerun job `90458570753`, verified and committed Head `8c0d4ce735d0f59cec80442667442a8160dfc182`.

- A controlled proxy emits a genuine Basic `407 Proxy Authentication Required` and returns the success page only after valid `Proxy-Authorization`.
- The sentinel hostname is intentionally unresolvable, so direct navigation cannot fake success.
- Chromium requests `webRequest` + `webRequestAuthProvider` and HTTP(S) origins, then completes 407 retry through the real localized Fixed UI, Apply transaction, Popup activation, and background credential handler.
- Firefox requests `webRequest` + `webRequestBlocking` and HTTP(S) origins directly inside the original Apply user gesture. It does not await `permissions.contains` first, because that consumed user activation.
- Firefox returns to Direct before revoking the broad authentication permission, then continues fine-grained origin-permission tests.
- Secret diagnostics redact `/secret/` storage entries; the proxy records bounded counts only and never prints authorization material.
- C-08 is closed for supported HTTP/HTTPS proxy authentication. Authenticated SOCKS remains explicitly unsupported under C-09.

## Explicit scope decisions

- ADR-015: preserve and round-trip `file:` PAC URLs and warnings, but do not read or activate local files in the browser-only release.
- ADR-016: GitHub Gist synchronization is `NOT_PORTING` for the first release and requires a dedicated later remote-sync milestone.
- ADR-017: WebDAV synchronization is `NOT_PORTING` for the first release and requires a separate crash-safe, HTTPS-oriented design.
- ADR-018: original credential-bearing browser `storage.sync` behavior is an `INTENTIONAL_DIVERGENCE`; Nex does not propagate Gist tokens or WebDAV passwords through browser sync.

## Automated acceptance state

The integrated product slice passed:

- architecture and UI compatibility guards;
- corrected parity-document validation across 126 classified rows;
- ESLint, Prettier, workspace type checks, and `svelte-check --fail-on-warnings` with zero errors and zero warnings;
- unit, integration, and component-rendering tests;
- manifest, MV3 CSP, build, inspection, packaging, and dual-browser checks;
- complete Chromium and Firefox E2E, including genuine 407 authentication;
- temporary patch cleanup and automatic product commit.

The bot-authored integration commit produced `action_required` workflow shells with no jobs. A human-authored reconciliation Head must therefore run fresh exact-Head CI, Browser E2E, Parity Documentation, and Visual Evidence before candidate preparation.

## Honest remaining parity work

The matrix reconciliation must preserve genuine open items rather than converting them into paperwork closure:

- target-dependent PAC-disable wiring in the New Profile dialog;
- original-style Rename action/dialog parity;
- modern browser FTP/protocol capability edges;
- final Switch condition-type and condition-field matrix acceptance;
- complete real-browser creation coverage for all four normal profile types;
- non-blocking reference-level visual differences such as exact Popup dimensions.

## Remaining release gates

- exact human-authored reconciliation Head with green CI, Browser E2E, Parity Documentation, and Visual Evidence;
- one consolidated installable candidate with fresh artifact digest and current QC checklist;
- repository-owner review of the consolidated visual artifact;
- repository-owner acceptance of a real complex ZeroOmega backup in Chromium and Firefox;
- restart recovery, active-route, theme, rollback, and authenticated-route checks on the consolidated candidate.

## Current next action

Reconcile the canonical matrix, PR body, and replacement-candidate record; run exact-Head automation; then freeze one consolidated owner-QC candidate. Do not request installation of intermediate slices.
