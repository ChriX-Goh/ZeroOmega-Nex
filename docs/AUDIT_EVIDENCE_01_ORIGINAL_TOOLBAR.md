# Audit Evidence 01 — Original ZeroOmega v3.5.0 Toolbar

## 0. Purpose

This is the source-evidence companion to `DELIVERY_ORDER_01_TOOLBAR_STATE.md`.

It records only facts captured from the exact original tag and the exact archived evidence artifact. It does not claim runtime/visual acceptance where no screenshot or installed-browser observation exists.

## 1. Fixed authority

- Original repository: `zero-peak/ZeroOmega`.
- Original tag: `v3.5.0`.
- Release commit: `05cbb30`.
- Archived source-evidence workflow: run `30181773502`.
- Artifact: `original-zeroomega-ui-evidence-v3.5.0`, ID `8625759489`.
- Declared and independently verified artifact SHA-256: `8403e963325a5d4fcac10fd2f3c8dac246cb720afb24f322c827d5cf8ebfdd19`.
- Archive contents: 124 files, 1,083,961 uncompressed bytes.

## 2. Evidence-artifact correction

Despite its historical name, `original-zeroomega-ui-evidence-v3.5.0` is a source and locale evidence archive, not a runtime screenshot set.

The extracted archive contains:

- Chromium target CoffeeScript/JavaScript source;
- browser target modules;
- `omega-target` source;
- `omega-web` controllers, templates, styles and Popup source;
- en_US, zh_CN, zh_TW and zh_Hant PO files;
- source inventories and a source tarball;
- one instructional image used by the original permission UI.

It does **not** contain installed original toolbar screenshots or a state-by-state toolbar recording.

Therefore:

- source behavior can be marked `SOURCE_CAPTURED` where the code is explicit;
- exact installed visual appearance remains `UNKNOWN` until reproduced or captured;
- previous references to this Artifact as complete runtime visual evidence were incorrect;
- generated Nex screenshots cannot substitute for missing original runtime evidence.

## 3. Exact original renderer

### 3.1 Build/import chain

Original `omega-target-chromium-extension/overlay/x-background.js`, blob `6ef5b059a4fdf7d97f73d3395c4f5b20e6bacb92`, imports:

```text
./img/icons/draw_omega.js
./js/background.js
```

The web build is copied into the target build before the overlay, so the renderer source comes from:

- `omega-web/img/icons/draw_omega.js`;
- blob `aa5ef9cfac1ef7b46dbe0df03b1adc3d5a2faf43`.

### 3.2 Exact normalized geometry

The renderer is:

```js
globalThis.drawOmega = function (ctx, outerCircleColor, innerCircleColor) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = outerCircleColor;

  ctx.beginPath();
  ctx.lineWidth = 0.25;
  ctx.arc(0.5, 0.5, 0.375, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.stroke();

  if (innerCircleColor != null) {
    ctx.fillStyle = innerCircleColor;
  } else {
    ctx.globalCompositeOperation = 'destination-out';
  }

  ctx.beginPath();
  ctx.arc(0.5, 0.5, 0.25, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
};
```

Observable geometry:

- center: `(0.5, 0.5)`;
- outer center-line radius: `0.375`;
- outer stroke width: `0.25`;
- outer visible radial extent: approximately `0.25` to `0.5`;
- inner circle radius: `0.25`;
- one-color state: inner circle is removed with `destination-out`, producing the Ω opening/transparent center;
- two-color state: inner circle is filled with `innerCircleColor`;
- outer ring uses `outerCircleColor`.

No new logo geometry is needed or permitted. The original renderer can be ported directly behind a typed/browser-independent state model.

## 4. Dynamic icon generation

Original `background.coffee`, blob `0b2f996210b75df9fe08535de380a6606ac20ac8`, wraps the renderer with `drawIcon(resultColor, profileColor)`:

- cache key: `omega+<resultColor>+<profileColor>`;
- `OffscreenCanvas(300, 300)`;
- output sizes: 16, 19, 24, 32 and 38;
- one supplied color calls `drawOmega(ctx, profileColor)`;
- two supplied colors call `drawOmega(ctx, resultColor, profileColor)`;
- each output is `ImageData`;
- if browser privacy resistance replaces the pixels, dynamic drawing is disabled and the manifest static icon remains.

Color argument order is source-defined and must not be renamed from visual intuition without verifying the rendered outcome. Pixel/ring semantics must be checked against a running original build.

## 5. Static fallback assets

The original manifest references action assets from `omega-web/img/icons`.

| Size | Path                                      | Blob SHA                                   |
| ---: | ----------------------------------------- | ------------------------------------------ |
|   16 | `omega-web/img/icons/omega-action-16.png` | `46f3348f339c800d44e3e471dbd258077118ad99` |
|   19 | `omega-web/img/icons/omega-action-19.png` | `3498aa0da88481a723b78612581c6d7e32ae16c2` |
|   24 | `omega-web/img/icons/omega-action-24.png` | `adfe35604052905261307953a2b51789e8cd0a02` |
|   32 | `omega-web/img/icons/omega-action-32.png` | `07e41189b4e5bd8860d7ed5e5f0be359c63ee12d` |

Decoded inspection shows the familiar light-blue Ω/ring fallback with transparent center/background. This is materially different from the current Nex green square/white Ω static asset.

Current Nex 16px asset:

