# Audit Evidence 02I — Original Sidebar Brand Guard

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records one evidence-direction correction in the permanent UI compatibility guard. It is not an acceptance candidate or completion claim.

## Evidence conflict

The paired `en-US / zh-CN / zh-TW` matrix and official default Options DOM establish that the original v3.5.0 sidebar brand is rendered as `Zero Omega` with a space.

An older compound validator still required the opposite:

- it rejected `<span>Zero Omega</span>`;
- it did not reject the replacement spelling `<span>ZeroOmega</span>`.

That validator condition contradicted the permanent Original ↔ Nex evidence and caused the ordinary CI run for `d4f4ba63be9264864bf715439101036527772c5b` to fail after the product had been corrected.

## Guard correction

The validator now:

- requires `<span>Zero Omega</span>` in the ordinary Options sidebar;
- rejects `<span>ZeroOmega</span>` in that sidebar;
- continues to reject Nex branding, visible History navigation, Draft status and protocol-capability research in ordinary UI;
- retains the separate production-English, bracketed built-in profile and About-structure guards.

No product code changed in this transaction.

The guard correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

## Verification boundary

The atomic commit is Actions-generated, so GitHub marks its pull-request workflows `action_required`. This ordinary documentation Head must run all six permanent read-only gates and regenerate the paired locale matrix. The expected result is:

- CI accepts the original sidebar brand;
- production Original and Nex default to English for `en-US`, `zh-CN` and `zh-TW`;
- Chromium and Firefox Browser E2E retain explicit Simplified and Traditional Chinese coverage;
- no merge, release or owner retest becomes authorized.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate exists.
