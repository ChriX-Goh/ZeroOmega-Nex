# Milestone 8 Consolidated Candidate and Repository-Owner QC

## Current candidate state

**No installable Milestone 8 replacement candidate is currently declared.**

PR #11 remains Draft. Verification artifacts, historical packages, visual artifacts, and integrated product Heads are evidence inputs only. A candidate exists only when this file records one exact human-authored Head, fresh build artifact, digest, expiry, and executable owner-QC checklist.

## Superseded artifacts

Do not install or accept:

- failed implementation Head `335229f762e6353ec14e57b5cc2695b6395d175c`, artifact `8622723587`;
- obsolete replacement Head `90955b49223772a7d7df14317cd011073647055e`, artifact `8623785399`;
- every package created before the current source-backed parity review, dual-browser real 407 closure, unified four-profile creation acceptance, and PAC target-capability closure.

The earlier candidate failed owner QC because its layout diverged from original ZeroOmega and user-visible workflow defects remained. Later automation does not retroactively validate it.

## Latest integrated product evidence

### PAC target-capability closure

- **Integrated product Head:** `4233e45340ea0d1185e87270aa9c10cfcd2c7b6b`
- **Integration workflow:** run `30418355127`
- **Result:** repository verification, unit/component tests, complete Chromium E2E, unsupported-target injection evidence, product commit, and temporary workflow/patch cleanup all passed
- **Candidate status:** evidence only; not an installable owner-QC candidate

The slice proves:

- writable `proxy.settings.get/set` supports PAC Profile creation;
- original `proxy.register/registerProxyScript` targets disable PAC creation and display the localized explanation;
- targets without writable `proxy.settings` fail closed;
- the decision is wired into the real Options → New Profile flow rather than remaining a component-only boolean.

### Previously completed critical evidence

- Unified four-profile creation: run `30416441326`, product Head `febb7dcd8a5455bd31c499a88bf450039bc4a67b`.
- Genuine Chromium/Firefox proxy 407: run `30414496421`, rerun job `90458570753`, product Head `8c0d4ce735d0f59cec80442667442a8160dfc182`.

## Latest exact verification evidence

At human-authored Head `28d95bc600d3e8678a7b2c50f387a2754f001807`:

- CI `30418808732` passed full verification, dual-target builds, inspection, packaging, and artifact upload.
- Browser E2E `30418808739` passed Chromium, Firefox, and headed native Chromium Inspect.
- Parity Documentation `30418808735` passed the canonical matrix: `DONE=119`, `PARTIAL=7`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.
- Milestone 8 Visual Evidence `30418808737` passed all 24 light/dark × zh-CN/zh-TW captures.
- Build artifact `browser-builds`, ID `8711139469`, digest `sha256:7d035a7eabb751529f5e9fe7f3a03666741f4822f8e64213cdc3875d159ae086`, expiry 2026-10-27.
- Visual artifact `m8-visual-evidence-28d95bc600d3e8678a7b2c50f387a2754f001807`, ID `8711138863`, digest `sha256:3e17518f3b4608ae17dc1a79fdac58a256c5aa4c95a53a9320bc67f1b0231a34`, expiry 2026-08-28.

These remain verification evidence, not a consolidated owner-QC candidate, because four release-blocking `MUST_MATCH` rows remain.

## Verified product capabilities entering candidate preparation

- original-style full-tab Options with Settings, Profiles, and Actions;
- independent settings, action, and profile pages;
- Fixed, Switch, PAC, and Virtual normal profile creation, including one unified fresh-workspace browser chain;
- target-dependent PAC creation support and unsupported-state explanation;
- original profile-header Rename action, independent validation dialog, and attached Rule List/source rename transaction;
- imported and attached Rule List workflows;
- Draft/Applied/snapshot/browser-state separation;
- original schema-v1/v2 import, bounded online review, and byte-identical export round trip;
- Popup switching, current-site conditions, temporary rules, ownership blockers, and external import;
- Snapshot History and real rollback;
- English, Simplified Chinese, and Traditional Chinese typed UI;
- 24-image light/dark × zh-CN/zh-TW visual evidence workflow;
- genuine Chromium and Firefox Basic proxy 407 challenge, permission acquisition, background credential supply, and retry success;
- background-owned secrets excluded from ProfileSpec, normal backups, diagnostics, logs, command responses, and rendered UI.

## Open candidate blockers

