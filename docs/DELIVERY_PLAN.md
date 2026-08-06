# ZeroOmega Nex Delivery Plan

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. `EXECUTION_GOVERNANCE.md` controls batch structure and drift prevention. `PROJECT_STATE.json` records the current authorized batch and release state.

## 1. Delivery rules

1. Product work-in-progress is limited to one implementation batch.
2. Every batch belongs to one complete parent journey and declares compatibility classes, frozen scope, acceptance criteria, evidence plan, debt impact, and stop rules before code changes.
3. Real user outcomes take priority over evidence convenience. A low-value micro-state must not displace a higher-value migration, routing, recovery, or daily-use journey.
4. Development iteration uses targeted tests. One clean exact Head is formed when the batch is coherent; the permanent full gate set runs once on that Head when required.
5. Owner testing is reserved for complete parent journeys, material product decisions, and the final candidate.
6. Original and real-data evidence is required for compatibility claims. Synthetic fixtures supplement but do not replace representative real exports.
7. Internal candidate, compiler, snapshot, install, and rollback stages stay behind the compatible user boundary.
8. No unrelated redesign, Rust/WASM expansion, native-engine expansion, remote-sync work, or feature pull-forward is authorized during the first-release sequence.

## 2. Historical engineering assets

Milestones 0–7 remain useful foundations: the TypeScript/WXT/Svelte shell, ProfileSpec, bounded importer, reference interpreter, PAC compiler, browser adapters, atomic activation, rollback, restart recovery, ownership handling, and authentication boundaries.

These assets are preserved unless real evidence exposes a contract defect. They do not by themselves prove direct migration, complete user journeys, or release readiness.

## 3. Authorized batches

## `GOV-01` — Governance and compatibility-class convergence

### User outcome

Future development follows one unambiguous product boundary and cannot gradually drift into either an unrelated redesign or low-value behavioral cloning.

### Scope

- classify compatibility as `CONTRACT-EXACT`, `UX-COMPATIBLE`, `MODERNIZED`, or `LEGACY-DEFECT-REJECTED`;
- establish `EXECUTION_GOVERNANCE.md`;
- establish machine-readable current authorization in `PROJECT_STATE.json`;
- align Constitution, Compatibility, Delivery, Progress, Agent, Milestone, knowledge-graph, and PR wording;
- preserve the existing 47.9%/48% audit anchor until one explicit tri-track recalculation.

### Acceptance

- core documents contain no conflicting default requirement for pixel/DOM/event-level cloning;
- direct migration, data meaning, route results, failure recovery, rollback, and no-material-relearning remain hard requirements;
- product WIP=1, stop rules, debt budgets, owner boundaries, and evidence proportionality are binding;
- current product progress does not increase;
- product code remains frozen.

## `MIG-01` — Real original-export golden path

### User outcome

A supported original export can be brought into Nex and used immediately without rebuilding profiles or learning a migration ritual.

### Corpus

- official/default v3.5.0 export;
- sanitized owner daily-use export;
- nested Switch/Virtual/Rule List export;
- PAC, update/cache, bypass, and authentication-metadata export;
- malformed, cyclic, missing-reference, oversized, unsupported, and hostile negative cases.

### Acceptance chain

`import -> validate -> atomic activation -> real route decisions -> restart -> semantic re-export`

Acceptance requires:

- representable required fields preserved 100%;
- silent loss or downgrade: zero;
- profile names, colors, order, references, startup, Quick Switch, PAC, Rule List, bypass, and safe opaque metadata preserved;
- Chromium and Firefox route/result vectors pass;
- every injected failure preserves or restores the previous confirmed state;
- no mandatory manual reconstruction or migration wizard.

### Frozen scope

Popup/Options beautification, new diagnostics, scheduling, history, backup, remote sync, native engine, and new Profile types.

## `UX-POPUP-01` — Consolidated Toolbar and Popup daily-use journey

### User outcome

