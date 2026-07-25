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

A conflicting extension or browser policy is reported explicitly. The package never claims a candidate is active after a failed confirmation or rollback, and it never moves per-request routing into extension JavaScript.
