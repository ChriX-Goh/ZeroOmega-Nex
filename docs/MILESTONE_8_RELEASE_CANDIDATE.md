# Milestone 8 Consolidated Candidate and Repository-Owner QC

## Current candidate state

**No installable Milestone 8 replacement candidate is currently declared.**

PR #11 remains Draft. Verification artifacts, historical packages, visual artifacts, and the integrated product Head are evidence inputs; none is an owner-QC candidate until this file records one exact human-authored Head, fresh CI artifact, artifact digest, and current checklist.

## Superseded artifacts

The following artifacts must not be installed or accepted:

- failed implementation Head `335229f762e6353ec14e57b5cc2695b6395d175c`, artifact `8622723587`;
- obsolete replacement Head `90955b49223772a7d7df14317cd011073647055e`, artifact `8623785399`;
- every other package created before the current canonical parity review and real dual-browser 407 closure.

The earlier candidate failed owner QC because its layout diverged from original ZeroOmega, global and profile settings occupied the wrong surfaces, and user-visible defects remained. Later automation does not retroactively validate that artifact.

## Latest integrated product evidence

- **Integrated product Head:** `8c0d4ce735d0f59cec80442667442a8160dfc182`
- **Integration workflow:** run `30414496421`
- **Successful rerun job:** `90458570753`
- **Result:** repository verification, Chromium E2E, Firefox E2E, genuine 407 authentication, evidence upload, product commit, and temporary-patch cleanup all passed
- **Candidate status:** evidence only; not installable owner-QC candidate

The bot-authored integration Head produced `action_required` workflow shells with no jobs. One human-authored reconciliation Head must therefore receive fresh exact-Head CI, Browser E2E, Parity Documentation, and Visual Evidence before a candidate can be frozen.

## Verified product capabilities entering candidate preparation

- original-style full-tab Options with Settings, Profiles, and Actions;
- independent settings, action, and profile pages;
- Fixed, Switch, PAC, and Virtual normal profile creation;
- imported and attached Rule List workflows;
- Draft/Applied/snapshot/browser-state separation;
- original schema-v1/v2 import, bounded online review, and byte-identical export round trip;
- Popup switching, current-site conditions, temporary rules, ownership blockers, and external import;
- Snapshot History and real rollback;
- English, Simplified Chinese, and Traditional Chinese typed UI;
- 24-image light/dark × zh-CN/zh-TW visual evidence workflow;
- genuine Chromium and Firefox Basic proxy 407 challenge, permission acquisition, background credential supply, and retry success;
- background-owned secrets excluded from ProfileSpec, normal backups, diagnostics, logs, command responses, and rendered UI.

## Candidate freeze prerequisites

A consolidated candidate may be declared only after all conditions below are satisfied:

1. Canonical `UI_AUDIT_MATRIX.md`, `MILESTONE_8_STATUS.md`, PR #11, and this file identify the same exact Head and blocker set.
2. All `MUST_MATCH` rows are `DONE + VERIFIED` or have an explicit source-backed scope decision.
3. Exact-Head CI passes formatting, lint, type checks, unit/integration/component tests, dual-browser builds, audits, packaging, and artifact generation.
4. Exact-Head Browser E2E passes Chromium, Firefox, and headed native Inspect.
5. Exact-Head Parity Documentation and Visual Evidence pass.
6. No temporary patch script, one-off integration residue, generated browser output, or obsolete candidate pointer remains.
7. A fresh `browser-builds` artifact is downloaded, independently hashed, and recorded here.
8. The owner-QC checklist below is updated with the exact artifact layout and browser versions.

## Repository-owner QC checklist

This checklist becomes executable only after a candidate section records the exact Head, workflow runs, artifact ID, SHA-256, and expiry.

### Shared acceptance gate

- Compare navigation, page separation, terminology, and profile workflow against original ZeroOmega v3.5.0.
- Confirm an experienced original user does not need to relearn navigation or manually reconstruct an exported configuration.
- Use a real complex ZeroOmega/SwitchyOmega backup rather than only repository fixtures.
- Record whether active traffic changed at every failed or cancelled operation.

### Chromium

1. Load the exact unpacked candidate artifact.
2. Confirm full-tab Options and the Settings / Profiles / Actions sidebar.
3. Confirm General, Interface, Import/Export, Theme, Snapshot History, Built-in Profiles, About, New Profile, and each profile type are independent pages.
4. Import a real complex backup and compare names, colors, ordering, routes, rules, Rule Lists, PAC definitions, bypass entries, startup route, and Quick Switch order.
5. Confirm review alone changes no traffic; test both inactive import and `Import and use now`.
6. Exercise Fixed, Switch, PAC, Virtual, imported Rule List, Apply/Discard, profile exports, and Snapshot History rollback.
7. Exercise Direct/System, result routes, permanent current-site rules, temporary rules, Inspect, ownership blockers, and diagnostics.
8. Test authenticated HTTP/HTTPS proxy activation, genuine challenge success, permission denial, and recovery without partial state.
9. Restart the browser and confirm active route, Applied state, theme, and history remain coherent.

### Firefox

1. Temporarily install the exact candidate artifact and grant private-window access before proxy activation.
2. Repeat the full-tab, real-backup, profile, Apply/Discard, Popup, history, rollback, and authenticated-route checks.
3. Confirm Firefox requests authentication permission inside the original Apply gesture and completes a real 407 retry.
4. Revoke private-window permission and confirm activation fails visibly without partial committed state.
5. Restart Firefox and confirm route/theme/state recovery.

### Visual review

- Review all 24 generated screenshots: light/dark × zh-CN/zh-TW across Options General, Fixed Profile, Import/Export, Popup, Temporary Rules, and Network.
- Check clipping, density, hierarchy, disabled states, tables, dialogs, scroll behavior, contrast, and locale-specific expansion.
- Record any mismatch against the original information architecture separately from optional Nex visual styling.

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

PR #11 remains Draft until one candidate recorded in this file passes Chromium and Firefox owner QC, visual review, and real complex-backup acceptance. A failure requires a code or scope correction, new exact Head, full automation, fresh artifact digest, and another focused candidate pass.
