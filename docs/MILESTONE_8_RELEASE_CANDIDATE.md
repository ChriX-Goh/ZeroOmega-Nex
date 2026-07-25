# Milestone 8 Replacement Release Candidate and Repository-Owner QC

## Superseded candidate

The earlier implementation head `335229f762e6353ec14e57b5cc2695b6395d175c` and artifact `8622723587` failed repository-owner QC on 2026-07-26. Its layout diverged from original ZeroOmega, detailed and global settings were crowded into the wrong surfaces, and user-visible bugs remained. Do not install or use that artifact for further acceptance.

## Frozen replacement evidence

- **Implementation head:** `90955b49223772a7d7df14317cd011073647055e`
- **Pull request:** #11 (`feat/m8-profile-workflow`), Draft
- **Full CI:** run `30174300115` — passed
- **Browser E2E:** run `30174300078` — Chromium and Firefox jobs passed
- **Installable artifact:** `browser-builds` from CI run `30174300115`
- **Artifact ID:** `8623785399`
- **Artifact SHA-256:** `810b6818b746312c16089951acbf9b8f7f7b588f2205bf5fd791f6f21611d48d`
- **Artifact expiry:** 2026-10-23

The artifact ZIP contains `browser-builds.tar.gz`. That archive contains complete unpacked extension directories for both `browser-builds/chrome-mv3/` and `browser-builds/firefox-mv3/`.

## What changed after the failed QC

- Options now opens as a complete browser tab.
- The original ZeroOmega three-group sidebar is restored: Settings, Profiles, and Actions.
- Interface, General, Import / Export, Theme, Snapshot History, Built-in Profiles, New Profile, and every user profile are independent right-hand pages.
- Startup and Quick Switch settings were removed from profile editors and placed only on General.
- A single `New profile…` page replaces the five permanently visible creation buttons.
- Profile editors use the full right-hand workspace rather than a narrow stacked card column.
- Original ZeroOmega/SwitchyOmega backup files can be selected directly.
- `Import and use now` performs import plus verified Apply as one explicit user action.
- Automatic, Light, and Dark themes are available; Automatic is the default and follows the operating system.
- Product identity now reports Milestone 8.

## Automated acceptance evidence

The replacement head passed:

- Original-layout, full-tab, independent-page, theme, import, architecture, accessibility, responsive, rollback, and global-error guards.
- ESLint and Prettier checks.
- Type checking for every workspace package and the extension, with zero Svelte diagnostics.
- 274 root unit/integration tests and 6 Svelte component-rendering tests.
- Chromium and Firefox MV3 builds, manifest audits, dynamic-code/CSP inspection, and packaging.
- Chromium real-browser automation covering:
  - full Options initialization,
  - Automatic → Dark → Automatic theme changes,
  - profile edit and Apply,
  - snapshot history,
  - Popup Direct switching,
  - upload of a real schema-v2 ZeroOmega fixture file,
  - compatibility analysis,
  - `Import and use now`,
  - presence of imported profiles after activation.
- Firefox real-browser automation covering profile edit, Apply, restored-layout history navigation, Popup switching, and private-window proxy prerequisites.

## Permission rationale

### Required permissions

- `storage`: persists ProfileSpec working-copy state, immutable revisions, verified PAC snapshots, activation state, and separately stored authentication material.
- `proxy`: installs and confirms PAC, Direct, and System proxy modes through the browser-native proxy API.

### Optional permissions

- Chromium: `webRequest` and `webRequestAuthProvider`.
- Firefox: `webRequest` and `webRequestBlocking`.
- Optional host access is restricted to `http://*/*` and `https://*/*`.

Optional request permissions and host access are requested only when a reachable HTTP/HTTPS proxy endpoint uses credentials. The authentication listener is registered dynamically and removed when no authenticated route is active. The extension does not request `<all_urls>` and does not use an extension-side global routing callback.

Firefox additionally requires the user to allow the extension in private windows before Firefox permits extension-controlled proxy settings that affect all windows. The product rejects activation when this prerequisite is absent; the E2E runner grants it explicitly through Firefox WebDriver BiDi.

