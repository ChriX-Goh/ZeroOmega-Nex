# Project Charter

`docs/PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This charter describes the mission and engineering direction without weakening that contract.

## Mission

ZeroOmega Nex is a clean-room, bottom-layer rewrite of ZeroOmega v3.5.0 for Firefox and Chromium. It preserves the original user-facing product contract while replacing the request-time architecture with a compiled, browser-native execution model.

The project is not a modernization redesign. Internal architecture may change completely; observable user behavior remains original-equivalent by default.

## Problem statement

Existing proxy-manager extensions can place JavaScript rule evaluation and request monitoring on every browser request. In Firefox, this can delay navigation, block extension UI work, and affect unrelated extensions. Nex moves expensive parsing, validation, graph resolution, and compilation from request time to configuration-change time without transferring that complexity to users.

## Primary users

1. Existing ZeroOmega/SwitchyOmega users with established profiles, PAC files, rule lists, startup state, and Quick Switch habits.
2. Users who need fast switching among Direct, System, Fixed, PAC, Switch, Virtual, and Rule List behavior.
3. Advanced users with large or nested configurations who require deterministic behavior, reliable recovery, and bounded diagnostics.

## Required product outcomes

- Import supported ZeroOmega `schemaVersion: 2` exports directly.
- Preserve representable names, colors, ordering, references, startup and Quick Switch state, proxy endpoints, bypass rules, PAC, Rule Lists, temporary rules, and authentication metadata.
- Make imported configurations immediately usable without manual reconstruction or mandatory new workflow.
- Preserve original Toolbar, Popup, Options, dialogs, terminology, action hierarchy, defaults, validation timing, and state transitions unless a recorded browser limitation requires a minimum accepted difference.
- Provide Firefox and Chromium packages from one repository and verify each browser separately.
- Compile profile graphs into immutable runtime snapshots.
- Execute ordinary decisions through browser-native PAC without an extension-side global request callback.
- Detect unsupported or ambiguous behavior before it can replace a working active state.
- Activate atomically and roll back safely after compilation, storage, installation, confirmation, or control-ownership failure.
- Keep diagnostics bounded and explicitly enabled.

## Non-goals for the first stable release

- Operating-system-wide VPN or transparent proxying.
- TLS interception or HTTPS content inspection.
- Remote execution of downloaded scripts.
- Million-rule native-engine optimization before behavioral parity is established.
- Reproducing browser-controlled chrome pixels that extensions cannot control.
- Treating every undocumented historical bug as intentional without original evidence and owner acceptance.
- Exposing internal Draft, Compile, Snapshot, Capability, or migration taxonomy through invented ordinary-user workflow.

Maintainability, accessibility, or performance alone is not permission to redesign observable behavior. A visible difference requires the evidence and `DR-xxxx` process defined by the product constitution.

## Product principles

### Original contract, replaceable internals

ZeroOmega v3.5.0 is the default authority for observable behavior. ProfileSpec, PAC, indexes, caches, snapshots, browser adapters, and storage may change behind that boundary.

### Compile, then execute

Parsing, validation, normalization, conflict detection, graph resolution, and optimization happen when configuration changes. Page loads consume an already-validated snapshot.

### Compatibility is measurable

Compatibility includes structure, semantics, effective route decisions, workflow, state transitions, and visible results. Successful JSON parsing or Nex-only rendering is insufficient.

### Failure leaves the previous state intact

No partially imported, compiled, installed, or confirmed configuration becomes active. Internal candidate processing is permitted; a forced new user workflow is not.

### Explicit platform capability

A browser limitation is recorded with original evidence, official platform evidence, a minimum-difference design, cross-browser verification, and owner acceptance. Silent degradation is forbidden.

## Success metrics

### Compatibility

- 100% inventory coverage for required original profile, condition, setting, UI, and journey nodes.
- 100% preservation of representable references, ordering, colors, startup state, and Quick Switch state.
- Differential route and observable-result parity for supported fixtures and representative real exports.
- Every downgrade, unsupported field, or necessary difference is precisely recorded.
- Existing users can complete normal operation without material relearning.

### Performance

- Zero extension-side global proxy decision callbacks during normal PAC-mode navigation.
- Diagnostics-disabled overhead is negligible and contains no persistent all-request collection.
- Profile switching uses a precompiled snapshot where possible.
- Common operations remain inside the agreed UI and activation budgets.

### Reliability

- Atomic activation and one-step rollback.
- Corrupt imports cannot overwrite the active configuration.
- Browser restart restores the last confirmed active state.
- Competing control, permission loss, storage failure, PAC failure, and authentication failure are handled without silent state corruption.

### Maintainability

- Strict TypeScript, documented boundaries, deterministic builds, and automated Firefox/Chromium tests.
- Architecture decisions are recorded in-repository.
- Permanent CI is read-only and evidence collection is parameterized rather than implemented as one-time push workflows.

## Release definition

The first stable release is complete only when an existing ZeroOmega user can install Nex, directly import representative real original exports, immediately use the preserved configuration, operate through original-equivalent Toolbar/Popup/Options workflows, browse without global extension-side request matching, restart and recover safely, export without required data loss, and complete the full acceptance matrix on Chromium and Firefox. One exact final candidate must receive repository-owner `PASS`.
