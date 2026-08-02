# Milestone 8 Status — Original-Compatible Rewrite

## Authority

`PRODUCT_CONSTITUTION.md` is the highest-authority product contract. This file is the single hand-maintained Milestone 8 progress and blocker summary. Exact moving Head and workflow conclusions are read from Draft PR #11 and GitHub Checks.

- Branch: `feat/m8-profile-workflow`.
- Pull request: #11, Draft.
- Active release candidate: none.
- Active acceptance build: none.
- Retired acceptance build: `d57449bb74d9fedb53602af9b1e908ae18d700b9`.
- Latest owner result: `FAIL` on 2026-08-02 using Firefox.
- Provisional total progress: 48% (unrounded 47.9%; confidence band 43%–50%).
- Active journey: Order 1 — installation/startup/Toolbar/Popup/Options entry experience, 45%.
- Change from the previous baseline: −4 rounded project points and −35 Order 1 points; no denominator correction.
- Merge, release and owner retest: prohibited.

The historical `98%`, broad `DONE` counts and the superseded `52% / Order 1 80%` readiness claim measured engineering evidence without original-facing product parity and are invalid.

## Product contract — memorized hard constraint

ZeroOmega Nex is a bottom-layer clean-room rewrite of ZeroOmega v3.5.0, not a redesign.

- Supported original exports must import directly and become immediately usable.
- Experienced original users must not rebuild profiles, reinterpret ordinary settings or learn a replacement workflow.
- Popup, Options, terminology, information hierarchy, defaults, interaction order and visible behavior must follow the original unless a documented browser limitation makes exact behavior impossible.
- Engineering concepts, checkpoints, Draft/Applied internals, revisions, compilation, snapshots, graph traces, capability research and delivery status belong only in code, tests and documentation. They must not appear in ordinary UI.
- A visible difference requires exact original evidence, a bounded browser limitation or explicit repository-owner acceptance.

## Owner failure and corrected diagnosis

The Firefox owner run found that the icon changed but the product still contained many original-incompatible UI and workflow differences, especially extra descriptions and engineering concepts exposed in Options.

The failure is accepted as authoritative. It invalidates the prior claim that Order 1 was ready for owner acceptance.

Concrete demonstrated defects include:

- Nex Options defaults to the `Proxy` editor while original v3.5.0 defaults to `About`;
- Nex omits the original default `auto switch` profile from Popup and Options;
- Nex adds top-level `配置历史` and persistent Draft/application status UI absent from the original normal path;
- Nex exposes a large protocol-capability research table and browser-internal compatibility explanations inside the Fixed editor;
- Nex adds page subtitles, branding and helper prose not present in the original;
- Nex Popup adds `ZeroOmega Nex` branding and changes row geometry, order, labels and selection styling;
- the Chromium-oriented acceptance helper package did not provide a valid Firefox-first restart workflow and is retired.

These are not isolated copy defects. They demonstrate `KG-UI-001`, `KG-EXTRA-001`, `KG-INVENTION-001` and `KG-FLOW-001` failures in the normal entry experience.

## Engineering evidence retained

The following work remains valid engineering infrastructure:

- one background Action writer and global/per-tab state;
- clean-install System initialization;
- Direct/System and user-edited Fixed proxy/bypass runtime behavior;
- represented Switch, nested Switch, Virtual, nested Virtual, attached Rule List, PAC, temporary-rule, external-control and renderer-fallback Action states;
- Chromium and Firefox browser automation;
- normal browser close/relaunch restoration;
- native Chromium Inspect;
- read-only official v3.5.0 Toolbar evidence harness.

This infrastructure does not compensate for incorrect visible product structure.

## New original-facing evidence boundary

`Original Nex UI Evidence` is now a permanent read-only workflow.

It:

- downloads and SHA-256 verifies the official ZeroOmega v3.5.0 Chromium package;
- builds Nex from the exact PR Head;
- loads Original and Nex in the same Chromium version, locale, viewport and light theme;
- captures paired default Popup and Options screenshots;
- records rendered body text, text lines, page dimensions and hashes;
- reports text present only in Nex and text missing from Nex.

The first paired capture objectively reproduces the owner report. Nex-only screenshots can no longer be used as evidence of original parity.

## Current Order 1 boundary

Order 1 is reopened at 45%.

Runtime Action engineering is broad, but the ordinary user journey remains failed until:

1. the original Popup and Options baseline is fully captured;
2. Nex default profiles, default landing page, sidebar hierarchy and Popup structure match the original;
3. engineering-only descriptions and internal state are removed from ordinary UI;
4. Firefox is the primary manual/browser-facing validation target;
5. Chromium is used as the required cross-browser confirmation after Firefox parity;
6. paired Original ↔ Nex evidence shows the intended convergence;
7. only after those gates does an internal owner review become relevant.

No user retest is requested during this correction phase.

## Immediate execution order

1. Repair CI formatting for the paired Original ↔ Nex evidence harness.
2. Treat official v3.5.0 paired evidence as the UI authority.
3. Restore the original Options shell and default About landing page.
4. Restore original default `proxy` and `auto switch` visibility and ordering.
5. Remove `配置历史`, persistent Draft/application status, protocol-capability research and other Nex-only ordinary UI.
6. Align Popup rows, labels, icons, selection state, separator and Options entry.
7. Validate Firefox first, then Chromium.
8. Expand paired evidence to the next original surface only after the current surface is structurally aligned.

## Project-wide release blockers

- `KG-ORIGINAL-UI-EVIDENCE-001` — paired original-facing UI capture: active.
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
