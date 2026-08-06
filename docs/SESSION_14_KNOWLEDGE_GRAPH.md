# Session 14 Knowledge Graph - Governance Reset and Migration Lock

This file records the current Session 14 project graph. Stable product rules live in
`PRODUCT_CONSTITUTION.md`. Current authorization lives in `PROJECT_STATE.json`.
GitHub PR metadata and checks remain authoritative for the moving exact Head.

## 1. Product identity

ZeroOmega Nex is a modern successor rewrite of ZeroOmega v3.5.0.

Compatibility classes:

- `CONTRACT-EXACT`: data, semantics, routes, persistence, recovery and security.
- `UX-COMPATIBLE`: familiar tasks, terminology, defaults and resulting state.
- `MODERNIZED`: safer architecture, reliability, accessibility and performance.
- `LEGACY-DEFECT-REJECTED`: confirmed bugs, races, corruption and unsafe behavior.

Execution hierarchy:

```text
Objective
  -> Capability
    -> Journey
      -> Batch
        -> Task
          -> Acceptance
            -> Evidence
```

Binding governance rules:

- Product work in progress is limited to one parent batch.
- Historical UI rows are evidence inventory, not the product contract.
- Permanent gates run on coherent exact Heads, not every micro-state.
- Owner review is reserved for complete journeys or irreducible decisions.

## 2. Audited project state

- Product completion: `45.15%`, reported as `45%`.
- Evidence confidence: `43%-50%`.
- Release state: `NO-GO`.
- PR #11 remains open and Draft.
- Latest owner result: Firefox `FAIL`, dated 2026-08-02.
- Merge, release, candidate claims and owner retest remain prohibited.

The reduction from the historical `47.9%` anchor is methodological, not a regression.
Governance work earned no product-completion points.

## 3. Completed governance batch

`GOV-01` is complete.

It established:

- one product identity and four compatibility classes;
- product WIP of one;
- proportional evidence requirements;
- stop and re-plan rules;
- a machine-readable current state;
- a reconciled progress model;
- a rule that engineering research stays out of ordinary UI.

## 4. Active product batch

The only active product batch is `MIG-01`.

Parent journey:

```text
real original export
  -> direct import
  -> compatibility report
  -> acceptance transaction
  -> Apply and browser confirmation
  -> real route decisions
  -> persistent restart
  -> semantic schema-v2 export
  -> failure-state preservation
  -> Chromium and Firefox
```

Hard acceptance requirements:

- Preserve all representable required data.
- Permit no silent loss, reinterpretation or downgrade.
- Complete the full chain on Chromium and Firefox.
- Preserve or restore the previous confirmed state on every failure.
- Require no mandatory manual reconstruction ritual.
- Leak no secrets or secret references.

## 5. Official original fixture

The authoritative positive fixture is:

`fixtures/zeroomega-v2/original-default-v3.5.0.bak`

It was produced by the pinned original ZeroOmega v3.5.0 runtime and has provenance.

Important facts:

- Fixed profile `proxy`, color `#99ccee`.
- HTTP fallback proxy `proxy.example.com:8080`.
- Bypass entries `127.0.0.1`, `::1` and `localhost`.
- Switch profile `auto switch`, color `#99dd99`.
- `internal.example.com` routes directly.
- `*.example.com` routes through `proxy`.
- The default route is direct.
- Quick Switch is disabled and its route list is empty.
- The startup profile is empty.

The disabled Quick Switch state is contractual. Popup correctly hides `auto switch`.
Tests must not reinterpret that behavior as a product defect.

## 6. Completed backend migration oracle

`apps/extension/src/lib/original-default-migration.test.ts` proves:

- original backup analysis;
- acceptance of Draft and secret material;
- Apply to confirmed runtime state;
- schema-v2 semantic export and re-import;
- preservation of the previous active state after forced activation failure;
- retention of the accepted imported Draft after Apply failure;
- no unexpected secret-store mutation during failed Apply.

The ordinary UI still composes `accept-import` and `apply` as two commands.

## 7. Completed Chromium official-fixture journey

`scripts/e2e-chromium-original-migration.mjs` now runs before the existing Chromium suite.
It reuses the existing Browser E2E Chromium job and adds no permanent workflow.

The packaged Chromium journey proves:

- Options imports the official `.bak` through the ordinary UI.
- Profile names, kinds, colors, order, endpoint and bypass data survive import.
- Original Quick Switch disabled and empty settings survive import.
- Public workflow commands temporarily enable and activate `auto switch` for testing.
- Chromium confirms extension-controlled PAC mode.
- `internal.example.com` reaches the direct local target without the proxy.
- `routed.example.com` reaches the imported HTTP proxy.
- Active Switch, PAC and both route decisions recover after browser restart.
- Temporary route-test settings are replaced with the original imported settings.
- Schema-v2 export preserves required original semantics.
- Export contains no secret references.
- Existing Chromium, Toolbar, restart, Rule List, trace and Popup suites remain green.

The temporary Quick Switch mutation is test scaffolding, not a migration product step.

## 8. Remaining migration debt

The parent `MIG-01` batch remains open because the following are still missing:

- an equivalent official-fixture Firefox packaged journey;
- a sanitized owner daily-use backup;
- broader original-runtime-produced complex positive fixtures;
- complete unsupported, downgraded and opaque-field classification;
- packaged failure injection on both browsers;
- a complete two-browser failure matrix;
- large real-export storage and restart-capacity evidence;
- final wording for import acceptance followed by Apply failure.

These gaps prevent release-state changes and owner retest.

## 9. Exact next implementation target

Next slice: `MIG-01.3B`.

Goal:

> Drive `original-default-v3.5.0.bak` through the equivalent packaged Firefox journey.

Required Firefox evidence:

- import through the supported extension surface;
- profile and settings mapping;
- temporary public-workflow activation of imported `auto switch`;
- confirmed PAC installation;
- real direct and proxied route decisions;
- persistent browser restart recovery;
- restoration of original imported settings;
- semantic schema-v2 export without secret references.

Constraints:

- Reuse the existing Browser E2E Firefox job.
- Do not create a new permanent workflow.
- Do not weaken original Quick Switch settings.
- Keep route-test mutations temporary and explicitly restored.
- Do not add unrelated Popup, Options, diagnostics, history or engine scope.

## 10. Frozen scope

During `MIG-01`, continue to freeze:

- unrelated Popup and Options beautification;
- broad diagnostics expansion;
- scheduling, history, backup and remote sync;
- new Profile families;
- speculative optimization;
- Rust, WASM and native-engine expansion.

## 11. Stop and re-plan rules

Stop and re-plan when:

- work enters a second unrelated parent journey;
- a behavior lacks a compatibility class;
- real data disproves an assumed mapping;
- data would be silently lost or reinterpreted;
- a fix leaks internal architecture into ordinary UI;
- evidence cost exceeds independent migration, recovery or security risk;
- two cycles add no measurable parent-journey progress.

## 12. Progress effect

The Chromium official-fixture slice closes one browser sub-journey and raises evidence.
It does not close the weighted parent migration capability.

Audited state therefore remains:

- product completion: `45.15%`, reported as `45%`;
- evidence confidence: `43%-50%`;
- release state: `NO-GO`;
- PR state: Draft;
- owner retest: prohibited.
