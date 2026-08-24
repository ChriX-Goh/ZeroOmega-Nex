# ZeroOmega Nex Delivery Plan

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This plan translates that contract into delivery orders and acceptance gates.

## 1. Execution rules

1. Product progress is measured by complete user journeys, not by module count, commit count, changed lines, test count, or green CI alone.
2. Historical engineering milestones remain valid architectural assets but do not close observable product parity.
3. Every user-visible implementation starts from original source/package/runtime evidence or an accepted `DR-xxxx` record.
4. Unknown behavior remains `UNKNOWN` and fails closed.
5. Permanent CI is read-only. Do not create one-time workflows that commit or push implementation or documentation changes.
6. Evidence collection is parameterized and batched. Temporary evidence is uploaded as artifacts; stable reviewed evidence is committed deliberately.
7. Chromium and Firefox are tested separately.
8. Internal candidate, compile, snapshot, install, confirmation, and rollback stages may differ from the original internally, but must not create mandatory new ordinary-user workflow.
9. A delivery row closes only through the complete evidence chain:

   `Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

10. A later product order may be researched in parallel, but its product-completion score does not close before its dependencies and acceptance gates pass.

## 2. Completion levels

### Engineering Done

- Behavior and failure behavior are specified.
- Source, tests, and documentation are committed deliberately.
- The exact Head passes required engineering checks.
- Cross-browser and migration impact are assessed.

### Parity Verified

- Original-derived evidence and explicit mapping exist.
- Real browser evidence passes on applicable targets.
- Representative real data is used where synthetic fixtures are insufficient.
- Necessary differences have accepted `DR-xxxx` records.

### Journey Accepted

- The complete user journey passes on one exact installable build.
- The repository owner records explicit `PASS`.

Only Journey Accepted closes product progress.

## 3. Historical engineering milestones

Milestones 0–7 are retained as engineering foundations integrated on `main`:

- Milestone 0 — initial governance, architecture, compatibility, and agent rules.
- Milestone 1 — pnpm/TypeScript/WXT/Svelte shell, deterministic builds, and dual-browser CI.
- Milestone 2 — initial ZeroOmega schema-v2 inventory and fixture corpus.
- Milestone 3 — versioned ProfileSpec, schema, validation, serialization, and migrations.
- Milestone 4 — bounded ZeroOmega importer, mapping, secret isolation, and compatibility reports.
- Milestone 5 — auditable reference interpreter and deterministic route traces.
- Milestone 6 — deterministic PAC compiler, capability analysis, differential verification, budgets, and snapshots.
- Milestone 7 — Chromium/Firefox adapters, atomic activation, confirmation, rollback, restart recovery, ownership checks, and optional proxy authentication.

These assets are preserved unless evidence shows a contract defect. They do not by themselves prove direct migration, original-equivalent UI/workflow, complete browser journeys, or owner acceptance.

## 4. Product delivery orders

## Order 0 — Constitution and governance convergence

### Objective

Eliminate contradictory product contracts, stale dynamic state, and self-writing micro-workflows before further parity implementation.

### Work packages

- Establish `PRODUCT_CONSTITUTION.md` as the highest-authority contract.
- Bind `AGENTS.md`, Project Charter, Compatibility Contract, Delivery Plan, progress model, knowledge graph, and PR description to that contract.
- Remove or neutralize wording such as “approximately familiar”, “similar popup”, or “workflow familiarity, not copied implementation”.
- Separate stable historical milestone records from current product status.
- Stop copying moving SHA, CI run, test count, candidate state, and blocker state into multiple documents.
- Remove write-enabled one-time applicator/knowledge-sync workflows.
- Define one hand-maintained product-status summary and use PR metadata/GitHub Checks for exact moving Head and CI.

### Acceptance

- No core document weakens observable-equivalence, direct migration, no-relearning, dual-browser, rollback, or owner-acceptance requirements.
- Permanent workflows are read-only.
- Exact Head and CI are not copied into competing status documents.
- Previous `98%`, broad `DONE` counts, and failed-candidate claims cannot be interpreted as current completion.
- Exact Head passes all permanent gates.

## Order 1 — Installation, startup, Toolbar, per-tab state, and recovery

### Objective

Deliver one complete original-equivalent browser Action journey rather than isolated result-string slices.

### Required original evidence families

- Clean install and initial System state.
- Direct, System, and Fixed proxy/bypass.
- Switch matched/default, nested Switch, and original-invalid targets.
- Immediate and nested Virtual results.
- Attached Rule List prefixes, matched lines, defaults, and target details.
- PAC direct/proxy/default/matched result traces.
- Temporary/site-rule state.
- External-control state and recovery.
- Inspect overlay behavior.
- Dynamic renderer failure and static fallback where feasible.

### Implementation work packages

- Build one parameterized original evidence harness producing a unified evidence bundle.
- Define one Original-observable result trace model independent from the internal graph trace.
- Project represented trace shapes into title, multiline detail, Badge, colors, icon inputs, Popup state, and per-tab overrides.
- Route all Toolbar mutations through one background writer.
- Keep unknown shapes fail-closed.
- Verify startup serialization, last-confirmed-state recovery, internal-page fallback, two-tab isolation, navigation updates, and Inspect overlay restoration.

### Acceptance

On one exact Chromium and Firefox build:

- Clean installation initializes to original-equivalent System state without opening Popup or Options.
- Direct, System, Fixed, Switch, Virtual, Rule List, PAC, temporary-rule, external-control, Inspect, fallback, and recovery rows pass the active matrix.
- Action title, Badge, icon/color semantics, Popup binding, and per-tab behavior match original evidence.
- Browser-controlled pixel differences are bounded and recorded; user-controlled hierarchy and state meaning match.
- No second Action writer or global request-time decision listener exists.
- Repository owner records `PASS` for the consolidated Order 1 build.

## Order 2 — Real original export to direct immediate use

### Objective

Prove the central migration contract with representative real ZeroOmega v3.5.0 exports.

### Corpus

- Official/default export.
- Sanitized owner daily-use export.
- Nested Switch/Virtual/Rule List export.
- PAC, update/cache, bypass, and authentication-metadata export.
- Malformed, missing-reference, cyclic, oversized, and unsupported-field negative cases.

### Work packages

- Create provenance manifests and local sanitization/secret-scanning rules.
- Validate field, order, color, reference, startup, Quick Switch, PAC, Rule List, bypass, temporary-rule, and safe opaque metadata preservation.
- Execute `import -> atomic activation -> browse -> restart -> export` on Chromium and Firefox.
- Compare semantic manifests and route/result vectors.
- Ensure successful imports do not force manual reconstruction or a mandatory new migration ritual.
- Ensure all failures preserve the previous active state.

### Acceptance

- Supported real exports import directly and become immediately usable.
- No required profile, rule, ordering, color, startup, or reference reconstruction remains.
- Browsing, restart recovery, and re-export pass on both browsers.
- Every loss, downgrade, unsupported field, or target difference is precise and reviewable.
- Repository owner records `PASS` for the real migration journey.

## Order 3 — Popup and temporary/site-rule journey

### Objective

Restore original-equivalent Popup hierarchy, switching, current/result state, and site-rule workflow.

### Work packages

- Match Popup dimensions, hierarchy, ordering, colors, selected/current/result semantics, and close behavior.
- Restore original site-rule and temporary-rule entry points, scope, priority, and lifecycle.
- Bind Popup display to the same Original-observable trace model as Toolbar.
- Remove internal architecture explanations and unsupported status taxonomy.
- Verify multiple tabs, internal pages, reload, navigation, and browser-session cleanup.

### Acceptance

- Existing users can switch profiles and manage site/temporary rules without relearning.
- Toolbar and Popup never disagree about current/result state.
- Chromium and Firefox journeys pass with paired original evidence.
- Repository owner records `PASS`.

## Order 4 — Options, dialogs, and Apply/Discard journey

### Objective

Restore original page hierarchy, density, controls, validation timing, dialogs, and unsaved-state behavior.

### Work packages

- Inventory every visible page, section, dialog, button, label, help element, default, and transition.
- Remove or hide Nex-only Draft/Compile/Snapshot/Capability/Migration workflow unless original-backed or covered by an accepted difference.
- Restore original navigation, profile list, action hierarchy, Apply/Discard behavior, deletion protection, reference replacement, and validation timing.
- Preserve modern internal atomic compilation and rollback behind the original workflow.

### Acceptance

- Every visible node has an original anchor or accepted `DR-xxxx` record.
- Fixed paired-state screenshots and interaction recordings pass for supported locales and both browsers.
- Apply/Discard, reload restoration, validation, dialogs, and destructive operations match original behavior.
- Repository owner records `PASS`.

## Order 5 — Complete profile and lifecycle journeys

### Objective

Close create, edit, reference, duplicate, rename, delete, update, cache, and activation behavior for all required profile families.

### Required families

- Direct and System built-ins.
- Fixed and bypass.
- Switch and nested Switch.
- Virtual and nested Virtual.
- Attached and standalone Rule Lists.
- PAC URL, raw PAC, update/cache, and failure retention.
- AutoDetect where current browser capability permits.

### Acceptance

- Original configuration semantics and lifecycle behavior pass deterministic, Chromium, Firefox, and owner gates.
- Unknown or unsupported graphs fail precisely without corrupting active state.
- Rule ordering, references, colors, names, and defaults remain stable through edits and round trips.

## Order 6 — Export, restart, rollback, ownership, and authentication

### Objective

Prove reliability and security without adding user-visible workflow that the original does not require.

### Work packages

- Export and re-import round trips.
- Normal restart, forced shutdown, interrupted activation, storage failure, PAC installation failure, confirmation mismatch, and browser crash recovery.
- Competing extension/policy control and control restoration.
- HTTP/HTTPS proxy 407 handling, incorrect credentials, permission changes, and separation from ordinary website 401 authentication.
- Secret scanning across exports, PAC, logs, artifacts, diagnostics, and UI.

### Acceptance

- The last confirmed working state survives or is restored after every injected failure.
- External control is not overwritten when the extension lacks control.
- Proxy credentials are used only for matching proxy challenges and never leak.
- Chromium and Firefox reliability matrices pass.
- Repository owner records `PASS`.

## Order 7 — Localization, information density, and visual alignment

### Objective

Complete original-equivalent presentation after hierarchy and behavior are correct.

### Work packages

- Source-backed English, Simplified Chinese, and Traditional Chinese terminology.
- Original-equivalent density, spacing, grouping, colors, icons, focus, keyboard behavior, and responsive boundaries.
- Paired Original ↔ Nex screenshots under fixed locale, viewport, theme, browser, and DPI conditions.
- Accessibility fixes that do not redesign hierarchy or workflow.

### Acceptance

- No untranslated or invented user-visible terminology remains.
- Paired evidence shows acceptable hierarchy, density, color, icon, and interaction alignment.
- Any browser-controlled pixel tolerance is documented.
- Repository owner records `PASS`.

## Order 8 — Consolidated candidate and release hardening

### Objective

Produce one exact installable candidate after all required journeys are accepted.

### Work packages

- Clean Chromium and Firefox packages.
- Fresh install, upgrade, downgrade, migration, restart, rollback, and performance baselines.
- Permission rationale, privacy policy, release notes, known accepted differences, and blocker classification.
- Exact artifact digests and reproducible build evidence.

### Acceptance

- All required journey rows are `OWNER_ACCEPTED`.
- No unresolved release blocker remains.
- Representative real original exports work directly.
- Complete Chromium and Firefox matrices pass on the exact candidate.
- Repository owner records final `PASS`.

## 5. Deferred and optional work

### Rule-source updates and bounded diagnostics

Production hardening for scheduled updates, retained verified cache, bounded diagnostics, user-entered URL decision tests, and secret-free diagnostic bundles follows the same original-equivalence and evidence rules. Existing pulled-forward infrastructure is not considered complete until its user journey closes.

### Rust/WASM policy core

Rust/WASM starts only after profiling identifies a meaningful total-system improvement and differential parity is protected by the TypeScript oracle.

### Native engine

A native engine remains optional. The browser-only product must remain fully usable, migratable, and safely recoverable without it.

## 6. Current authorization

The authorized sequence is:

1. Complete Order 0.
2. Complete and owner-accept Order 1.
3. Complete and owner-accept Order 2.
4. Continue Orders 3–8 in dependency order.

No unrelated redesign, Rust/WASM expansion, native-engine work, merge, release, or candidate claim is authorized before the applicable gates pass.
