# Milestone Status

## Authority and reading rule

`PRODUCT_CONSTITUTION.md` defines the product contract. This file records stable historical milestone integration only. It does not declare current product completion, release readiness, moving branch Head, CI runs, or candidate state.

For current product progress and active evidence, read:

1. `PROJECT_PROGRESS_MODEL.md`.
2. `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`.
3. `ACTIVE_PARITY_AUDIT_INDEX.md`.
4. The active delivery-order document.
5. Draft PR #11 and GitHub Checks for the exact current Head.

No build is a release candidate unless PR #11 explicitly declares one exact artifact and the repository owner accepts it.

## Repository baseline

`main` contains the verified engineering foundations through Milestone 7. Milestone 7 merged through PR #10 at commit `e3f7725d77d78922589b7c113ffbab806b188ae3`.

These records establish engineering assets. They do not prove complete original-compatible product journeys.

Stable engineering integration records:

- Milestone 0 — initial charter, architecture, compatibility, delivery, decisions, and agent rules; integrated through PR #1.
- Milestone 1 — pnpm/TypeScript/WXT/Svelte shell, dual-browser builds, CI, and manifest guards; integrated through PR #2.
- Milestone 2 — initial schema-v2 field/profile/condition inventory and deterministic fixtures; integrated through PR #4.
- Milestone 3 — versioned ProfileSpec model, schema, validation, serialization, revisions, and migrations; integrated through PR #6.
- Milestone 4 — bounded decoding, profile/condition mapping, secret isolation, and compatibility reports; integrated through PR #7.
- Milestone 5 — auditable profile graph and route oracle with deterministic traces; integrated through PR #8.
- Milestone 6 — deterministic PAC, capability analysis, differential tests, budgets, and snapshots; integrated through PR #9.
- Milestone 7 — Chromium/Firefox installation, confirmation, rollback, restart recovery, ownership checks, and optional proxy authentication; integrated through PR #10.

## Interpretation of Milestones 1–7

The following are retained architectural assets:

- Ordinary navigation uses browser-native PAC rather than an extension-side global request decision listener.
- No required `<all_urls>` proxy-decision permission or global `proxy.onRequest` data plane is introduced.
- Candidate, compiled, installed, confirmed, and active states remain internally distinguishable.
- Failed compilation or installation cannot silently replace the previous confirmed state.
- Secrets remain outside ProfileSpec, PAC, ordinary exports, diagnostics, and rendered UI.
- Firefox and Chromium remain separate capability and verification targets.

These assets remain subject to real original-export, observable-parity, complete-browser-journey, and owner-acceptance gates.

## Active product work

Milestone 8 and later product work is under a full Original ↔ Nex parity audit on `feat/m8-profile-workflow` in Draft PR #11.

Current product progress must not be inferred from the old broad UI inventory, old `DONE` counts, previous `98%` claims, commit count, changed lines, test count, or Nex-only screenshots. The failed `M8-OWNER-QC-1` candidate remains historical evidence that those measures were incomplete.

The active sequence is governed by `PRODUCT_CONSTITUTION.md`:

1. Eliminate conflicting contracts and dynamic status duplication.
2. Close Order 1 as a complete installation/startup/Toolbar/per-tab/Popup-smoke/Inspect/recovery journey.
3. Prove real original export -> direct import -> immediate equivalent use.
4. Correct Popup and temporary/site-rule journeys.
5. Correct Options, dialogs, and Apply/Discard journeys.
6. Close complete profile, lifecycle, export, restart, rollback, ownership, and authentication journeys.
7. Complete localization, density, and visual alignment.
8. Produce one exact final candidate for repository-owner acceptance.

## Candidate and release boundary

PR #11 remains Draft. Merge, release, or candidate claims remain prohibited until the applicable evidence chain closes:

`Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`