An experienced ZeroOmega user can install, recognize current/result state, switch profiles, use site/temporary rules, and recover from control conflicts without instructions.

### Acceptance

- Direct, System, Fixed, Switch, Virtual, PAC, Rule List, temporary/site-rule, external-control, policy-owned, internal-page, multi-tab, restart, and fallback states form one consistent parent journey;
- Toolbar and Popup never contradict current/result state;
- core terminology, default profiles, order, colors, entry points, and action result are familiar;
- no internal architecture or delivery concepts appear;
- Firefox and Chromium representative journeys pass;
- existing bounded 02Q/02R/02S evidence remains regression coverage rather than separate release gates.

## `UX-OPTIONS-01` — Options, dialogs, CRUD, and Apply/Discard

### User outcome

An experienced user can manage configuration using the familiar information architecture while Nex keeps modern atomic compilation and rollback internal.

### Acceptance

- representative Fixed, Switch, PAC, Rule List, and Virtual editing;
- create, rename, duplicate where supported, delete, reference replacement, validation, Apply, Discard, reload, and destructive dialogs;
- original core terminology, entry points, defaults, necessary action order, and resulting state remain familiar;
- ordinary UI contains no Draft/Compile/Snapshot/Capability taxonomy;
- task steps do not materially exceed the original without an accepted difference;
- three supported locales and both browsers pass representative task vectors.

## `SEM-01` — Profile-family and rule-result semantic closure

### User outcome

Real migrated configurations produce the same supported effective routing behavior across all required Profile and condition families.

### Acceptance

- supported semantic vectors match the TypeScript oracle, PAC output, Chromium, and Firefox;
- nested Switch/Virtual/Rule List behavior and defaults pass;
- supported vector match rate is 100%;
- target-dependent, downgraded, unsupported, and unknown items are precise and fail closed;
- cycles, missing references, malformed rules, and oversized inputs cannot corrupt active state.

### Frozen scope

New Profile families, speculative optimization, Rust/WASM, and native engine.

## `REL-01` — Export, restart, rollback, ownership, authentication, reliability, and security

### User outcome

Nex can safely replace the original for long-term daily use, including failures and browser lifecycle changes.

### Acceptance

- normal restart, forced termination, interrupted Apply, storage failure, PAC installation failure, confirmation mismatch, ownership loss, permission revocation, and credential failure are injected;
- previous confirmed state preservation/recovery rate is 100%;
- semantic export and re-import preserve required user intent;
- proxy credentials never leak through exports, PAC, logs, artifacts, diagnostics, or UI;
- website 401 and proxy 407 remain separated;
- both browsers pass the reliability matrix.

## `FINAL-01` — Localization, accessibility, bounded visual alignment, packaging, and owner candidate

### User outcome

One exact build is ready for ordinary owner use and final release decision.

### Acceptance

- English, Simplified Chinese, and Traditional Chinese have no missing or invented core terminology;
- keyboard and focus main journeys work;
- no severe overflow, unreachable controls, misleading state, or inaccessible critical action remains;
- paired visual evidence confirms recognizable hierarchy, density, colors, hit targets, and task flow without requiring incidental pixel identity;
- every high-weight journey is bound to one exact Head;
- permanent gates pass on that Head;
- one installable owner package is produced;
- owner records `PASS` before release.

## 4. Batch dependencies

`GOV-01 -> MIG-01 -> SEM-01 -> REL-01 -> FINAL-01`

`GOV-01 -> UX-POPUP-01 -> UX-OPTIONS-01 -> REL-01`

Evidence preparation may overlap, but product implementation remains WIP=1. `MIG-01` is the next product batch after governance convergence.

## 5. Release states

- `NO-GO` — current state; no merge, release, or owner retest package.
- `GO-FOR-OWNER` — all required journeys and exact-Head gates complete; one consolidated package may be tested.
- `OWNER-PASS` — repository owner accepted the exact candidate.

Green automation alone cannot advance release state.
