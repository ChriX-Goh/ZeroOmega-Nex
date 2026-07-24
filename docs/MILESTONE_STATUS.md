# Milestone Status

## Repository baseline

`main` contains the completed and verified foundation, Milestone 1, and Milestone 2 work.

The pre-normalization main commit is preserved at `archive/main-before-stack-normalization`.

## Completed — Milestone 1

Delivered:

- pnpm workspace and frozen lockfile.
- Strict TypeScript boundaries.
- WXT plus Svelte extension shell.
- Chromium and Firefox Manifest V3 production builds.
- Familiar ZeroOmega-like popup and options-page layout shells.
- Architecture guards against premature proxy permissions, global request listeners, and `<all_urls>`.
- Manifest audits, unit tests, linting, formatting, type checks, and build artifacts.
- Stable Firefox extension ID and explicit no-data-collection declaration.

Acceptance:

- Automated CI passed.
- Chromium desktop temporary-load smoke test passed.
- Firefox desktop temporary-load smoke test passed.
- Issue #3 closed as completed.

## Completed — Milestone 2

Delivered:

- ZeroOmega v3.5.0 / schemaVersion 2 compatibility inventory.
- Full profile, condition, rule-list, endpoint, bypass, credential, header, settings, synchronization, backup, runtime-state, built-in appearance, and network-edge classification.
- Positive, negative, network-edge, scale, route-decision, and browser-capability fixture corpora.
- Deterministic 36-profile / 1,024-rule large fixture.
- Proxy-authentication capability contract for Chromium MV3 and Firefox MV3.
- Final field decisions with zero remaining `investigate` classifications.
- Secret isolation, generated-data quarantine, and unknown-field risk policy.

Acceptance:

- Every known v3.5.0 field has an explicit map, preserve, secret, generated, runtime, target-dependent, downgrade, or reject decision.
- All fixture validators, differential-oracle inputs, linting, formatting, type checks, tests, browser builds, manifest audits, and artifacts passed.
- PR #4 merged after the verified M1 UI files were consolidated into the final tree.

## Active development direction

Next implementation work begins with the versioned ProfileSpec and legacy importer, followed by the reference interpreter, PAC compiler, browser adapters, full UI workflow, packaging, migration, and performance hardening.

Intermediate work is verified internally and through GitHub CI. The repository owner is not asked to repeatedly inspect partial slices. Owner QC is reserved for a consolidated, installable release candidate unless an irreducible product decision requires direct input.
