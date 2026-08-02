# Milestone 8 Status — Original-Compatible Rewrite

## Authority

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This file is the single hand-maintained Milestone 8 progress and blocker summary. Exact moving Head and workflow conclusions are read from Draft PR #11 and GitHub Checks.

- Branch: `feat/m8-profile-workflow`.
- Pull request: #11, Draft.
- Active release or acceptance candidate: none.
- Retired acceptance build: `d57449bb74d9fedb53602af9b1e908ae18d700b9`.
- Latest owner result: `FAIL` on 2026-08-02 using Firefox.
- Provisional total progress: 48% (unrounded 47.9%; confidence band 43%–50%).
- Active journey: Order 1 — installation/startup/Toolbar/Popup/Options entry experience, 45%.
- Change from the superseded readiness claim: −4 rounded project points and −35 Order 1 points; no denominator correction yet.
- Merge, release and owner retest: prohibited.

The historical `98%`, broad `DONE` counts and superseded `52% / Order 1 80%` readiness claim measured engineering evidence without original-facing product parity and are invalid.

## Product contract — memorized hard constraint

ZeroOmega Nex is a bottom-layer clean-room rewrite of ZeroOmega v3.5.0, not a redesign.

- Supported original exports must import directly and become immediately usable.
- Experienced original users must not rebuild profiles, reinterpret ordinary settings or learn a replacement workflow.
- Popup, Options, terminology, information hierarchy, defaults, interaction order and visible behavior must follow the original unless a documented browser limitation makes exact behavior impossible.
- Engineering concepts, checkpoints, Draft/Applied internals, revisions, compilation, snapshots, graph traces, capability research and delivery status belong only in code, tests and documentation. They must not appear in ordinary UI.
- A visible difference requires exact original evidence, a bounded browser limitation or explicit repository-owner acceptance.
- Firefox is the primary browser-facing validation target. Chromium is the required cross-browser confirmation, not the user's primary test environment.

## Owner failure and corrected diagnosis

The Firefox owner run found that the icon changed but the product still contained many original-incompatible UI and workflow differences, especially extra descriptions and engineering concepts exposed in Options.

The failure is authoritative. It invalidated the previous claim that Order 1 was ready for owner acceptance.

The demonstrated defects were structural rather than cosmetic:

- Options opened the `Proxy` editor instead of the original About page;
- the original default `auto switch` profile was missing;
- top-level History and persistent Draft/application status were added to ordinary UI;
- Fixed exposed protocol-capability research and browser-internal explanations;
- page subtitles, helper prose and Nex branding were added without original provenance;
- Popup row geometry, ordering, labels and selection styling diverged;
- the Chromium-oriented acceptance helper did not provide a valid Firefox-first workflow.

These defects keep `KG-UI-001`, `KG-EXTRA-001`, `KG-INVENTION-001`, `KG-FLOW-001` and `KG-ICON-001` open.

## Permanent Original ↔ Nex evidence boundary

`Original Nex UI Evidence` is a permanent read-only workflow.

It:

- downloads and SHA-256 verifies the official ZeroOmega v3.5.0 Chromium package;
- builds Nex from the exact PR Head;
- loads Original and Nex in the same Chromium version, requested locale, viewport and light theme;
- captures paired default Popup and Options screenshots;
- records rendered text, saved body DOM, normalized anchors, dimensions and hashes;
- records browser/document/extension language signals and packaged locale directories;
- captures a clean `en-US` / `zh-CN` / `zh-TW` default-text matrix;
- reports text present only in Nex and text missing from Nex.

Paired official evidence is now the UI authority. Nex-only screenshots remain regression evidence but cannot prove original parity.

## Entry correction slices — verified automation, owner-unaccepted

The first original-facing correction slice now contains:

- official default user profiles in original order: `proxy` (`#99ccee`) and `auto switch` (`#99dd99`);
- original built-in colors: Direct `#aaaaaa`, System `#000000`;
- original product spelling by surface: sidebar `Zero Omega`, About/product name `ZeroOmega`, and no `Nex` branding;
- Options default navigation to About;
- removal of top-level History navigation from ordinary Options;
- removal of persistent Draft/application status prose;
- removal of the Fixed protocol-capability research table from ordinary UI while retaining compiler/runtime capability logic;
- removal of Popup Nex branding;
- Popup profile selection decoupled from the keyboard Quick Switch enable switch;
- reset-options behavior routed through the background profile-workflow command boundary rather than direct UI storage access;
- Chromium and Firefox E2E updated to validate About first and then enter `proxy`;
- Firefox retained as the primary browser-facing contract;
- custom PAC/authentication/rollback/Toolbar unit scenarios converted to explicit fixtures instead of depending on installation defaults;
- architecture, parity, type, unit, component, lint and diff checks all passing in the pre-commit diagnostic transaction.