## Known limitations and explicit boundaries

1. Browser-only authenticated SOCKS4/SOCKS5 routes are unsupported. Reachable SOCKS credentials are rejected before traffic changes.
2. MV3 CSP forbids runtime execution of generated PAC through `eval` or `Function`. Node/CI performs differential PAC execution; extension runtime performs reference-safety checks and browser installation confirmation.
3. Direct legacy migration targets ZeroOmega/SwitchyOmega schema-version-2 JSON or base64 backups. Corrupt, unknown, internally inconsistent, or unsupported records are rejected with migration details rather than guessed.
4. Selecting a backup file does not alter traffic. `Import and use now` is the explicit activation action; `Import without activating` remains available.
5. Firefox PAC activation requires private-window access.
6. Auto Detect and file-based PAC behavior can be browser-target-dependent and is shown as a warning.
7. Snapshot rollback requires the archived source revision; corrupt, cross-document, target-incompatible, or missing records are rejected.
8. Automated tests cannot establish visual fidelity or usability by themselves. The repository owner’s comparison with original ZeroOmega is a release gate.
9. This replacement candidate may still contain bugs not covered by the current suite. Record exact reproduction steps rather than accepting a superficially green build.

## Repository-owner QC checklist

Use only the frozen artifact above. Do not reuse the rejected artifact and do not rebuild from another commit for this pass.

### Chromium — original-layout and migration gate

1. Extract `browser-builds.tar.gz`, enable developer mode, and load `browser-builds/chrome-mv3/` unpacked.
2. Open Options from the extension and confirm it opens in a complete browser tab.
3. Compare against original ZeroOmega: confirm the fixed left sidebar has Settings, Profiles, and Actions; profile selection changes only the right-hand page.
4. Confirm Interface, General, Import / Export, Theme, Snapshot History, Built-in Profiles, New Profile, and each user profile are independent pages.
5. Confirm Startup and Quick Switch appear only under General, not underneath profile details.
6. Open Theme. Verify Automatic is selected by default, follows the system appearance, and Light/Dark overrides persist after reopening Options.
7. Export a real configuration from the original ZeroOmega/SwitchyOmega installation and select that file under Import / Export.
8. Review migration totals, then click `Import and use now`. Confirm profiles, colors, startup selection, Quick Switch order, switching rules, rule lists, PAC definitions, bypass entries, and supported credentials appear without manual rebuilding.
9. Open several imported Fixed, Switch, Rule List, PAC, and Auto Detect profiles. Check field values and ordering against the original extension.
10. Confirm Popup immediately uses the imported Applied configuration and active marker.
11. Edit a profile, confirm the Draft becomes dirty without changing traffic, then Apply and verify history records the snapshot.
12. Create a second snapshot and use two-step rollback to restore the earlier one.
13. Exercise Direct and System switching from Popup.
14. Exercise an authenticated HTTP/HTTPS route first without optional permission, then after granting it; confirm no partial state remains after failure.
15. Restart the browser and confirm the last committed active route and chosen theme are restored.
16. Judge the primary requirement explicitly: an experienced original ZeroOmega user should not need to relearn the navigation or reconstruct an exported configuration.

### Firefox

1. Temporarily install `browser-builds/firefox-mv3/`.
2. Grant permission for the extension to run in private windows before testing proxy activation.
3. Repeat the full-tab layout, independent pages, themes, real backup import, profile comparison, Apply, history, rollback, Popup, authentication, and restart checks above.
4. Revoke private-window permission and confirm Apply fails visibly without partially changing committed workflow state.

## Bug-report format for this QC

For every failure, record:

- browser and exact version,
- page/profile type,
- imported backup type when relevant,
- exact steps,
- expected behavior based on original ZeroOmega,
- observed behavior,
- whether active traffic changed,
- screenshot or console error when available.

## Closure rule

Keep PR #11 Draft until this replacement candidate passes both browser checks. A failure requires a code fix, new implementation head, full CI and Browser E2E rerun, new artifact digest, and another focused QC pass. Automated green status alone is not sufficient.
