# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft; no installable replacement candidate  
**Latest integrated product Head:** `f0a11300eba0958662e3b9fa4806ea3582bec8ca`  
**Latest product integration:** run `30423585469`, passed repository verification, complete Chromium and Firefox E2E, committed the product slice, uploaded evidence, and removed all temporary integration machinery  
**Estimated first stable replacement-release progress:** 97%

The moving branch Head and exact workflow runs are recorded only in PR #11. This file records stable product checkpoints and release boundaries, so evidence bookkeeping does not repeatedly invalidate its own exact verification Head.

## Acceptance authority

Milestone 8 is accepted against:

- original source: `zero-peak/ZeroOmega v3.5.0`;
- source-capture run: `30181773502`;
- original evidence artifact: `original-zeroomega-ui-evidence-v3.5.0`, ID `8625759489`;
- original artifact SHA-256: `8403e963325a5d4fcac10fd2f3c8dac246cb720afb24f322c827d5cf8ebfdd19`;
- durable knowledge graph: `docs/ORIGINAL_KNOWLEDGE_GRAPH.md`;
- canonical UI/function matrix: `docs/UI_AUDIT_MATRIX.md`;
- architecture decisions: `docs/DECISIONS.md`;
- Session 7 checkpoint: `docs/MILESTONE_8_SESSION_7_CHECKPOINT.md`;
- candidate gate: `docs/MILESTONE_8_RELEASE_CANDIDATE.md`.

All previously frozen Milestone 8 candidates and artifacts are obsolete. None may be installed or treated as completeness evidence.

## Objective

Rebuild the familiar ZeroOmega v3.5.0 interface and profile workflow on top of typed ProfileSpec, deterministic PAC compilation, immutable snapshots, and atomic Chromium/Firefox browser adapters.

An experienced ZeroOmega/SwitchyOmega user should retain the familiar navigation and configuration model without inheriting the original secret-storage, browser-sync, or rollback weaknesses.

## Non-negotiable invariants

1. Options retains the original Settings / Profiles / Actions information architecture with independent right-hand pages.
2. Draft, candidate, Applied revision, verified snapshot, installed state, and browser-confirmed active state remain distinct.
3. Popup switching uses Applied state only.
4. Selecting or reviewing a backup never changes traffic.
5. Secrets remain background-owned and never enter ProfileSpec, ordinary exports, diagnostics, logs, command responses, or rendered UI.
6. Diagnostics never auto-start and never collect headers, bodies, cookies, credentials, query strings, fragments, or response content.
7. Failed compilation, permission, installation, confirmation, or rollback cannot silently replace the previous confirmed state.
8. Chromium and Firefox remain separate capability targets with separate builds and browser tests.
9. Temporary integration patches and generated diagnostic residue are removed after every verified product commit.
10. PR #11 remains Draft until every `MUST_MATCH` row is `DONE + VERIFIED` or has an explicit source-backed scope decision, and repository-owner QC accepts one consolidated candidate.

## Verified delivered scope

### Original-compatible Options and profiles

- Full-tab Options with Settings, Profiles, and Actions.
- Independent General, Interface, Import/Export, Theme, Snapshot History, Built-in Profiles, About, New Profile, and type-specific profile pages.
- Fixed, Switch, PAC, and Virtual as the four normal creation types.
- One isolated Chromium chain creates all four through the real New Profile dialog, verifies type-specific editors and typed Draft state, points Virtual at the new Fixed profile, and commits through normal Apply.
- PAC creation now uses an explicit browser-target capability signal:
  - writable `proxy.settings.get/set` supports PAC Profiles;
  - original `proxy.register` or `proxy.registerProxyScript` targets disable PAC creation and display the original-style localized explanation;
  - targets without writable `proxy.settings` fail closed.
- Component rendering covers supported and unsupported capability metadata; real Chromium Options injection proves the unsupported radio state and warning.
- Imported and attached Rule List compatibility without exposing Rule List as a normal creation type.
- Fixed fallback/HTTP/HTTPS/FTP table, all original protocol choices, target-specific transport/authentication/DNS capability matrix, legacy-inactive FTP request explanation, bypass, inherited placeholders, and background-owned credentials.
- Switch compact rule table, grouped conditions, Draft/Apply validation boundary, source mode, reload restoration, and persisted drag ordering.
- Complete Virtual target and reference-replacement transaction.
- Original profile-header Rename action and independent validated dialog, including Apply-before-dialog and attached Rule List/source rename transactions.
- Typed deletion blockers, general Replace Profile dialog, profile PAC export, and Switch Rule List export.

### Rule Source, PAC, import, and history

