# Architecture

## 1. Architectural objective

Move proxy-policy cost from request time to configuration-change time. Normal browsing must use an immutable, previously compiled runtime snapshot and must not depend on the extension background process evaluating every request.

## 2. System boundaries

```text
User Interface
    ↓ typed commands
Application Control Plane
    ↓ versioned ProfileSpec
Policy Pipeline
    ↓ immutable RuntimeSnapshot
Browser Adapter
    ↓ native PAC/proxy APIs
Browser Data Plane
```

A future optional native engine is a second data-plane backend, not a prerequisite for the browser extension.

## 3. Repository target layout

```text
apps/
  extension/                 WXT browser extension
packages/
  profile-spec/              public schema, validation, migrations
  legacy-zeroomega/          schemaVersion 2 importer and fixtures
  policy-model/              normalized model and compiler IR
  reference-interpreter/     simple correctness-first evaluator
  pac-compiler/              deterministic PAC backend
  browser-adapters/          Firefox and Chromium implementations
  ui/                        shared Svelte components and layout
  test-vectors/              URLs, expected decisions, legacy fixtures
crates/
  policy-core/               later Rust core
  native-engine/             later optional local data plane
docs/
```

The exact folders may evolve through an architecture decision, but package boundaries must remain explicit.

## 4. Public configuration model

### User ProfileSpec

The public format contains only user intent:

- Profiles and stable IDs.
- Display names, colors, and ordering.
- Proxy endpoints and credential references.
- Rule sources and local rules.
- Startup and quick-switch settings.
- UI preferences that genuinely belong to the user.
- Imported opaque legacy metadata when safe preservation is needed.

It does not contain generated PAC, indexes, caches, diagnostics, active network state, or secrets.

### Versioning

- Semantic schema version independent from application version.
- JSON Schema validates structure.
- Ordered, explicit migrations transform old ProfileSpec versions.
- Importers for external formats are separate from internal migrations.

## 5. Policy pipeline

```text
External or User ProfileSpec
  → Structural validation
  → Legacy import mapping
  → Semantic validation
  → Normalization
  → Reference resolution
  → Cycle detection
  → Capability analysis
  → Rule partitioning
  → Optimization
  → Backend compilation
  → Differential verification
  → RuntimeSnapshot
```

Every stage returns structured errors and warnings. No stage mutates the active configuration.

## 6. Internal policy model

The normalized model uses stable IDs rather than display names for references. Suggested structures:

- Exact host map.
- Reversed domain suffix trie.
- Scheme/port decision table.
- IPv4 and IPv6 CIDR radix structures.
- Ordered residual matcher for URL patterns that cannot be indexed safely.
- Profile decision DAG with explicit defaults.

The reference interpreter remains deliberately simple and ordered. Optimized implementations must match it through differential tests.

## 7. Runtime snapshots

A RuntimeSnapshot is immutable and contains:

- Snapshot ID.
- Source configuration hash.
- Compiler version.
- Browser target and capability set.
- Compiled PAC or native-engine policy.
- Structured compatibility warnings.
- Verification result.
- Creation timestamp.

Activation sequence:

1. Compile candidate snapshot.
2. Validate generated output.
3. Run deterministic decision vectors.
4. Install candidate through browser adapter.
5. Confirm browser acceptance.
6. Atomically update `activeSnapshotId`.
7. Retain the previous confirmed snapshot for rollback.

Failure at any step leaves the previous snapshot active.

## 8. Browser execution backends

### PAC backend — default

Used for fixed proxies, direct/system behavior, host/domain rules, scheme/port rules, supported IP logic, and compatible rule-list semantics.

Normal request path:

```text
Browser request → Browser PAC engine → DIRECT/PROXY/SOCKS
```

The extension background process is not in this path.

### Narrow Firefox compatibility backend

Only used when a supported legacy rule truly requires request details unavailable to the PAC target. Requirements:

- Capability must be detected during compilation.
- User must see the compatibility mode and performance implication.
- URL filters must be narrowed to affected origins/patterns.
- Never register `<all_urls>` merely for convenience.
- Compatible PAC rules remain in PAC rather than being rerouted through the listener.

### Future native backend

A local Rust process may support very large policies, health checks, advanced failover, DNS policy, connection metrics, and multiple browsers. Native Messaging is control-plane only; request traffic uses a local proxy endpoint.

## 9. Browser adapters

Expose a small common contract but preserve platform-specific implementation:

```ts
interface ProxyPlatform {
  getCapabilities(): Promise<Capabilities>;
  installSnapshot(snapshot: RuntimeSnapshot): Promise<InstallResult>;
  activateSnapshot(snapshotId: string): Promise<void>;
  restoreSnapshot(snapshotId: string): Promise<void>;
  clearControl(): Promise<void>;
}
```

Firefox and Chromium adapters separately handle permissions, private browsing, proxy ownership conflicts, PAC installation, authentication, lifecycle, and error reporting.

## 10. Storage

### IndexedDB

- ProfileSpec revisions.
- Imported source files and reports.
- Rule-source cache.
- Runtime snapshots.
- Test vectors and compatibility evidence.
- Bounded diagnostic sessions.

### Browser storage

- Active snapshot ID.
- Current profile ID.
- Last known good snapshot ID.
- Small UI settings.
- Temporary session overrides.

Secrets are not exported in normal ProfileSpec. Future native mode uses operating-system credential storage and opaque credential references.

## 11. UI architecture

- Svelte components with a layout deliberately familiar to ZeroOmega.
- Left profile navigation, central editor, top-level apply/revert state, familiar popup switching.
- UI sends typed commands; it never calls browser proxy APIs or mutates storage tables directly.
- Migration report is shown before an imported configuration can replace active state.
- Applying changes always displays compile state, warnings, and rollback status.

## 12. Diagnostics

Diagnostics are session-based and opt-in:

- Explicit start and stop.
- Time and entry limits.
- Ring-buffer storage.
- Host/rule decision data only as needed.
- No permanent all-request monitoring.
- No full URL query logging by default.

## 13. Reliability rules

- Background lifecycle can end at any time; memory is never the source of truth.
- Event handlers are idempotent and restartable.
- Import, compile, install, and activation are distinct transactions.
- A browser API error is surfaced with the last confirmed state preserved.
- Rule-source download failure keeps the previous verified content unless the user explicitly removes it.

## 14. Security rules

- Remote rule lists are data, never executable remote code.
- Minimum required host permissions.
- Narrow optional permissions for URL compatibility features.
- Strict content security policy.
- Sanitized imports and bounded parser resources.
- No silent credential export.

## 15. Performance budgets

Budgets will be converted into CI gates during implementation. Initial architectural requirements:

- Normal PAC-mode request callback count in extension: zero.
- Diagnostics-off request collection: zero.
- No O(requests × all rules) extension-side navigation path.
- Import and compilation may be expensive but must be interruptible and must not freeze UI.
- Large operations run outside the UI thread where supported.

## 16. Rust/WASM introduction gate

Rust/WASM starts only when all conditions hold:

1. Public ProfileSpec and normalized model are stable enough.
2. Reference interpreter has a representative fixture corpus.
3. PAC backend has differential parity tests.
4. A measured TypeScript bottleneck justifies replacement.
5. The Rust implementation can be tested against the same vectors.

This prevents a high-performance implementation of incorrect semantics.
