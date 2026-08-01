# Milestone 8 Status — Original-Compatible Rewrite

## Authority

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This file is the single hand-maintained status summary for Milestone 8 product progress, blockers, and next work. Exact moving Head and CI conclusions are read from Draft PR #11 and GitHub Checks, not copied here.

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft  
**Active candidate:** none  
**Last candidate:** `M8-OWNER-QC-1` — `FAILED` on 2026-07-30  
**Provisional total progress:** 47% (unrounded 46.7%; confidence band 42%–50%)  
**Active journey:** Order 1 — installation/startup/Toolbar, 35%

## Product interpretation

ZeroOmega Nex is a bottom-layer rewrite of ZeroOmega v3.5.0, not a new product inspired by it. Internal implementation may change completely; supported configuration semantics and observable user behavior remain original-equivalent by default.

Supported original exports must import directly and become immediately usable. Experienced users must not be forced to rebuild profiles, reinterpret settings, or learn a replacement workflow. Any necessary visible difference follows the `DR-xxxx` evidence and owner-acceptance process.

## Status correction

Milestone 8 is not complete and is not release-ready. The previous `98%` and broad `DONE` counts measured an incomplete automated contract and were invalidated by repository-owner trial.

Existing code is treated as an implementation inventory until its user journey is revalidated against:

- exact original source/package/runtime evidence;
- real original exports where applicable;
- explicit Original -> Nex mapping;
- deterministic tests;
- real Chromium and Firefox extension behavior;
- repository-owner acceptance of one exact build.

## Retained engineering assets

The branch contains substantial reusable foundations, including typed configuration, import mapping, reference interpretation, PAC compilation, Chromium/Firefox adapters, atomic activation and rollback, profile editors, Popup, temporary rules, localization, authentication handling, browser automation, and visual-evidence tooling.

These assets are not presumed product-complete. User-visible pages, descriptions, terminology, state taxonomies, defaults, and workflows remain open until original provenance or an accepted difference exists.

## Verified Order 1 engineering slice

The current retained Toolbar architecture includes:

- one background owner for all real Action writes;
- a browser-global Action baseline followed by per-tab overrides;
- serialized startup and profile-workflow transitions;
- clean-install initialization to the original System route;
- one browser-independent Original-observable result projection between internal graph decisions and Action rendering;
- Direct, System, Fixed proxy/bypass, exact Switch -> Direct/Fixed, and immediate Virtual -> Direct/Fixed proxy/bypass result handling through that projection;
- original-derived title, multiline detail, Badge truncation, color inputs, and Virtual target suffix behavior for represented shapes;
- preservation of the original Switch -> Direct two-color icon rule, where the result and Badge are Direct while the inner ring remains the current Switch color;
- Chromium and Firefox Action acceptance for the represented states;
- internal-page/default fallback, two-tab isolation, and Chromium Inspect overlay set/clear/isolation;
- fail-closed behavior for result shapes not yet represented.

The trace projection is `IMPLEMENTED` and `VERIFIED_AUTOMATION` for the represented shapes. It does not yet cover nested Switch/Virtual, attached Rule List, PAC, temporary-rule, or external-control result families.

This is slice-level engineering evidence only. It does not close Order 1 or `KG-ICON-001`. Total progress remains 47% and Order 1 remains 35%.

## Order 0 governance correction

Order 0 is engineering-complete at the current checkpoint:

- `PRODUCT_CONSTITUTION.md` is authoritative;
- `AGENTS.md`, `PROJECT_CHARTER.md`, `COMPATIBILITY.md`, and `DELIVERY_PLAN.md` are bound to it;
- the knowledge graph is separated into product, architecture, and acceptance layers;
- stable milestone history is separated from current product status;
- moving Head and CI values are no longer copied across competing documents;
- failed write-enabled/per-trace attached-Rule-List workflows and scripts were removed;
- permanent CI remains read-only.

Future original evidence collection must be parameterized and batched rather than implemented as a new workflow and applicator for every trace.

## Attached Rule List checkpoint

Exact original attached Rule List evidence is retained in `AUDIT_EVIDENCE_01H_ORIGINAL_ATTACHED_RULE_LIST_RESULTS.md`.

The attempted one-time implementation applicator did not land product code: its verification stopped at formatting before commit/push. The write-enabled applicator, per-trace audit workflow, and temporary scripts were removed.

The unified Original-observable trace layer now exists, so attached Rule List implementation no longer requires a separate result engine. The remaining work is to map only the evidence-backed attached Rule List trace shapes into that layer. No attached Rule List result is claimed implemented yet.

## Open Order 1 blockers

- one parameterized original evidence harness for the remaining result families;
- nested Switch/profile chains;
- nested Virtual and Virtual -> Switch/Rule List/PAC targets;
- attached Rule List result prefixes, matched lines, defaults, and details;
- PAC result traces and actual route/result projection;
- temporary-rule transitions through the single Action writer;
- external-control transitions and recovery;
- forced dynamic-render failure and static fallback evidence where feasible;
- headed Toolbar pixels only where browser-readable Action state is insufficient;
- one consolidated repository-owner `PASS` for the corrected Order 1 journey.

Switch -> System is not an open parity feature because the original runtime rejects it.

## Project-wide release blockers

- `KG-ICON-001` — Toolbar icon, title, Badge, result detail, and per-tab state.
- `KG-IMPORT-001` — real original export direct import and immediate equivalent use.
- `KG-UI-001` — layout, density, dialogs, controls, and action hierarchy.
- `KG-EXTRA-001` — unnecessary descriptions and extra workflow.
- `KG-INVENTION-001` — visible behavior without original evidence or accepted difference.
- `KG-FLOW-001` — complete feature and interaction parity.
- `KG-GOV-001` — completion, evidence, and acceptance governance.

All remain release-blocking.

## Immediate execution order

1. Build one parameterized original evidence harness for the remaining Toolbar/Popup result families.
2. Extend the unified Original-observable trace model only with evidence-backed attached Rule List, nested Switch/Virtual, PAC, temporary-rule, and external-control states.
3. Run one complete Chromium/Firefox Order 1 matrix and produce one exact installable owner-QC build.
4. Record repository-owner `PASS` or concrete defects.
5. Only after Order 1 acceptance, begin the real original-export migration corpus.

## Candidate prohibition

No new candidate, merge, or release may be declared from green automation alone. A candidate requires a complete exact-build evidence package and explicit repository-owner acceptance under the product constitution.
