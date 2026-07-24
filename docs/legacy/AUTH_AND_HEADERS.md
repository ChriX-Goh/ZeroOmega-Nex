# Legacy Credentials and Download Headers

Status: source-derived compatibility and security inventory for ZeroOmega `v3.5.0`.

## 1. Proxy credential shape

A `FixedProfile` may contain an `auth` object. Credential entries are selected by proxy slot rather than by arbitrary URL:

```json
{
  "auth": {
    "fallbackProxy": {
      "username": "<redacted>",
      "password": "<redacted>"
    },
    "all": {
      "username": "<redacted>",
      "password": "<redacted>"
    }
  }
}
```

Recognized slot keys correspond to the fixed-profile proxy properties:

- `proxyForHttp`
- `proxyForHttps`
- `proxyForFtp`
- `fallbackProxy`
- `all` as a final credential fallback

Each slot value is passed to the browser as an authentication credential object containing `username` and `password`.

## 2. Legacy runtime behavior

The upstream runtime:

1. Collects every referenced profile containing `auth`.
2. Maps slot-specific credentials to the configured proxy host and port.
3. Keeps multiple candidate credentials when several profiles reference the same proxy endpoint.
4. Tries endpoint-specific credentials before `all` fallbacks.
5. Tracks attempts by request ID to avoid retrying the same candidate indefinitely.
6. Returns credentials only when the browser reports that the challenge is for a proxy.

The implementation registers `onAuthRequired`, `onCompleted`, and `onErrorOccurred` listeners over all request URLs. The two completion listeners exist mainly to clear request-attempt state.

## 3. Nex security classification

Proxy credentials are user intent but also secrets.

Initial classification:

- Credential slot association: `map`.
- Username and password values: `map-secret` pending the final ProfileSpec vocabulary.
- Upstream plaintext storage behavior: do not reproduce.
- Empty `auth` object: preserve only when needed for migration reporting; it has no routing effect.
- Unknown auth slot: `investigate`, then preserve or reject explicitly.

Required Nex behavior:

- Import credentials only after explicit user acknowledgement that the source contains plaintext secrets.
- Convert secret values into credential references rather than ordinary exported ProfileSpec fields.
- Exclude secret values from normal export, sync, logs, migration reports, diagnostics, and crash bundles.
- Display only whether credentials exist and which proxy slot they belong to.
- Provide a separate opt-in secret backup mechanism if ever implemented.
- Never copy source credential values into test fixtures.

## 4. Nex runtime implication

Proxy authentication is different from proxy policy selection. Supporting it does not justify restoring request-time rule matching.

The preferred design is:

- Install PAC or fixed proxy configuration normally.
- Enable an authentication listener only while an active snapshot references credentials.
- Handle only proxy challenges.
- Index credentials by normalized challenger host and port.
- Use a bounded, expiring attempt cache instead of permanent `onCompleted` and `onErrorOccurred` listeners over every request.
- Disable the listener and clear its secret-bearing memory when no active credential reference remains.

A browser whose API requires broader permissions must report that capability and request permission only when the user activates credential support.

## 5. Download header shape

Updatable PAC and rule-list profiles may contain:

```json
{
  "headers": [
    {
      "name": "X-Fixture-Header",
      "value": "fixture-value"
    }
  ]
}
```

The upstream update path:

- Iterates the array in order.
- Ignores entries with an empty header name.
- Converts entries into a name-value dictionary before fetching.
- Overwrites an earlier value when the same exact name appears again.
- Uses the resulting headers when fetching `pacUrl` or `sourceUrl`.

Header-name case normalization depends on the underlying browser fetch layer and still requires platform tests.

## 6. Nex header classification

Header names and values express user intent, but some values are secrets. Examples include authorization tokens, cookies, signed URLs split across headers, and private subscription keys.

Initial classification:

- Header order: `map` because duplicate resolution depends on order.
- Header name: `map` after validation.
- Header value: secret-aware user intent.
- Empty-name entry: `downgrade` by ignoring it with a migration warning, matching observable legacy fetch behavior.
- Duplicate exact name: preserve order and report that the last value wins.
- Forbidden browser-controlled header: preserve as inactive metadata or reject activation with a precise reason.

Required Nex behavior:

- Treat every imported header value as sensitive by default.
- Redact values in UI summaries and migration reports.
- Keep secret header values outside ordinary exports and sync.
- Validate names and enforce total header count and size limits.
- Reject line breaks and other request-smuggling input.
- Never allow remote rule content to add or modify request headers.

## 7. Compatibility fixtures

Fixtures use literal `<redacted>` values. They validate serialized shape without embedding usable credentials or tokens.

Behavioral vectors still needed:

- Slot-specific credential selected for the matching challenger endpoint.
- `all` fallback selected only after endpoint-specific candidates.
- Multiple profiles sharing one proxy endpoint.
- Authentication failure and bounded retry behavior.
- Empty auth object.
- Empty header name ignored.
- Duplicate header name uses the last value.
- Header-name case differences.
- Header values containing Unicode and size-limit boundaries.

## 8. Unresolved questions

- Exact browser-store permission requirements for authenticated proxies on current Firefox and Chromium releases.
- Whether private-window credentials need separate lifecycle handling.
- Whether legacy backup exports always include plaintext credentials and header values.
- Whether sync backends transform or encrypt these values outside the generic option transformation path.
- Final operating-system credential-store design for the optional native engine.
