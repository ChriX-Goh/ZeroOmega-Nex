# Milestone 8 Candidate and Repository-Owner QC

## Current candidate state

**No active installable candidate is accepted or under QC.**

Candidate `M8-OWNER-QC-1` is permanently recorded as:

- **Candidate Head:** `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`
- **Artifact ID:** `8725915254`
- **Owner-QC result:** `FAILED`
- **Failure recorded:** 2026-07-30
- **Release status:** rejected; must not be presented as nearly complete or reused as a future candidate

PR #11 remains Draft.

## Why the candidate failed

Repository-owner trial identified broad original-compatibility failures, including:

1. The browser toolbar icon and its UI do not match the original and do not change correctly with active profile/runtime state.
2. A configuration exported by the original extension still cannot be imported and used directly as an equivalent working configuration.
3. Layout, interaction logic and information density remain substantially different from the original.
4. Nex introduces many unnecessary user-visible explanatory blocks and auxiliary workflow that are not part of the original mental model.
5. Additional defects and mismatches are too numerous to treat as a finite final-QC punch list.

These failures invalidate the previous premise that only A-14 and I-11 remained open. They also invalidate the use of `DONE=124 / PARTIAL=2` as a product-completion measure.

## Governance correction

The previous process confused four different states:

- code implemented;
- automated checks passing;
- original-compatible behavior verified with real data;
- repository-owner acceptance.

Only the final state is delivery-complete.

All future work is governed by:

- `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`

That document is both the engineering comparison authority and the owner-facing delivery order.

## Initial failed areas

| Defect ID | Area | Result |
| --- | --- | --- |
| `KG-ICON-001` | Toolbar icon, badge/title and runtime-state presentation | `FAILED` |
| `KG-IMPORT-001` | Direct use of real original exported configurations | `FAILED` |
| `KG-UI-001` | Original information architecture, layout and action hierarchy | `FAILED` |
| `KG-EXTRA-001` | Unnecessary description/help boxes and extra user-facing workflow | `FAILED` |
| `KG-FLOW-001` | Broad feature and interaction parity | `FAILED` |
| `KG-GOV-001` | Completion and acceptance governance | `FAILED` |

## Candidate freeze prohibition

No new candidate may be declared until all of the following are true:

1. The original product graph is captured page-by-page, state-by-state and data-contract-by-data-contract.
2. The current Nex product is captured independently without assuming equivalence.
3. Every original node has an explicit Original ↔ Nex mapping and gap classification.
4. Real sanitized original backups covering complex production configurations import into a clean browser and work directly.
5. Toolbar, Popup, Options, all profile journeys, Apply/Discard, import/export, restart, rollback, ownership and authentication pass in Chromium and Firefox.
6. Every extra Nex dialog, description block and auxiliary surface is justified by an accepted divergence or removed.
7. The repository owner reviews the comparison order and marks the exact final build `PASS`.

## Superseded evidence

The following remain historical engineering evidence only and must not be used as release-completeness evidence:

- candidate Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`;
- Artifact `8725915254`;
- CI `30456863674`;
- Browser E2E `30456863926`;
- Parity Documentation `30456863775`;
- Visual Evidence `30456863885`;
- the earlier canonical count `DONE=124 / PARTIAL=2`.

Passing those checks proves only that the tested implementation was internally consistent with the incomplete test contract.

## Next acceptance artifact

The next owner-facing artifact is not another ZIP. It is the completed comparison and delivery order containing:

- original source and runtime evidence;
- current Nex source and runtime evidence;
- exact differences;
- required correction;
- automated acceptance;
- real-backup acceptance;
- Chromium and Firefox evidence;
- owner `PASS`, `FAIL` or `NOT RUN`.

## Closure rule

Milestone 8 cannot be described as 100%, parity-complete, candidate-ready or release-ready until the complete delivery knowledge graph is mapped and the repository owner accepts one exact final candidate.