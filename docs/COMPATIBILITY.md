# ZeroOmega Compatibility Contract

`docs/PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This document defines how its migration and parity requirements are measured.

## 1. Scope

The primary migration target is ZeroOmega v3.5.0 export data using `schemaVersion: 2`. Compatibility is evaluated at four levels:

1. **Structural:** the file can be parsed and represented.
2. **Semantic:** profile references, settings, rules, and result meanings are preserved.
3. **Behavioral:** representative URLs resolve to the same effective route and result trace.
4. **Observable:** the user encounters equivalent Toolbar, Popup, Options, dialogs, defaults, terminology, action order, and state transitions.

Successful parsing, a green importer test, or a similar-looking Nex screen alone is not sufficient.

## 2. Preservation requirements

When present and valid, the importer preserves:

- Profile display name, color, user-visible order, and type.
- Rule order, notes, defaults, matches, attached Rule Lists, and profile references.
- Fixed proxy protocol, host, port, per-scheme mapping, bypass list, and local-host intent.
- PAC URL, PAC body, update state, and last valid executable content where representable.
- Rule-list URL, format, update metadata, cached source, and target profiles where representable.
- Startup profile, Quick Switch order, refresh-on-switch, and related settings.
- Temporary/site-rule meaning and lifecycle where supported by current browser capabilities.
- Supported authentication metadata through secret references without leaking secrets into ordinary exports, PAC, logs, or UI.
- Safe unknown fields as namespaced opaque legacy metadata when required for lossless preservation or future interpretation.

References in the new model may use stable IDs internally, but user-visible names, ordering, colors, and behavior remain unchanged.

## 3. Profile matrix

| Legacy profile | Import target | Required expectation |
| --- | --- | --- |
| `DirectProfile` | Built-in direct route | Original-equivalent |
| `SystemProfile` | Browser/system control mode | Original-equivalent subject to recorded platform control limits |
| `FixedProfile` | Fixed proxy policy | Original-equivalent supported mappings, bypass behavior, and authentication boundaries |
| `SwitchProfile` | Ordered decision profile | Original-equivalent supported conditions, attached Rule Lists, defaults, references, and nested results |
| `VirtualProfile` | Referenced/derived profile behavior | Original-equivalent graph semantics and observable result projection |
| `RuleListProfile` | Rule source plus decision behavior | Original-equivalent recognized formats, update/cache behavior, and result details |
| `SwitchyRuleListProfile` | Rule source adapter | Original-equivalent supported semantics |
| `AutoProxyRuleListProfile` | Rule source adapter | Original-equivalent supported semantics; precise report for unsupported syntax |
| `PacProfile` | PAC source/profile | Preserve and execute subject only to proven browser and security limits |
| `AutoDetectProfile` | Browser capability adapter | Original-equivalent where current browser APIs permit; otherwise accepted `DR-xxxx` |

No profile is treated as complete solely because its JSON shape imports.

## 4. Condition and result matrix

Each original condition, profile result, UI state, or browser transition receives one status:

- `exact`: equivalent on all required targets.
- `target-dependent`: equivalent only on identified targets/backends with evidence.
- `downgraded`: minimum accepted semantic difference under a `DR-xxxx` record.
- `unsupported`: preserved and precisely reported but cannot safely activate.
- `unknown`: evidence is insufficient; implementation and visible wording must fail closed.

The final matrix is derived from original source, official packages, runtime probes, real exports, and differential tests rather than design inference.

Required condition families include exact host, domain/wildcard, URL wildcard, host/URL regex, bypass/local host, IPv4/IPv6/CIDR, scheme/port, Rule List formats, PAC results, and any original time/day or target-specific condition proven in scope.

## 5. Import and activation transaction

1. Read source as untrusted data.
2. Enforce size, nesting, graph-depth, and resource limits.
3. Parse supported JSON/base64 legacy representations.
4. Validate schema shape and enumerate all profiles and settings.
5. Assign stable internal IDs while preserving display order and identity.
6. Resolve name-based references and detect missing references, cycles, and unsupported graphs.
7. Convert supported fields and preserve safe opaque fields.
8. Produce deterministic semantic and compatibility reports.
9. Build an internal candidate ProfileSpec revision.
10. Compile and run required differential and safety checks.
11. Atomically activate the imported state according to the original startup/current-state contract.
12. Confirm browser installation and observable state.
13. On any failure, leave or restore the previous active state and report the exact reason.

The internal candidate transaction is a safety mechanism, not a mandatory new user workflow. Supported imports must not require manual profile rebuilding, reinterpretation, or a forced migration wizard before normal use.

## 6. Migration reporting

Reports are machine-readable and reviewable after import. Ordinary successful import must remain direct and familiar.

Each non-exact item includes:

- Original profile, rule, setting, or UI identity.
- Original value and evidence anchor.
- New representation.
- Compatibility status.
- Affected browser/backend.
- Practical effect and recommended action.
- Associated `DR-xxxx` where a necessary difference is accepted.

Internal compile, snapshot, capability, or revision taxonomy is not exposed as ordinary-user workflow unless the original has an equivalent concept or an accepted difference requires it.

## 7. Differential compatibility testing

### Fixture and real-export corpus

Maintain sanitized evidence for:

- Official/default ZeroOmega v3.5.0 exports.
- Minimal profile of every required type.
- Owner representative real-world exports.
- Nested Switch and Virtual graphs.
- Attached and standalone Rule Lists in required formats.
- PAC URL, embedded PAC, cache/update, and failure cases.
- Duplicate names, Unicode, IDN, IPv4/IPv6, bypass, authentication metadata, and large configurations.
- Missing references, circular references, malformed encodings, unsupported fields, and resource-limit failures.
- External-control and restart/recovery states.

Synthetic fixtures are necessary but cannot replace representative real original exports.

### Decision and observable vectors

Each vector records:

```text
input configuration and browser state
input URL or user action
expected original profile path/result trace
expected effective route
expected Toolbar/Popup/Options state
expected warnings or failure behavior
```

Run applicable vectors against:

1. Original source/package/runtime evidence.
2. New reference interpreter.
3. Original-observable trace projector.
4. Generated PAC harness.
5. Chromium adapter and real extension package.
6. Firefox adapter and real extension package.
7. Owner acceptance build.

## 8. Export policy

Nex may use its own versioned internal/public representation, but exports must preserve all required user data and safe legacy metadata needed by the product contract.

A legacy-export feature may claim compatibility only when mapping is lossless for the selected configuration and any Nex-only or target-limited behavior is identified before export.

Secrets, runtime caches that are not part of user intent, and diagnostic data are excluded unless the original contract and security model explicitly require safe representation.

## 9. UI and workflow compatibility

The goal is observable equivalence, not merely familiarity:

- Original-equivalent profile list, colors, ordering, density, and navigation.
- Original-equivalent profile editor categories, controls, validation timing, and dialogs.
- Original-equivalent Popup hierarchy, switching, current/result state, temporary/site-rule entry, and close behavior.
- Original-equivalent Apply/Discard behavior and unsaved-state handling.
- Original-equivalent Toolbar title, Badge, icon semantics, result details, and per-tab state.
- No invented ordinary-user pages, explanations, status taxonomies, or mandatory workflow for internal Draft/Compile/Snapshot/Capability concepts.

A browser-controlled pixel difference is not a general exemption for hierarchy, wording, color meaning, state transitions, or operation order. Any unavoidable visible difference follows the `DR-xxxx` process.

## 10. Completion gate

A compatibility row closes only when the evidence chain is complete:

`Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

Compatibility is not complete until:

- The required original inventory is complete and every item has an explicit status.
- Supported items pass semantic, route, observable, restart, and failure vectors.
- Representative real original exports import directly and become immediately usable without manual reconstruction.
- Failed import or activation preserves the previous active state.
- Unsupported or necessary differences are precise and, where visible, owner-accepted.
- Complete Chromium and Firefox user journeys pass on one exact build.
- Unjustified visible workflow is removed.
- The repository owner records explicit `PASS` for the applicable exact candidate.
