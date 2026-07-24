# Modern Browser Proxy Authentication Capabilities

Status: Milestone 2 capability contract researched against current Chrome and Firefox WebExtension documentation in July 2026.

This document defines what ZeroOmega Nex may rely on before any proxy-authentication permission or implementation is added.

## 1. Scope

This capability slice covers browser extension handling of an HTTP `407 Proxy Authentication Required` challenge through `webRequest.onAuthRequired`.

It does not cover:

- origin-server HTTP authentication (`401`);
- SOCKS username/password authentication;
- TLS interception;
- browser password-manager integration;
- operating-system proxy credential stores;
- the future optional native engine.

## 2. Browser capability matrix

| Capability                                     | Chromium MV3                                                      | Firefox MV3                                                                                | Nex decision                                   |
| ---------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Observe authentication challenges              | `webRequest`                                                      | `webRequest`                                                                               | Required only for authenticated-proxy support  |
| Supply credentials in ordinary store extension | `webRequestAuthProvider`                                          | `webRequestAuthProvider` or Firefox blocking support                                       | Use the cross-browser permission name          |
| Asynchronous response                          | `asyncBlocking` callback                                          | `asyncBlocking` callback from Firefox 128; Firefox also supports a Promise with `blocking` | Use `asyncBlocking` for one shared path        |
| `webRequestBlocking` in MV3                    | Not available to ordinary store extensions; policy-installed only | Supported                                                                                  | Firefox-only permission where required         |
| HTTP/HTTPS proxy challenge                     | Supported                                                         | Supported                                                                                  | Supported capability                           |
| SOCKS proxy challenge                          | Not delivered through `onAuthRequired`                            | Not delivered through `onAuthRequired`                                                     | Explicitly unsupported in browser-only mode    |
| Private/incognito requests                     | Only after user enables incognito access                          | Only after user enables private-window access                                              | Explicit capability state; never assume access |
| Background runtime                             | Extension service worker                                          | Nonpersistent event page                                                                   | State must survive background suspension       |

Shared asynchronous handling requires a candidate minimum of Chrome 120 and Firefox 128. Final release minimum versions remain a release decision, but an older target requires a separate adapter path rather than silently changing the contract.

## 3. Permission model

### Chromium candidate manifest capability

Authenticated proxy support requires:

```json
{
  "permissions": ["proxy", "webRequest", "webRequestAuthProvider"],
  "optional_host_permissions": ["<all_urls>"]
}
```

`webRequestBlocking` must not be requested by the ordinary Chromium MV3 build.

### Firefox candidate manifest capability

Comprehensive Firefox proxy authorization, including Firefox system requests, requires:

```json
{
  "permissions": ["proxy", "webRequest", "webRequestAuthProvider", "webRequestBlocking"],
  "optional_host_permissions": ["<all_urls>"]
}
```

The official Firefox proxy-authorization exception for browser/system requests specifically requires `webRequest`, `webRequestBlocking`, `proxy`, and `<all_urls>`.

### Runtime grant

The all-host permission must remain optional and be requested only when the user activates an HTTP/HTTPS proxy endpoint containing credential references.

The UI must explain that the permission allows the extension to receive authentication challenges for arbitrary destination URLs. Declining the grant leaves the profile importable and editable but marks authenticated routing unavailable.

Turning off the last authenticated HTTP/HTTPS proxy should offer to revoke the optional host permission. Revocation is user-visible capability management and must not destroy stored credentials.

## 4. Why `<all_urls>` is sometimes necessary

The `onAuthRequired` request filter describes destination requests, not merely the proxy server address. A proxy used as a profile fallback can carry traffic for arbitrary destinations, so a fixed list of destination origins cannot represent the capability.

This does not permit a return to the legacy global request architecture.

Allowed listener:

```text
webRequest.onAuthRequired
  filter: <all_urls>
  event frequency: only authentication challenges
  early guard: details.isProxy === true
```

Forbidden listeners for the authentication subsystem:

- `onBeforeRequest`;
- `onBeforeSendHeaders`;
- `onHeadersReceived`;
- `onCompleted`;
- `onErrorOccurred`;
- any request monitor or policy matcher attached for credential cleanup.

An authentication challenge listener is exceptional because it runs only on a `401`/`407` challenge. It must not become a general request observer.

## 5. Event registration and background lifecycle

Chrome extension service-worker event listeners must be registered synchronously at the top level so Chrome can wake the worker for the event. Firefox MV3 uses a nonpersistent event page and likewise cannot treat global memory as canonical state.

Nex requirements:

1. Register the supported `onAuthRequired` listener at module top level in the browser adapter.
2. Keep the listener function small and deterministic.
3. Load the active immutable authentication index from durable/session storage through the asynchronous callback path.
4. Never depend on initialization that registers the listener after an awaited database call.
5. Never depend on a global credential map surviving background suspension.
6. Keep actual secret values outside the normal runtime snapshot; the snapshot contains only secret references and endpoint associations.
7. Resolve the secret only after confirming the challenge is a proxy challenge for a known active endpoint.

