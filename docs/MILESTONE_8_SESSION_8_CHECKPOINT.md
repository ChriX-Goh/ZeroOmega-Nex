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
- the coordinator refreshes the global baseline and then all identified tabs through the same single writer;
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

Authenticated clean checkpoint `db1b10ebe6d41637246d777e34b1afd4eb6ca170` passed all four permanent gates: CI `30666472249`, Browser E2E `30666473257`, Parity Documentation `30666472570` and Milestone 8 Visual Evidence `30666472029`. Browser E2E passed Firefox, Chromium toolbar Action and native Chromium Inspect jobs. This remains slice-level engineering evidence only.

The authoritative knowledge graph, audit index, Delivery Order 1, Milestone 8 status and Verification Head were synchronized to that exact checkpoint in `16fdd72ca32e109778f54b0eb2a61993059ba60c`; the temporary synchronization files were removed in `7eb7077ba11c500ebc12829f822da9dd67f246ad`.

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

1. Require the four permanent gates on this authenticated post-synchronization Head.
2. Continue with internal-page, same-tab transition and direct Inspect Action acceptance.
3. Keep progress at 47% / 35% until their real-browser and owner-acceptance gates close.