Three release-blocking `MUST_MATCH` rows remain:

1. C-09 — protocol/target capability matrix.
2. D-04 — Switch condition-type matrix acceptance.
3. D-05 — condition-specific fields and Draft/Apply browser acceptance.

C-05 remains `UNCERTAIN` for modern Chromium/Firefox FTP behavior. A-14 and I-11 remain non-blocking visual `REFERENCE` rows.

## Candidate freeze prerequisites

A consolidated candidate may be declared only after all conditions below are satisfied:

1. `UI_AUDIT_MATRIX.md`, `MILESTONE_8_STATUS.md`, PR #11, and this file identify the same blocker set and exact candidate Head.
2. All `MUST_MATCH` rows are `DONE + VERIFIED` or have an explicit source-backed scope decision.
3. Exact-Head CI passes formatting, lint, type checks, unit/integration/component tests, dual-browser builds, audits, packaging, and artifact generation.
4. Exact-Head Browser E2E passes Chromium, Firefox, and headed native Inspect.
5. Exact-Head Parity Documentation and Visual Evidence pass.
6. No temporary patch script, one-off integration residue, generated browser output, or obsolete candidate pointer remains.
7. A fresh `browser-builds` artifact is downloaded, independently hashed, and recorded here.
8. The owner-QC checklist is updated with the exact artifact layout and browser versions.

## Repository-owner QC checklist

This checklist becomes executable only after a candidate section records the exact Head, workflow runs, artifact ID, SHA-256, and expiry.

### Shared acceptance gate

- Compare navigation, page separation, terminology, and profile workflow against ZeroOmega v3.5.0.
- Confirm an experienced original user does not need to relearn navigation or manually reconstruct an exported configuration.
- Use a real complex ZeroOmega/SwitchyOmega backup rather than repository fixtures alone.
- Record whether active traffic changed at every failed or cancelled operation.

### Chromium

1. Load the exact unpacked candidate artifact.
2. Confirm full-tab Options and the Settings / Profiles / Actions sidebar.
3. Confirm General, Interface, Import/Export, Theme, Snapshot History, Built-in Profiles, About, New Profile, and each profile type are independent pages.
4. Import a real complex backup and compare names, colors, ordering, routes, rules, Rule Lists, PAC definitions, bypass entries, startup route, and Quick Switch order.
5. Confirm review alone changes no traffic; test inactive import and `Import and use now`.
6. Exercise Fixed, Switch, PAC, Virtual, imported Rule List, Apply/Discard, profile exports, and Snapshot History rollback.
7. Exercise target-dependent PAC creation, Direct/System, result routes, permanent current-site rules, temporary rules, Inspect, ownership blockers, and diagnostics.
8. Test authenticated HTTP/HTTPS proxy activation, genuine challenge success, permission denial, and recovery without partial state.
9. Restart the browser and confirm active route, Applied state, theme, and history remain coherent.

### Firefox

1. Temporarily install the exact candidate artifact and grant private-window access before proxy activation.
2. Repeat the full-tab, real-backup, profile, Apply/Discard, Popup, history, rollback, and authenticated-route checks.
3. Confirm the New Profile dialog reports PAC support from the Firefox target capability rather than a hardcoded default.
4. Confirm Firefox requests authentication permission inside the original Apply gesture and completes a real 407 retry.
5. Revoke private-window permission and confirm activation fails visibly without partial committed state.
6. Restart Firefox and confirm route/theme/state recovery.

### Visual review

- Review all 24 screenshots: light/dark × zh-CN/zh-TW across Options General, Fixed Profile, Import/Export, Popup, Temporary Rules, and Network.
- Check clipping, density, hierarchy, disabled states, tables, dialogs, scroll behavior, contrast, and locale-specific expansion.
- Record mismatches against original information architecture separately from optional Nex visual styling.

## Bug-report format

For every failure record:

- browser and exact version;
- candidate Head and artifact SHA-256;
- page/profile type;
- backup source when relevant;
- exact steps;
- expected original-compatible behavior;
- observed behavior;
- whether active traffic changed;
- screenshot, console output, or stable error code.

## Closure rule

PR #11 remains Draft until one candidate recorded here passes Chromium and Firefox owner QC, visual review, and real complex-backup acceptance. Any failure requires a code or scope correction, a new exact Head, full automation, a fresh artifact digest, and another focused candidate pass.
