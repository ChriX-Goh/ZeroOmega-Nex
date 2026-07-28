# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft; original-parity implementation continues  
**Current product implementation head:** `af81c0a8842b3a2a4d4d8183096755a14010ace5` — Typed Temporary Rules and Network  
**Latest integration verification:** run `30389904319` validates typed Temporary Rules and Network in three locales, safe errors, session/privacy boundaries, fresh locale inventory, full repository verification, and the complete Chromium interaction chain  
**Last completed exact-Head verification:** `15cb75a31cbc67aae6e6553b0e4904e06274e7ec`; CI `30390127680`, Browser E2E `30390127707`, Parity Documentation `30390127706` passed  
**Installable release candidate:** none; all previously frozen artifacts are obsolete  
**Current-head rule:** read PR #11 and exact GitHub Actions runs; never infer completion from this document alone

All previously frozen Milestone 8 candidates and artifacts failed or were superseded by source-backed parity review. They must not be installed, accepted, or used as evidence of functional completeness.

This file is the durable execution context for Milestone 8. The acceptance authority is the original ZeroOmega v3.5.0 source capture together with `docs/ORIGINAL_KNOWLEDGE_GRAPH.md` and `docs/UI_AUDIT_MATRIX.md`; chat history is not a source of truth.

## Fixed baseline

- Original source: `zero-peak/ZeroOmega v3.5.0`.
- Source-capture run: `30181773502`.
- Evidence artifact: `original-zeroomega-ui-evidence-v3.5.0`, ID `8625759489`.
- Artifact SHA-256: `8403e963325a5d4fcac10fd2f3c8dac246cb720afb24f322c827d5cf8ebfdd19`.
- PR #11 remains Draft until every `MUST_MATCH` audit row is `DONE + VERIFIED` or receives an explicit documented scope decision.

## Non-negotiable invariants

1. Options follows the original ZeroOmega/SwitchyOmega information architecture closely enough that existing users do not need to relearn it.
2. Global settings and profile editors remain separate pages in a full browser tab.
3. Components do not call proxy APIs or persistent secret storage directly; secrets remain background-owned.
4. Draft, candidate, Applied revision, verified snapshot, installed state, and browser-confirmed active state remain distinct.
5. Selecting a backup never changes traffic; `Import and use now` performs import plus the normal verified Apply transaction.
6. Popup switching uses Applied state only.
7. Secret values never enter ProfileSpec, ordinary exports, reports, logs, command responses, or rendered UI.
8. Temporary workflows, patch scripts, and generated browser outputs are removed after each verified product commit.
9. Every implementation slice must pass full integration and exact resulting-Head CI, Chromium/Firefox E2E, and Parity Documentation before it is complete.

## Verified source-backed slices

### Options, taxonomy, and Virtual

- Full-tab Options restores Settings, Profiles, and Actions with independent right-hand pages.
- Normal New Profile choices are Fixed, Switch, PAC, and Virtual; Rule List remains imported or attached.
- Virtual participates in schema, validation, references, migration, routing, PAC, workflow operations, Options, and tests.
- Exact Head `bb3fa10871e5ee62fd231e79c56998bba2046e76`: CI `30183999834`, Browser E2E `30183999830`, Parity Documentation `30183999833`.

### Fixed Profile and semantic defaults

- Restored fallback/HTTP/HTTPS/FTP rows, advanced SOCKS4/SOCKS5/bypass settings, inherited placeholders, and per-endpoint authentication.
- New Fixed profiles start blank and resolve safely through Direct until configured.
- PAC/Rule List source switching and header creation no longer persist fake URLs, instructional text, or example request headers.
- Exact Head `e8f4ecf7c1583c1ed723eeda06724110f72cf74c`: CI `30187574395`, Browser E2E `30187574392`, Parity Documentation `30187574414`.

### Switch table, Draft boundary, and source editor

