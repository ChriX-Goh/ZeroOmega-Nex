# Milestone 8 Consolidated Candidate and Repository-Owner QC

## Current candidate state

**Declared candidate:** `M8-OWNER-QC-1`

This is the first consolidated installable Milestone 8 owner-QC candidate after source-backed parity closure. PR #11 remains Draft. Declaring this candidate does not mean it is release-accepted; it must pass the repository-owner checklist below without silently replacing the artifact.

### Immutable candidate identity

- **Candidate Head:** `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`
- **Integrated product Head:** `23272bd9efc4abbcec5ca99c86d31a1353714e8b`
- **Product integration:** run `30456527030`
- **CI:** run `30456863674`
- **Browser E2E:** run `30456863926`
- **Parity Documentation:** run `30456863775`
- **Visual Evidence:** run `30456863885`
- **Artifact name:** `browser-builds`
- **Artifact ID:** `8725915254`
- **Artifact size:** `647775` bytes
- **Artifact expiry:** `2026-10-27T13:37:29Z`
- **GitHub artifact ZIP SHA-256:** `190dda95001cc381be4e2f9f95b7146314632ab8d3d87893347df9f994935b4c`
- **Independently downloaded ZIP SHA-256:** `190dda95001cc381be4e2f9f95b7146314632ab8d3d87893347df9f994935b4c`
- **Inner `browser-builds.tar.gz` SHA-256:** `1a3dffc3748c1c9479edbfa3be9769e49fded037717052fd151898ba3c86def3`
- **Visual artifact:** `m8-visual-evidence-46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`
- **Visual artifact ID:** `8725905691`
- **Visual artifact SHA-256:** `d5b3633941a5e7395d02e7286943878358c4b728552b0cbcd47d609b96d843ae`

The independently downloaded outer ZIP passed `unzip -t`; the inner archive passed `tar -tzf`. The outer SHA-256 exactly matches the digest reported by GitHub Actions.

### Exact package layout

Extract the GitHub artifact ZIP once:

```text
browser-builds.tar.gz
```

Extract that tarball once:

```text
browser-builds/
├── chrome-mv3/
│   ├── manifest.json
│   ├── background.js
│   ├── options.html
│   ├── popup.html
│   ├── temp-rules.html
│   ├── network.html
│   ├── chunks/
│   ├── assets/
│   ├── icon/
│   └── _locales/
└── firefox-mv3/
    ├── manifest.json
    ├── background.js
    ├── options.html
    ├── popup.html
    ├── temp-rules.html
    ├── network.html
    ├── chunks/
    ├── assets/
    ├── icon/
    └── _locales/
```

Both packages are Manifest V3 and report extension version `0.0.1`.

### Automation browser versions

- Chromium acceptance: Chrome for Testing `149.0.7827.55`, Playwright Chromium build `1228`.
- Firefox acceptance: Mozilla Firefox `152.0.6`.
- Runner: Ubuntu `24.04.4`, image `20260720.247.2`.

Owner QC must also record the repository owner's local browser versions; automation versions do not substitute for local installation evidence.

## Installation instructions

### Verify and extract

1. Download artifact `browser-builds`, ID `8725915254`.
2. Verify the downloaded ZIP SHA-256 is exactly:

   `190dda95001cc381be4e2f9f95b7146314632ab8d3d87893347df9f994935b4c`

3. Extract the outer ZIP. It must contain only `browser-builds.tar.gz`.
4. Verify the inner tarball SHA-256 is exactly:

   `1a3dffc3748c1c9479edbfa3be9769e49fded037717052fd151898ba3c86def3`

5. Extract the tarball. It must produce the two directories listed above.

### Chromium

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `browser-builds/chrome-mv3`.
5. Record the installed extension ID and local Chromium version before QC.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on**.
3. Select `browser-builds/firefox-mv3/manifest.json`.
4. Grant private-window access before proxy activation when required by the local Firefox installation.
5. Record the temporary extension ID and local Firefox version before QC.

Do not repackage, rebuild, edit, rename internal files, or substitute a newer branch Head during QC. Any changed package is a different candidate.

## Superseded artifacts

Do not install or accept:

- failed implementation Head `335229f762e6353ec14e57b5cc2695b6395d175c`, artifact `8622723587`;
- obsolete replacement Head `90955b49223772a7d7df14317cd011073647055e`, artifact `8623785399`;
- any package created before `M8-OWNER-QC-1`;
- CI or visual artifacts from another Head, even when newer.

## Candidate prerequisite result

All candidate-freeze prerequisites are satisfied:

