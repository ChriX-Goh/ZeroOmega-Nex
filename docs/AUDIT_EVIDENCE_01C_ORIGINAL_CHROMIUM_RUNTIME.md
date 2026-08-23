# Audit Evidence 01C — Original ZeroOmega v3.5.0 Chromium Runtime

## Authority

- Package: official `chromium-release.zip` from release `v3.5.0`.
- Package SHA-256: `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`.
- Runtime browser: Chromium `149.0.7827.55` on Ubuntu 24.04 GitHub runner.
- Resolved extension ID: `cofiboofgeodafifnjhmngjfibbnpgjg`.

## Captured Action states

| State                       | URL                            | Title                                                                         | Badge | Popup                                                                   |
| --------------------------- | ------------------------------ | ----------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------- |
| `initial-web-page`          | `http://127.0.0.1:35155/alpha` | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `chrome-extension://cofiboofgeodafifnjhmngjfibbnpgjg/popup-iframe.html` |
| `direct-web-page`           | `http://127.0.0.1:35155/alpha` | ZeroOmega:: [Direct]<br>(not using any proxy)                                 | ``    | `chrome-extension://cofiboofgeodafifnjhmngjfibbnpgjg/popup-iframe.html` |
| `system-web-page`           | `http://127.0.0.1:35155/alpha` | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `chrome-extension://cofiboofgeodafifnjhmngjfibbnpgjg/popup-iframe.html` |
| `system-second-tab`         | `http://127.0.0.1:35155/beta`  | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `chrome-extension://cofiboofgeodafifnjhmngjfibbnpgjg/popup-iframe.html` |
| `system-first-tab-inactive` | `http://127.0.0.1:35155/alpha` | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `chrome-extension://cofiboofgeodafifnjhmngjfibbnpgjg/popup-iframe.html` |
| `system-internal-page`      | `chrome://version/`            | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `chrome-extension://cofiboofgeodafifnjhmngjfibbnpgjg/popup-iframe.html` |

## Installed UI capture

- Options title: `ZeroOmega Options (Z​er​oOmega)`.
- Popup title: `Z​eroOmega Popup`.
- Popup direct-page viewport: `1280 × 720`.
- Popup document extent: `1280 × 720`.
- Screenshots: `options-zh-CN.png` and `popup-iframe-zh-CN.png` in the workflow Artifact.

## Acceptance boundary

This is real execution of the exact official Chromium package. It captures runtime title/Badge/Popup state and installed extension pages. Headless execution does not provide an operating-system screenshot of the browser toolbar icon itself; exact icon geometry/assets remain covered by source and package evidence. User-profile, Switch/PAC result, temporary-rule, Inspect and external-control states remain open.