- Attached Rule List ownership and complete create/update/schedule/rename/duplicate/delete/detach lifecycle.
- Independent Rule List Config / URL / Text editor.
- PAC URL, request headers, bounded download, cache, Clear, inline editing, raw top-level PAC activation, and original `auth.all` isolation.
- File, pasted JSON, pasted base64, and bounded online HTTP(S) backup review.
- Original schema-v2 export plus browser export → clear → restore → byte-identical export round trip.
- Original schema-v1 upgrade, referenced Auto Detect → WPAD PAC migration, and disabled sync-runtime cleanup.
- Typed Snapshot History with real Chromium rollback converging browser, Applied, Draft, and UI state.

### Popup, auxiliary surfaces, localization, and evidence

- Applied-only Popup switching and result-profile selection.
- Permanent current-site conditions and browser-session-only temporary rules.
- Proxy ownership blockers and Chromium external-profile import.
- Inspect frame/link/media lifecycle, evaluated result badge/title, and headed native Chromium context-menu E2E.
- Explicit-session bounded request diagnostics with strict privacy and storage limits.
- Direct typed English, Simplified Chinese, and Traditional Chinese across all normal user-visible surfaces.
- Locale inventory reports zero untranslated user-visible candidates.
- Permanent visual workflow captures 24 images: light/dark × zh-CN/zh-TW across Options General, Fixed Profile, Import/Export, Popup, Temporary Rules, and Network.

### Real Chromium and Firefox proxy authentication

Integration run `30414496421`, rerun job `90458570753`, committed product Head `8c0d4ce735d0f59cec80442667442a8160dfc182`.

- A controlled proxy emits a genuine Basic `407 Proxy Authentication Required` and succeeds only after valid `Proxy-Authorization`.
- The sentinel hostname is unresolvable, so direct navigation cannot fake success.
- Chromium and Firefox both complete the real challenge through localized Fixed UI, Apply, Popup activation, permission acquisition, and background credential handling.
- Secret diagnostics redact `/secret/` entries; authorization material is never logged.
- C-08 is closed for supported HTTP/HTTPS proxy authentication. Authenticated SOCKS is explicitly unsupported by the completed C-09 capability matrix and ADR-019.

## Explicit scope decisions

- ADR-015: preserve and round-trip `file:` PAC URLs and warnings, but do not read or activate local files in the browser-only release.
- ADR-016: GitHub Gist synchronization is `NOT_PORTING` for the first release.
- ADR-017: WebDAV synchronization is `NOT_PORTING` for the first release.
- ADR-018: original credential-bearing browser `storage.sync` is an `INTENTIONAL_DIVERGENCE`.
- ADR-019: preserve all original Fixed URL slots and protocol choices while explicitly reporting modern FTP-request removal, SOCKS DNS target differences, and SOCKS authentication limits.

## Automated acceptance state

The proxy protocol and browser-target capability integration passed:

- architecture and UI compatibility guards;
- canonical parity validation with C-05 and C-09 closed;
- ESLint, Prettier, workspace type checks, warning-fatal Svelte checks, and all 450 tests;
- unit, integration, and component-rendering tests for the protocol, slot, authentication, and DNS matrix;
- dual-browser build, manifest, inspection, packaging, and staging checks;
- complete Chromium E2E, including all four protocols in a real Fixed Draft and normal Apply workflow;
- complete Firefox E2E, including target identification, all four protocol choices, and legacy-inactive FTP disclosure;
- evidence upload, product commit, and removal of the temporary workflows, patch, and integration helper.

Exact workflow evidence is intentionally maintained in PR #11 rather than repeatedly committed into this file.

## Honest remaining parity work

The canonical matrix contains 126 rows: `DONE=124`, `PARTIAL=2`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.

No release-blocking `MUST_MATCH` rows remain. D-04 and D-05 are closed by `docs/SWITCH_CONDITION_MATRIX.md`, typed catalog tests, complete Chromium field/Apply/source acceptance, and independent Firefox target acceptance.

The only open rows are non-blocking visual references:

- A-14 and I-11 remain non-blocking visual `REFERENCE` rows.

## Remaining release gates

- maintain a clean exact non-Actions-authored Head with green CI, Browser E2E, Parity Documentation, and Visual Evidence;
- close or explicitly scope the two remaining `MUST_MATCH` rows without weakening acceptance;
- produce one consolidated installable candidate with a fresh artifact digest and current QC checklist;
- obtain repository-owner visual review and real complex-backup acceptance in Chromium and Firefox;
- verify restart recovery, active route, theme, rollback, and authenticated routing on the consolidated candidate.

## Current next action

Freeze one consolidated installable candidate, then perform repository-owner visual, real complex-backup, restart-recovery, rollback, and authenticated-route QC in Chromium and Firefox.
