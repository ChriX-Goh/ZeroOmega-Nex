# Milestone 8 Release Candidate and Repository-Owner QC

## Frozen implementation evidence

- **Implementation head:** `335229f762e6353ec14e57b5cc2695b6395d175c`
- **Pull request:** #11 (`feat/m8-profile-workflow`)
- **Full CI:** run `30170265014` — passed
- **Browser E2E:** run `30170265029` — Chromium and Firefox jobs passed
- **Installable artifact:** `browser-builds` from CI run `30170265014`
- **Artifact ID:** `8622723587`
- **Artifact SHA-256:** `914428216f5fd3c8b9aaf5db4c7dd898b14868efc2c1e2d344a0adf96622b126`
- **Artifact expiry:** 2026-10-23

The artifact ZIP contains `browser-builds.tar.gz`. That archive contains complete unpacked extension directories for both `browser-builds/chrome-mv3/` and `browser-builds/firefox-mv3/`.

## Automated acceptance evidence

The frozen head passed the permanent repository checks for:

- Architecture boundaries, including the prohibition on Options/Popup direct proxy, authentication, and persistent-secret storage access.
- UI compatibility guards, keyboard focus requirements, responsive layout requirements, rollback confirmation, global error visibility, and verification-mode disclosure.
- ESLint and Prettier checks.
- Type checking for every workspace package and the extension.
- Root unit and integration tests plus Svelte component-rendering tests.
- Chromium and Firefox MV3 builds, manifest audits, dynamic-code/CSP bundle inspection, and staged browser-build packaging.
- Real Chromium extension automation: initialize, edit a profile, Apply, inspect snapshot history, open Popup, and switch to Direct.
- Real Firefox temporary-install automation with explicit test-only private-browsing grant: initialize, edit a profile, Apply, inspect snapshot history, open Popup, and switch to Direct.

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
2. MV3 CSP forbids runtime execution of generated PAC through `eval` or `Function`. Node/CI performs differential PAC execution; the extension runtime performs a reference-safety vector check and then requires browser installation confirmation. Snapshot history discloses which verification mode produced each record.
3. Legacy import targets ZeroOmega/SwitchyOmega schema-version-2 JSON or base64 backups. Import analysis is inactive; acceptance writes only to Draft and never activates traffic automatically.
4. Firefox PAC activation requires private-window access. Users must grant it in Firefox extension settings.
5. Auto Detect and file-based PAC behavior can be browser-target-dependent and is surfaced as a warning rather than silently treated as cross-browser exact.
6. General, Interface, and About navigation placeholders are not completed settings surfaces in Milestone 8. Profile editing, import review, history, Apply/Revert, rollback, and Popup switching are the acceptance scope.
7. Snapshot rollback requires the archived source revision. Corrupt, incomplete, cross-document, target-incompatible, or missing records are rejected.
8. The PR remains Draft until repository-owner installation and manual QC of this consolidated artifact are recorded.

## Repository-owner QC checklist

Use the frozen artifact above. Do not rebuild from a different commit for this acceptance pass.

### Chromium

1. Extract `browser-builds.tar.gz`.
2. Open the browser extension management page, enable developer mode, and load `browser-builds/chrome-mv3/` unpacked.
3. Open Options and confirm the default Fixed Profile is visible.
4. Rename the profile, change endpoint data to a safe test value, and confirm the Draft becomes dirty without changing active traffic.
5. Apply and confirm the working copy becomes clean and a snapshot appears in Configuration History.
6. Create a second successful snapshot, then use the two-step rollback control to restore the earlier snapshot.
7. Open Popup and switch among the Applied profile, Direct, and System; confirm the active marker follows browser-confirmed state.
8. Review a legacy import and confirm analysis alone does not modify Draft; acceptance modifies Draft but does not activate until Apply.
9. Exercise an authenticated HTTP/HTTPS route first without optional permission, then after granting it; confirm failure is visible and no partial proxy/auth state remains.
10. Restart the browser and confirm the last committed active route is restored.

### Firefox

1. Temporarily install `browser-builds/firefox-mv3/`.
2. Grant permission for the extension to run in private windows before testing proxy activation.
3. Repeat the Chromium workflow: Draft edit, Apply, history, second snapshot, rollback, Popup Direct/System switching, import-to-Draft, authenticated-route permission handling, and restart restoration.
4. Revoke private-window permission and confirm Apply fails visibly without partially changing committed workflow state.

## Closure rule

Record repository-owner QC results against this implementation head and artifact digest. If QC passes, update PR #11 from Draft to ready for review. If QC fails, keep the PR Draft, document the exact browser, version, step, observed state, and expected state, then fix and freeze a new implementation head and artifact.