All temporary migration, export and diagnostic workflows/scripts were removed after the verified correction was committed. Standard CI was restored. The permanent paired Original ↔ Nex workflow remains.

Subsequent exact evidence also verifies:

- production defaults to original English under `en-US`, `zh-CN` and `zh-TW`;
- explicit Chromium and Firefox E2E builds retain Simplified and Traditional Chinese coverage;
- Popup built-ins use `[Direct]` and `[System Proxy]`;
- About links, attributions, status/action icons and the 32×32 blue Omega product icon match the original information structure;
- default Popup/Options text is aligned except the truthful Nex version and original hidden-modal text;
- complete startup recovery is serialized ahead of runtime messages, preventing delayed System writes over external Fixed/PAC state.

Ordinary Head `92feff8c28fd01740d58bfb144aa5361aa85180f` passed all six permanent gates. Chromium main E2E passed on its first attempt and completed every Toolbar specialist step; Firefox and native Chromium Inspect also completed fully.

These slices correct direction and close demonstrated automation defects but do not justify increasing progress. Paired evidence still shows remaining Popup and Options presentation differences, and the latest owner result remains FAIL.

## Engineering evidence retained

The following remains valid infrastructure:

- one background Action writer and global/per-tab state;
- clean-install System initialization;
- Direct/System and Fixed proxy/bypass runtime behavior;
- represented Switch, nested Switch, Virtual, nested Virtual, attached Rule List, PAC, temporary-rule, external-control and renderer-fallback Action states;
- Chromium and Firefox browser automation;
- normal browser close/relaunch restoration;
- native Chromium Inspect;
- read-only official v3.5.0 Toolbar evidence harness.

This infrastructure does not compensate for incorrect visible product structure.

## Current Order 1 boundary

Order 1 remains reopened at 45%.

The ordinary entry journey remains failed until:

1. the original Popup and Options surface inventory is complete enough to prevent another redesign-by-assumption;
2. default profiles, default landing page, sidebar hierarchy and Popup structure match the original;
3. engineering-only descriptions and internal state remain absent from ordinary UI;
4. Firefox automation continues to pass the original-derived entry journey;
5. Chromium continues to confirm the same behavior after Firefox without reruns;
6. paired Original ↔ Nex evidence shows material visual convergence across the relevant surfaces;
7. no intermediate user retest is requested before those gates are met;
8. the owner explicitly accepts a later exact build.

## Immediate execution order

1. Extend paired evidence with computed layout and typography metrics for Original and Nex.
2. Align Options light-theme sidebar background, boundary, typography and vertical rhythm.
3. Re-run paired screenshots/DOM and the six permanent gates.
4. Align Popup icons, row geometry, selected state, divider and Options entry.
5. Audit remaining editor/dialog density and visible helper text against original evidence.
6. Expand paired evidence to the next original surface only after the current surface is aligned.
7. Validate Firefox first, Chromium second.
8. Do not request owner retest during this correction phase.

## Project-wide release blockers

- `KG-ORIGINAL-UI-EVIDENCE-001` — paired original-facing UI capture: active.
- `KG-STARTUP-OWNERSHIP-001` — serialized startup/external ownership: `VERIFIED_AUTOMATION`.
- `KG-ICON-001` — complete Toolbar/Popup entry journey: `FAILED`.
- `KG-UI-001` — layout, density, dialogs, controls and hierarchy: `FAILED`.
- `KG-EXTRA-001` — unnecessary descriptions and extra workflow: `FAILED`.
- `KG-INVENTION-001` — visible behavior without provenance: `FAILED`.
- `KG-FLOW-001` — complete feature and interaction parity: `FAILED`.
- `KG-IMPORT-001` — real original export direct import and immediate equivalent use: `FAILED`.
- `KG-IMPORT-COLOR-001` — shorthand original color normalization: open.
- `KG-GOV-001` — final completion and owner-acceptance governance: open.

## Candidate prohibition

No acceptance build, merge or release is authorized. Green automation establishes engineering health only; it cannot overrule paired original evidence or owner-observed product mismatch.
