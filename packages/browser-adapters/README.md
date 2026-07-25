# Browser Adapters

This package owns the control-plane boundary between verified runtime snapshots and browser proxy APIs.

Activation is transactional:

1. Persist the candidate snapshot and pending activation intent.
2. Confirm that ZeroOmega Nex can control the browser proxy setting.
3. Install the verified PAC snapshot.
4. Read the effective setting back and confirm ownership and identity.
5. Commit the candidate as active only after confirmation succeeds.
6. Restore the previous verified snapshot or captured browser state if installation or confirmation fails.

The browser-neutral activation state machine is tested through injected drivers and repositories. Chromium, Firefox, extension storage, authentication, and background lifecycle integrations are separate adapters around that core.

Chromium uses a regular-scope `pac_script` configuration with an inline script and `mandatory: true`. Firefox uses `proxyType: autoConfig` with a generated data URL, requires private-window access before installation, and treats reported PAC runtime errors as failed confirmation.

The persistent repository stores activation state and verified snapshots under a versioned `storage.local` namespace. It validates records on every read, rejects corrupted or mismatched snapshot identities, and preserves pending rollback context across service-worker restarts.

The extension background performs recovery before normal restoration. An interrupted activation is rolled back first; only then is the last verified active snapshot confirmed or reinstalled. No profile is activated merely because the extension restarted.

Proxy authentication is a separate, default-disabled capability. It registers only after the browser has already granted the optional WebRequest authentication permissions and only when explicit HTTP or HTTPS proxy bindings and separately stored secret values exist. The listener filters only HTTP and HTTPS URLs, ignores ordinary website authentication, limits credential retries per request, and never supports SOCKS authentication by pretending it is HTTP authentication. Full Firefox authentication for browser system requests would require broader `<all_urls>` access and is therefore not enabled by this contract.

A conflicting extension or browser policy is reported explicitly. The package never claims a candidate is active after a failed confirmation or rollback, and it never moves per-request routing into extension JavaScript.
