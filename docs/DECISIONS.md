# Architecture Decision Log

This file records decisions that materially affect product behavior, compatibility, architecture, security, or delivery order. New decisions append entries; do not rewrite history without noting supersession.

## ADR-001 — Clean rewrite rather than continued ZeroOmega patching

**Status:** Accepted

**Decision:** Build ZeroOmega Nex as a new implementation with an explicit legacy importer. Do not fork the old CoffeeScript/AngularJS runtime as the primary architecture.

**Reason:** The main performance risk is architectural: request-time extension callbacks and duplicated monitoring. Carrying the old runtime forward would preserve the same coupling and make correctness harder to prove.

**Consequence:** Familiar user workflows and data concepts are retained, but internal code and storage are new.

## ADR-002 — Preserve existing user profiles through import

**Status:** Accepted

**Decision:** ZeroOmega `schemaVersion: 2` compatibility is a first-class requirement. Users must not manually recreate ordinary profiles.

**Reason:** Existing profiles represent substantial user effort and are part of the product's practical value.

**Consequence:** Legacy inventory, fixtures, migration reports, and differential decision tests precede feature expansion.

## ADR-003 — Familiar UI, new internals

**Status:** Accepted

**Decision:** Maintain a layout and interaction model recognizably close to ZeroOmega: profile navigation, profile colors, central editor, popup switching, and explicit apply behavior.

**Reason:** Compatibility includes workflow and muscle memory, not only JSON.

**Consequence:** Visual parity is subordinate to accessibility, correctness, and maintainability; pixel-perfect cloning is not required.

## ADR-004 — PAC-first browser data plane

**Status:** Accepted

**Decision:** Normal routing uses precompiled PAC installed through browser-native proxy APIs.

**Reason:** Ordinary requests should not wait for extension JavaScript to parse URLs and scan rules.

**Consequence:** Compilation occurs when configuration or rule sources change. Browser requests consume compiled output directly.

## ADR-005 — No global Firefox proxy listener

**Status:** Accepted

**Decision:** ZeroOmega Nex must not register an extension-side `<all_urls>` proxy decision listener in normal operation.

**Reason:** This is the principal architecture pattern capable of stalling Firefox navigation and affecting other extensions.

**Consequence:** Features requiring request details unavailable to PAC are capability-gated and use narrowly filtered compatibility handling only when necessary.

## ADR-006 — TypeScript control plane and UI

**Status:** Accepted

**Decision:** Use strict TypeScript for browser APIs, control flow, storage coordination, messages, and Svelte UI.

**Reason:** WebExtension integration is JavaScript-native; TypeScript gives strong boundary contracts without forcing browser APIs through WASM wrappers.

**Consequence:** Strict compiler settings and package boundaries are mandatory.

## ADR-007 — Rust/WASM after semantic parity

**Status:** Accepted

**Decision:** Rust/WASM is a later optimization for pure policy work, introduced only after the public model, reference interpreter, fixtures, and differential tests exist.

**Reason:** A faster implementation of incorrectly understood legacy semantics would increase project risk.

**Consequence:** Initial compiler and interpreter may be TypeScript. Rust adoption requires measured benefit and zero behavioral regression.

## ADR-008 — Stable user format, derived runtime snapshots

**Status:** Accepted

**Decision:** Separate versioned ProfileSpec from compiled PAC, indexes, caches, browser capability data, and diagnostics.

**Reason:** User intent needs long-term compatibility; runtime artifacts need freedom to evolve.

**Consequence:** Generated artifacts are reproducible and never treated as the canonical user configuration.

## ADR-009 — Atomic activation and rollback

**Status:** Accepted

**Decision:** New configurations and rule-source updates compile into inactive candidate snapshots. Activation occurs only after validation, verification, installation, and confirmation.

**Reason:** Partial configuration updates can break all browsing.

**Consequence:** The previous confirmed snapshot remains available and active on failure.

## ADR-010 — Diagnostics are opt-in and bounded

**Status:** Accepted

**Decision:** Do not permanently monitor and retain all browser requests. Diagnostics run only during explicit, bounded sessions.

