# Audit Evidence 02C — Popup Default Convergence

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`, `AUDIT_EVIDENCE_02_ORIGINAL_ENTRY_CORRECTION.md` and `AUDIT_EVIDENCE_02B_BROWSER_CONTRACT_STABILIZATION.md`.

It records one bounded Original ↔ Nex Popup correction. It is not a candidate or completion claim.

## Original-derived correction

The paired official v3.5.0 and Nex evidence showed two concrete default-Popup differences:

- Nex was hard-coded to a 320-pixel Popup while the original evidence surface was 440 pixels wide;
- Nex permanently exposed the default `auto switch` result label and result selector even while System or Direct was active, whereas the original default Popup showed only the profile rows and Options entry.

The correction therefore:

- changes the Popup document and shell width from 320 pixels to 440 pixels;
- renders a Switch or Virtual result label only while that exact profile route is active;
- renders its result selector only while that exact profile route is active;
- keeps the active Switch/Virtual result-selection capability intact;
- adds Chromium coverage proving the inactive default Switch exposes no result label or selector in the System state;
- adds Firefox coverage proving the inactive default Switch exposes no result label or selector in the Direct state.

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and diff validation before being committed. Temporary patch scripts were removed in the same transaction.

## Required evidence

The six permanent read-only gates must run on a normal repository Head. The next paired Original ↔ Nex artifact must be inspected before any further Popup geometry or styling change.

Project progress remains 48%; Order 1 remains 45%; no acceptance candidate, merge, release or owner retest is authorized.
