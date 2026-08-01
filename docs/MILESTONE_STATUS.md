# Milestone Status

## Authority and reading rule

`PRODUCT_CONSTITUTION.md` defines the product contract. This file records stable historical milestone integration only. It does not declare current product completion, release readiness, moving branch Head, CI runs, or candidate state.

For current product progress and active evidence, read:

1. `PROJECT_PROGRESS_MODEL.md`;
2. `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`;
3. `ACTIVE_PARITY_AUDIT_INDEX.md`;
4. the active delivery-order document;
5. Draft PR #11 and GitHub Checks for the exact current Head.

No build is a release candidate unless PR #11 explicitly declares one exact artifact and the repository owner accepts it.

## Repository baseline

`main` contains the verified engineering foundations through Milestone 7. Milestone 7 merged through PR #10 at commit `e3f7725d77d78922589b7c113ffbab806b188ae3`.

These records establish engineering assets. They do not prove complete original-compatible product journeys.

| Milestone | Stable engineering result | Integration record |
| --- | --- | --- |
| 0 — Foundation and governance | Initial charter, architecture, compatibility, delivery, decisions, and agent rules | PR #1 |
| 1 — Monorepo and deterministic tooling | pnpm/TypeScript/WXT/Svelte shell, dual-browser builds, CI, and manifest guards | PR #2 |
| 2 — Legacy inventory and fixture corpus | Initial schema-v2 field/profile/condition inventory and deterministic fixtures | PR #4 |
| 3 — ProfileSpec v1 | Versioned model, schema, validation, serialization, revisions, and migrations | PR #6 |
| 4 — ZeroOmega importer | Bounded decoding, profile/condition mapping, secret isolation, and compatibility reports | PR #7 |
| 5 — Reference interpreter | Auditable profile graph and route oracle with deterministic traces | PR #8 |
| 6 — PAC compiler and verifier | Deterministic PAC, capability analysis, differential tests, budgets, and snapshots | PR #9 |
| 7 — Browser adapters and atomic activation | Chromium/Firefox installation, confirmation, rollback, restart recovery, ownership checks, and optional proxy authentication | PR #10 |

## Interpretation of Milestones 1–7

The following are retained architectural assets:

- ordinary navigation uses browser-native PAC rather than an extension-side global request decision listener;
- no required `<all_urls>` proxy-decision permission or global `proxy.onRequest` data plane is introduced;
- candidate, compiled, installed, confirmed, and active states remain internally distinguishable;
- failed compilation or installation cannot silently replace the previous confirmed state;
- secrets remain outside ProfileSpec, PAC, ordinary exports, diagnostics, and rendered UI;
- Firefox and Chromium remain separate capability and verification targets.

These assets remain subject to real original-export, observable-parity, complete-browser-journey, and owner-acceptance gates.

## Active product work

Milestone 8 and later product work is under a full Original ↔ Nex parity audit on `feat/m8-profile-workflow` in Draft PR #11.

Current product progress must not be inferred from the old broad UI inventory, old `DONE` counts, previous `98%` claims, commit count, changed lines, test count, or Nex-only screenshots. The failed `M8-OWNER-QC-1` candidate remains historical evidence that those measures were incomplete.

The active sequence is governed by `PRODUCT_CONSTITUTION.md`:

1. eliminate conflicting contracts and dynamic status duplication;
2. close Order 1 as a complete installation/startup/Toolbar/per-tab/Popup-smoke/Inspect/recovery journey;
3. prove real original export -> direct import -> immediate equivalent use;
4. correct Popup and temporary/site-rule journeys;
5. correct Options, dialogs, and Apply/Discard journeys;
6. close complete profile, lifecycle, export, restart, rollback, ownership, and authentication journeys;
7. complete localization, density, and visual alignment;
8. produce one exact final candidate for repository-owner acceptance.

## Candidate and release boundary

PR #11 remains Draft. Merge, release, or candidate claims remain prohibited until the applicable evidence chain closes:

`Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`