- Restored the compact original-style rule table, grouped condition types, drag/keyboard ordering, notes, actions, URL warning, and table-bottom default profile.
- Options-added rules append; the first uses the default route and later rows copy the preceding rule while clearing textual patterns.
- Draft validation permits temporary condition warnings while Apply, import, revisions, candidate creation, and PAC compilation remain strict.
- Added reversible result-enabled SwitchyOmega Conditions source editing with line errors and Apply/navigation guards.
- Exact Heads:
  - `12275f8b42a296e8cf6823120cf65236e3389a06`: CI `30207977729`, Browser E2E `30207977745`, Parity Documentation `30207977744`.
  - `371acd582ad0372477560036778f9188cdba1104`: CI `30210603889`, Browser E2E `30210603887`, Parity Documentation `30210603935`.
  - `196f7d332894b4e1dfa36a888494189c9856ab2f`: CI `30215434190`, Browser E2E `30215434168`, Parity Documentation `30215434165`.

### Switch source-mode persistence and drag ordering

- Original v3.5.0 stores `editSource` separately under `web._profileEditor.<name>` and recomposes source from the current rules on restore. Nex now keeps the same separation using a stable Profile-ID localStorage key, so profile renames do not lose the editor mode and source text never enters UI-state storage.
- Entering source mode stores the preference; successful exit clears it; parse failure keeps the user in source mode; compose failure safely returns to table mode.
- Chromium E2E enters source mode, reloads and restores it, exits and verifies key cleanup, then performs a real drag-handle reorder and verifies visible order, typed Draft order, and reload persistence.
- Integration run `30318613443`; product commit containing this document.

### Virtual creation and complete reference migration

- Original Virtual uses a target selector and a Replace Profile confirmation; replacement leaves both endpoint profiles intact while rewriting other profile references and global routes.
- Nex performs this as one typed Draft transformation followed by the normal verified Apply transaction. Unit coverage now includes Startup, Quick Switch de-duplication, Switch rules/default, Rule List match/default, PAC/Auto Detect fallback, and other Virtual targets.
- Chromium uses a separate user data directory, restores a source-backed schema-v2 cross-reference fixture, creates `Stable Alias` through the real four-type New Profile dialog, selects `Target Proxy`, confirms migration, verifies every typed route surface and both endpoint profiles, then commits through Apply.
- Integration run `30320204375`; product commit `b686e109f4ae8d4bf6ec85346608a1c23c1d3cd3`; clean exact Head `ac5d0e2c5e191c11acfc6aa1a36a244e6bf5ee35` passed CI `30320359259`, Browser E2E `30320359263`, and Parity Documentation `30320359269`.

### Zero-warning accessible Options dialogs

- The seven remaining Svelte warnings were fully enumerated: New Profile dialog/autofocus, Fixed table alert/auth dialog, PAC auth dialog, and blocked/confirm deletion dialogs.
- Neutral dialog containers preserve the existing original interaction layout while removing invalid section roles. New Profile, Fixed/PAC authentication, and deletion dialogs now move focus deterministically to their first meaningful control.
- Table validation keeps native table semantics by placing `role=alert` inside the error cell. Chromium verifies each focus transition through the real Options workflows.
- The extension check now uses `svelte-check --fail-on-warnings`, permanently making any future warning a CI failure.
- Integration run `30330515929`; product commit `f6ed558ad14e5be6a5a2565f236fc278817ab1b7`; clean exact Head `65b8fe0741178c1053f9ff1680e7487dbf647dc5` passed CI `30330704000`, Browser E2E `30330703868`, and Parity Documentation `30330703871`.

### Profile-level PAC and Rule List exports

- Original profile-header exports operate on the current in-memory Options state rather than forcing Apply. Nex commits only an active Switch source editor into Draft, then exports without changing Applied state or browser traffic.
- Fixed, Switch, Rule List, and Virtual profiles compile to cross-browser PAC; PAC Profiles export structurally validated top-level inline/downloaded scripts; Auto Detect is excluded and uncached remote PAC fails explicitly.
- Switch exports modern result-enabled `OmegaRules_*.sorl` with Require/Date/Usage metadata. When legacy export is requested and all conditions remain basic, `SwitchyRules_*.ssrl` is produced; advanced conditions show a warning and safely fall back to `.sorl`.
- All files use original `/\W+/g` filename sanitization and `text/plain;charset=utf-8`. Chromium verifies modern, legacy, warning fallback, generated PAC, raw PAC, and Auto Detect exclusion through real downloads.
- Integration run `30328853989`; product commit `29db0982ea57a230861c095968794d9363bf0261`; clean exact Head `e0870bad4d90d11ad606dc7a5592203536653e49` passed CI `30329080792`, Browser E2E `30329080770`, and Parity Documentation `30329080845`.

