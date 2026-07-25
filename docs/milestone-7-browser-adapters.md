# Milestone 7 — Browser Adapters and Atomic Activation

## Purpose

Milestone 7 installs verified PAC runtime snapshots into Chromium and Firefox without moving normal routing decisions into extension JavaScript.

## Atomic activation contract

A candidate snapshot becomes active only after all of these steps succeed:

1. Persist the candidate snapshot.
2. Capture the browser's current proxy state.
3. Persist a pending activation record containing the rollback context.
4. Install the candidate PAC configuration.
5. Read the effective browser setting back.
6. Confirm that this extension controls the setting and that the effective PAC script matches the verified snapshot.
7. Commit the candidate as active and last-known-good.

Installation or confirmation failure restores the previous verified snapshot. A failed first activation restores the captured browser state. If rollback itself fails, the candidate is never recorded as active and the failure remains persisted.

## Restart recovery

The background lifecycle performs two ordered operations:

1. Recover any pending activation left by an interrupted worker or browser shutdown.
2. Confirm or reinstall the previously active verified snapshot.

Recovery state and verified snapshots are stored in a versioned `storage.local` namespace and validated on every read. Corrupt records and mismatched snapshot identities are rejected.

## Chromium adapter

- Uses regular-scope `proxy.settings`.
- Installs `mode: pac_script` with inline PAC data and `mandatory: true`.
- Maps `levelOfControl` into the shared capability contract.
- Confirms exact script equality after installation.
- Supports Direct, System, clear-control, and baseline restoration operations.

## Firefox adapter

- Uses `proxy.settings` with `proxyType: autoConfig`.
- Encodes the generated PAC script in a data URL.
- Requires private-window access before installation because the proxy setting affects all windows.
- Retains `proxy.onError` PAC runtime failures and rejects confirmation when an error was reported.
- Pins Firefox `strict_min_version` to `91.1.0` for the secured proxy API.

## Proxy authentication boundary

Proxy authentication is separate from PAC generation and is disabled by default.

- Required extension permissions remain only `proxy` and `storage`.
- Chromium authentication declares optional `webRequest` and `webRequestAuthProvider` permissions.
- Firefox authentication declares optional `webRequest` and `webRequestBlocking` permissions.
- Optional host access is limited to `http://*/*` and `https://*/*`.
- The background checks existing grants but never requests permissions during startup.
- The listener is registered only when explicit HTTP/HTTPS proxy bindings and separately stored secret values already exist.
- Only `isProxy=true` Basic or Digest challenges are considered.
- Ordinary website authentication is ignored.
- Credential attempts are bounded per request and by a finite request-ID cache.
- SOCKS authentication is reported as unsupported rather than being misrepresented as HTTP authentication.
- No `proxy.onRequest`, `<all_urls>`, request-completion listener, or request-error listener is used.

Firefox system-request proxy authentication would require broader `<all_urls>` access. That broader mode is intentionally outside this milestone.

## Permission and artifact audit

Generated Chromium and Firefox MV3 manifests must contain:

- Required permissions: `proxy`, `storage` only.
- Browser-specific optional authentication permissions only.
- Optional HTTP and HTTPS host patterns only.
- No required host permissions.
- No `<all_urls>`.

Generated background bundles are audited for the absence of global proxy-decision listeners, completion/error monitoring, and permission-request calls.

## Failure and integration testing

The suite covers:

- Competing extension and uncontrollable proxy state.
- Installation and confirmation failure.
- Previous-snapshot and browser-baseline rollback.
- Rollback failure.
- Interrupted activation recovery.
- Browser restart and lost-setting restoration.
- Chromium and Firefox settings mapping.
- Firefox private-window denial and PAC runtime errors.
- Persistent state corruption and snapshot identity mismatch.
- Authentication binding ambiguity, missing secrets, protocol mismatch, retry limits, permission denial, and browser-specific listener modes.
- Both browser production builds and final manifest inspection.
