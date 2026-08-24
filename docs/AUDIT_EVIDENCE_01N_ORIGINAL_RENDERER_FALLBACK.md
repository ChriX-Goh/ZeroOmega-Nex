# Audit Evidence 01N — Original Renderer Fallback

## Scope

This evidence captures the observable ZeroOmega v3.5.0 Chromium Toolbar contract when dynamic Ω icon rendering is blocked by privacy-style canvas pixels, the same profile color is refreshed again, and rendering later becomes available.

It is intentionally narrow. It does not claim every canvas exception, context-creation failure, browser restart, previously drawn pixel state or headed-toolbar presentation.

## Provenance

The permanent read-only `Original Toolbar Evidence` workflow downloaded the official ZeroOmega v3.5.0 Chromium release and verified:

```text
4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce  chromium-release.zip
```

The parameterized `renderer-fallback` scenario ran in an isolated real Chromium profile and used:

- the official original service worker and runtime APIs;
- the original `_actionForUrl` path with icon generation enabled;
- the real OffscreenCanvas 2D context prototype;
- a probe that changed only the first returned alpha byte to `255`;
- explicit per-call pixel-read counters;
- the original manifest Action metadata.

The successful final original evidence run was `30734541540`; Artifact `8829278325` contained the captured runtime JSON.

## Original source contract

The exact v3.5.0 package source establishes:

- one shared `300 × 300` OffscreenCanvas;
- dynamic output sizes `16`, `19`, `24`, `32` and `38`;
- a privacy check on the first pixel alpha byte;
- alpha `255` throws `Icon drawing blocked by privacy.resistFingerprinting.`;
- only the first renderer error is logged;
- a failed draw returns `null`;
- failed color pairs are not accepted as successful cache hits and are retried later;
- `setIcon(null)` performs no browser Action icon write;
- if a full dynamic `setIcon` call is rejected, the original retries with only the `19` and `38` ImageData entries.

The original log text describes a static fallback because the manifest default Action icon remains available when no dynamic icon is written. The renderer does not construct or actively write a second static path set during the failed draw.

## Static default icon identity

Original manifest paths:

```text
16 -> img/icons/omega-action-16.png
19 -> img/icons/omega-action-19.png
24 -> img/icons/omega-action-24.png
32 -> img/icons/omega-action-32.png
```

Nex manifest paths:

```text
16 -> icon/original-action-16.png
19 -> icon/original-action-19.png
24 -> icon/original-action-24.png
32 -> icon/original-action-32.png
```

The corresponding PNG files are byte-identical:

```text
16  5fe3e8713a4749153f52f2dc676710d7b463207f382792d3377a0db222bb075c
19  723171d0768f25b688e81a018f2e9f6833d1b7aab9d41d974cfa9315257c0569
24  524018ab142b08a523488c513d67b40abb8f7216f10b0b61d86675792d6f0409
32  2eab00756dbddbf5f02224be92c4e137dde92cd79f90014832f6a7e699125593
```

## Scenario

Applied profile:

- name: `Runtime Renderer Fallback Fixed`;
- type: Fixed;
- color: `#ab47bc`;
- fallback: `PROXY 127.0.0.1:18189`;
- no bypass entries.

Target URL:

```text
http://renderer-fallback.test/path
```

## Captured results

### 1. First forced failure

Before the explicit `_actionForUrl` call the probe count was `2`; after the call it was `3`.

Observable result:

- one explicit pixel read occurred;
- `action.icon` was `null`;
- title, detail, Badge text and colors were still produced normally;
- no dynamic icon object was returned.

### 2. Second forced failure for the same colors

Before the explicit call the probe count was `3`; after the call it was `4`.

Observable result:

- the same color pair entered `getImageData` again;
- `action.icon` was again `null`;
- the failed result was not treated as a terminal color-cache entry.

### 3. Renderer restored for the same colors

Before the explicit call the probe count was `4`; after the call it was `9`.

Observable result:

- exactly five pixel reads occurred;
- `action.icon` contained sizes `16`, `19`, `24`, `32` and `38`;
- every returned ImageData width and height matched its key;
- the same profile color recovered without an explicit renderer-cache reset.

## Nex mapping

Nex reproduces this captured subset through:

- the exact five-size shared-canvas Ω renderer;
- caching only successful dynamic icon sets;
- returning no dynamic icon after privacy-style or other renderer failure;
- logging/callback of only the first renderer error while continuing to retry failed colors;
- performing no `setIcon` call when no dynamic image exists;
- preserving manifest/current browser icon state instead of actively writing a static path during failure;
- retrying a rejected full dynamic browser write with the original `19`/`38` ImageData subset;
- exact copied manifest default PNG assets;
- deterministic renderer and Action-adapter tests;
- real Chromium and Firefox E2E that force opaque first pixels twice, verify zero icon writes, restore normal pixels and verify five-size dynamic recovery.

The browser E2E probe is compiled and registered only when `WXT_ICON_RENDERER_E2E=1`. Normal CI, production and native Inspect builds do not register the hidden probe message channel.

## Represented subset

`KG-ACTION-FALLBACK-001` is represented for:

- one Fixed profile color;
- alpha-`255` privacy-style pixel rejection;
- first and repeated failure for the same colors;
- no dynamic `setIcon` write during failure;
- exact manifest default icon paths and byte-identical PNG assets;
- same-color recovery to all five dynamic sizes;
- full dynamic browser-write rejection fallback to the original `19`/`38` subset in deterministic tests;
- real Chromium and Firefox Action/runtime acceptance.

## Unrepresented shapes

The following remain open:

- headed pixel proof of which icon is visually displayed after a previously successful dynamic icon later fails;
- 2D context creation failure and arbitrary canvas exceptions;
- browser Action failure of both the full set and the `19`/`38` retry;
- profile/color changes during repeated failure;
- background/service-worker/browser restart behavior;
- platform policy and anti-fingerprinting variants outside the captured alpha check;
- repository-owner visual acceptance.

## Classification

For the represented 01N subset:

- edge: `EXACT_EQUIVALENT`;
- evidence status: `VERIFIED_AUTOMATION`.

This closes only the strict renderer-fallback engineering subset. It does not close `KG-ICON-001` or replace repository-owner acceptance.
