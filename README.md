# ZeroOmega Nex

A next-generation, cross-browser proxy profile manager focused on ZeroOmega compatibility, deterministic policy compilation, and low-overhead browser-native execution.

## Status

The foundation and Milestones 1 through 7 are complete and merged into `main`.

Milestone 8 is active on [`feat/m8-profile-workflow`](https://github.com/ChriX-Goh/ZeroOmega-Nex/tree/feat/m8-profile-workflow) in Draft PR [#11](https://github.com/ChriX-Goh/ZeroOmega-Nex/pull/11). The current work restores the source-backed ZeroOmega v3.5.0 Options, Popup, profile workflows, import/export behavior, and English/Simplified Chinese/Traditional Chinese coverage on top of the compiled PAC and atomic browser-adapter core.

No installable replacement or release candidate is currently declared. Use PR #11 and [`docs/MILESTONE_8_STATUS.md`](docs/MILESTONE_8_STATUS.md) for the exact verified Head, current blockers, and next action.

## Core promises

- Import existing ZeroOmega `schemaVersion: 2` user profiles without forcing ordinary users to rebuild them.
- Preserve familiar profile navigation, colors, editors, popup switching, and Apply/Discard workflow where practical.
- Compile policy when configuration changes instead of scanning all rules in extension JavaScript for every browser request.
- Use browser-native PAC as the default data plane.
- Never silently activate downgraded or unsupported legacy behavior.
- Activate only verified immutable snapshots and retain rollback capability.
- Treat Firefox and Chromium as separate capability targets.

## Source-of-truth documents

- [`AGENTS.md`](AGENTS.md) — binding instructions for AI agents and contributors.
- [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md) — mission, scope, non-goals, and success metrics.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — compile-first system architecture and boundaries.
- [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) — ZeroOmega profile migration contract and test strategy.
- [`docs/DELIVERY_PLAN.md`](docs/DELIVERY_PLAN.md) — gated milestones and implementation order.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — architecture decision record.
- [`docs/MILESTONE_STATUS.md`](docs/MILESTONE_STATUS.md) — project-wide completed and active milestone summary.
- [`docs/MILESTONE_8_STATUS.md`](docs/MILESTONE_8_STATUS.md) — current Milestone 8 execution checkpoint.
- [`docs/ORIGINAL_KNOWLEDGE_GRAPH.md`](docs/ORIGINAL_KNOWLEDGE_GRAPH.md) — fixed ZeroOmega v3.5.0 UI and behavior facts.
- [`docs/UI_AUDIT_MATRIX.md`](docs/UI_AUDIT_MATRIX.md) — source-backed UI/function acceptance matrix.
- [`docs/LOCALE_INVENTORY.json`](docs/LOCALE_INVENTORY.json) — machine-generated remaining literal-English inventory.

## Current architecture state

- Chromium and Firefox Manifest V3 production builds share a strict TypeScript, WXT, and Svelte workspace.
- Normal routing installs verified browser-native PAC snapshots; no `proxy.onRequest` handler or extension-side `<all_urls>` decision listener is used.
- Activation distinguishes Draft, candidate, Applied revision, verified snapshot, installed state, and browser-confirmed active state, with rollback and restart recovery.
- Required permissions remain limited to the browser proxy/storage boundary. Proxy authentication, rule-source access, and bounded request diagnostics use explicit optional permissions.
- Diagnostics never auto-start and do not persist headers, bodies, cookies, credentials, query strings, or response content.
- Options and Popup implement source-backed ZeroOmega-compatible profile workflows while keeping secrets and browser proxy APIs background-owned.

See the current Milestone 8 checkpoint before treating any build or artifact as complete.
