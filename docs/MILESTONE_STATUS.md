# Milestone Status

## Repository baseline

`main` contains the completed and verified foundation plus Milestones 1 through 6.

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

## Completed — Milestone 4

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
- Final documentation Head `00404b9` passed CI run `30142533822`.
- The complete suite includes 53 tests covering positive fixtures, unsafe fixtures, real secret extraction, IDN and IPv4/IPv6 edges, deterministic output, 36 profiles, and 1,024 ordered rules.
- Chromium MV3 and Firefox MV3 builds, manifest audits, and packaged build artifacts passed.
- PR #7 merged into `main` at `692b6e5`.

## Completed — Milestone 5

Delivered:

- Pure request and support contracts independent from browser APIs.
- All twelve ProfileSpec condition families.
- IPv4, IPv6, CIDR, host wildcard, and URL wildcard execution.
- Ordered SwitchProfile first-match and default behavior.
- Recursive profile graph resolution with deterministic traces.
- FixedProfile bypass, scheme-specific endpoint, fallback, and unmapped-direct behavior.
- Missing profile, endpoint, disabled profile, cycle, and maximum-depth protection.
- SwitchyOmega modern and legacy rule-list parsing.
- AutoProxy normal and exclusive rule parsing and priority.
- Execution of all committed condition and rule-list oracle vectors.
- Explicit indeterminate boundaries for arbitrary PAC and browser auto-detect behavior.
- Backend-neutral differential records with sanitized terminal routes, profile paths, matched rules, and normalized traces.
- Credential and secret-reference exclusion from differential records.
- Deterministic, immutability, domain-suffix, IPv4 subnet, and source-preservation property tests.

Acceptance evidence:

- Condition interpreter Head `12c3d0b` passed CI run `30142970294`.
- Recursive profile graph Head `bbd14a8` passed CI run `30144021927`.
- Rule-list interpreter Head `50681fe` passed CI run `30144346169`.
- Complete implementation Head `5ea9eaf` passed CI run `30144651695`.
- Final documentation Head `9435e76` passed CI run `30144697164`.
- The complete suite contains 77 tests, including all immutable Milestone 2 decision vectors.
- Chromium MV3 and Firefox MV3 builds, manifest audits, and packaged build artifacts passed.
- PR #8 merged into `main` at `c428ad9`.

## Completed — Milestone 6

Delivered:

- Reachability-based exact, target-dependent, and unsupported PAC capability analysis.
- Explicit blocking for System routes, arbitrary nested PAC, browser auto-detect, missing references, cycles, disabled profiles, unavailable rule-source content, and unsupported target semantics.
- Deterministic PAC generation with one stable function per reachable profile.
- Compile-time expansion of Switchy and AutoProxy RuleList profiles.
- Self-contained conservative PAC runtime for wildcard, regex, bypass, IPv4/IPv6 prefix, host-level, weekday, and hour matching.
- `PROXY`, `HTTPS`, `SOCKS4`, and `SOCKS5` endpoint directives.
- Safe string escaping, IDN endpoint normalization, IPv6 bracketing, and directive-injection rejection.
- Profile, condition, and script-byte hard budgets plus near-limit warnings.
- Isolated generated-script Harness with deterministic local weekday/hour injection.
- Differential verifier against every committed condition and RuleList oracle vector.
- Structured mismatch detection verified with deliberately corrupted PAC output.
- Credential, secret-reference, request-header, ProfileSpec JSON, and arbitrary PAC-body exclusion from generated output.
- SHA-256 hashing and immutable verified RuntimeSnapshot metadata.
- Deterministic snapshot identity independent from `createdAt`.
- Large 36-profile / 1,024-rule fixture compilation with reachable graph pruning to 25 profiles, 24 endpoints, and 200 conditions.

Acceptance evidence:

- Capability analyzer Head `a246d87` passed CI run `30145010296`.
- Deterministic generator Head `5ab912b` passed CI run `30145972662`.
- Differential and verified snapshot Head `acf569f` passed CI run `30146430909`.
- Large policy Head `2252c57` passed CI run `30146482543`.
- Final documentation Head `4a643e6` passed CI run `30146582195`.
- The complete suite contains 108 tests, including all immutable Milestone 2 decision vectors, PAC/reference differential checks, snapshot hashing, and the large representative policy.
- Chromium MV3 and Firefox MV3 builds, manifest audits, and packaged build artifacts passed.
- PR #9 merged into `main` at `843433a`.

## Completed in branch — Milestone 7

Branch: `feat/m7-browser-adapters`  
Pull request: #10

Delivered:

- Browser-neutral Chromium and Firefox proxy capability and control-state contracts.
- Atomic candidate persistence, install, confirmation, active-state commit, and rollback.
- Previous verified snapshot and captured browser-baseline restoration.
- Conflict detection for uncontrollable and other-extension-controlled proxy settings.
- Restart recovery for interrupted activation and lost effective settings.
- Chromium regular-scope mandatory inline PAC installation and exact read-back confirmation.
- Firefox autoConfig data-URL installation, private-window preflight, and PAC runtime error confirmation failure.
- Versioned persistent activation state and verified snapshot storage with corruption checks.
- Extension background recovery before active-state restoration.
- Required extension permissions limited to `proxy` and `storage`.
- Default-disabled HTTP/HTTPS proxy authentication with browser-specific optional permissions.
- Separate endpoint binding and secret records, no password values in PAC or binding records.
- `isProxy`-only Basic/Digest challenge handling, bounded retries, ambiguity rejection, and no SOCKS impersonation.
- No `proxy.onRequest`, `<all_urls>`, request-completion monitoring, request-error monitoring, or startup permission prompts.
- Updated architecture and generated-manifest audits for the production proxy boundary.

Acceptance evidence:

- Atomic state-machine Head `82aca61` passed CI run `30147612373`.
- Chromium and Firefox platform-driver Head `aff8b91` passed CI run `30147933438`.
- Persistent activation repository Head `277ed33` passed CI run `30148190150`.
- Extension background and proxy-permission Head `7fb0430` passed CI run `30148414347`.
- Optional authentication integration Head `be2f339` passed CI run `30149000776`.
- The complete suite contains 142 tests covering activation, rollback, restart recovery, platform mappings, persistent state, authentication matching, permission gating, retry limits, and secret separation.
- Generated Chromium and Firefox MV3 packages contain no required host permissions or `<all_urls>`.
- Generated background bundles contain `onAuthRequired` only when configured at runtime and contain no completion/error monitoring or permission-request calls.
- Final status and documentation Head must pass the complete read-only pipeline before PR #10 merges.

## Active development direction

After Milestone 7 merges, implementation continues with the familiar ZeroOmega-like profile workflow, import review, Apply/Revert state, popup switching, and snapshot history in Milestone 8.

Intermediate work is verified internally and through GitHub CI. The repository owner is not asked to repeatedly inspect partial slices. Owner QC is reserved for a consolidated, installable release candidate unless an irreducible product decision requires direct input.
