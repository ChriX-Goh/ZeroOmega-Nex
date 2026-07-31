# Milestone 8 — Session 8 checkpoint

## Project contract

ZeroOmega Nex remains a faithful bottom-layer rewrite of ZeroOmega v3.5.0. The original user-facing product contract is authoritative; this is not a modernization redesign. Original exports must import directly and become immediately usable, and visible behavior must remain original-backed or explicitly owner-approved.

## Governance state

- PR: `#11`, Draft.
- Active candidate: none.
- Previous candidate `M8-OWNER-QC-1`: failed.
- Provisional project progress: `47%` (`46.7%`, confidence `42%–50%`).
- Active Order 1 progress: `35%`.
- Merge, release and candidate generation remain prohibited.
- No toolbar matrix row, `KG-ICON-001`, Order 1 or project-completion claim is closed by this checkpoint.

## Session 8 engineering result

Product commit `a69cdb3f1e215ad0306afe4083b67066f2c68d18` establishes a durable original-facing toolbar Action baseline:

- browser-level Action title, Badge, Popup and icon fallback can be written without a `tabId`;
- Direct and System establish a global Action baseline before per-tab URL-derived states override it;
- the per-tab coordinator refreshes the global baseline and then all identified tabs through the same single writer;
- Inspect delegates global writes without applying per-tab overlays;
- profile-workflow commands are serialized so concurrent `get` requests cannot observe a partially persisted but not-yet-activated initial state;
- activation follow-up may be asynchronous and is awaited before the command response resolves;
- startup recovery reactivates the saved startup route when profile state exists but proxy runtime state is missing;
- Firefox focused toolbar acceptance is command-driven rather than dependent on unrelated rename, authentication or Popup UI steps.

The transaction passed:

- architecture, UI, parity, localization, lint, formatting and type checks;
- `517` unit tests;
- `25` component tests;
- Chromium and Firefox builds plus manifest/CSP inspection;
- one complete Firefox extension journey;
- ten consecutive focused Firefox Action journeys covering System, Direct and simultaneous Fixed proxy/bypass states on two real tabs.

Temporary applicators, diagnostics and the one-time workflow were removed atomically in clean tree commit `db8b351053b023fe2d79e02d8fa4f77921440e65`.

## Verification boundary

The bot-authored cleanup Head produced `action_required` rather than executed permanent PR gates. This checkpoint is the authenticated trigger commit for the same product tree plus this record. The exact permanent CI, Browser E2E, Parity Documentation and Milestone 8 Visual Evidence results must be recorded only after they complete on this Head.

## Remaining Order 1 work

- complete Switch/PAC default and matched-result traces;
- Virtual and attached Rule List traces;
- temporary-rule and external-control transitions through the single writer;
- explicit internal-page fallback and same-tab proxy↔bypass assertions;
- direct Inspect set/clear/isolation Action capture;
- forced dynamic-render failure/static-fallback evidence where feasible;
- headed toolbar pixels where browser-readable state is insufficient;
- focused repository-owner acceptance and explicit `PASS`.

## Next gate

1. Require all four permanent gates on this authenticated clean checkpoint.
2. Synchronize the authoritative knowledge graph and PR description to the exact successful Head and run IDs.
3. Continue with internal-page, same-tab transition and direct Inspect Action acceptance without increasing progress until their acceptance gates close.
