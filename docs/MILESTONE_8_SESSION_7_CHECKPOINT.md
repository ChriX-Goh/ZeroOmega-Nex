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
- Provisional total progress: 46% with a 42%–50% confidence band under `PROJECT_PROGRESS_MODEL.md`.
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
2. `docs/PROJECT_PROGRESS_MODEL.md`
3. `docs/ACTIVE_PARITY_AUDIT_INDEX.md`
4. `docs/MILESTONE_8_STATUS.md`
5. `docs/MILESTONE_8_RELEASE_CANDIDATE.md`
6. `docs/MILESTONE_8_VERIFICATION_HEAD.md`

The first document is the product contract, detailed knowledge graph, defect register, work order and owner-facing delivery order. The moving audit index records the current real position.

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

## Active Order 1

- `docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md`
- `docs/AUDIT_EVIDENCE_01_ORIGINAL_TOOLBAR.md`

The original toolbar core source, exact Ω geometry, static assets, main locale strings and 18-row Original ↔ Nex mapping are now captured. Current Nex lacks the corresponding complete subsystem. Original Chromium/Firefox runtime screenshots remain open.

## Historical Session 7 record — retained but invalidated

The following anchors are preserved because they are real historical audit facts and are required by the permanent documentation guard. They must not be interpreted as current completion evidence.

- Initial audited Head: `ffa5a25d8679706bd0b77b3d729a2d0ca5bb93bb`.
- Initial real proxy challenge integration run: `30410949018`.
- The failed initial route showed `directTargetCount: 1`, proving the acceptance route could reach the origin directly rather than proving proxy authentication.
- Session 7 initially estimated replacement-release progress at `94%`.
- Session 7 contained a section named `Governance drift found and corrected`.
- Later historical estimates rose to 97%/98%, and the old matrix reached `DONE=124 / PARTIAL=2`.
- Historical candidate `M8-OWNER-QC-1` was frozen after those checks.

These historical figures measured a self-referential automated contract. Repository-owner trial on 2026-07-30 demonstrated that the contract omitted substantial original UI, migration, toolbar and interaction requirements. The estimates and matrix closure are therefore invalid as product-completeness claims, while the underlying run and commit records remain immutable history.

## Next execution phase

Continue complete Order 1 capture and implementation only where the original contract is source-certain:

1. reproduce original toolbar states in Chromium and Firefox;
2. preserve unknown runtime differences explicitly;
3. implement the exact renderer and pure toolbar state model;
4. integrate per-tab behavior only after source/runtime mapping;
5. proceed to real original-export migration as Order 2.

Current product changes must be tied to an active delivery row. No candidate may be generated.