## 6. Cross-browser response contract

Use `asyncBlocking` and invoke the supplied callback at most once.

Conceptual handler:

```text
onAuthRequired(details, callback)
  if not details.isProxy:
    callback({})
    return

  locate active endpoint by challenger host and port
  enforce private-window policy
  load bounded challenge-attempt state
  resolve the next credential reference
  callback({ authCredentials }) or callback({})
```

Chrome does not support returning a Promise from this event. The shared adapter therefore must not use an `async` listener return value as its primary contract.

## 7. Endpoint and credential selection

The active compiled snapshot produces a nonsecret authentication index:

```text
challenger host:port
  -> ordered endpoint credential references
  -> optional profile-wide fallback reference
```

Selection rules:

1. Ignore all events where `details.isProxy` is false.
2. Normalize challenger host and port without DNS resolution.
3. Match only endpoints referenced by the active snapshot.
4. Try exact endpoint-slot credentials in deterministic profile/reference order.
5. Use an imported legacy `all` credential only as the final explicit fallback.
6. Never try credentials belonging only to inactive profiles.
7. Never expose the credential value in traces, badges, errors, or migration reports.

## 8. Retry and loop prevention

Browsers call `onAuthRequired` again after rejected credentials. A handler that repeatedly returns the same bad credential can create an authentication loop.

Legacy ZeroOmega tracks attempts in a process-local map and cleans entries through global `onCompleted` and `onErrorOccurred` listeners. Nex must not copy that architecture.

Nex design:

- maintain a bounded challenge-attempt record keyed by browser request ID plus challenger endpoint;
- persist enough attempt state in browser-session storage to survive service-worker/event-page suspension;
- record only credential-reference IDs and counters, never secret values;
- apply a short expiration time;
- limit attempts to the number of eligible exact references plus at most one fallback;
- return no credentials after the limit;
- opportunistically purge expired entries during authentication events and extension lifecycle events;
- do not attach completion/error listeners to all web requests solely for cleanup.

## 9. Private/incognito behavior

Extensions do not receive private/incognito events unless the user enables that access.

Nex must expose three separate states:

- browser has not granted private access;
- browser has granted access but the user disabled proxy credential use in private windows;
- browser and user both permit credential use.

Use `extension.isAllowedIncognitoAccess()` to detect the browser grant.

The default policy should be conservative: imported credentials remain disabled for private windows until the user explicitly enables their use. `details.incognito` must be checked before resolving a secret.

Chrome's default spanning mode and Firefox's supported spanning behavior can share extension storage between normal and private contexts. The UI must state that enabling private proxy authentication uses the same credential store unless a future native/isolated secret provider is selected.

## 10. Unsupported SOCKS credentials

`webRequest.onAuthRequired` does not provide SOCKS proxy authentication challenges.

Migration behavior for a legacy credential associated with `socks4` or `socks5`:

- import the endpoint and secret into an inactive or capability-limited representation;
- classify browser-only authentication as unsupported;
- do not pretend the credential will be supplied;
- offer unauthenticated SOCKS only when the endpoint permits it;
- reserve authenticated SOCKS for the future native engine or another explicitly verified backend.

## 11. Architecture guard consequences

The current no-network-listener guard remains valid for all existing milestones. When authenticated-proxy implementation begins, the guard may be changed only through a new ADR and must allow exactly:

- `webRequest.onAuthRequired` in the authentication adapter;
- required browser-specific permissions;
- optional `<all_urls>` host access;
- no other `webRequest` event.

The guard must fail if `<all_urls>` or authentication permissions appear without the dedicated capability flag and adapter boundary.

## 12. Testing requirements for the implementation milestone

The future authentication implementation requires browser integration tests for:

- HTTP proxy success;
- HTTPS/TLS proxy success;
- origin `401` ignored;
- proxy `407` handled;
- wrong credential retry bounded;
- exact endpoint credential before fallback;
- inactive profile credential never used;
- service-worker/event-page restart between challenges;
- optional permission denied, granted, and revoked;
- private access denied and allowed;
- private credential policy disabled and enabled;
- SOCKS credential reported unsupported;
- Firefox system request behavior;
- no global completion/error request listeners;
- listener and secret-store failures returning no credential rather than hanging the request.

## 13. Official documentation baseline

- Chrome `webRequest` API and authentication handling: <https://developer.chrome.com/docs/extensions/reference/api/webRequest>
- Chrome extension service-worker events: <https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/events>
- Chrome extension service-worker lifecycle: <https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle>
- Chrome permission model: <https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions>
- Chrome incognito manifest behavior: <https://developer.chrome.com/docs/extensions/reference/manifest/incognito>
- MDN `webRequest.onAuthRequired`: <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onAuthRequired>
- MDN background manifest behavior: <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background>
- MDN incognito manifest behavior: <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/incognito>

This research document adds no manifest permission and no runtime listener.
