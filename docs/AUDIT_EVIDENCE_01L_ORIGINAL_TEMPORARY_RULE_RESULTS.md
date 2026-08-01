# Audit Evidence 01L — Original Temporary Rule Toolbar Results

## Scope

This evidence captures the observable ZeroOmega v3.5.0 Chromium Toolbar contract for one temporary host rule over one base Switch profile.

It is intentionally narrow. It does not claim every temporary-rule combination, Popup journey, restart behavior or profile-family combination.

## Provenance

The permanent read-only `Original Toolbar Evidence` workflow downloaded the official ZeroOmega v3.5.0 Chromium release and verified:

```text
4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce  chromium-release.zip
```

The parameterized `temporary-rule` scenario ran in an isolated real Chromium profile and used original runtime APIs:

- `addProfile`
- `applyProfile`
- `addTempRule`
- `_actionForUrl`
- `getState`

The successful original evidence run was `30717827198`; Artifact `8823899449` contained the captured runtime JSON.

## Scenario

Profiles:

- `Runtime Temporary Base`
  - type: Switch
  - color: `#ffb74d`
  - no rules
  - default: Direct
- `Runtime Temporary Fixed`
  - type: Fixed
  - color: `#64b5f6`
  - fallback: `PROXY 127.0.0.1:18187`
  - no bypass entries

Temporary command:

```text
addTempRule("temp-rule.test", "Runtime Temporary Fixed", 1)
```

The original runtime creates a hidden temporary Switch and a `*.temp-rule.test` host rule. The hidden profile is not exposed as the current visible profile.

## Captured results

### 1. Temporary rule matched

URL:

```text
http://temp-rule.test/path
```

Observable Action:

```text
ZeroOmega:: Runtime Temporary Base
(TEMP) *.temp-rule.test => Runtime Temporary Fixed
PROXY 127.0.0.1:18187
```

Contract:

- current profile: `Runtime Temporary Base`
- result profile: `Runtime Temporary Fixed`
- Badge: `Runt`
- profile/current color: `#ffb74d`
- result color: `#64b5f6`
- detail prefix: localized temporary-rule prefix
  - English: `(TEMP) `
  - Simplified Chinese: `(临时) `
  - Traditional Chinese: `(臨時) `
- the hidden temporary Switch name is not displayed

### 2. Temporary overlay active, rule unmatched

URL:

```text
http://temp-rule-default.test/path
```

Observable Action:

```text
ZeroOmega:: Runtime Temporary Base
(default) => Runtime Temporary Base
(default) => [Direct]
```

Contract:

- the hidden temporary Switch first falls through to the base profile
- the base Switch then falls through to Direct
- both default transitions remain visible
- current profile remains `Runtime Temporary Base`
- result is built-in Direct
- Badge is `Dire`
- the Action uses Direct as result color and the base profile as current color

### 3. Last temporary rule removed

Command:

```text
addTempRule("temp-rule.test", "Runtime Temporary Fixed", -1)
```

The same original session then resolves `http://temp-rule.test/path` as:

```text
ZeroOmega:: Runtime Temporary Base
(default) => Runtime Temporary Base
(default) => [Direct]
```

This proves that deleting the final rule does not immediately destroy the active hidden temporary Switch. The empty overlay remains active for the current session, so the two default transitions remain observable.

## Original source correlation

The original package source confirms:

- `addTempRule` creates the hidden temporary Switch when necessary;
- the temporary host condition is `*.` plus the supplied domain;
- the selected rule is marked `isTempRule`;
- `_actionForUrl` prepends the localized temporary-rule prefix for a temporary match;
- deleting the final rule removes the rule but does not destroy the active hidden temporary profile.

Runtime evidence, not source inference, is authoritative for the exact Action values above.

## Nex mapping

Nex reproduces this captured subset through:

- a session-persisted temporary overlay state;
- preservation of an empty active overlay after the last rule is removed;
- an internal Toolbar-only projection of the active synthetic graph;
- a specialized Original-observable temporary-rule projector;
- the existing single Action writer and per-tab coordinator;
- immediate Action refresh after temporary-rule activation changes;
- deterministic tests and shared Chromium/Firefox profile-trace E2E.

The hidden synthetic profile remains internal and is never displayed directly.

The Chromium full E2E captures a verified rollback target before temporary-rule evidence begins. After the final rule is removed and the original empty-overlay state is verified, the test uses the normal extension-page workflow channel to add built-in System to Quick Switch when absent, replace and apply the draft, and activate System with the new applied revision. System is used only as a safe non-temporary route for later network diagnostics; it is not treated as the source of the historical rollback target. The messages originate from the still-open extension page rather than from a service-worker self-message. These are test-harness boundaries, not product-contract differences.

## Represented subset

`KG-TEMP-RULE-001` is represented only for:

- one temporary host rule;
- host pattern `*.temp-rule.test`;
- one empty base Switch with default Direct;
- one Fixed HTTP proxy target with no bypass entries;
- matched result;
- active-overlay unmatched result;
- removal of the last rule while preserving the active empty overlay;
- Chromium and Firefox localized Action behavior.

## Unrepresented shapes

The following remain unknown and fail closed where they affect Toolbar projection:

- multiple temporary rules, ordering and replacement;
- other condition forms;
- Direct, System, PAC, Rule List, Virtual or nested targets;
- non-empty or attached-Rule-List base Switches;
- Fixed targets with bypass or scheme-specific mappings;
- restart and browser-session restoration semantics;
- invalid routes, activation failure and rollback;
- complete Popup interaction and owner acceptance.

## Classification

For the represented 01L subset:

- edge: `EXACT_EQUIVALENT`
- evidence status: `VERIFIED_AUTOMATION`

This does not close the complete Toolbar journey or replace repository-owner acceptance.