**Reason:** Permanent monitoring creates performance, privacy, and memory costs.

**Consequence:** Diagnostics use time/entry limits, ring buffers, and privacy-preserving defaults. A persistent preference may expose the feature, but listeners start only after an explicit browser-session action and stop on session end, disablement, permission revocation, or browser restart. Records use session storage, strip URL credentials/query/fragment, exclude headers/bodies/cookies/response content, and expose only aggregate summaries to Popup.

## ADR-011 — Browser differences remain explicit

**Status:** Accepted

**Decision:** Firefox and Chromium use separate adapters and capability reporting rather than pretending their proxy APIs and background lifecycles are identical.

**Reason:** False abstraction creates silent compatibility errors.

**Consequence:** Common interfaces stay small; platform behavior and tests remain separate.

## ADR-012 — Milestone gates are mandatory

**Status:** Accepted

**Decision:** Do not combine foundation, importer, compiler, UI, Rust, and native-engine work into one uncontrolled implementation phase.

**Reason:** The project is vulnerable to context loss and architectural drift. Each stage needs permanent acceptance evidence.

**Consequence:** `docs/DELIVERY_PLAN.md` controls order. Architecture-changing shortcuts require a new ADR before code merges.

## ADR-013 — Optional all-host exception for proxy authentication challenges

**Status:** Accepted

**Decision:** Browser-only authentication for HTTP and HTTPS proxy endpoints may use exactly one `webRequest.onAuthRequired` listener with an `<all_urls>` request filter. All-host access remains optional and is requested only when an authenticated proxy is activated. The listener handles proxy challenges only and is not a proxy-decision, monitoring, or general request listener.

**Reason:** Browser `onAuthRequired` filters describe destination requests. A fallback proxy can carry arbitrary destination traffic, so comprehensive authentication cannot be represented by a fixed destination list. At the same time, a `407` challenge event is sparse and fundamentally different from evaluating or recording every ordinary request.

**Alternatives considered:** Requiring all-host permission at installation was rejected as excessive. Reintroducing global completion/error listeners for retry cleanup was rejected because it recreates permanent request overhead. Declaring authenticated browser proxies entirely unsupported was rejected because modern Chromium and Firefox provide a bounded challenge API for HTTP/HTTPS proxies.

**Consequences:** Chromium and Firefox use separate permission manifests. Chromium MV3 uses `webRequestAuthProvider` without ordinary `webRequestBlocking`; Firefox may require `webRequestBlocking`, especially for system-request proxy authorization. The shared response path uses `asyncBlocking`. SOCKS authentication remains unsupported in browser-only mode. Retry state must survive background suspension without storing secrets and must not be cleaned through all-request listeners. The architecture guard may later allow this exact adapter boundary only; this ADR does not add permissions or listeners during Milestone 2.

## ADR-014 — Import acceptance and authentication preparation are background transactions

**Status:** Accepted

**Decision:** Legacy import analysis may run as a pure UI operation, but accepting an imported candidate, persisting extracted secrets, deriving proxy-authentication bindings, preparing the authentication listener, and replacing the Draft must execute behind typed background commands. UI components must not write persistent secret storage or browser proxy/authentication state directly.

**Reason:** Import acceptance changes multiple durable security-sensitive stores. A component-originated sequence can leave orphaned or overwritten secrets after a Draft generation conflict, and it bypasses the control-plane boundary required for deterministic rollback and testing. Authenticated proxy activation can also fail on the first request unless bindings and the bounded `onAuthRequired` listener are prepared before browser proxy installation.

**Alternatives considered:** Direct Options-page storage writes were rejected because an adapter import does not change the fact that the browser API call originates in UI code. Persisting secrets during analysis was rejected because analysis must remain non-mutating. Registering authentication only at extension startup was rejected because the first imported authenticated proxy would require a restart. Treating secret persistence as best-effort was rejected because partial import state is not recoverable or auditable.

