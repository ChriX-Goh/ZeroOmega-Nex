# Project Charter

## Mission

ZeroOmega Nex is a clean-room, next-generation proxy profile manager for Firefox and Chromium browsers. It preserves the proven user-facing concepts of SwitchyOmega/ZeroOmega while replacing the request-time architecture with a compiled, browser-native execution model.

## Problem statement

Existing proxy-manager extensions can place JavaScript rule evaluation and request monitoring on every browser request. In Firefox, this can delay navigation, block extension UI work, and affect unrelated extensions. The product must move expensive work from request time to configuration-change time.

## Primary users

1. Existing ZeroOmega/SwitchyOmega users with established profiles and rule lists.
2. Users who need fast switching between direct, system, fixed proxy, PAC, and automatic rules.
3. Advanced users with large rule sets who require diagnostics and future native-engine capabilities.

## Required product outcomes

- Import existing ZeroOmega `schemaVersion: 2` exports.
- Preserve familiar profile concepts and an approximately familiar layout.
- Provide Firefox and Chromium packages from one repository.
- Compile profile graphs into immutable runtime snapshots.
- Execute ordinary decisions through browser-native PAC without an extension-side global request callback.
- Detect unsupported or ambiguous legacy behavior before activation.
- Roll back safely when compilation or installation fails.
- Offer diagnostics only when explicitly enabled.

## Non-goals for the first stable release

- Operating-system-wide VPN or transparent proxying.
- TLS interception or HTTPS content inspection.
- Remote execution of downloaded scripts.
- Million-rule native-engine optimization before behavioral parity is established.
- Exact visual pixel cloning where it conflicts with accessibility or maintainability.
- Supporting every historical undocumented SwitchyOmega bug as intentional behavior.

## Product principles

### Compile, then execute

Parsing, validation, normalization, conflict detection, graph resolution, and optimization happen when configuration changes. Page loads consume only an already-validated snapshot.

### Compatibility is measurable

Compatibility means identical route decisions for representative inputs, not merely successful JSON import.

### Stable public model, replaceable internals

User ProfileSpec remains versioned and migratable. PAC, indexes, caches, and browser-specific representations may change freely.

### Explicit platform capability

A rule or feature unsupported on one browser is shown as such before activation. Silent degradation is forbidden.

### Failure leaves the previous state intact

No partially compiled or partially installed configuration can become active.

## Success metrics

### Compatibility

- 100% parse coverage for supported ZeroOmega profile types in the fixture corpus.
- 100% preservation of representable profile references and ordering.
- Differential route parity for all supported legacy fixtures.
- Every downgrade or unsupported field produces a structured report.

### Performance

- Zero extension-side global proxy decision callbacks during normal PAC-mode navigation.
- Diagnostics disabled overhead is negligible and contains no all-request state collection.
- Profile switching uses a precompiled snapshot where possible.
- No UI task exceeding the agreed performance budget during common profile operations.

### Reliability

- Atomic snapshot activation and one-step rollback.
- Corrupt imports cannot overwrite the active configuration.
- Browser restart restores the last confirmed active snapshot.

### Maintainability

- Strict TypeScript, documented boundaries, deterministic build, automated Firefox/Chromium tests.
- Architecture decisions recorded in-repository.
- Test fixtures protect migration behavior.

## Release definition

The first stable release is complete when an existing ZeroOmega user can install ZeroOmega Nex, import a representative configuration, review a migration report, activate supported profiles, switch profiles through a familiar UI, browse without global extension-side request matching, export the new format, and roll back safely after a failed change.
