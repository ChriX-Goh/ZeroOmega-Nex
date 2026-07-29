# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft; consolidated owner-QC candidate declared, not release-accepted  
**Latest integrated product Head:** `23272bd9efc4abbcec5ca99c86d31a1353714e8b`  
**Latest product integration:** run `30456527030`, passed repository verification, complete Chromium and Firefox E2E, evidence upload, product commit, and temporary integration cleanup  
**Exact verified candidate Head:** `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`  
**Declared candidate:** `M8-OWNER-QC-1`, Artifact `8725915254`, QC status `NOT RUN`  
**Estimated first stable replacement-release progress:** 98%

The moving documentation Head and exact workflow runs are recorded in PR #11. The immutable owner-QC candidate remains fixed to the Head and artifact above; later documentation commits do not replace it.

## Acceptance authority

Milestone 8 is accepted against:

- original source: `zero-peak/ZeroOmega v3.5.0`;
- source-capture run: `30181773502`;
- original evidence artifact: `original-zeroomega-ui-evidence-v3.5.0`, ID `8625759489`;
- original artifact SHA-256: `8403e963325a5d4fcac10fd2f3c8dac246cb720afb24f322c827d5cf8ebfdd19`;
- durable knowledge graph: `docs/ORIGINAL_KNOWLEDGE_GRAPH.md`;
- canonical UI/function matrix: `docs/UI_AUDIT_MATRIX.md`;
- Switch condition authority: `docs/SWITCH_CONDITION_MATRIX.md`;
- architecture decisions: `docs/DECISIONS.md`;
- Session 7 checkpoint: `docs/MILESTONE_8_SESSION_7_CHECKPOINT.md`;
- candidate identity and QC gate: `docs/MILESTONE_8_RELEASE_CANDIDATE.md`.

All candidates and artifacts preceding `M8-OWNER-QC-1` are obsolete and must not be installed or treated as current completeness evidence.

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
10. PR #11 remains Draft until repository-owner QC accepts one exact consolidated candidate.

## Verified delivered scope

### Original-compatible Options and profiles

- Full-tab Options with Settings, Profiles, and Actions.
- Independent General, Interface, Import/Export, Theme, Snapshot History, Built-in Profiles, About, New Profile, and type-specific profile pages.
- Fixed, Switch, PAC, and Virtual as the four normal creation types.
- One isolated Chromium chain creates all four through the real New Profile dialog, verifies type-specific editors and typed Draft state, points Virtual at the new Fixed profile, and commits through normal Apply.
- PAC creation uses an explicit browser-target capability signal:
  - writable `proxy.settings.get/set` supports PAC Profiles;
  - original `proxy.register` or `proxy.registerProxyScript` targets disable PAC creation with localized explanation;
  - targets without writable `proxy.settings` fail closed.
- Imported and attached Rule List compatibility without exposing Rule List as a normal creation type.
- Fixed fallback/HTTP/HTTPS/FTP table, all original protocol choices, target-specific transport/authentication/DNS matrix, legacy-inactive FTP explanation, bypass, inherited placeholders, and background-owned credentials.
- Original Switch basic 4-item and advanced 10-item condition catalogs.
- `TrueCondition` and `BypassCondition` remain import/source compatibility states rather than ordinary selectable types.
- False annotation, combined IP/CIDR, HostWildcard warning, HostLevels ranges, Weekday checkboxes, Time ranges, invalid Draft retention, strict Apply rejection, correction, source round trip, reload, and Apply convergence.
- Complete Virtual target and reference-replacement transaction.
- Original profile-header Rename action and validated independent dialog, including Apply-before-dialog and attached Rule List/source rename transactions.
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
- Direct typed English, Simplified Chinese, and Traditional Chinese across normal user-visible surfaces.
- Locale inventory reports zero untranslated user-visible candidates.
- Permanent visual workflow captures 24 images: light/dark × zh-CN/zh-TW across Options General, Fixed Profile, Import/Export, Popup, Temporary Rules, and Network.

### Real Chromium and Firefox proxy authentication

Integration run `30414496421`, rerun job `90458570753`, committed product Head `8c0d4ce735d0f59cec80442667442a8160dfc182`.

- A controlled proxy emits a genuine Basic `407 Proxy Authentication Required` and succeeds only after valid `Proxy-Authorization`.
- The sentinel hostname is unresolvable, so direct navigation cannot fake success.
- Chromium and Firefox complete the real challenge through localized Fixed UI, Apply, Popup activation, permission acquisition, and background credential handling.
- Secret diagnostics redact `/secret/` entries; authorization material is never logged.
- Authenticated SOCKS remains explicitly unsupported under ADR-019 and the completed target capability matrix.

## Explicit scope decisions

- ADR-015: preserve and round-trip `file:` PAC URLs and warnings, but do not read or activate local files in the browser-only release.
- ADR-016: GitHub Gist synchronization is `NOT_PORTING` for the first release.
- ADR-017: WebDAV synchronization is `NOT_PORTING` for the first release.
- ADR-018: original credential-bearing browser `storage.sync` is an `INTENTIONAL_DIVERGENCE`.
- ADR-019: preserve all original Fixed URL slots and protocol choices while explicitly reporting modern FTP-request removal, SOCKS DNS target differences, and SOCKS authentication limits.

## Automated acceptance state

At exact candidate Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`:

- CI `30456863674` passed full verification, tests, dual-target builds, inspection, packaging, and Artifact upload.
- Browser E2E `30456863926` passed Chromium, Firefox, and headed native Chromium Inspect. The initial Chromium attempt encountered the existing external-Profile popup timing race; the unchanged-job rerun passed.
- Parity Documentation `30456863775` passed all 126 rows.
- Visual Evidence `30456863885` passed all 24 captures.
- Candidate Artifact `8725915254` was independently downloaded, archive-tested, and SHA-256 verified.

## Honest remaining parity state

The canonical matrix contains 126 rows: `DONE=124`, `PARTIAL=2`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.

No release-blocking `MUST_MATCH` row remains.

The only open rows are non-blocking visual references:

- A-14 — exact original skin;
- I-11 — exact Popup dimensions/pixels.

These are reviewed during owner QC and do not invalidate candidate installation.

## Current candidate

`M8-OWNER-QC-1` is fixed to:

- Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`;
- Artifact `browser-builds`, ID `8725915254`;
- outer ZIP SHA-256 `190dda95001cc381be4e2f9f95b7146314632ab8d3d87893347df9f994935b4c`;
- inner tarball SHA-256 `1a3dffc3748c1c9479edbfa3be9769e49fded037717052fd151898ba3c86def3`;
- expiry `2026-10-27T13:37:29Z`;
- QC status `NOT RUN`.

Exact extraction, installation, environment recording, owner-QC checklist, and defect format are in `docs/MILESTONE_8_RELEASE_CANDIDATE.md`.

## Remaining release gates

- repository-owner visual review of the automation captures and installed extension;
- real complex-backup import/export and configuration comparison in Chromium and Firefox;
- authenticated HTTP/HTTPS route acceptance, permission denial, and recovery;
- browser restart recovery for route, Applied state, theme, and history;
- Snapshot History rollback on the exact candidate;
- explicit `PASS`/`FAIL`/`NOT RUN` recording without silently replacing the artifact.

## Current next action

Install and execute owner QC against `M8-OWNER-QC-1`. Any failure must be recorded against this exact candidate before deciding whether to correct code, add an explicit source-backed scope decision, or freeze a new candidate.