### General Replace Profile dialog

- Original v3.5.0 exposes replacement from the Virtual page, but the modal is general: both `from` and `to` remain selectable, both endpoints are previewed, and the help text covers rules, Startup, Quick Switch, and other options while preserving both profiles.
- Nex now applies any dirty Draft before opening the dialog, then uses the existing complete typed replacement transaction to produce a new Draft. The two endpoint profiles remain unchanged and the migration still requires normal Apply.
- Hidden attached Rule Lists are excluded from both selectors. Chromium verifies the Apply-before-open boundary, arbitrary selector changes and previews, complete cross-type reference migration, endpoint preservation, and final Apply.
- Integration run `30326757503`; product commit `fa06a34099bc6a3298068f0cd288f7b46c9108e3`; clean exact Head `f20fa8b44d9ab82ad02d95aa290c44b79f50f4e8` passed CI `30326903002`, Browser E2E `30326903039`, and Parity Documentation `30326902994`.

### Profile deletion and reference protection

- Original deletion refuses any profile that is referenced by another Profile, lists visible referrers, and collapses attached Rule List references to the parent profile. Startup and Quick Switch references are cleaned after deletion but do not block it.
- Nex now exposes a typed blocker list across Switch, Rule List, PAC, Auto Detect, and Virtual routes; `deleteProfileDraft` rejects referenced deletion even when called outside Options.
- Options uses explicit accessible blocked/confirmation dialogs instead of a generic browser confirm. Unreferenced deletion changes Draft only and commits through normal Apply; Startup becomes unset and Quick Switch only removes deleted routes.
- Chromium restores the cross-reference fixture, verifies that `Target Proxy` cannot be deleted and lists all five referrers, then confirms deletion of `Unrelated Proxy`, verifies Draft/resource cleanup, and applies it normally.
- Integration run `30325486940`; product commit `64cc51231ad20946bb9167705b2dfa05af16c6ed`; clean exact Head `69aee5ac54f35526df04a8a55e2276f61581161f` passed CI `30325639100`, Browser E2E `30325639148`, and Parity Documentation `30325639093`.

### Attached Rule List lifecycle and background updates

- A Switch Profile owns one hidden `__ruleListOf_<parent name>` profile/source that is excluded from normal navigation and route selectors.
- Create, enable/disable, match/default routes, Switchy/AutoProxy, inline/URL mode, request headers, cached URL text, rename/color propagation, duplication, detach confirmation, parent deletion, and original-backup reconstruction are implemented transactionally.
- Manual download requests host permission from the Options user gesture, resolves secret headers only in the background, uses isolated no-store/no-referrer/credential-omitting fetches, enforces a 10-second timeout and 4 MiB limit, and atomically preserves the old cache on failure or conflict.
- Automatic updates use one coalesced `alarms` scanner: scan on startup, then every minute; each source is due according to its own/global interval and `lastAttemptAt`, so failures do not retry every minute.
- Background scheduling never requests host permission; ungranted origins are skipped.
- Options consumes validated local workflow-state change payloads synchronously, keeping its generation current without inserting a command between chained operations such as import-and-apply.
- The persistent Switch source editor is not remounted by background updates, so local source text remains while the backing spec receives new cached Rule Source state.
- Chromium E2E covers local HTTP manual download with a custom header, forced alarm refresh to a second payload, state synchronization, continued editing, and successful detach afterward.
- Core lifecycle integration: run `30232967645`, product commit `15f835e88cb7d3237a3fe9a9271a578893dc7010`.
- Manual update integration: run `30235776499`, product commit `d9419f7303e40c11fca44bea3fb54df9913ce950`.
- Automatic scheduler integration: run `30242780330`, product commit `508b6471682d33c658c2efddc55923ed510fec24`.
- Scheduler exact Head `352b29294e409ff4aa6f15684341d28b90686032`: CI `30243118765`, Browser E2E `30243118764`, Parity Documentation `30243118777`.