**Consequences:** Import acceptance uses compare-and-swap Draft semantics and restores prior secret values when persistence fails. Activation synchronizes HTTP/HTTPS authentication bindings before installing a route that can require them and restores prior bindings/listener state on activation or commit failure. Permission-required status is surfaced before traffic switches. Command responses never contain secret values. SOCKS authentication remains unsupported in browser-only mode.

## ADR-015 — Preserve but do not activate local `file:` PAC URLs

**Status:** Accepted

**Decision:** Chromium and Firefox browser-only targets preserve imported PAC Profiles whose source URL uses `file:`, render the original source-backed warnings, and allow the user to clear or replace the URL. They do not read the local file, request file-origin access, install the file URL directly, or silently activate an old cached script. To use the policy, the user must clear the URL and paste the PAC as inline text or expose it through an explicitly permitted HTTP(S) origin.

**Reason:** Nex activation is based on a reproducible, validated `raw-pac/1` snapshot whose script bytes, hash, source revision, installation, and browser confirmation are known before traffic changes. A machine-local path is non-portable across devices, has browser- and user-specific file-access controls, and cannot pass the same bounded background download, compare-and-swap, hashing, and rollback evidence. Directly delegating the path to the browser would create a second unverified activation path.

**Alternatives considered:** Installing the `file:` URL directly through the browser proxy API was rejected because it bypasses the verified snapshot boundary and differs across targets. Requesting broad local-file access and reading the path from the extension was rejected because it adds a high-trust permission for a legacy edge case and still cannot make the path portable. Falling back to a stale cached script was rejected because the UI would claim one source while traffic used another.

**Consequences:** Import/export may retain the non-secret URL for compatibility, but Apply and Popup activation fail before authentication preparation, runtime creation, permission requests, or browser proxy mutation. The Options page keeps the original standalone/referenced warnings and gives the user an explicit conversion path. This is an `INTENTIONAL_DIVERGENCE` from original local-file activation, not a missing implementation.

## ADR-016 — Defer GitHub Gist synchronization beyond the first browser release

**Status:** Accepted

**Decision:** The first browser-only ZeroOmega Nex replacement does not implement continuous GitHub Gist synchronization. Gist sync is classified as `NOT_PORTING` for Milestone 8 and deferred to a dedicated remote-sync milestone. File import/export and bounded online URL restore remain supported, but neither implies Gist synchronization.

**Reason:** Original v3.5.0 Gist sync is a persistent bidirectional state machine rather than a backup transport. It stores a personal access token, reads commit history, downloads and merges a remote `ZeroOmega.json`, debounces local changes, pushes through the GitHub API, watches for remote commits, and can rebuild local Options plus reapply the startup Profile after conflict resolution. Recreating this safely requires background-owned credentials, explicit remote identity, compare-and-swap commits, conflict UX, retry/rate-limit policy, remote deletion semantics, migration from original state, and dual-browser suspension recovery. Those obligations are materially larger than Milestone 8 import parity.

**Alternatives considered:** Reusing online restore for Gist was rejected because one-shot review cannot provide bidirectional merge or conflict semantics. Persisting the token in ProfileSpec or ordinary settings was rejected because secrets must remain background-owned and absent from exports, command responses, logs, and rendered UI. Shipping a push-only shortcut was rejected because it could overwrite newer remote data while presenting itself as synchronization.

**Consequences:** G-13 is a completed scope decision rather than a missing first-release feature. A later milestone must define a dedicated secret repository, least-privilege GitHub token requirements, remote document schema/version, optimistic concurrency, conflict recovery, bounded scheduling, revocation, deletion, migration, and Chromium/Firefox lifecycle tests before any Gist UI is added.

## ADR-017 — Defer WebDAV synchronization beyond the first browser release

**Status:** Accepted

**Decision:** The first browser-only replacement does not implement continuous WebDAV synchronization. WebDAV sync is classified as `NOT_PORTING` for Milestone 8 and deferred to the same dedicated remote-sync milestone, but it remains a separate backend with separate acceptance criteria.