1. The canonical matrix is `DONE=124`, `PARTIAL=2`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.
2. No release-blocking `MUST_MATCH` row remains.
3. CI passed formatting, lint, type checks, unit/integration/component tests, dual-browser builds, audits, packaging, and artifact generation.
4. Browser E2E passed Chromium, Firefox, and headed native Chromium Inspect. The initial exact-Head Chromium attempt encountered the existing external-Profile popup timing race; the unchanged-job rerun passed.
5. Parity Documentation and all 24 visual captures passed.
6. Temporary integration workflows and patch helpers were removed by the successful product integration.
7. The artifact was independently downloaded, structurally tested, and hashed.
8. The exact package layout and automation browser versions are recorded above.

The only remaining matrix rows are non-blocking visual references:

- A-14 — exact original skin;
- I-11 — exact Popup dimensions/pixels.

They are evaluated during owner visual QC and do not block candidate installation.

## Repository-owner QC checklist

Each item must be recorded as `PASS`, `FAIL`, or `NOT RUN`. A failure does not permit silently rebuilding or replacing this candidate.

### Identity and environment

- [ ] Downloaded Artifact ID is `8725915254`.
- [ ] Outer ZIP SHA-256 matches the declared value.
- [ ] Inner tarball SHA-256 matches the declared value.
- [ ] Chromium directory is exactly `browser-builds/chrome-mv3`.
- [ ] Firefox manifest is exactly `browser-builds/firefox-mv3/manifest.json`.
- [ ] Local Chromium version recorded.
- [ ] Local Firefox version recorded.
- [ ] Real backup source and backup date recorded.

### Shared acceptance gate

- [ ] Navigation, page separation, terminology, and profile workflow are compared against ZeroOmega v3.5.0.
- [ ] An experienced original user can locate normal actions without relearning the information architecture.
- [ ] A real complex ZeroOmega/SwitchyOmega backup imports without manual reconstruction.
- [ ] Names, colors, ordering, routes, rules, Rule Lists, PAC definitions, bypass entries, startup route, and Quick Switch order are compared.
- [ ] Review-only import changes no active traffic.
- [ ] Cancelled or failed operations leave active traffic unchanged.
- [ ] `Import and use now` changes traffic only after the explicit confirmed operation.
- [ ] Export → clear → restore → export is checked against the real imported configuration.

### Chromium

- [ ] Exact unpacked candidate loads successfully.
- [ ] Full-tab Options and Settings / Profiles / Actions sidebar are present.
- [ ] General, Interface, Import/Export, Theme, Snapshot History, Built-in Profiles, About, New Profile, and every profile type are independent pages.
- [ ] Fixed, Switch, PAC, Virtual, imported Rule List, Apply/Discard, profile exports, and Snapshot History rollback work.
- [ ] Original 4/10 Switch condition catalogs and condition-specific fields work on real data.
- [ ] Direct/System, Popup result routes, permanent current-site rules, temporary rules, Inspect, ownership blockers, and diagnostics work.
- [ ] Authenticated HTTP/HTTPS proxy activation completes a genuine challenge.
- [ ] Authentication permission denial fails visibly without partial committed state.
- [ ] Browser restart preserves active route, Applied state, theme, and coherent history.

### Firefox

- [ ] Exact temporary candidate loads successfully.
- [ ] Full-tab, real-backup, profile, Apply/Discard, Popup, history, rollback, and Switch condition checks pass.
- [ ] PAC support is reported from the Firefox target capability rather than a hardcoded default.
- [ ] Authentication permission is requested inside the original Apply gesture and a genuine 407 retry succeeds.
- [ ] Revoking required private-window access causes visible activation failure without partial committed state.
- [ ] Firefox restart preserves route, theme, Applied state, and history.

### Visual review

- [ ] All 24 automation screenshots are reviewed.
- [ ] Light and dark modes are checked in zh-CN and zh-TW.
- [ ] Clipping, density, hierarchy, disabled states, tables, dialogs, scroll behavior, contrast, and locale expansion are checked.
- [ ] A-14 skin differences are recorded separately from functional information-architecture defects.
- [ ] I-11 Popup dimension/pixel differences are recorded separately from Popup workflow defects.

## QC result

**Status:** `NOT RUN`

No repository-owner acceptance result has been recorded yet.

## Bug-report format

For every failure record:

- browser and exact version;
- candidate ID, Head, Artifact ID, outer ZIP SHA-256, and inner tarball SHA-256;
- page/profile type;
- backup source when relevant;
- exact steps;
- expected original-compatible behavior;
- observed behavior;
- whether active traffic changed;
- screenshot, console output, or stable error code.

## Closure rule

PR #11 remains Draft until `M8-OWNER-QC-1` passes Chromium and Firefox owner QC, visual review, real complex-backup acceptance, authenticated-route checks, restart/recovery, and rollback. Any failure requires a recorded defect and either:

1. a code or scope correction followed by a new exact Head, full automation, fresh artifact identity, and a new candidate ID; or
2. an explicit source-backed scope decision accepted before release.