### Popup current-site conditions, result profiles, temporary rules, proxy ownership, external import, and Inspect

- Popup reads only the invoking tab through `activeTab`; production builds do not receive global host access.
- Public Suffix List parsing derives base domains and subdomain scopes, including multi-label suffixes such as `co.uk`, private suffixes, IPv4, and IPv6.
- The original five permanent condition choices are restored: Host wildcard/regex, URL wildcard/regex, and URL keyword.
- Result routes exclude hidden, disabled, self-referencing, and cycle-producing profiles.
- A duplicate condition tag replaces the earlier rule; `addConditionsToBottom` controls top or bottom insertion.
- The typed background command accepts only the currently active enabled Switch Profile, rejects unapplied Options Draft work, runs normal verified Apply, and keeps the active Switch route.
- Popup rows for Switch and Virtual display their current result route and expose only cycle-safe legal results. Changes use the same dirty-Draft guard and verified Apply transaction while preserving whichever route is currently active.
- Temporary current-site rules use a hidden runtime Switch, `chrome.storage.session` state, and session-only PAC snapshots. They survive service-worker restarts, disappear on browser restart, remain separate from ProfileSpec, preserve the underlying route across normal Apply/switching, and can be removed individually or together in a dedicated manager.
- Runtime message channels reject unrelated messages synchronously so their Promise responses cannot consume one another.
- Proxy ownership inspection remains background-owned and returns only capability/control metadata, never the effective proxy value. Another extension, local policy, missing Firefox capability, and inspection failure map to distinct `app`, `policy`, `disabled`, and `unknown` blockers.
- A blocked Popup hides profiles, result selectors, permanent current-site conditions, and temporary rules, while preserving the original-style Cancel and Manage Extensions escape controls.
- System-mode external import converts Chromium auto-detect, PAC URL/inline, and fixed-server settings in the background; normalizes single/fallback and per-scheme servers plus bypass; suppresses exact existing matches; validates original naming rules; and imports through CAS plus normal verified Apply before immediately activating the resulting profile.
- Popup receives only the external profile kind and suggested label; proxy hosts, ports, and PAC script contents stay background-owned.
- Inspect menus for frame, link, and media targets are reconciled from Applied `showInspectMenu`; valid HTTP/HTTPS/FTP targets are kept per tab in session storage, expire after 10 minutes, clear with their tab or a same-page selection, and replace the Popup current-site context without entering persistent configuration.
- Inspect now evaluates the browser-confirmed active start route against the inspected URL. The `#` badge uses the resolved Profile/Direct/System color; the action title restores the original two-line `[Inspect]/[检查] target` plus current-to-result route shape. Evaluation failure keeps a neutral fallback without blocking inspection.
- Current-site integration: run `30245478398`, product commit `8803d6e4ecf91024fc8d39ad047b3bbfb6dda17b`.
- Result-profile integration: run `30268062637`, product commit `8ea05242cfd619f7eec24a5078fe09e0344b68e2`.
- Temporary-rule integration: run `30281637537`, product commit `625ceb598423c0dda5641490e4a8cdefdf915cfb`.
- Proxy-ownership integration: run `30283438960`, product commit `af25f7c2c2af5d305c3b06d2ee385a425763eb05`.
- External-profile integration: run `30286217338`, product commit `e4c11f6684346510e44b1961b277159b5b13e854`.
- Inspect-menu integration: run `30289377957`, product commit `e305394dae78ce98fa359f5ddc3521ed01675fe9`.
- Inspect result-presentation integration: run `30294936789`, product commit `7e394cf23b6e0035fc58a2a55592c5d22e737367`.
- Native Inspect context-menu E2E integration: run `30297644740`, product commit `944644f3d4588e70429de65224402d8bdc37863a`.

### Top-level raw PAC activation and all-proxy authentication

