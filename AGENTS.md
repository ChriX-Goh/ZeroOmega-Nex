# ZeroOmega Nex — Agent Operating Contract

This file is the persistent source of truth for AI agents and contributors. Read it before making changes.

## Product objective

Build a next-generation cross-browser proxy profile manager that preserves the familiar ZeroOmega/SwitchyOmega user experience and imports existing ZeroOmega user profiles, while replacing the request-time architecture that can stall Firefox.

## Binding constraints

1. Existing ZeroOmega `schemaVersion: 2` user profiles must be importable without forcing users to recreate profiles.
2. Preserve profile names, colors, ordering, references, startup profile, quick-switch settings, bypass lists, rule order, proxy endpoints, and supported authentication metadata whenever representable.
3. UI layout and interaction should remain recognizably close to ZeroOmega unless a change materially improves correctness, accessibility, or performance.
4. Ordinary browser requests must not depend on an extension-side `<all_urls>` proxy decision listener.
5. Use browser-native PAC execution by default. Request-level compatibility hooks must be narrowly scoped and optional.
6. User configuration is the stable public contract. Compiled PAC, indexes, caches, and runtime snapshots are derived artifacts.
7. Configuration activation must be atomic and rollback-safe.
8. Firefox and Chromium behavior must be tested separately; do not hide platform differences behind unsafe assumptions.
9. Do not add Rust/WASM merely for appearance. Rust is reserved for deterministic parsing, validation, normalization, optimization, compilation, and optional native-engine work.
10. Do not begin a later phase until the current phase acceptance criteria pass.

## Technical direction

- Browser shell and UI: TypeScript strict mode, WXT, Svelte.
- Public configuration: versioned JSON plus JSON Schema.
- Browser storage: IndexedDB for durable data; browser storage for small active-state records.
- Policy core: start with a TypeScript reference implementation; introduce Rust/WASM only behind stable interfaces and differential tests.
- Default data plane: precompiled PAC installed through browser-native proxy APIs.
- Optional advanced data plane: future Rust native local engine controlled through Native Messaging.

## Required workflow

1. Read `docs/PROJECT_CHARTER.md`, `docs/ARCHITECTURE.md`, `docs/COMPATIBILITY.md`, `docs/DELIVERY_PLAN.md`, and `docs/DECISIONS.md`.
2. Work on a dedicated branch.
3. State the milestone and acceptance criteria in the PR description.
4. Add or update tests before declaring completion.
5. Record architecture-changing decisions in `docs/DECISIONS.md`.
6. Update compatibility fixtures whenever importer behavior changes.
7. Never silently reinterpret an unsupported legacy field. Import it, preserve it as opaque metadata, explicitly downgrade it with a warning, or reject it with a precise reason.

## Definition of done for any feature

- Behavior is specified.
- Edge cases and failure behavior are defined.
- Unit tests pass.
- Cross-browser impact is assessed.
- Import/export compatibility impact is assessed.
- No uncontrolled request-time listener or persistent diagnostic overhead is introduced.
- Documentation and decision log are updated.

## Current order of work

1. Foundation documentation and repository conventions.
2. Monorepo/tooling skeleton.
3. Legacy fixtures and schema discovery.
4. Versioned ProfileSpec and legacy importer.
5. Reference interpreter and decision tests.
6. PAC compiler and browser adapters.
7. ZeroOmega-like UI and profile editing.
8. Packaging, migration, performance gates, and release hardening.
9. Rust/WASM optimization only after behavioral parity is proven.
