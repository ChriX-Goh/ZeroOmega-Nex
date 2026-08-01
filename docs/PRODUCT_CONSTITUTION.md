# ZeroOmega Nex Product Constitution

This document is the highest-authority product contract for ZeroOmega Nex. When another repository document conflicts with it, this document wins until the conflict is corrected.

## 1. Product identity

ZeroOmega Nex is a clean-room, bottom-layer rewrite of ZeroOmega v3.5.0. It is not a modernization redesign inspired by ZeroOmega.

The implementation may replace the data model, compiler, storage, browser adapters, state machines, test infrastructure, security boundaries, and internal architecture. The user-facing product contract remains inherited from ZeroOmega v3.5.0 by default.

## 2. Observable-equivalence rule

Unless a current browser imposes a proven, irreducible limitation, Nex must preserve the original observable contract, including:

- configuration semantics and reference resolution;
- profile names, colors, ordering, startup state, and Quick Switch state;
- Fixed, Switch, PAC, Virtual, Rule List, bypass, temporary-rule, and authentication behavior;
- Toolbar icon, title, Badge, per-tab state, and result details;
- Popup, Options, dialogs, terminology, hierarchy, defaults, validation timing, and state transitions;
- action order, Apply/Discard behavior, restart behavior, rollback behavior, and control-ownership behavior.

Existing users should not need to relearn normal operation. Internal architecture must not be exposed through invented visible pages, status taxonomies, explanatory workflow, or mandatory migration rituals.

## 3. Direct migration contract

Supported ZeroOmega `schemaVersion: 2` exports must import directly and become immediately usable without manual profile reconstruction or reinterpretation.

Import may use an internal candidate revision, validation, compilation, and atomic activation transaction. Those internal safety stages must not force a new user workflow. On any failure, the previous active state remains intact and the failure is reported precisely.

The importer must preserve representable configuration and safe opaque legacy metadata. It must never silently reinterpret unsupported data. A field is mapped, preserved, explicitly downgraded, or rejected with a precise reason.

## 4. Permitted differences

A user-visible difference is permitted only when all of the following exist:

1. exact original source, package, or runtime evidence;
2. official browser documentation and a real reproduction proving the limitation;
3. the smallest practical difference design;
4. compatibility and migration impact analysis;
5. Chromium and Firefox verification where applicable;
6. a recorded repository-owner decision.

Each permitted difference must have a `DR-xxxx` record. Without sufficient evidence, the state is `UNKNOWN`; design inference must not be used to invent behavior.

Browser-controlled chrome, DPI, theme, and platform pixels may have bounded visual tolerance. User-controlled hierarchy, wording, state meaning, colors, Badge semantics, and interaction behavior do not receive a general tolerance exemption.

## 5. Internal architecture constraints

- Ordinary navigation must not depend on an extension-side global `<all_urls>` proxy decision listener.
- Browser-native PAC execution is the default data plane.
- Configuration activation is atomic, confirmed, and rollback-safe.
- User configuration is the stable public contract; PAC, indexes, caches, and runtime snapshots are derived artifacts.
- Firefox and Chromium are verified separately.
- Request-level compatibility hooks are narrowly scoped, evidence-backed, and optional.
- Rust/WASM is introduced only after measured need and protected differential parity.

## 6. Evidence chain

A parity row closes only when its evidence chain is complete:

`Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

Synthetic fixtures are necessary but cannot replace representative real original exports or real browser journeys.

Unknown or target-dependent shapes fail closed. A green unit test, a green CI run, a screenshot of Nex alone, or a high test count is not proof of product parity.

## 7. Completion levels

### Engineering Done

The behavior is specified, implemented, tested, documented, and the exact Head passes required engineering checks.

### Parity Verified

Original-derived evidence, mapping, real browser evidence, and compatibility impact are complete.

### Journey Accepted

A consolidated exact build completes the full user journey and receives explicit repository-owner `PASS`.

Only Journey Accepted work can close the corresponding product journey. The project reaches 100% only when all required journeys are accepted, real original exports work directly, unjustified visible workflow is removed, and one exact final candidate receives repository-owner `PASS`.

## 8. Governance

- Dynamic Head, CI run, test count, candidate state, progress, and blocker data must have one authoritative generated source.
- Stable product rules belong here; knowledge graphs contain mappings and evidence IDs, not competing product contracts.
- Permanent CI is read-only. Do not create one-time workflows that commit or push implementation and documentation changes.
- Evidence collection is parameterized and batched. Temporary evidence is stored as artifacts; permanent evidence is committed deliberately.
- Progress is based on closed user journeys, not commit count, changed lines, test count, or green automation alone.

## 9. Current execution order

1. Freeze this constitution and remove conflicting repository wording.
2. Complete installation, startup, Toolbar, per-tab state, Popup smoke, Inspect, and recovery as one Order 1 journey.
3. Prove original export -> direct import -> immediate equivalent use with real sanitized exports.
4. Correct Popup and temporary/site-rule journeys.
5. Correct Options, dialogs, and Apply/Discard journeys.
6. Close Fixed, Switch, PAC, Virtual, Rule List, lifecycle, export, restart, rollback, ownership, and authentication journeys.
7. Complete localization, information density, and visual alignment.
8. Produce one exact final candidate for repository-owner acceptance.

No merge, release, or new release-candidate claim is permitted before the applicable gates pass.