- Directly selected inline or downloaded-cache PAC Profiles now create deterministic `raw-pac/1` snapshots instead of entering the generated typed PAC graph.
- Raw snapshots enforce script bounds and entrypoint structure, hash the ProfileSpec and script, record a target-dependent warning plus structural verification, then reuse the existing browser install, confirmation, rollback, and last-known-good transaction.
- Arbitrary PAC remains non-composable: nested references continue to fail typed capability analysis. `file:` and URL sources without cache fail before authentication preparation or browser mutation.
- Original `auth.all` maps to one PAC credential secret ref. The Options dialog reads/writes only through background commands; the password remains in proxy-auth secret storage and ordinary `.bak` export omits it with a warning.
- Runtime authentication gives exact endpoint bindings priority; otherwise exactly one active PAC all-proxy binding may answer proxy Basic/Digest challenges. Ambiguous wildcard credentials and ordinary website challenges receive no credentials.
- Chromium E2E edits PAC credentials, applies the Draft normally, activates the PAC through the typed background command, and verifies the `raw-pac/1` snapshot, all-proxies binding, isolated secret, and absence of plaintext in ProfileSpec or command response.
- Integration run `30317075172`; product commit containing this document.

### PAC remote source state machine

- URL PAC now retains an optional downloaded script cache in typed ProfileSpec; runtime timestamps/errors remain outside ProfileSpec in the update ledger.
- Original backup import preserves `pacScript` beside `pacUrl`, and export writes both back, restoring offline/round-trip semantics.
- A dedicated PAC editor restores URL, remote-only headers, Download now/status, read-only downloaded script, Clear URL → retained editable inline script, file warning, and referenced-file error behavior.
- PAC updates reuse the verified optional origin permission, background downloader, secret-header resolution, 10-second/4 MiB bounds, CAS conflict handling, failure-preserves-cache behavior, and coalesced alarm scheduler.
- The remote-source data plane is now paired with the verified top-level raw activation/authentication slice above; only file activation, locale, Firefox coverage, and real 407 manual QC remain.
- Integration run `30313263269`; product commit containing this document.

### Independent imported Rule List editor

- Independent imported Rule List profiles now use the original three-section page: Rule List Config, Rule List URL, and Rule List Text.
- Match/default route selectors and AutoProxy/Switchy radio controls are separated from source location. Presence of a URL defines remote mode; clearing it keeps cached text and returns to editable inline mode.
- Remote text is read-only, uses the already verified optional host-permission/background downloader, secret-header resolution, 10-second/4 MiB bounds, CAS conflict protection, update status, and failure-preserves-cache behavior.
- Hidden attached Rule Lists remain owned and edited through their parent Switch; no ownership or detach transaction is shared with the independent editor.
- Component tests and Chromium E2E cover the structure, imported `rule-switchy` navigation, real local HTTP download, update status, read-only cache, URL clear, and inline editing.
- Integration run `30303532476`; product commit containing this document.

### Original-compatible Options export and backup round trip

- Export first commits the active editor and, when Draft differs from Applied, requires the same Apply transaction before producing a file.
- The download is a real ZeroOmega schema-v2 Options object, not a renamed ProfileSpec: plain `JSON.stringify`, MIME `text/plain;charset=utf-8`, and `ZeroOmegaOptions-<ISO>.bak` filename.
- Fixed, Switch, PAC, Virtual, Rule List, routes, rule order, inline/URL content, literal headers, global settings, and built-in colors map back to original fields. Nex-only disabled/flags/fallback/per-source interval values use ignored extension fields so Nex can restore them without breaking original import.
- Proxy credentials, sensitive request headers, sync credentials, secret references, and secret-like metadata are omitted with visible warnings.
- Fixture `original-default-v3.5.0.bak` is generated by executing the pinned original module from Artifact `8625759489`, not manually authored.
- Unit tests cover representative and original-generated round trips plus secret omission. Chromium downloads the backup, clears local/session storage, restores it through the UI, exports again, and requires byte-identical JSON.
- Integration run `30300955079`; product commit `5a4782f17d0f2e55ec389f46231a639bc5e5b40e`.

### Bounded request diagnostics and network inspection

