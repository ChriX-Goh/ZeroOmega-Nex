# ZeroOmega Nex

A next-generation, cross-browser proxy profile manager focused on ZeroOmega compatibility, deterministic policy compilation, and low-overhead browser-native execution.

## Status

Milestone 1 implementation is active on a dedicated branch. The current code is an extension/tooling shell only; no production proxy behavior has been enabled.

## Core promises

- Import existing ZeroOmega `schemaVersion: 2` user profiles without forcing ordinary users to rebuild them.
- Preserve familiar profile navigation, colors, editors, popup switching, and Apply/Revert workflow where practical.
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
- [`docs/DELIVERY_PLAN.md`](docs/DELIVERY_PLAN.md) — gated milestones and detailed implementation order.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — architecture decision record.
- [`docs/MILESTONE_STATUS.md`](docs/MILESTONE_STATUS.md) — current milestone scope and outstanding acceptance evidence.

## Milestone 1 stack

- Node.js 24 LTS
- pnpm workspace
- TypeScript strict mode
- WXT 0.20.27
- Svelte 5
- Vitest
- ESLint and Prettier
- Firefox and Chromium build targets

## Current architecture state

- No `proxy` permission.
- No `<all_urls>` permission or listener.
- No `proxy.onRequest` handler.
- No permanent request monitor.
- Popup and options pages are layout shells that intentionally resemble the familiar ZeroOmega workflow.

See the milestone status document before treating the implementation as complete.
