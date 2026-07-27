# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft; original-parity implementation continues  
**Current product implementation head:** `e4c11f6684346510e44b1961b277159b5b13e854`  
**Latest integration verification:** run `30286217338` passed full `pnpm verify` and Chromium System-mode external Fixed import plus immediate activation E2E before committing the Popup external-profile workflow  
**Last completed exact-Head verification:** `ead747bf690c86d639670fe35a5c15a05afb69d0`; CI `30283674973`, Browser E2E `30283673758`, Parity Documentation `30283675950` passed  
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

### Popup current-site conditions, result profiles, temporary rules, and proxy ownership

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
- Chromium E2E switches through the real Popup to System, writes a valid external `fixed_servers` configuration, verifies reserved-name rejection, imports the exact Fixed endpoints and bypass data, confirms Draft equals Applied, and verifies the active snapshot starts at the imported profile.
- Current-site integration: run `30245478398`, product commit `8803d6e4ecf91024fc8d39ad047b3bbfb6dda17b`.
- Result-profile integration: run `30268062637`, product commit `8ea05242cfd619f7eec24a5078fe09e0344b68e2`.
- Temporary-rule integration: run `30281637537`, product commit `625ceb598423c0dda5641490e4a8cdefdf915cfb`.
- Proxy-ownership integration: run `30283438960`, product commit `af25f7c2c2af5d305c3b06d2ee385a425763eb05`.
- External-profile integration: run `30286217338`, product commit `e4c11f6684346510e44b1961b277159b5b13e854`.
- Proxy-ownership exact Head `ead747bf690c86d639670fe35a5c15a05afb69d0`: CI `30283674973`, Browser E2E `30283673758`, Parity Documentation `30283675950`.

## Automated acceptance state

The latest Popup external-profile integration passed architecture guards, permanent UI compatibility guards, all 124 parity-document rows, ESLint, Prettier, workspace type checks, unit/integration tests, component rendering, manifest and MV3 CSP inspection, Chromium/Firefox builds and packaging, and Chromium System-mode external Fixed import plus immediate activation E2E.

Four pre-existing Svelte accessibility warnings remain tracked; no new Svelte error was introduced.

## Remaining closure

PR #11 is not a replacement release candidate. Current blockers include:

- Switch source-editor localization, browser interaction coverage, and edit-mode persistence across reloads,
- complete Switch localization and Chromium drag-order E2E,
- dedicated imported Rule List and PAC download/update semantics,
- Virtual browser E2E creation and reference-migration coverage,
- full Options `.bak` export and a real original-backup semantic round trip,
- complete Simplified/Traditional Chinese coverage,
- Popup bounded diagnostic functions,
- remaining accessibility warnings in New Profile and Fixed authentication dialogs.

## Current next action

Proceed to bounded request diagnostics and Inspect controls. Update both canonical parity documents in the same product commit, pass full integration, then pass exact-Head CI, Chromium/Firefox E2E, and Parity Documentation. Do not request repository-owner installation until a consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.