- Monitoring requires an explicit start action for the current browser session and optional WebRequest/HTTP(S) permission; it never auto-starts merely because a persistent preference is enabled.
- Records are session-only and bounded to 10 minutes, 1,000 entries per tab, 5,000 globally, 256 active requests per tab, and 1,024 active requests globally.
- URLs remove credentials, query strings, and fragments. Headers, bodies, cookies, credentials, and response content are never collected.
- Popup receives only the current tab's count/domain summary. The dedicated page displays non-clickable records, supports start/stop/clear, and does not recreate failed requests.
- Unit tests and Chromium E2E cover the privacy bounds, explicit session lifecycle, real failed request capture, Popup summary, sanitized detail display, and clearing.
- Integration run `30293423052`; product commit `e751e21fdb22efc652b3de23860276089319dd29`.

### Typed PAC locale and Firefox interaction

- `PacProfileEditor` now directly renders English, Simplified Chinese, and Traditional Chinese for URL/Clear, remote headers, download/cache state, script, `auth.all`, file warnings, fallback, actions, placeholders and ARIA using the semantic typed catalog.
- Fixed v3.5.0 `profile_pac.jade` and PO files are the source for PAC URL/script terminology, file warnings, obsolete state, download action, username/password, and the three original all-proxy credential warnings.
- Unstable lower-level PAC downloader messages are not rendered directly; the UI emits localized status while preserving cached script. Authentication read/permission/save/remove failures use non-secret typed errors.
- Chromium keeps remote HTTP download, Clear-to-inline and all-proxy authentication coverage with zh-CN selectors. Firefox creates an inline PAC through the real New Profile flow, applies it, activates it from Popup, and verifies a `raw-pac/1` snapshot and PAC start route.
- This slice does not claim Firefox remote-origin permission/download coverage, real 407 acceptance, or `file:` PAC activation.

### Typed Temporary Rules and Network

- Temporary Rules and Network now directly render English, Simplified Chinese, and Traditional Chinese for page shells, tables, actions, empty/loading/error states, permission/session status, dynamic bounds, titles, buttons, and ARIA.
- Temporary Rules retains browser-session-only storage and session-only PAC snapshots. Network retains explicit start/stop, bounded session storage, sanitized non-navigating URLs, and production-disabled automatic monitoring.
- Both pages replace raw backend/exception messages with safe typed summaries; stable technical request codes such as `ERR_TIMEOUT` remain visible as evidence.
- Chromium verifies zh-CN manager/table/delete and diagnostics start/capture/clear/stop flows. Firefox verifies zh-TW empty/stopped shells without starting monitoring or broadening permissions.
- Integration run `30389904319`; product commit `af81c0a8842b3a2a4d4d8183096755a14010ace5`; clean exact Head `15cb75a31cbc67aae6e6553b0e4904e06274e7ec` passed CI `30390127680`, Browser E2E `30390127707`, and Parity Documentation `30390127706`. The typed inventory now covers fourteen components and reports 90 remaining candidates; stable `ERR_TIMEOUT` remains classified as technical evidence.

### Typed Theme and Popup

- Theme keeps the existing Automatic, Light, and Dark behavior while directly rendering all appearance choices, descriptions, help, and ARIA in English, Simplified Chinese, and Traditional Chinese.
- Popup route/result rows, ownership blockers, external-profile naming, request-diagnostics summary, temporary-rule controls, current-site condition workflow, footer actions, dynamic status/title, safe errors, and ARIA now render directly through the typed catalog.
- Popup switching remains Applied-only; temporary rules remain session-only; ownership blockers remain fail closed. This slice changes the presentation contract, not those state machines.
- Chromium verifies resolved zh-CN Theme and Popup locale, shared dark/automatic theme behavior, result selection, temporary-rule session storage, current-site Apply, external import, and ownership blocking through the complete interaction chain.
- Integration run `30382975947`; product commit `0f8c95eb9e92495a0551be2bb357428a10af7fc3`; clean exact Head `4fb93193d089809dc107cf6d77ba41b9ee42b58b` passed CI `30383219144`, Browser E2E `30383224211`, and Parity Documentation `30383219516`. The typed inventory now covers twelve components and reports 117 remaining candidates.

### Typed Options shell, General and Interface

