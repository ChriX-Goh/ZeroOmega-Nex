# Audit Evidence 01D — Original ZeroOmega v3.5.0 Firefox Runtime

## Authority

- Package: exact official `firefox-release.zip` from ZeroOmega release `v3.5.0`.
- Package SHA-256: `666ce976022ed379601b896f9138ada82a29aabfe0154bf2bf1ae779e3319cda`.
- Runtime browser: Firefox `152.0.6` on an Ubuntu 24.04 GitHub-hosted runner.
- Installation path: WebDriver BiDi `webExtension.install` from the extracted official package.
- Add-on ID: `suziwen1@gmail.com`.
- Deterministic audit UUID: `00000000-0000-4000-8000-000000000009`.
- Successful workflow run: `30597356624`.
- Runtime Artifact: `8780625790`.
- Artifact digest: `sha256:1638d78b85d5c70c52d50510ec3e98b0b479a96c0bbf98f86cd133f48e889980`.

## Captured Action states

| State                       | URL                          | Title                                                       | Badge | Runtime popup       |
| --------------------------- | ---------------------------- | ----------------------------------------------------------- | ----- | ------------------- |
| `initial-web-page`          | local `/alpha` page          | `ZeroOmega:: [System Proxy]` + external-control explanation | empty | `popup-iframe.html` |
| `direct-web-page`           | local `/alpha` page          | `ZeroOmega:: [Direct]` + direct explanation                 | empty | `popup-iframe.html` |
| `system-web-page`           | local `/alpha` page          | `ZeroOmega:: [System Proxy]` + external-control explanation | empty | `popup-iframe.html` |
| `system-second-tab`         | local `/beta` page           | `ZeroOmega:: [System Proxy]` + external-control explanation | empty | `popup-iframe.html` |
| `system-first-tab-inactive` | inactive local `/alpha` page | `ZeroOmega:: [System Proxy]` + external-control explanation | empty | `popup-iframe.html` |
| `system-internal-page`      | `about:support`              | `ZeroOmega:: [System Proxy]` + external-control explanation | empty | `popup-iframe.html` |

For all captured states, the Action Badge background color was `[217, 0, 0, 255]`. The result-profile Badge preference was disabled in the captured original storage, so empty Badge text is expected.

## Installed UI capture

- Options URL: `moz-extension://00000000-0000-4000-8000-000000000009/options.html#!/about`.
- Options title: `ZeroOmega Options (Z​er​oOmega)`.
- Popup URL opened from the Firefox manifest entry: `moz-extension://00000000-0000-4000-8000-000000000009/popup/index.html`.
- Popup title: `Z​eroOmega Popup`.
- Popup viewport and document extent: `1366 × 682`.
- Artifact screenshots: `options-zh-CN.png` and `popup-zh-CN.png`.

## Browser-specific observation

The Firefox manifest declares `popup/index.html`, while `action.getPopup({ tabId })` returned `popup-iframe.html` for every captured tab. Nex must preserve observed runtime behavior rather than infer Action state solely from the manifest entry.

The initial storage contained the original sample `proxy` and `auto switch` profiles. Direct and System transitions were performed through the original runtime message contract, not by editing captured output.

## Reproducibility note

A later GitHub runner image exposed Firefox `153.0`, whose Marionette navigation rejected direct `moz-extension://` navigation before state capture. That is a harness compatibility change after this successful exact-package run; it does not invalidate the Firefox `152.0.6` runtime evidence. Future reruns on Firefox 153+ must navigate extension pages through a supported BiDi browsing-context path or use a pinned Firefox runtime.

## Acceptance boundary

This evidence proves real installation and execution of the exact official Firefox package for initial/System, Direct, two-tab, inactive-tab and internal-page Action states, plus installed Options and Popup surfaces.

It does not yet prove:

- user-created Fixed profile color/title state;
- Switch/PAC result and two-color icon state;
- Virtual and attached Rule List state;
- temporary-rule state;
- Inspect state;
- external-controller transition details beyond the captured System title;
- operating-system toolbar icon pixels in headed Firefox;
- Nex equivalence or repository-owner acceptance.

Exact icon geometry and assets remain covered by source/package evidence. The remaining runtime states stay `UNKNOWN` until separately captured.
