# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft; no installable replacement candidate  
**Integrated product Head:** `febb7dcd8a5455bd31c499a88bf450039bc4a67b`  
**Exact verified Head:** `a168d78fe53b6cbd4cae92d15ccb2366e90cb4f4`  
**Estimated first replacement-release progress:** 96%  
**Current-head rule:** use PR #11 and exact GitHub Actions runs for the moving branch Head; this document records the latest accepted checkpoint.

## Exact verification evidence

At Head `a168d78fe53b6cbd4cae92d15ccb2366e90cb4f4`:

- CI `30416573442` passed full verification, tests, dual-target builds, inspection, packaging, and artifact upload.
- Browser E2E `30416573430` passed Chromium, Firefox, and headed native Chromium Inspect.
- Parity Documentation `30416573424` passed 126 rows: `DONE=118`, `PARTIAL=8`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.
- Milestone 8 Visual Evidence `30416573395` passed all 24 light/dark × zh-CN/zh-TW captures.
- Build artifact `browser-builds`, ID `8710375259`, digest `sha256:a61770c9e6e1860e8acb5692282984bf72257713b06c85b1abd95b45f5c0b34c`.
- Visual artifact `m8-visual-evidence-a168d78fe53b6cbd4cae92d15ccb2366e90cb4f4`, ID `8710369376`, digest `sha256:67a660e2ee1421590759e310347a5a17a34065a2446042570b5d8e5bb61743c6`.

These are verification artifacts only. No consolidated owner-QC candidate is declared while `MUST_MATCH` rows remain open.

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

Rebuild the familiar ZeroOmega v3.5.0 interface and profile workflow on top of typed ProfileSpec, deterministic PAC compilation, immutable snapshots, and atomic Chromium/Firefox browser adapters.

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
9. Temporary integration patches and generated diagnostic residue are removed after each verified product commit.
10. PR #11 remains Draft until every `MUST_MATCH` row is `DONE + VERIFIED` or receives an explicit documented scope decision, and repository-owner QC accepts one consolidated candidate.

## Verified delivered scope

### Original-compatible Options and profiles

- Full-tab Options with Settings, Profiles, and Actions.
- Independent General, Interface, Import/Export, Theme, Snapshot History, Built-in Profiles, About, New Profile, and type-specific profile pages.
- Fixed, Switch, PAC, and Virtual as the four normal creation types.
- One isolated Chromium chain creates all four through the real New Profile dialog, verifies type-specific editors and typed Draft state, points Virtual at the new Fixed profile, and commits through normal Apply.
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

## Honest remaining parity work

Eight rows remain `PARTIAL`:

### Five release-blocking `MUST_MATCH` rows

1. A-12 — connect target-dependent PAC unsupported state to the New Profile dialog and prove it in-browser.
2. B-03 — restore original-style Rename action/dialog parity or record a justified product decision.
3. C-09 — finish the protocol/target capability matrix.
4. D-04 — complete the original Switch condition-type matrix acceptance.
5. D-05 — complete condition-specific field/control and Draft/Apply browser acceptance.

### One `UNCERTAIN` row

- C-05 — modern Chromium/Firefox FTP scheme behavior.

### Two non-blocking `REFERENCE` rows

- A-14 — exact original skin.
- I-11 — exact Popup dimensions and pixels.

## Remaining release gates

- close or explicitly scope the five remaining `MUST_MATCH` rows without weakening acceptance;
- maintain exact-Head CI, Browser E2E, Parity Documentation, and Visual Evidence;
- produce one consolidated installable candidate with fresh artifact digest and current QC checklist;
- obtain repository-owner review of the consolidated visual artifact;
- obtain repository-owner acceptance of a real complex ZeroOmega backup in Chromium and Firefox;
- verify restart recovery, active route, theme, rollback, and authenticated routing on the consolidated candidate.

## Current next action

Close A-12, then proceed through B-03, C-09, D-04, and D-05. Do not request installation of intermediate slices.