- The Options sidebar retains the original Settings / Profiles / Actions information structure. Apply and Discard remain fixed in Actions and continue to operate only through the existing Draft/Applied workflow.
- Navigation, document title, Apply/Discard and dynamic Draft status, loading/failure state, General startup/Quick Switch/diagnostics settings, and Interface confirmation/menu controls now render directly in English, Simplified Chinese, and Traditional Chinese through the typed catalog.
- App-level command and exception failures no longer render raw backend text. The shell shows a non-secret typed summary while feature-specific panels retain stable status/code/path evidence.
- Chromium enters the real General and Interface pages, verifies zh-CN headings, labels, select/ARIA contracts and Actions state, and rejects legacy English template text. Existing Firefox zh-TW Apply and PAC paths remain mandatory.
- Integration run `30381058967`; product commit `4bb42febeb4bd51f434a4e381f91a9df6b2daf12`; clean exact Head `14ced5045ae8b8338ad9d12c06c72061d869f892` passed CI `30381284751`, Browser E2E `30381284926`, and Parity Documentation `30381285016`. The remaining literal-English inventory fell from 202 to 156 candidates.

### Delivery-plan reconciliation: Import review

- The user-visible import review was confirmed as implemented rather than a placeholder: file-first input, optional pasted JSON/base64, compatibility summary, technical details, safe secret extraction, explicit activate/non-activate actions, and no traffic change during selection or analysis.
- Object, JSON string, base64 JSON, and schema-v2 support have direct decoder/importer tests. Chromium verifies original backup upload, explicit activation, full storage clear, restore, and byte-identical re-export.
- The stale G-04/G-05/G-06 `UNVERIFIED/BROKEN` statuses are corrected. Legacy Import now renders directly through the typed three-locale catalog, presents stable status/code/path evidence instead of backend English messages, and has a real Chromium assertion for the non-default imported startup route. Repository-owner real complex-backup acceptance remains final QC.
- Online URL restore, schema-v1 upgrade, and v1 AutoDetect migration remain separate missing/scope items.

### Typed Legacy Import and imported startup activation

- `LegacyImportPanel` directly renders English, Simplified Chinese, and Traditional Chinese for export, file/pasted input, compatibility counts, technical details, secret-material notices, inactive import, immediate apply, success/error states, buttons, placeholders, titles, and ARIA.
- Report details show localized status plus stable code/source/target paths. Backend `item.message` and exception `error.message` are not rendered; local failures use non-secret typed summaries.
- The original schema-v2 export → clear → import → export byte-equivalence remains intact. Chromium also requires the fixture's non-default `switch` startup route to converge across Applied settings, the active verified snapshot, Draft/Applied revision identity, `chrome.proxy.settings` PAC mode, and extension control ownership.
- This closes local import translation and startup activation. Online URL restore, schema-v1 upgrade, v1 AutoDetect migration, and repository-owner real complex-backup QC remain separate open items.
- Integration run `30378560992`; product commit `b6dc3d0937296b91f83a917a74cfae6711318e08`; clean exact Head `713079a86fe81aa8ae2c615ea52e2b98e5813e43` passed CI `30378787419`, Browser E2E `30378787402`, and Parity Documentation `30378787342`. The typed inventory now covers ten components and reports 202 remaining candidates.

### Typed Snapshot History and real rollback closure

- The existing revision/snapshot repositories and atomic rollback command were retained; no second state machine was introduced.
- Snapshot History now renders English, Simplified Chinese, and Traditional Chinese directly for page/navigation text, revision and snapshot metadata, verification modes, status, warnings, empty/error states, confirmation, actions, and ARIA.
- The page continues to receive metadata only. ProfileSpec content, PAC source, request headers, and secret material remain background-owned and are never returned by the history command.
- Chromium captures a verified persistent snapshot, activates a distinct raw PAC snapshot, then uses the real History confirmation flow to restore the first snapshot. The regression requires browser `activeSnapshotId`, Applied revision, Draft revision, and the History Active marker to converge.
- The import-review audit is now closed for local files: compatibility summary, stable code/path technical details, secret-material warning, inactive import, immediate apply, byte-identical backup round trip, and direct typed locale coverage are all verified. Online URL restore remains a separate scope item.
- Integration run `30375459826`; product commit `19ed3d66b52be16366842912f0461cd203e1a825`; clean exact Head `b3d54fc266f7472cecca336022f75f56652b84e5` passed CI `30375737690`, Browser E2E `30375737649`, and Parity Documentation `30375737656`. The typed inventory now covers nine components and reports 229 remaining candidates.

