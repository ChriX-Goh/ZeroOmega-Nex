# ZeroOmega Compatibility Contract

`docs/PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This document defines how migration, semantic compatibility, user-task compatibility, modernization, and intentional defect rejection are measured.

## 1. Compatibility model

Every required item is classified before implementation:

- `CONTRACT-EXACT` — data, meaning, route decisions, persistence, restart, failure recovery, rollback, export, and security boundaries.
- `UX-COMPATIBLE` — ordinary user tasks, mental model, terminology, entry points, defaults, information hierarchy, and resulting state.
- `MODERNIZED` — internal architecture and bounded user-facing improvements that preserve the contract.
- `LEGACY-DEFECT-REJECTED` — confirmed defects and obsolete implementation accidents that must not be inherited by default.

Compatibility is not satisfied by successful parsing, similar screenshots, Nex-only fixtures, or equal happy-path output alone.

## 2. Direct migration

The primary migration target is ZeroOmega v3.5.0 `schemaVersion: 2` export data.

Supported exports must complete:

`real original export -> direct import -> validation -> atomic activation -> real route decisions -> browser restart -> semantic re-export`

Ordinary successful import must not require manual profile reconstruction, reinterpretation, or a mandatory migration wizard.

When present and valid, Nex preserves:

- profile display names, colors, user-visible order, type, and identity;
- references, rule order, notes, defaults, matches, attached Rule Lists, and nested graphs;
- Fixed proxy protocol, host, port, per-scheme mapping, bypass, and authentication boundaries;
- PAC URL/body, last valid executable content, update and cache meaning where representable;
- Rule List source, format, target profiles, update and cache meaning where representable;
- startup profile, Quick Switch order, refresh-on-switch, and related settings;
- temporary/site-rule meaning and lifecycle where supported;
- safe unknown fields as namespaced opaque legacy metadata where needed for preservation.

Every field is mapped, preserved, explicitly target-limited, explicitly downgraded, or rejected with a precise reason. Silent loss and silent reinterpretation are prohibited.

## 3. Profile and condition semantics

The TypeScript reference interpreter remains the semantic oracle until a replacement is proven through differential tests.

Required profile families include Direct, System, Fixed, Switch, Virtual, Rule List, Switchy Rule List, AutoProxy Rule List, PAC, and AutoDetect where current browser capability permits.

Required condition families include exact host, domain/wildcard, URL wildcard, host/URL regex, bypass/local host, IPv4/IPv6/CIDR, scheme/port, Rule List formats, PAC results, nested references, defaults, and target-specific conditions proven in scope.

Each semantic item has one status:

- `exact`;
- `target-dependent`;
- `downgraded`;
- `unsupported`;
- `unknown`.

Unknown and unsupported items fail closed and cannot silently replace a working active state.

## 4. User-task compatibility

Toolbar, Popup, Options, dialogs, Apply/Discard, profile CRUD, site rules, and temporary rules are evaluated as complete tasks rather than collections of incidental DOM facts.

A `UX-COMPATIBLE` task passes when:

- an experienced original user can complete it without instructions or material relearning;
- core terminology, entry point, default meaning, necessary action order, destructive consequences, and result remain familiar;
- ordinary UI does not expose internal Draft, compiler, snapshot, graph, capability, migration-transaction, or delivery concepts;
- Toolbar, Popup, Options, and persisted state do not contradict one another;
- errors and blocked states are truthful and recoverable.

The following are not default compatibility requirements:

- identical DOM hierarchy;
- every CSS value or pixel;
- identical animation or focus timing;
- identical click-versus-blur implementation;
- reproduction of inaccessible or framework-accidental behavior.

Geometry and visual evidence remain required where they affect information hierarchy, recognition, overflow, hit targets, accessibility, or task completion.

## 5. Modernization and defect rejection

A `MODERNIZED` change is accepted when it preserves all affected `CONTRACT-EXACT` and `UX-COMPATIBLE` requirements and has evidence proportionate to risk.

Examples include:

- compile-time rather than request-time policy work;
- browser-native PAC execution;
- atomic activation and rollback;
- strict TypeScript boundaries;
- responsive layout;
- keyboard and focus improvements;
- accessibility corrections;
- clearer errors and loading feedback;
- bounded diagnostics and privacy improvements.

A `LEGACY-DEFECT-REJECTED` decision records:

- original behavior;
- evidence that it is defective, unsafe, obsolete, or accidental;
- corrected behavior;
- affected real data or user automation;
- any narrow compatibility adapter retained.

The existence of an original behavior is not sufficient proof that it belongs in the product contract.

## 6. Difference decisions

A `DR-xxxx` record is required when:

- a `CONTRACT-EXACT` result changes;
- a material `UX-COMPATIBLE` task changes;
- a browser or platform limit forces a visible or semantic difference;
- real user data cannot be represented or activated exactly.

The record includes original evidence, target evidence, practical impact, minimum-difference design, migration effect, browser verification, and owner decision where material.

Low-risk modernization and confirmed defect correction use proportionate ADR or audit evidence; they do not require proving an irreducible browser limitation.

## 7. Import and activation transaction

1. Read source as untrusted data.
2. Enforce size, nesting, graph-depth, and resource limits.
3. Parse supported JSON/base64 legacy representations.
4. Validate schema shape and enumerate profiles and settings.
5. Assign stable internal IDs while preserving user-visible identity and order.
6. Resolve references and detect missing references, cycles, unsupported graphs, and target limits.
7. Convert supported fields, isolate secrets, and preserve safe opaque fields.
8. Produce deterministic semantic and compatibility reports.
9. Build an inactive candidate revision.
10. Compile and run required differential and safety checks.
11. Atomically activate according to the original startup/current-state contract.
12. Confirm browser installation and observable state.
13. On any failure, leave or restore the previous confirmed state and report the exact reason.

Internal candidate and snapshot stages are safety mechanisms, not mandatory ordinary-user workflow.

## 8. Evidence strategy

### Real corpus

Maintain sanitized, provenance-bound evidence for:

- official/default ZeroOmega v3.5.0 exports;
- an owner representative daily-use export;
- nested Switch/Virtual/Rule List configurations;
- PAC URL/body, cache/update, bypass, and authentication metadata;
- duplicate names, Unicode, IDN, IPv4/IPv6, large configurations, and safe unknown fields;
- malformed, cyclic, missing-reference, oversized, unsupported, and hostile cases.

Synthetic fixtures supplement this corpus but cannot replace it for migration claims.

### Semantic vectors

Each vector records input configuration and browser state, input URL or user action, expected profile path/result, expected effective route, expected persisted state, and expected warning or failure behavior.

Run applicable vectors against the original evidence, reference interpreter, generated PAC, Chromium adapter, Firefox adapter, and real extension package.

### UX task vectors

Each task vector records start state, user goal, essential actions, expected visible state, persisted effect, failure behavior, and any permitted modernization.

Micro-states remain regression tests inside the parent task unless they carry independent data, security, or recovery risk.

## 9. Completion gate

A compatibility item closes only with evidence appropriate to its class.

`CONTRACT-EXACT` closure requires explicit mapping, deterministic tests, applicable real data/browsers, and precise failure behavior.

`UX-COMPATIBLE` closure requires original task anchors, successful representative journeys, consistent state, and bounded visual evidence where material.

`MODERNIZED` closure requires proof of the claimed improvement and regression protection for affected contracts.

`LEGACY-DEFECT-REJECTED` closure requires defect evidence, corrected behavior, and compatibility-impact analysis.

Representative real original exports must import directly and become immediately usable before migration compatibility can be claimed. Complete Chromium and Firefox journeys must pass on one exact final candidate before release.
