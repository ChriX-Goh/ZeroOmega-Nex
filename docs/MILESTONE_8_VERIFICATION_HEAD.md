# Milestone 8 Verification Boundary

This branch is in full Original ↔ Nex parity re-audit.

There is no active candidate and no verified release-completeness Head.

The previous candidate `M8-OWNER-QC-1`, Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`, failed repository-owner trial on 2026-07-30. Its green workflows prove only that the incomplete automated contract passed; they do not prove original-compatible delivery.

## Current boundary

Every future product change must be governed by:

- `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`;
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

When a future mapped product slice is integrated, its exact Head and workflow evidence may be recorded in PR #11. That evidence remains slice-level until the complete owner-facing comparison order and final owner acceptance are satisfied.
