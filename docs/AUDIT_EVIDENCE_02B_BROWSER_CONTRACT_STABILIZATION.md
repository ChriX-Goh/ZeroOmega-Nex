# Audit Evidence 02B — Browser Contract Stabilization

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and `AUDIT_EVIDENCE_02_ORIGINAL_ENTRY_CORRECTION.md`.

It records test-contract stabilization after the first original-entry correction. It is not a candidate or completion claim.

## Corrections

- Chromium external-profile synchronization is initiated from an actual Popup page, matching the product message path. A Service Worker cannot send the ownership request to its own runtime listener and previously produced `Receiving end does not exist`.
- External-profile coverage still requires the real browser proxy state, System activation, ownership inspection and an importable Fixed candidate. No candidate is fabricated and no ownership check is bypassed.
- Firefox attached Rule List, profile-trace and restart scripts were normalized with repository Prettier rules after their original-derived `#/about` navigation updates.

The combined correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and diff validation before being committed. Temporary patch scripts were removed in the same transaction.

## Acceptance boundary

The six permanent gates must run on a normal repository Head. Green automation remains engineering evidence only; progress stays 48%, Order 1 stays 45%, and no candidate, merge, release or owner retest is authorized.
