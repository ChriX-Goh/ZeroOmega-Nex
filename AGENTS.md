# ZeroOmega Nex — Agent Operating Contract

Read `docs/PRODUCT_CONSTITUTION.md` before making any change. It is the highest-authority product contract. If another document conflicts with it, the constitution wins and the conflict must be corrected.

## Product objective

Build a clean-room, bottom-layer rewrite of ZeroOmega v3.5.0 for Chromium and Firefox while preserving the original observable product contract as modern browser APIs permit. This is not a modernization redesign.

## Binding constraints

1. Supported ZeroOmega `schemaVersion: 2` exports must import directly and become immediately usable without manual profile reconstruction or a mandatory new migration workflow.
2. Preserve representable profile names, colors, ordering, references, startup profile, Quick Switch settings, bypass lists, rule order, proxy endpoints, PAC, Rule Lists, temporary rules, and supported authentication metadata.
3. UI, terminology, hierarchy, defaults, validation timing, Toolbar, Popup, Options, dialogs, and state transitions are observable contracts and must be equivalent to the original by default.
4. Do not invent visible pages, descriptions, status taxonomies, or workflow merely to expose rewrite internals.
5. Any user-visible difference requires a `DR-xxxx` record containing original evidence, browser-limitation evidence, the minimum difference, cross-browser verification, impact analysis, and repository-owner acceptance.
6. Ordinary browser requests must not depend on an extension-side global `<all_urls>` proxy decision listener.
7. Use browser-native PAC execution by default. Request-level compatibility hooks must be narrowly scoped, evidence-backed, and optional.
8. User configuration is the stable public contract. Compiled PAC, indexes, caches, and runtime snapshots are derived artifacts.
9. Configuration activation must be atomic, confirmed, and rollback-safe.
10. Firefox and Chromium behavior must be tested separately; do not hide platform differences behind assumptions.
11. Unknown or target-dependent shapes fail closed. Never invent simplified wording or behavior to make a test pass.
12. Do not add Rust/WASM merely for appearance. Introduce it only after measured need and protected differential parity.
13. Do not repeatedly ask the repository owner to inspect micro-slices. Self-verify coherent work, then request owner QC for a complete user journey or irreducible product decision.
14. Permanent CI is read-only. Do not create one-time workflows that commit or push implementation or documentation changes.

## Technical direction

- Browser shell and UI: TypeScript strict mode, WXT, Svelte.
- Public configuration: versioned JSON plus JSON Schema.
- Browser storage: IndexedDB for durable data; browser storage for small active-state records.
- Policy core: TypeScript reference implementation remains the semantic oracle.
- Default data plane: precompiled PAC installed through browser-native proxy APIs.
- Optional advanced data plane: future native engine only after behavioral parity and measured need.

## Required workflow

1. Read `docs/PRODUCT_CONSTITUTION.md`, `docs/PROJECT_CHARTER.md`, `docs/ARCHITECTURE.md`, `docs/COMPATIBILITY.md`, `docs/DELIVERY_PLAN.md`, and `docs/DECISIONS.md`.
2. Read the latest knowledge graph, active delivery order, exact Head status, and unresolved evidence nodes before changing code.
3. Work on the dedicated branch and preserve a clean, reviewable commit history for each coherent work package.
4. State the user journey, original anchors, acceptance criteria, and known `UNKNOWN` or `DR-xxxx` items.
5. Capture or cite original source/package/runtime evidence before implementing user-visible behavior.
6. Add or update deterministic tests and parameterized browser evidence.
7. Update compatibility fixtures whenever importer or semantic behavior changes.
8. Never silently reinterpret unsupported legacy data. Map it, preserve it, explicitly downgrade it, or reject it precisely.
9. Run the required verification pipeline against the exact committed Head.
10. Update one authoritative status source. Do not hand-maintain competing Head, CI, progress, candidate, or blocker values across multiple documents.
11. Accumulate verified work into a complete user-journey build and present one concise owner QC package.

## Completion levels

### Engineering Done

- Behavior and failure behavior are specified.
- Unit and contract tests pass.
- Cross-browser and import/export impact are assessed.
- Architecture and decision records are updated where needed.
- The exact Head passes required engineering checks.

### Parity Verified

- Original-derived evidence and explicit mapping exist.
- Chromium and Firefox evidence pass where applicable.
- Real data or real browser evidence exists where synthetic fixtures are insufficient.
- Any unavoidable difference has an accepted `DR-xxxx` record.

### Journey Accepted

- The complete user journey passes on one exact build.
- The repository owner records explicit `PASS`.

Only Journey Accepted work closes product progress. Commit count, changed lines, test count, green CI, or Nex-only screenshots do not establish product completion.

## Current execution order

1. Freeze the product constitution and eliminate conflicting wording and status sources.
2. Complete Order 1: installation, startup, Toolbar, per-tab state, Popup smoke, Inspect, and recovery.
3. Prove real original export -> direct import -> immediate equivalent use.
4. Correct Popup and temporary/site-rule journeys.
5. Correct Options, dialogs, and Apply/Discard journeys.
6. Close Fixed, Switch, PAC, Virtual, Rule List, lifecycle, export, restart, rollback, ownership, and authentication journeys.
7. Complete localization, density, and visual alignment.
8. Produce one exact final candidate for repository-owner acceptance.