## Automated acceptance state

The latest product slices passed architecture guards, permanent UI compatibility guards, all 124 parity-document rows, ESLint, Prettier, workspace type checks, unit/integration tests, component rendering, manifest and MV3 CSP inspection, Chromium/Firefox builds and packaging, the complete Chromium regression suite, a real headed Chromium native Inspect menu path, and a browser download→clear→restore→download Options backup round trip. Request diagnostics were rebuilt with test-only pregranted permissions; production manifests retain optional WebRequest and HTTP(S) host permissions.

`svelte-check --fail-on-warnings` reports 0 errors and 0 warnings; future Svelte compiler or accessibility warnings fail CI.

## Remaining closure

PR #11 is not a replacement release candidate. Current blockers include:

- Firefox remote-origin permission/download coverage, real proxy-challenge manual QC, and an explicit `file:` PAC target decision,
- stable Rule Source/PAC downloader failure codes for complete semantic error localization,
- online restore and Gist/WebDAV/browser sync remain explicitly `UNCERTAIN`,
- consolidated light/dark/zh-CN/zh-TW visual evidence and repository-owner real complex-backup acceptance,

## Current next action

Audit and migrate the remaining literal-English Options surfaces from `docs/LOCALE_INVENTORY.json`, beginning with Built-in Profiles, About, new-profile shell text, profile headers/export actions, and any residual lifecycle status while preserving the original navigation and Draft/Applied boundaries.

### Typed locale inventory and first vertical batch

- Fixed v3.5.0 `zh_CN` / `zh_TW` PO files and original New/Delete/Cannot Delete/Replace/Fixed Auth templates are the wording evidence. A semantic `ui-messages.ts` catalog now gives compile-time keys and typed parameter objects instead of relying on English text matching after render.
- New Profile, shared deletion/replacement dialogs, Fixed Profile, shared Profile-kind labels, and Direct/System/Missing route labels render English, Simplified Chinese, and Traditional Chinese directly. The global observer remains only as a compatibility layer for pending components.
- Unit tests validate every catalog entry has all three locales and dynamic messages never fall back to English. Component tests cover zh-CN and zh-TW; Chromium verifies zh-CN headings, ARIA selectors, blocker kind labels, and locale identity through real workflows.
- `scripts/generate-locale-inventory.mjs` produces `docs/LOCALE_INVENTORY.json`; `validate:locale` blocks a stale inventory or literal-English regression in the completed batch and is part of `pnpm verify`.
- Integration run `30332516697`; product commit `e0dec06345cf496ceb4a4ac18725223a8b3b0937`. The first clean Head exposed one stale Firefox zh-TW selector (`情景模式名稱`); the source-backed `情境模式名稱` selector was corrected in test commit `999ec55f13529176c7032e2d7f40acd8383e03e5`, which passed CI `30332908321`, Browser E2E `30332908331`, and Parity Documentation `30332908361`.

### Typed locale second vertical batch

- Switch Profile condition groups/help, source mode, compact table, drag/keyboard ordering ARIA, rule actions/notes, attached Rule List row, default route, and online attachment section now render through typed three-locale keys.
- Attached and independent Rule List editors localize Config/URL/Text structure, route selectors, formats, source mode, headers, update actions/status, downloaded cache, placeholders, and ARIA. English ARIA contracts remain stable while zh-CN/zh-TW use source-backed terminology.
- Switch parser errors use stable `SwitchSourceError.code` plus line numbers. Rule Source update records do not yet expose stable failure codes, so the UI deliberately shows a localized failure summary instead of leaking an unstable English downloader message; complete downloader error localization remains open.
- Component tests cover zh-CN Switch/attached flows and zh-TW independent Rule List. Chromium asserts direct zh-CN headings, table columns, field ARIA, update status, and URL/text controls. Inventory and locale regression guards include all three components.
- Integration run `30368429932`; product commit `85ce92bd443591f94a11adce4191f8c648b4d0fc`; clean exact Head `6998ddf6d42e646403856e0372943c2778b6ad7a` passed CI `30368666864`, Browser E2E `30368666918`, and Parity Documentation `30368666640`.
