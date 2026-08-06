# Project Charter

`docs/PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This charter defines mission, scope, non-goals, and success metrics without weakening that contract.

## Mission

ZeroOmega Nex is a clean-room, bottom-layer rewrite and modern compatible successor to ZeroOmega v3.5.0 for Firefox and Chromium.

The project preserves the original user's configuration, effective behavior, mental model, familiar high-frequency tasks, and migration value while replacing request-time rule evaluation with a compiled, browser-native execution model.

It is neither an unrelated modernization redesign nor an implementation-level clone.

## Problem statement

The original product's practical value comes from accumulated user configuration, profile semantics, fast switching, and familiar operation. Its aging request-time architecture, browser assumptions, framework, storage coupling, reliability boundaries, and maintenance burden should not be inherited.

Nex therefore separates two boundaries:

- outside the boundary: user data, meaning, effective results, familiar tasks, and recovery expectations;
- inside the boundary: a new model, compiler, storage system, browser adapters, state machines, security design, tests, and optional future execution backends.

## Primary users

1. Existing ZeroOmega/SwitchyOmega users with established exports, PAC files, Rule Lists, startup state, and Quick Switch habits.
2. Users who need fast switching among Direct, System, Fixed, PAC, Switch, Virtual, and Rule List behavior.
3. Advanced users with large or nested configurations who require deterministic behavior, reliable recovery, bounded diagnostics, and low normal-browsing overhead.

## Required product outcomes

- Import supported ZeroOmega `schemaVersion: 2` exports directly.
- Preserve representable names, colors, ordering, references, startup and Quick Switch state, endpoints, bypass, PAC, Rule Lists, temporary rules, and supported authentication boundaries.
- Make imported configurations immediately usable without manual reconstruction or mandatory new workflow.
- Preserve effective route decisions, state meaning, persistence, semantic export, restart behavior, failure recovery, and rollback.
- Preserve familiar Toolbar, Popup, Options, dialogs, terminology, defaults, information hierarchy, and high-frequency task flow without material relearning.
- Keep internal Draft, compiler, snapshot, graph, capability, migration-transaction, and delivery concepts out of ordinary UI.
- Compile profile graphs into immutable runtime snapshots and execute ordinary decisions through browser-native PAC.
- Verify Firefox and Chromium separately.
- Detect unsupported or ambiguous behavior before it replaces a working state.
- Keep diagnostics bounded, explicit, and privacy-preserving.

## Compatibility boundary

The four binding classes are:

- `CONTRACT-EXACT` — data, semantics, route results, persistence, restart, export, rollback, failure recovery, and security.
- `UX-COMPATIBLE` — familiar ordinary tasks and mental model without requiring incidental pixel, DOM, or event-timing identity.
- `MODERNIZED` — architecture, performance, reliability, accessibility, responsive behavior, and bounded clarity improvements that preserve the contract.
- `LEGACY-DEFECT-REJECTED` — confirmed defects, races, corruption, unsafe behavior, obsolete browser limits, and framework accidents.

A visible difference is not automatically a defect. A visual modernization is not automatically an improvement. The decision is based on user-task impact, data and semantic impact, accessibility, reliability, and evidence.

## Non-goals for the first stable release

- Operating-system-wide VPN or transparent proxying.
- TLS interception or HTTPS content inspection.
- Remote execution of downloaded scripts.
- New Profile families not required by the original replacement contract.
- Million-rule native-engine optimization before behavioral correctness and measured need.
- Pixel-perfect, DOM-perfect, animation-perfect, or event-timing cloning.
- Reproducing confirmed historical bugs, data corruption, security weaknesses, or obsolete browser constraints.
- Exposing internal Draft, Compile, Snapshot, Capability, graph, or migration taxonomy as ordinary-user workflow.
- Continuous Gist/WebDAV/remote synchronization in the first browser-only release.
- Expanding scheduling, diagnostics, backup, or history merely because partial infrastructure exists.

## Product principles

### User contract outside, new implementation inside

User configuration and effective behavior are stable. Internal models and artifacts are replaceable.

### Near-zero migration and relearning cost

Existing users should not rebuild profiles or learn a different product mental model. This requirement is evaluated by complete tasks, not by every incidental pixel.

### Compile, then execute

Parsing, validation, normalization, conflict detection, graph resolution, and optimization happen when configuration changes. Page loads consume an already validated snapshot.

### Failure leaves the previous state intact

No partially imported, compiled, installed, or confirmed configuration becomes active.

### Modernization must earn its place

A modernization must improve a required quality without adding mandatory steps, changing meaning, renaming core concepts, or exposing internal architecture.

### Original defects are evidence, not commands

An original behavior is not inherited merely because it existed. Confirmed defects are corrected with compatibility-impact analysis.

### Compatibility is measurable

Compatibility includes data, semantics, effective routes, persistence, task completion, state transitions, restart, failure recovery, and bounded presentation evidence.

## Success metrics

### Migration and semantics

- Representable required data preservation: 100%.
- Silent loss or silent downgrade: zero.
- Supported semantic vector match: 100%.
- Representative real exports complete import, activation, browsing, restart, and semantic re-export on both browsers.

### User tasks

- Existing users complete ordinary high-frequency tasks without instructions or material relearning.
- Core terminology, entry points, defaults, information hierarchy, action meaning, and resulting state remain familiar.
- Ordinary UI exposes zero internal engineering workflow concepts.

### Performance and reliability

- Zero extension-side global proxy decision callbacks during normal PAC-mode navigation.
- Diagnostics-disabled request collection: zero.
- Atomic activation and one-step recovery to the last confirmed state.
- Failure-injection recovery rate for required cases: 100%.

### Security

- No silent credential export.
- No credentials in PAC, ordinary logs, artifacts, diagnostics, or rendered UI.
- Proxy authentication remains separate from website authentication.

### Maintainability

- Strict TypeScript, documented boundaries, deterministic builds, reusable read-only CI, and separate browser adapters.
- Product WIP=1 and every task has a parent batch and journey.
- Dynamic status is not hand-copied across documents.

## Release definition

The first stable release is complete only when an existing user can install Nex, directly import representative original exports, immediately use the preserved configuration, operate through familiar Toolbar/Popup/Options tasks, browse without global extension-side request matching, restart and recover safely, export without required data loss, and pass the consolidated Chromium and Firefox matrices on one exact candidate.

The repository owner must record final `PASS` before release.