**Reason:** Original v3.5.0 WebDAV sync creates a `zeroomega/` collection, authenticates with Basic or Bearer credentials, stores a mutable `zeroomega-commit.txt` pointer plus versioned `zeroomega-<commit>.json` files, periodically polls the pointer, replaces local sync storage, pushes a new version, updates the pointer, and deletes the previous file. The protocol is multi-request and not transactionally atomic; interruption can leave orphaned versions or a stale pointer. Original code also accepts HTTP URLs and explicitly lacks Digest authentication. A safe Nex implementation therefore requires HTTPS policy, background-owned credentials, bounded authentication negotiation, path canonicalization, server capability checks, optimistic concurrency, crash recovery, orphan cleanup, conflict UX, and hostile-response limits.

**Alternatives considered:** Copying the original Basic/Bearer implementation directly was rejected because it would expose credentials to a broad UI/storage path and retain non-atomic remote mutation. Treating a WebDAV URL as ordinary online restore was rejected because restore performs local review only and intentionally has no write, watch, or conflict behavior. Supporting only one PUT file without commit identity was rejected because concurrent devices could silently overwrite each other.

**Consequences:** G-14 is a completed first-release scope decision. Any later implementation must be HTTPS-only by default, keep username/password or bearer token in a background-owned secret store, use a documented concurrency protocol, survive partial writes and background suspension, bound every response, and prove interoperability and conflict behavior against controlled WebDAV fixtures on both browser targets. Digest support requires a separate decision.

## ADR-018 — Do not port original credential-bearing browser sync enhancement

**Status:** Accepted

**Decision:** ZeroOmega Nex does not port the original built-in browser-sync mechanism that copies Gist/WebDAV connection configuration into `storage.sync`. This is an `INTENTIONAL_DIVERGENCE`, not a deferred implementation of the same behavior. A future feature may sync non-secret metadata or encrypted envelopes only after a separate cryptographic and recovery design.

**Reason:** Original v3.5.0 writes `gistId`, `gistToken`, `syncUsername`, `syncBackendType`, and `lastGistCommit` into the browser vendor's synchronized storage under `zeroOmegaSync`, then uses cross-device changes to initialize or force remote synchronization. For WebDAV, the field named `gistToken` is the password or bearer token. Copying those plaintext credentials into browser cloud sync violates Nex's background-owned secret boundary and makes credential propagation depend on browser-account sync, vendor retention, quota, device access, and extension storage behavior. It also couples remote-conflict recovery to a second synchronization channel.

**Alternatives considered:** Reproducing the original fields in `storage.sync` was rejected as plaintext credential replication. Syncing secret references without keys was rejected because another device could not resolve them safely. Automatically wrapping secrets with a device-local key was rejected because cross-device decryption, recovery, rotation, account loss, and compromise semantics are undefined.

**Consequences:** G-15 is DONE as an intentional divergence. Production manifests continue to request only ordinary `storage`; no product path writes credentials to browser-synchronized storage. Future browser-native sync, if any, must default to non-secret metadata, define quotas and conflict semantics, and require an explicit encrypted-secret ADR before credentials or recovery material can cross devices.

## ADR template

```markdown
## ADR-NNN — Title

**Status:** Proposed | Accepted | Superseded | Rejected

**Decision:**

**Reason:**

**Alternatives considered:**

**Consequences:**

**Supersedes / superseded by:**
```

## 2026-07-28 — Ordinary `.bak` exports omit secret material

**Decision:** Full Options exports use the original ZeroOmega schema-v2 JSON, MIME, and filename contract, but proxy credentials, sensitive request-header values, secret references, sync credentials, and arbitrary secret-like metadata are excluded. The UI exposes compatibility warnings and the browser round-trip test asserts the downloaded file contains no secret markers.

**Reason:** Original v3.5.0 exported credentials as part of its plain Options object. Reproducing that behavior would violate the Nex secret-ownership boundary and create a portable plaintext credential bundle.

**Consequence:** Non-secret Options semantics round-trip through original-compatible `.bak` files. Credentials must be re-entered or migrated through a future explicit encrypted-secret workflow; ordinary backups are never that workflow.
