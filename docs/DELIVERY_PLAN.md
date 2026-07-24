# Delivery Plan

## Execution rule

Work proceeds milestone by milestone. A later milestone may be researched in parallel, but production code depending on it does not merge until the preceding milestone acceptance criteria pass.

Each milestone must produce:

- A scoped branch and PR.
- Tests and fixtures.
- Updated documentation.
- Explicit acceptance evidence.
- Known limitations.
- A rollback path where runtime behavior changes.

## Milestone 0 — Foundation and governance

### Objective

Make the repository self-describing so development does not depend on chat context or individual memory.

### Steps

1. Add project charter and non-goals.
2. Add architecture and compatibility contracts.
3. Add delivery plan and decision log.
4. Add `AGENTS.md` instructions for AI contributors.
5. Define branch, commit, review, and release conventions.
6. Define issue templates for feature, compatibility, performance, and bug work.
7. Update README with status, principles, and document links.

### Acceptance

- A new contributor can identify product scope, architecture, current milestone, and prohibited shortcuts from repository files alone.
- Every architectural change has a documented decision path.

## Milestone 1 — Monorepo and deterministic tooling

### Objective

Create a minimal buildable extension skeleton without implementing proxy behavior prematurely.

### Steps

1. Initialize pnpm workspace.
2. Configure TypeScript strict mode and shared tsconfig.
3. Initialize WXT extension app.
4. Add Svelte UI integration.
5. Add linting, formatting, unit-test runner, and type checking.
6. Add Firefox and Chromium build targets.
7. Add a minimal popup, options page, and background entrypoint.
8. Add CI for install, typecheck, unit test, and both browser builds.
9. Add deterministic lockfile and supported Node/pnpm versions.
10. Add package boundary rules.

### Acceptance

- Clean checkout builds Firefox and Chromium packages.
- Popup and options page load in both browsers.
- No proxy permission or global request listener is added yet.
- CI passes from a clean environment.

## Milestone 2 — Legacy inventory and fixture corpus

### Objective

Understand the real compatibility surface before designing the new public schema.

### Steps

1. Inventory ZeroOmega `schemaVersion: 2` top-level keys.
2. Inventory every profile type and condition type from source.
3. Inventory settings, sync fields, temporary state, generated fields, and authentication metadata.
4. Separate user intent from cache/runtime fields.
5. Build minimal fixture per profile and condition type.
6. Add sanitized representative exports.
7. Add malformed, missing-reference, circular-reference, Unicode, IDN, IPv6, and large-config fixtures.
8. Record expected legacy behavior for URL vectors.
9. Finalize compatibility matrix statuses.

### Acceptance

- No supported legacy type is undocumented.
- Every inventoried field has `map`, `preserve`, `ignore-generated`, `downgrade`, or `reject` status.
- Fixtures are sufficient to reproduce all known migration decisions.

## Milestone 3 — ProfileSpec v1

### Objective

Define the stable user configuration contract independent from ZeroOmega internals and browser runtime artifacts.

### Steps

1. Define stable IDs and ordered profile collection.
2. Define proxy endpoints and credential references.
3. Define profile variants and rule sources.
4. Define condition and route result types.
5. Define startup, quick-switch, UI, and update preferences.
6. Define namespaced opaque legacy metadata.
7. Create JSON Schema.
8. Implement structural and semantic validation.
9. Define ProfileSpec revision and migration framework.
10. Add round-trip serialization tests.

### Acceptance

- Valid ProfileSpec round-trips without data loss.
- Invalid references, cycles, invalid ports, malformed addresses, and unsupported combinations produce precise errors.
- Runtime caches and secrets cannot appear in normal exports.

## Milestone 4 — ZeroOmega importer

### Objective

Import current user profiles safely and produce a complete migration report.

### Steps

1. Detect supported legacy export encodings.
2. Parse under resource limits.
3. Map profiles to stable IDs while preserving order and display properties.
4. Map settings and profile references.
5. Parse fixed proxy and bypass semantics.
6. Parse SwitchProfile rules in order.
7. Parse rule-list profiles and source metadata.
8. Preserve PAC profiles under explicit security/capability rules.
9. Preserve safe unknown fields as opaque metadata.
10. Generate structured compatibility report.
11. Store import as an inactive candidate revision.
12. Add importer snapshot tests for every fixture.

### Acceptance

- Representative ZeroOmega exports import without manual profile recreation.
- Failed imports leave active configuration untouched.
- Every loss, downgrade, or target-dependent feature is reported.
- Import output validates against ProfileSpec v1.

## Milestone 5 — Reference interpreter

### Objective

Create a correctness-first executable definition of policy semantics.

### Steps

1. Normalize URLs, hosts, schemes, ports, IDN, and IP values.
2. Resolve profile graphs and defaults.
3. Implement exact host and domain suffix rules.
4. Implement fixed proxy and bypass behavior.
5. Implement supported URL, regex, CIDR, and scheme/port conditions.
6. Implement rule-list semantics.
7. Produce a decision trace showing profile path and matched rule.
8. Run all fixture decision vectors.
9. Add property tests and cycle/resource-limit tests.

### Acceptance

- Every supported imported fixture has deterministic decisions.
- Decision traces explain why a route was selected.
- The interpreter is simple enough to audit and is treated as the oracle for optimized backends.

## Milestone 6 — PAC compiler and verifier

### Objective

Compile supported policy into deterministic browser-native PAC and prove parity with the reference interpreter.

### Steps

