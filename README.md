# ZeroOmega Nex

A modern, cross-browser, user-contract-compatible successor rewrite of ZeroOmega v3.5.0, focused on direct migration, deterministic policy compilation, safe recovery, and low-overhead browser-native execution.

## Status

The foundation and Milestones 1 through 7 are complete and merged into `main` as engineering assets.

Milestone 8 is active on [`feat/m8-profile-workflow`](https://github.com/ChriX-Goh/ZeroOmega-Nex/tree/feat/m8-profile-workflow) in Draft PR [#11](https://github.com/ChriX-Goh/ZeroOmega-Nex/pull/11).

The current authorized batch is governance convergence. Product code is frozen while the compatibility boundary, progress model, delivery order, and anti-drift rules are aligned. The next product batch is the real original-export golden migration path.

No installable replacement or release candidate is declared. Read [`docs/PROJECT_STATE.json`](docs/PROJECT_STATE.json) and [`docs/MILESTONE_8_STATUS.md`](docs/MILESTONE_8_STATUS.md) for the current stable status; read PR #11 and GitHub Checks for the moving exact Head and CI.

## Product promise

ZeroOmega Nex is neither an unrelated redesign nor an implementation-level clone.

It preserves:

- supported original exports and user configuration;
- profile names, colors, ordering, references, startup state, and Quick Switch meaning;
- supported route decisions, PAC, Rule Lists, bypass, temporary rules, and authentication boundaries;
- familiar high-frequency Toolbar, Popup, Options, CRUD, and Apply/Discard tasks without material relearning;
- restart, failure recovery, semantic export, and rollback expectations.

It replaces:

- the old internal data model and framework;
- request-time rule evaluation;
- storage and activation coupling;
- browser adapters and lifecycle handling;
- unsafe, obsolete, inaccessible, or accidental historical behavior.

## Compatibility classes

- `CONTRACT-EXACT` — data, semantics, effective results, persistence, export, recovery, rollback, and security.
- `UX-COMPATIBLE` — familiar tasks, terminology, entry points, defaults, hierarchy, and resulting state.
- `MODERNIZED` — architecture, performance, reliability, accessibility, responsive behavior, and bounded clarity improvements that preserve the contract.
- `LEGACY-DEFECT-REJECTED` — confirmed bugs, races, corruption, unsafe behavior, obsolete browser limits, and framework accidents.

Pixel-perfect DOM cloning is not a goal. Near-zero migration and material relearning cost are goals.

## Core technical promises

- Import supported ZeroOmega `schemaVersion: 2` profiles without forcing ordinary users to rebuild them.
- Compile policy when configuration changes instead of scanning all rules in extension JavaScript for every browser request.
- Use browser-native PAC as the default data plane.
- Never silently activate downgraded, unsupported, partially persisted, or unconfirmed behavior.
- Activate verified immutable snapshots atomically and retain a recoverable last-confirmed state.
- Treat Firefox and Chromium as separate capability and verification targets.
- Keep rewrite internals out of ordinary user workflow.

## Source-of-truth documents

- [`docs/PRODUCT_CONSTITUTION.md`](docs/PRODUCT_CONSTITUTION.md) — highest product contract.
- [`docs/EXECUTION_GOVERNANCE.md`](docs/EXECUTION_GOVERNANCE.md) — long-running execution, WIP, stop, debt, and anti-drift rules.
- [`docs/PROJECT_STATE.json`](docs/PROJECT_STATE.json) — machine-readable stable current authorization and release state.
- [`AGENTS.md`](AGENTS.md) — binding contributor and agent operating contract.
- [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md) — mission, scope, non-goals, and success metrics.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — compile-first system architecture.
- [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) — migration, semantic, task, modernization, and defect-rejection contract.
- [`docs/DELIVERY_PLAN.md`](docs/DELIVERY_PLAN.md) — authorized high-value batches and gates.
- [`docs/PROJECT_PROGRESS_MODEL.md`](docs/PROJECT_PROGRESS_MODEL.md) — product completion, evidence confidence, and release state.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — architecture and scope decisions.
- [`docs/MILESTONE_8_STATUS.md`](docs/MILESTONE_8_STATUS.md) — current Milestone 8 summary.
- [`docs/ORIGINAL_KNOWLEDGE_GRAPH.md`](docs/ORIGINAL_KNOWLEDGE_GRAPH.md) — original evidence and behavior facts.
- [`docs/UI_AUDIT_MATRIX.md`](docs/UI_AUDIT_MATRIX.md) — UI/function audit evidence; rows must be interpreted under the current compatibility classes.

## Current architecture state

- Chromium and Firefox Manifest V3 builds share strict TypeScript, WXT, and Svelte packages.
- Normal routing installs verified browser-native PAC snapshots; no `proxy.onRequest` handler or extension-side global decision listener is used.
- Activation distinguishes internal candidate, verified runtime, installed state, and browser-confirmed active state, with rollback and restart recovery.
- Required permissions remain limited to the proxy/storage boundary. Proxy authentication, rule-source access, and bounded diagnostics use explicit optional permissions.
- Diagnostics do not auto-start and do not persist headers, bodies, cookies, credentials, query strings, or response content.
- Internal compiler and snapshot concepts remain behind the compatible user boundary.
