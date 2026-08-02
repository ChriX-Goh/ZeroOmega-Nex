# Audit Evidence 01M — Original External-Control Toolbar Results

## Scope

This evidence captures the observable ZeroOmega v3.5.0 Chromium Toolbar contract when one second extension takes control of browser proxy settings from one applied Fixed profile, releases that control and the original Fixed profile is explicitly re-applied.

It is intentionally narrow. It does not claim every browser policy, disabled-extension, operating-system, restart or ownership-failure state.

## Provenance

The permanent read-only `Original Toolbar Evidence` workflow downloaded the official ZeroOmega v3.5.0 Chromium release and verified:

```text
4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce  chromium-release.zip
```

The parameterized `external-control` scenario ran in an isolated real Chromium profile with:

- the official original package;
- one minimal second extension with the browser `proxy` permission;
- original runtime APIs `addProfile`, `applyProfile`, `getState` and `_actionForUrl`;
- actual browser Action reads for title, Badge text and Badge background color;
- actual `chrome.proxy.settings.get()` reads from both extensions.

The successful original evidence run was `30731753091`; Artifact `8828190578` contained the captured runtime JSON.

## Scenario

Applied original profile:

- name: `Runtime External Control Fixed`
- type: Fixed
- color: `#4fc3f7`
- fallback: `PROXY 127.0.0.1:18188`
- no bypass entries

Target URL:

```text
http://external-control.test/path
```

The second extension claims control by repeatedly setting browser proxy mode to Direct. It later stops claiming and clears its proxy setting.

## Captured results

### 1. Baseline Fixed state

Original control level:

```text
controlled_by_this_extension
```

Observable Action:

```text
ZeroOmega:: Runtime External Control Fixed
PROXY 127.0.0.1:18188
```

Contract:

- title current/result: `Runtime External Control Fixed`;
- Badge: `Runt`;
- Badge background: transparent `[0, 0, 0, 0]`;
- Fixed profile remains current in original runtime state.

### 2. Second extension takes control

Original control level:

```text
controlled_by_other_extensions
```

Observable Action:

```text
ZeroOmega:: [Direct]
(not using any proxy)
```

Contract:

- Toolbar current/result become built-in Direct;
- Badge becomes `Dire`;
- Badge background becomes warning red `[218, 79, 73, 255]`, equivalent to `#da4f49`;
- the original runtime may still retain `Runtime External Control Fixed` as its internal current profile name;
- the observable Toolbar follows effective browser ownership, not that retained internal name;
- no Nex-specific ownership explanation is inserted into the Toolbar title.

### 3. Second extension releases control

Original control level returns to:

```text
controlled_by_this_extension
```

Observable Action content automatically returns to:

```text
ZeroOmega:: Runtime External Control Fixed
PROXY 127.0.0.1:18188
```

Contract:

- no explicit original `applyProfile` call is needed for the Action content to return to Fixed;
- Badge returns to `Runt`;
- warning-red Badge background remains `[218, 79, 73, 255]`.

### 4. Original Fixed profile is explicitly re-applied

Observable Action content remains Fixed and the warning-red Badge background still remains `[218, 79, 73, 255]`.

This proves that, within the captured original background/session lifetime, the ownership-loss warning color is latched independently from the currently restored profile content.

## Nex mapping

Nex reproduces this captured subset through:

- real browser proxy capability inspection in the existing Toolbar runtime view;
- the existing `browser.proxy.settings.onChange` event feeding the existing global/per-tab coordinator;
- no second Action writer;
- exact `controlled-by-other-extension` projection to the existing built-in Direct observable state;
- a resolver-local warning latch using `#da4f49`;
- normal profile projection after control returns, while preserving the latched warning background;
- transparent normal Badge background before any captured ownership loss;
- focused deterministic tests;
- real Chromium and Firefox dual-extension E2E using actual proxy ownership and actual Action reads.

Popup ownership blocking remains a separate existing surface. This evidence maps only Toolbar behavior and does not replace the Popup contract.

## Represented subset

`KG-EXTERNAL-CONTROL-001` is represented only for:

- one applied Fixed HTTP fallback profile without bypass;
- one second extension taking proxy control;
- effective control level `controlled_by_other_extensions`;
- automatic control return after that extension clears its setting;
- one explicit re-application after recovery;
- title, Badge text and Badge background behavior;
- the warning latch within the same captured runtime lifetime;
- real Chromium and Firefox acceptance of the mapped Nex behavior.

## Unrepresented shapes

The following remain unknown or open:

- `not_controllable`, policy-controlled and operating-system ownership states;
- extension disable, uninstall, crash and permission revocation;
- multiple competing extensions and priority changes;
- non-Fixed current profiles;
- ownership loss during Apply, temporary rules, PAC update or rollback;
- background/service-worker/browser restart and warning-latch lifetime;
- recovery failures and user-facing Popup/Options ownership journeys;
- repository-owner acceptance.

Unrepresented control states are not mapped to the captured Direct warning state merely by similarity.

## Classification

For the represented 01M subset:

- edge: `EXACT_EQUIVALENT`;
- evidence status: `VERIFIED_AUTOMATION`.

This does not close the complete Toolbar journey or replace repository-owner acceptance.