1. Define PAC capability subset.
2. Partition PAC-compatible and compatibility-only conditions.
3. Generate deterministic PAC with stable output ordering.
4. Add safe string/regex escaping.
5. Add script-size and complexity warnings.
6. Build a PAC execution harness.
7. Run differential tests against reference interpreter.
8. Generate immutable RuntimeSnapshot metadata.
9. Add content hashing and compiler-version tracking.
10. Add incremental compilation cache only after correctness.

### Acceptance

- PAC-compatible vectors match the reference interpreter.
- Generated PAC passes syntax and resource checks.
- Compilation is deterministic for identical input.
- Unsupported conditions cannot silently enter the PAC output.

## Milestone 7 — Browser adapters and atomic activation

### Objective

Install and switch verified snapshots safely on Firefox and Chromium.

### Steps

1. Implement capability discovery per browser.
2. Implement PAC installation and removal.
3. Implement system/direct mode transitions.
4. Detect competing extensions or uncontrollable proxy state.
5. Implement candidate install, confirmation, active snapshot update, and rollback.
6. Restore last known good snapshot on restart.
7. Implement narrow Firefox compatibility listener only for proven cases.
8. Verify listener filters never default to `<all_urls>`.
9. Add browser integration tests.
10. Add failure injection tests for storage/browser API errors.

### Acceptance

- Normal PAC mode uses no extension-side global proxy decision callback.
- Failed activation restores or preserves the previous snapshot.
- Firefox and Chromium capability differences are visible.
- Restart restores confirmed state.

## Milestone 8 — Familiar UI and profile workflow

### Objective

Deliver a recognizable ZeroOmega-like workflow backed by the new model.

### Steps

1. Recreate left profile navigation and color identity.
2. Implement fixed proxy editor.
3. Implement automatic switch/rule editor with ordering.
4. Implement rule-list and PAC profile editors.
5. Implement startup and quick-switch settings.
6. Implement popup profile switching.
7. Implement Apply, Revert, compile status, and active state.
8. Implement import wizard and migration report.
9. Implement snapshot history and rollback UI.
10. Add keyboard navigation, accessibility, responsive sizing, and UI performance tests.

### Acceptance

- Existing users can find familiar operations without relearning the whole product.
- UI never directly manipulates browser proxy APIs.
- Unsaved, compiled, installed, and active states are distinguishable.
- Imported warnings remain reviewable after import.

## Milestone 9 — Rule-source updates and bounded diagnostics

### Objective

Add production-grade update behavior without permanent request monitoring.

### Steps

1. Implement conditional fetch, caching, timeout, size, and content-type limits.
2. Preserve previous verified rule source on update failure.
3. Compile updates as candidates before activation.
4. Add explicit manual and scheduled update controls.
5. Implement opt-in timed diagnostics with bounded ring buffer.
6. Add redaction and privacy defaults.
7. Add decision-test tool for a user-entered URL.
8. Add exportable diagnostic bundle without secrets.

### Acceptance

- Update failures do not break active browsing.
- Diagnostics disabled produces no persistent all-request collection.
- Diagnostic sessions stop automatically at configured limits.

## Milestone 10 — Packaging, migration hardening, and beta

### Objective

Produce installable beta packages and validate real-world migration/performance.

### Steps

1. Package signed-ready Firefox and Chromium artifacts.
2. Add extension upgrade and storage migration tests.
3. Test fresh install, legacy import, browser restart, downgrade, and rollback.
4. Build performance baselines with extension disabled, Nex enabled, and legacy ZeroOmega enabled.
5. Test representative small, medium, and large configurations.
6. Add privacy policy, permission rationale, and release notes.
7. Establish issue triage and compatibility-report template.
8. Run limited beta with sanitized user profiles.

### Acceptance

- Beta packages install and operate on supported browser versions.
- Representative configuration shows no Firefox-wide extension stall caused by global request matching.
- No known data-loss migration bug remains.
- Release blockers and non-blockers are explicitly classified.

## Milestone 11 — Rust/WASM policy core

### Entry gate

Do not start merely because Rust was planned. Start only after profiling identifies compiler/importer cost worth replacing and behavioral parity is protected.

### Steps

1. Freeze language-neutral policy-core interfaces.
2. Create Rust parser/normalizer/compiler crate.
3. Compile to WASM for browser-side candidate compilation.
4. Keep TypeScript reference interpreter as oracle.
5. Run identical fixtures and differential vectors.
6. Measure WASM startup, transfer, memory, and compile performance.
7. Replace modules only where total system performance improves.

### Acceptance

- Zero behavioral regression across fixture corpus.
- Measured total improvement justifies additional complexity.
- TypeScript fallback or previous stable implementation remains available during transition.

## Milestone 12 — Optional native engine

### Objective

Add advanced capabilities impossible or inefficient in browser-only PAC mode.

### Steps

1. Define versioned Native Messaging control protocol.
2. Implement local Rust proxy endpoint and policy loading.
3. Restrict control to approved extension IDs and pairing credentials.
4. Add operating-system credential storage.
5. Add health checks, priority failover, DNS policy, and metrics as separate features.
6. Ensure browser traffic does not traverse Native Messaging.
7. Add service lifecycle, update, uninstall, and recovery design.

### Acceptance

- Browser-only product remains fully usable.
- Native engine failure can fall back safely.
- Security review and platform installation tests pass.

## Release gates applied to every milestone

- Correctness: tests and specified behavior.
- Compatibility: importer/exporter and legacy decision impact.
- Performance: no uncontrolled request-time overhead.
- Reliability: failure and rollback behavior.
- Security: permissions, untrusted input, secrets, and remote data.
- Documentation: current milestone and decisions updated.

## Immediate next action after this planning PR

Start Milestone 1 only. Do not implement importer, PAC logic, or Rust in the same PR. The first implementation PR should establish deterministic tooling and empty application boundaries that later milestones can safely fill.
