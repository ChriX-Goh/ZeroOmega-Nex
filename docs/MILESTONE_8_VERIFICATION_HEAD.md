# Milestone 8 Verification Boundary

## Purpose

This document defines how exact-Head evidence is interpreted. It intentionally does not copy a moving branch SHA, workflow run number, test count, or candidate digest.

The exact current Head is the `head_sha` shown by Draft PR #11. Its current engineering conclusions are the GitHub Checks attached to that exact SHA. Historical accepted or failed checkpoints remain in their dedicated evidence documents and PR history.

## Product authority

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. `MILESTONE_8_STATUS.md` is the single hand-maintained Milestone 8 progress/blocker summary. `PROJECT_PROGRESS_MODEL.md` defines the scoring method.

A green exact Head is an engineering checkpoint, not a release-completeness claim.

## Required permanent gates

The exact Head must pass all applicable permanent, read-only gates, including:

- CI;
- Browser E2E;
- Parity Documentation;
- Milestone 8 Visual Evidence;
- any additional permanent journey-level gate explicitly required by the active delivery order.

One-time workflows that commit or push implementation or documentation are prohibited. Temporary evidence belongs in workflow artifacts; permanent evidence is committed deliberately after review.

## Evidence interpretation

A green workflow proves only its stated contract. It does not:

- upgrade `IMPLEMENTED` to `PARITY_VERIFIED` or `OWNER_ACCEPTED`;
- prove direct use of a real original export;
- prove an untested browser or profile graph;
- validate a user-visible element without original provenance;
- close a complete user journey;
- authorize a release candidate, merge, or release.

A parity row closes only when the full evidence chain exists:

`Original source/runtime -> input data -> Nex mapping -> implementation -> deterministic tests -> Chromium -> Firefox -> owner result`

## Current audit boundary

The branch remains in full Original ↔ Nex parity re-audit. There is no active candidate and no verified release-completeness Head.

The previous candidate `M8-OWNER-QC-1` failed repository-owner trial on 2026-07-30. Its green workflows remain historical engineering evidence only.

Current product progress, active journey, blockers, retained Toolbar slice, attached Rule List checkpoint, and immediate execution order are maintained in `MILESTONE_8_STATUS.md` without copying the moving Head.

## Exact-Head procedure

For every coherent work package:

1. commit ordinary source, tests, and stable evidence deliberately;
2. confirm PR #11 points to the intended exact SHA;
3. run the required permanent read-only gates on that SHA;
4. record failures against the exact SHA and fix them in a new commit;
5. only after all required gates pass, cite the SHA as an engineering checkpoint;
6. do not increase product progress unless the corresponding journey evidence gate actually closes;
7. request repository-owner QC only for a complete journey build or an irreducible product decision.

## No-invention boundary

No patch may add or preserve user-visible pages, dialogs, descriptions, help boxes, terminology, state taxonomies, defaults, or workflow steps without:

1. original source/package/runtime evidence; or
2. a minimized necessary difference under an accepted `DR-xxxx` record.

Unknown behavior remains `UNKNOWN` and fails closed.

## Candidate boundary

No exact Head becomes a candidate until:

- the applicable original and Nex inventory is complete;
- every required node is explicitly mapped;
- representative real original exports import directly and work immediately;
- complete Chromium and Firefox journeys pass;
- unjustified visible UI/workflow is removed;
- all necessary differences are accepted;
- the repository owner accepts the exact build.
