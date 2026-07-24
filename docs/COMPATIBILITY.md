# ZeroOmega Compatibility Contract

## 1. Scope

The first migration target is ZeroOmega export data using `schemaVersion: 2`. Compatibility is evaluated at three levels:

1. **Structural:** the file can be parsed and represented.
2. **Semantic:** profile references and rule meanings are preserved.
3. **Behavioral:** representative URLs resolve to the same effective route.

Successful parsing alone is not sufficient.

## 2. Preservation requirements

When present and valid, the importer preserves:

- Profile display name.
- Profile color.
- User-visible profile order.
- Profile type.
- Rule order and notes.
- Default and matched profile references.
- Fixed proxy protocol, host, port, and per-scheme mapping.
- Bypass list and local-host intent.
- PAC URL and PAC body where supported.
- Rule-list URL, format, update metadata, and profile targets.
- Startup profile.
- Quick-switch profile order.
- Refresh-on-switch and related representable preferences.
- Unknown safe fields as namespaced opaque import metadata when needed for lossless export or diagnostics.

References in the new model use stable IDs, but display names remain unchanged.

## 3. Initial profile matrix

| Legacy profile | Import target | Initial release expectation |
|---|---|---|
| `DirectProfile` | Built-in direct route | Full |
| `SystemProfile` | Browser/system control mode | Full, platform-specific behavior reported |
| `FixedProfile` | Fixed proxy policy | Full for supported HTTP/HTTPS/SOCKS mappings and bypass rules |
| `SwitchProfile` | Ordered decision profile | Full for supported conditions and references |
| `VirtualProfile` | Ordered decision profile | Import and normalize; verify actual legacy use through fixtures |
| `RuleListProfile` | Rule source plus decision profile | Full for recognized formats and supported rule semantics |
| `SwitchyRuleListProfile` | Rule source plus decision profile | Supported through format adapter |
| `AutoProxyRuleListProfile` | Rule source plus decision profile | Supported through format adapter with explicit unsupported-rule report |
| `PacProfile` | PAC source/profile | Preserve and execute subject to browser capability and security checks |
| `AutoDetectProfile` | Auto-detect/PAC source | Capability-dependent and explicitly reported |

## 4. Condition matrix

Each legacy condition receives one of four statuses:

- `exact`: equivalent semantics on all targeted browsers.
- `target-dependent`: exact only on specified browsers/backends.
- `downgraded`: safely transformed with a visible semantic change.
- `unsupported`: preserved in import report but cannot be activated.

Initial candidates:

| Condition family | Expected handling |
|---|---|
| Exact host | Exact through indexed model/PAC |
| Host wildcard/suffix | Exact after normalization and differential tests |
| URL wildcard | Target-dependent where HTTPS path visibility differs |
| Host regex | Exact if accepted by safe regular-expression policy and backend |
| URL regex | Target-dependent; never force global listener |
| Bypass/local host | Exact where browser semantics permit; normalized explicitly |
| IPv4/IPv6/CIDR | Backend capability-tested |
| Scheme/port | Exact when representable in PAC/backend |
| Time/day conditions | Deferred until legacy semantics and browser execution are proven |

The final matrix must be generated from actual ZeroOmega condition definitions and fixture tests, not assumptions.

## 5. Import transaction

1. Read source as untrusted data.
2. Enforce size and nesting limits.
3. Parse JSON/base64 legacy representation.
4. Validate schema shape.
5. Enumerate profiles and assign stable IDs.
6. Resolve name-based references.
7. Detect missing references and cycles.
8. Convert supported fields.
9. Preserve safe unknown fields.
10. Generate migration report.
11. Build candidate ProfileSpec revision.
12. Compile and run differential vectors.
13. Require explicit activation; never overwrite active state during import.

## 6. Migration report

Every import produces machine-readable and user-readable results:

```text
Imported profiles: N
Exact profiles: N
Target-dependent profiles: N
Downgraded rules: N
Unsupported rules: N
Missing references: N
Warnings: N
```

Each item includes:

- Legacy profile and rule identity.
- Original value.
- New representation.
- Compatibility status.
- Affected browser/backend.
- Recommended user action.

## 7. Differential compatibility testing

### Fixture corpus

Maintain sanitized fixtures for:

- Minimal profile of every type.
- Nested SwitchProfiles.
- Multiple rule-list formats.
- Duplicate names and unusual Unicode names.
- Missing references.
- Circular references.
- IPv4/IPv6 and bypass edge cases.
- SOCKS and authentication metadata.
- PAC URL and embedded PAC.
- Large real-world configurations.

### Decision vectors

Each fixture includes URL inputs and expected effective result:

```text
input URL
expected profile path
expected final route
expected warnings
```

Run vectors against:

1. Legacy/reference evaluator.
2. New reference interpreter.
3. Generated PAC in a PAC test harness.
4. Firefox adapter integration.
5. Chromium adapter integration.
6. Future native backend.

## 8. Export policy

ZeroOmega Nex exports its own versioned ProfileSpec by default.

A legacy-export feature may be added only when:

- Mapping is lossless for the selected configuration.
- Unsupported Nex-only features are identified before export.
- The export does not claim compatibility it cannot guarantee.

## 9. UI compatibility

The goal is workflow familiarity, not copied implementation:

- Familiar profile list and colors.
- Familiar profile editor categories.
- Similar popup profile switching.
- Clear Apply/Revert workflow.
- Rule ordering remains visible and controllable.
- New migration, compile, capability, and rollback information is integrated without burying the familiar controls.

## 10. Compatibility completion gate

Compatibility milestone is not complete until:

- The profile/condition inventory is derived from source and fixtures.
- Every item has an explicit status.
- Supported items pass behavioral vectors.
- Unsupported items are visible before activation.
- Import never modifies active configuration on failure.
- A representative user export can be imported and activated without manually rebuilding profiles.
