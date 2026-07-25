# Milestone Status

## Repository baseline

`main` contains the completed and verified foundation plus Milestones 1, 2, and 3.

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

## Completed — Milestone 3

Delivered:

- Versioned ProfileSpec `1.0` public model with stable IDs and ordered user collections.
- Fixed, switch, rule-list, PAC, and auto-detect profile variants.
- Explicit equivalents for all twelve pinned ZeroOmega condition families.
- Built-in Direct/System route targets without name-based references.
- Proxy endpoint, rule source, startup, ordered quick-switch routes, interface, synchronization, legacy metadata, and namespaced extension contracts.
- PAC and rule-source download headers with secret references for sensitive values.
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
- Final documentation Head `dec72f5` passed CI run `30113191066`.
- PR #6 merged into `main` at `26dbcc0`.

## Completed in branch — Milestone 4

Branch: `feat/m4-zeroomega-importer`  
Pull request: #7

Delivered:

- Bounded JSON and base64-JSON legacy backup decoding.
- Explicit input byte, depth, node, profile, and rule limits.
- Cycle-safe object inspection and deterministic imported identifiers.
- Two-stage profile inventory and reference resolution.
- Fixed, PAC, auto-detect, switch, virtual, rule-list, and legacy rule-list alias conversion.
- All twelve pinned ZeroOmega condition families.
- Ordered switch rules, quick-switch routes, startup route, built-in Direct/System appearance, and compatible interface settings.
- Proxy endpoint conversion with username preservation and password secret references.
- Sensitive PAC/rule-source header isolation into secret materials.
- Generated cache/runtime field exclusion and safe unknown-field classification.
- Inactive candidate output only; import never modifies active browser proxy state.
- Machine-readable exact, target-dependent, downgraded, preserved, ignored, and rejected migration items.
- Final ProfileSpec structural and semantic revalidation before a candidate is returned.

Acceptance evidence:

- Full importer Head `257d57d` passed CI run `30116627450`.
- Final secret-isolation and full base64-pipeline Head `fd989f7` passed CI run `30142477022`.
- The complete suite includes 53 tests covering positive fixtures, unsafe fixtures, real secret extraction, IDN and IPv4/IPv6 edges, deterministic output, 36 profiles, and 1,024 ordered rules.
- Chromium MV3 and Firefox MV3 builds, manifest audits, and packaged build artifacts passed on the exact verified Head.

## Active development direction

After Milestone 4 merges, implementation continues with the reference policy interpreter and differential decision vectors, followed by the PAC compiler, browser adapters, full UI workflow, packaging, migration, and performance hardening.

Intermediate work is verified internally and through GitHub CI. The repository owner is not asked to repeatedly inspect partial slices. Owner QC is reserved for a consolidated, installable release candidate unless an irreducible product decision requires direct input.
