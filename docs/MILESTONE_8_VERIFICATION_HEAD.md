# Milestone 8 Verification Boundary

This branch is in full Original ↔ Nex parity re-audit.

There is no active candidate and no verified release-completeness Head.

The previous candidate `M8-OWNER-QC-1`, Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`, failed repository-owner trial on 2026-07-30. Its green workflows prove only that the incomplete automated contract passed; they do not prove original-compatible delivery.

## Current audit checkpoint

- Provisional total progress: **47%**.
- Unrounded score: **46.7%**.
- Confidence band: **42%–50%**.
- Active journey: Order 1 — installation/startup/toolbar, **35%**.

Clean Head `5ce5a21a865a569e327a78062d7d255fe0f76126` passed all permanent gates after the exact Switch-to-Fixed toolbar trace slice and temporary-file cleanup:

- CI `30672861182`;
- Browser E2E `30672861154`;
- Parity Documentation `30672861161`;
- Milestone 8 Visual Evidence `30672861171`.

The permanent Browser E2E run passed the Chromium full journey, Chromium toolbar Action, Firefox full journey, the permanent focused Firefox toolbar Action job and native Chromium Inspect acceptance. Chromium and Firefox now directly verify System, Direct, simultaneous Fixed proxy / Fixed bypass state, browser-internal/default fallback, same-tab proxy ↔ bypass transitions and an exact no-attached-list Switch → Fixed proxy matched/default slice with runtime-localized multiline details, two-color state, result Badge and per-tab Popup. Native Inspect directly captures tab-local set, current-page clear, base-state restoration and cross-tab isolation. Dedicated transaction `30672598304` passed full verification, Chromium Switch Action acceptance and three consecutive focused Firefox Switch Action journeys.

The runtime now establishes a browser-level Action baseline before per-tab overrides, serializes profile-workflow commands so concurrent startup reads cannot observe half-initialized proxy state, and repairs missing persisted proxy runtime from the saved startup route. Top-level navigation remains an exact-guarded coordinator input rather than a second writer. Permanent acceptance now exercises the coordinator across internal/default fallback, same-tab URL result changes and Inspect overlay set/clear/isolation rather than only static two-tab snapshots.

This is an exact engineering and evidence checkpoint, not a release-completeness Head. It proves the mapped toolbar slice and permanent gates only.

## Confirmed integration boundary

The background now registers one real browser Action writer composed from the repository resolver, global/per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Clean installation initializes to System, profile-workflow commands are serialized through activation and Action follow-up, missing proxy runtime is repaired from the saved startup route, and top-level navigation commits provide final URLs without creating another writer.

Permanent Chromium and Firefox acceptance verifies System, Direct, Fixed proxy, Fixed bypass and the exact Switch → Fixed matched/default per-tab title/Badge/Popup state on real tabs. The Switch slice preserves the original condition/default transition line followed by the final Fixed PAC-result line and uses a two-color icon contract. Firefox 152.0.6 additionally verifies the historical original `about:blank` → committed web navigation path. Inspect no longer competes as a second title/Badge writer.

Still outside the verified slice are Switch results into Direct/System, nested or attached Rule Lists, PAC/Virtual/temporary-rule/external-control traces, forced renderer fallback, headed toolbar pixels where browser-readable state is insufficient and repository-owner PASS.

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
