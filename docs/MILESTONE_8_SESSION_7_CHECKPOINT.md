# Milestone 8 Session 7 Checkpoint — Parity Reset

## Project definition

ZeroOmega Nex is a complete bottom-layer rewrite whose user-facing contract must remain as close to ZeroOmega v3.5.0 as modern browser APIs permit.

The required migration experience is:

- an original user exports the original configuration;
- installs Nex;
- imports the file directly;
- immediately uses the equivalent configuration;
- does not materially relearn toolbar, Popup, Options, dialogs, profiles or normal workflows.

The project is not authorized to redesign the user experience merely because the underlying architecture has changed.

## Current reality

- PR #11 remains Draft.
- Active candidate: none.
- `M8-OWNER-QC-1`: failed owner trial on 2026-07-30.
- Completion percentage: unknown pending full Original ↔ Nex audit.
- Previous `98%` and `DONE=124 / PARTIAL=2`: invalid product-completeness measures.
- Merge, release and new candidate generation: prohibited.

## Why the reset occurred

Owner trial found:

- missing toolbar icon/runtime-state parity;
- real original export not directly usable after import;
- broad UI and interaction divergence;
- excessive and unnecessary explanatory UI;
- visible behavior inferred or invented without strict original evidence;
- further project-wide mismatches beyond a focused defect pass.

## Canonical authority

Read in this order before further work:

1. `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`
2. `docs/MILESTONE_8_STATUS.md`
3. `docs/MILESTONE_8_RELEASE_CANDIDATE.md`
4. `docs/MILESTONE_8_VERIFICATION_HEAD.md`

The first document is the product contract, detailed knowledge graph, defect register, work order and owner-facing delivery order.

## Hard rules

- Original source and runtime behavior are the default authority.
- Unknown behavior stays `UNKNOWN`; it is never filled by design assumptions.
- Every Nex-only visible element needs original provenance or owner-approved necessary-divergence evidence.
- Internal architecture improvements should remain hidden behind the original-facing interaction model.
- Synthetic fixtures and green tests do not prove real original-export compatibility.
- No old broad `DONE` row is trusted without revalidation.
- Only owner `PASS` on an exact final candidate counts as delivery completion.

## Reopened blockers

- `KG-ICON-001`
- `KG-IMPORT-001`
- `KG-UI-001`
- `KG-EXTRA-001`
- `KG-INVENTION-001`
- `KG-FLOW-001`
- `KG-GOV-001`

## Next execution phase

Do not start by patching isolated owner observations.

Start with complete Order 1 capture:

1. installation/startup and toolbar;
2. Popup;
3. Options and dialogs;
4. profile types and lifecycle;
5. rules, conditions and Rule Lists;
6. original import/export and runtime state;
7. visual density and localization.

Then capture current Nex independently and construct the owner-readable Original ↔ Nex mapping before accepting product changes.
