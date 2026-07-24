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

## Completed in branch — Milestone 3

Delivered:

- Versioned ProfileSpec `1.0` public model with stable IDs and ordered user collections.
- Fixed, switch, rule-list, PAC, and auto-detect profile variants.
- Explicit equivalents for all twelve pinned ZeroOmega condition families.
- Built-in Direct/System route targets without name-based references.
- Proxy endpoint, rule source, startup, quick-switch, interface, synchronization, legacy metadata, and namespaced extension contracts.
- JSON Schema 2020-12 structural contract.
- Semantic validation for references, cycles, IDs, names, hosts, URLs, ports, IP prefixes, regular expressions, ranges, secrets, generated fields, and browser-dependent warnings.
- Deterministic serialization with sorted object keys and preserved array order.
- Strict parsing with structured errors.
- Explicit migration registry and cycle/error detection.
- Deep cloning and immutable child-revision creation.

Acceptance evidence:

- Public-model Head `bba247e` passed CI run `30111303444`.
- Schema and semantic-validation Head `f111287` passed CI run `30112709422`.
- Lifecycle Head `9fec6f6` passed CI run `30113060732`.
- The final documentation Head must pass the complete read-only pipeline before PR #6 merges.

## Active development direction

After Milestone 3 merges, implementation continues with the ZeroOmega schema-v2 importer, reference interpreter, PAC compiler, browser adapters, full UI workflow, packaging, migration, and performance hardening.

Intermediate work is verified internally and through GitHub CI. The repository owner is not asked to repeatedly inspect partial slices. Owner QC is reserved for a consolidated, installable release candidate unless an irreducible product decision requires direct input.
