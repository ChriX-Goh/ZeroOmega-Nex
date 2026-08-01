# Milestone 8 Verification Boundary

This branch is in full Original ↔ Nex parity re-audit.

There is no active candidate and no verified release-completeness Head.

The previous candidate `M8-OWNER-QC-1`, Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`, failed repository-owner trial on 2026-07-30. Its green workflows prove only that the incomplete automated contract passed; they do not prove original-compatible delivery.

## Current audit checkpoint

- Provisional total progress: **47%**.
- Unrounded score: **46.7%**.
- Confidence band: **42%–50%**.
- Active journey: Order 1 — installation/startup/toolbar, **35%**.

Clean Head `6747760e01572d47038ec4beba6dba10ef4f1f02` passed all permanent gates after exact original immediate Virtual-to-Direct/Fixed integration and temporary-file cleanup:

- CI `30678329216`;
- Browser E2E `30678329237`;
- Parity Documentation `30678329224`;
- Milestone 8 Visual Evidence `30678329214`.

The permanent Browser E2E run passed Chromium full/toolbar, Firefox full/focused-toolbar and native Chromium Inspect acceptance. Both targets verify System, Direct, Fixed proxy/bypass, exact Switch matched/default results into Direct/Fixed and exact immediate Virtual results into built-in Direct or one Fixed proxy/bypass target. The Virtual display preserves the original target suffix, including `[[Direct]]`, suppresses the Virtual default transition from details, uses the resolved target Badge and applies Direct/Fixed color inputs exactly. Dedicated transaction `30678033747` passed full `pnpm verify`, Chromium Virtual Action acceptance and three consecutive focused Firefox Virtual journeys. Official original-package run `30677618681` and Artifact `8811046002` (`sha256:f4485078f732e9d64294c13d2edd8cb09f26a3f1405dfa427f2d4072292ce2ed`) fix the source/runtime contract.

The runtime now establishes a browser-level Action baseline before per-tab overrides, serializes profile-workflow commands so concurrent startup reads cannot observe half-initialized proxy state, and repairs missing persisted proxy runtime from the saved startup route. Top-level navigation remains an exact-guarded coordinator input rather than a second writer. Permanent acceptance now exercises the coordinator across internal/default fallback, same-tab URL result changes and Inspect overlay set/clear/isolation rather than only static two-tab snapshots.

This is an exact engineering and evidence checkpoint, not a release-completeness Head. It proves the mapped toolbar slice and permanent gates only.

## Confirmed integration boundary

The background now registers one real browser Action writer composed from the repository resolver, global/per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Clean installation initializes to System, profile-workflow commands are serialized through activation and Action follow-up, missing proxy runtime is repaired from the saved startup route, and top-level navigation commits provide final URLs without creating another writer.

Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy/bypass, exact Switch matched/default results into Direct or Fixed and exact immediate Virtual results into Direct or one Fixed proxy/bypass target. `AUDIT_EVIDENCE_01F_ORIGINAL_SWITCH_RESULTS.md` fixes the Switch contract; `AUDIT_EVIDENCE_01G_ORIGINAL_VIRTUAL_RESULTS.md` fixes the Virtual target suffix, `[[Direct]]`, detail suppression, resolved-target Badge and color inputs. Switch → System is rejected by the original PAC runtime. Firefox 152.0.6 additionally verifies the historical original `about:blank` → committed web navigation path. Inspect no longer competes as a second title/Badge writer.

Still outside the verified slice are nested Switch/profile chains, nested Virtual and Virtual-to-inclusive/PAC targets, attached Rule Lists, PAC/temporary-rule/external-control traces, forced renderer fallback, headed toolbar pixels where browser-readable state is insufficient and repository-owner PASS. Switch → System is not an open parity feature because the original runtime rejects it.

## Current boundary

Every future product change must be governed by:

- `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`;
- `docs/PROJECT_PROGRESS_MODEL.md`;
- `docs/ACTIVE_PARITY_AUDIT_INDEX.md`;
- `docs/MILESTONE_8_STATUS.md`;
- `docs/MILESTONE_8_RELEASE_CANDIDATE.md`.

The branch must not claim a verified completion Head until:

- the original product graph is completely captured;
- the current Nex graph is independently captured;
- every required node is explicitly mapped;
- representative original exports import directly and work immediately;
- every visible Nex-only element has original provenance or owner-approved necessary-divergence evidence;
- complete user journeys pass in Chromium and Firefox;
- the repository owner accepts the exact behavior.

## Automation interpretation

CI, Browser E2E, parity documentation and visual workflows remain required engineering gates, but none is sufficient by itself.

A green workflow means only that its stated contract passed. It does not upgrade `IMPLEMENTED` to `OWNER_ACCEPTED`, and it cannot override real original-export failure or repository-owner findings.

## No-invention boundary

No patch may add or preserve user-visible pages, dialogs, descriptions, help boxes, terminology, state taxonomies or workflow steps without:

1. original source/runtime evidence; or
2. minimized necessary-divergence evidence and explicit owner approval.

Unknown original behavior remains `UNKNOWN`.

## Exact-Head rule

When a mapped product slice is integrated, its exact Head and workflow evidence may be recorded in PR #11. That evidence remains slice-level until the complete owner-facing comparison order and final owner acceptance are satisfied.
