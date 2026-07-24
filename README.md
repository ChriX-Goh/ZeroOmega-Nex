# ZeroOmega Nex

A next-generation, cross-browser proxy profile manager focused on ZeroOmega compatibility, deterministic policy compilation, and low-overhead browser-native execution.

## Status

Planning and architecture foundation. No production proxy code has been accepted yet.

The current objective is to make scope, compatibility, architecture, delivery order, and acceptance criteria persistent in the repository before implementation begins.

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

## Planned stack

- TypeScript strict mode
- WXT
- Svelte
- Versioned JSON ProfileSpec plus JSON Schema
- IndexedDB and browser storage
- Browser-native PAC execution
- Rust/WASM policy core only after semantic parity and measured need
- Optional future Rust native engine

## Current milestone

**Milestone 0 — Foundation and governance**

Implementation begins with Milestone 1 only after the planning documents are reviewed and merged. Later milestones must not be collapsed into the initial tooling PR.