- path `apps/extension/public/icon/16.png`;
- blob `8648e132ca3d6dc0d1f562f0cde7101a4032e52d`;
- visible design: green filled square with a white Ω-like glyph.

The current asset is not an original-compatible fallback and has no recorded owner-approved divergence.

## 6. Original manifest action contract

Original v3.5.0 manifest, blob `89fd202f597cbbd5a00ff24e78ae572a925492d6`, defines:

- action icons: 16, 19, 24 and 32;
- default title: `manifest_icon_default_title`;
- default Popup: `popup-iframe.html`;
- suggested `_execute_action` shortcut: `Alt+Shift+O`;
- `tabs` permission;
- extension icons at 16, 24, 32, 48, 64 and 128.

Current Nex manifest lacks the original action size set, shortcut and `tabs` permission, and uses a different fallback design.

## 7. Original locale contract

The archived exact PO files provide the following toolbar text.

### 7.1 Loading/default title

| Locale  | `manifest_icon_default_title` |
| ------- | ----------------------------- |
| en_US   | `Loading…`                    |
| zh_CN   | `正在加载……`                  |
| zh_TW   | `正在載入……`                  |
| zh_Hant | `載入中…`                     |

### 7.2 Result title

For en_US, zh_CN and zh_TW:

```text
ZeroOmega:: $1:PROFILE$
$3:DETAILS$
```

The source passes current profile name and detailed matching trace. It does not expose internal Draft, Applied revision or snapshot terminology.

### 7.3 Result detail tokens

| Key                                | en_US                                                                | zh_CN                                  | zh_TW                                  |
| ---------------------------------- | -------------------------------------------------------------------- | -------------------------------------- | -------------------------------------- |
| `browserAction_titleExternalProxy` | `Note: The proxy settings are currently controlled by other app(s).` | `注意：其他应用正在控制当前代理设置。` | `注意：其他應用正在控制目前代理設定。` |
| `browserAction_titleInspect`       | `[Inspect] $URL$`                                                    | `[检查] $URL$`                         | `[檢查] $URL$`                         |
| `browserAction_defaultRuleDetails` | `(default)`                                                          | `(默认)`                               | `(預設)`                               |
| `browserAction_directResult`       | `DIRECT`                                                             | `直接连接`                             | `直接連線`                             |
| `browserAction_attachedPrefix`     | `(RL) `                                                              | `(列表) `                              | `(清單) `                              |
| `browserAction_tempRulePrefix`     | `(TEMP) `                                                            | `(临时) `                              | `(臨時) `                              |

### 7.4 Badge preference

- key: `options_showResultProfileOnActionBadgeText`;
- en_US: `Show the result profile's name on the action badge text.`;
- zh_CN: `将最终使用的情景模式名称显示到徽标上。`;
- original runtime truncates the displayed profile name to four characters and localizes built-in profile badge names.

The zh_TW archived PO does not contain a translated entry for this preference in the captured grep result; this remains a locale-specific audit item rather than permission to invent new wording.

## 8. Per-tab and state-transition facts

Original `ChromeTabs`, blob `698a5b105e20f8b730a0ec799add4a4f22eae686`:

- listens to `tabs.onUpdated` and `tabs.onActivated`;
- recalculates state per tab URL;
- sets tab-specific icon/title/badge;
- clears stale badge state;
- restores the default action on unsupported/browser-internal URLs;
- refreshes dirty tabs after current-profile changes.

Original `currentProfileChanged`:

- clears icon cache;
- handles external control;
- resolves Virtual targets;
- creates title/short-title state;
- selects one-color vs Direct/current two-color default state;
- calls `tabs.resetAll`.

Original Inspect:

- changes the tab-specific title;
- sets badge text `#`;
- sets badge background to the evaluated result color;
- clears and recalculates when inspecting the current tab URL.

## 9. Evidence status after this capture

| Evidence component                                              | Status            |
| --------------------------------------------------------------- | ----------------- |
| Exact tag/source paths and blobs                                | `SOURCE_CAPTURED` |
| Exact Ω geometry                                                | `SOURCE_CAPTURED` |
| Dynamic size/cache/fallback behavior                            | `SOURCE_CAPTURED` |
| Static action asset identities                                  | `SOURCE_CAPTURED` |
| Static asset decoded visual inspection                          | `SOURCE_CAPTURED` |
| en_US / zh_CN / zh_TW key toolbar strings                       | `SOURCE_CAPTURED` |
| Per-tab/state transition implementation                         | `SOURCE_CAPTURED` |
| Running original Chromium screenshots for all states            | `UNKNOWN`         |
| Running original Firefox screenshots for all states             | `UNKNOWN`         |
| Exact dynamic two-color pixel output against a running original | `UNKNOWN`         |
| Modern-browser divergence requirement                           | `UNKNOWN`         |
| Nex corrected implementation                                    | `NOT STARTED`     |
| Owner acceptance of corrected implementation                    | `NOT RUN`         |

## 10. Next gate

The next evidence task is to produce an installable exact v3.5.0 Chromium/Firefox reference or recover the corresponding release packages, then capture the state matrix in real browsers.

Code implementation may begin only for source-certain components—the pure state contract, exact renderer geometry and browser-action abstraction—while runtime-dependent wording, timing and browser differences remain guarded by explicit `UNKNOWN` tests and cannot be silently invented.
