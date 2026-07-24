# Architecture Decision Log

This file records decisions that materially affect product behavior, compatibility, architecture, security, or delivery order. New decisions append entries; do not rewrite history without noting supersession.

## ADR-001 — Clean rewrite rather than continued ZeroOmega patching

**Status:** Accepted

**Decision:** Build ZeroOmega Nex as a new implementation with an explicit legacy importer. Do not fork the old CoffeeScript/AngularJS runtime as the primary architecture.

**Reason:** The main performance risk is architectural: request-time extension callbacks and duplicated monitoring. Carrying the old runtime forward would preserve the same coupling and make correctness harder to prove.

**Consequence:** Familiar user workflows and data concepts are retained, but internal code and storage are new.

## ADR-002 — Preserve existing user profiles through import

**Status:** Accepted

**Decision:** ZeroOmega `schemaVersion: 2` compatibility is a first-class requirement. Users must not manually recreate ordinary profiles.

**Reason:** Existing profiles represent substantial user effort and are part of the product's practical value.

**Consequence:** Legacy inventory, fixtures, migration reports, and differential decision tests precede feature expansion.

## ADR-003 — Familiar UI, new internals

**Status:** Accepted

**Decision:** Maintain a layout and interaction model recognizably close to ZeroOmega: profile navigation, profile colors, central editor, popup switching, and explicit apply behavior.

**Reason:** Compatibility includes workflow and muscle memory, not only JSON.

**Consequence:** Visual parity is subordinate to accessibility, correctness, and maintainability; pixel-perfect cloning is not required.

## ADR-004 — PAC-first browser data plane

**Status:** Accepted

**Decision:** Normal routing uses precompiled PAC installed through browser-native proxy APIs.

**Reason:** Ordinary requests should not wait for extension JavaScript to parse URLs and scan rules.

**Consequence:** Compilation occurs when configuration or rule sources change. Browser requests consume compiled output directly.

## ADR-005 — No global Firefox proxy listener

**Status:** Accepted

**Decision:** ZeroOmega Nex must not register an extension-side `<all_urls>` proxy decision listener in normal operation.

**Reason:** This is the principal architecture pattern capable of stalling Firefox navigation and affecting other extensions.

**Consequence:** Features requiring request details unavailable to PAC are capability-gated and use narrowly filtered compatibility handling only when necessary.

## ADR-006 — TypeScript control plane and UI

**Status:** Accepted

**Decision:** Use strict TypeScript for browser APIs, control flow, storage coordination, messages, and Svelte UI.

**Reason:** WebExtension integration is JavaScript-native; TypeScript gives strong boundary contracts without forcing browser APIs through WASM wrappers.

**Consequence:** Strict compiler settings and package boundaries are mandatory.

## ADR-007 — Rust/WASM after semantic parity

**Status:** Accepted

**Decision:** Rust/WASM is a later optimization for pure policy work, introduced only after the public model, reference interpreter, fixtures, and differential tests exist.

**Reason:** A faster implementation of incorrectly understood legacy semantics would increase project risk.

**Consequence:** Initial compiler and interpreter may be TypeScript. Rust adoption requires measured benefit and zero behavioral regression.

## ADR-008 — Stable user format, derived runtime snapshots

**Status:** Accepted

**Decision:** Separate versioned ProfileSpec from compiled PAC, indexes, caches, browser capability data, and diagnostics.

**Reason:** User intent needs long-term compatibility; runtime artifacts need freedom to evolve.

**Consequence:** Generated artifacts are reproducible and never treated as the canonical user configuration.

## ADR-009 — Atomic activation and rollback

**Status:** Accepted

**Decision:** New configurations and rule-source updates compile into inactive candidate snapshots. Activation occurs only after validation, verification, installation, and confirmation.

**Reason:** Partial configuration updates can break all browsing.

**Consequence:** The previous confirmed snapshot remains available and active on failure.

## ADR-010 — Diagnostics are opt-in and bounded

**Status:** Accepted

**Decision:** Do not permanently monitor and retain all browser requests. Diagnostics run only during explicit, bounded sessions.

**Reason:** Permanent monitoring creates performance, privacy, and memory costs.

**Consequence:** Diagnostics use time/entry limits, ring buffers, and privacy-preserving defaults.

## ADR-011 — Browser differences remain explicit

**Status:** Accepted

**Decision:** Firefox and Chromium use separate adapters and capability reporting rather than pretending their proxy APIs and background lifecycles are identical.

**Reason:** False abstraction creates silent compatibility errors.

**Consequence:** Common interfaces stay small; platform behavior and tests remain separate.

## ADR-012 — Milestone gates are mandatory

**Status:** Accepted

**Decision:** Do not combine foundation, importer, compiler, UI, Rust, and native-engine work into one uncontrolled implementation phase.

**Reason:** The project is vulnerable to context loss and architectural drift. Each stage needs permanent acceptance evidence.

**Consequence:** `docs/DELIVERY_PLAN.md` controls order. Architecture-changing shortcuts require a new ADR before code merges.

## ADR template

```markdown
## ADR-NNN — Title

**Status:** Proposed | Accepted | Superseded | Rejected

**Decision:**

**Reason:**

**Alternatives considered:**

**Consequences:**

**Supersedes / superseded by:**
```
