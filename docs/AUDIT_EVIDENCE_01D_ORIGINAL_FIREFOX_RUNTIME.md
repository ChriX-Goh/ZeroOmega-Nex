# Audit Evidence 01D — Original ZeroOmega v3.5.0 Firefox Runtime

## Authority

- Package: official `firefox-release.zip` from release `v3.5.0`.
- Package SHA-256: `666ce976022ed379601b896f9138ada82a29aabfe0154bf2bf1ae779e3319cda`.
- Runtime browser: Firefox `152.0.6` on Ubuntu 24.04 GitHub runner.
- Add-on ID: `suziwen1@gmail.com`.
- Audit runtime UUID: `00000000-0000-4000-8000-000000000009`.

## Captured Action states

| State                       | URL                            | Title                                                                         | Badge | Popup                                                                    |
| --------------------------- | ------------------------------ | ----------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------ |
| `initial-web-page`          | `http://127.0.0.1:33321/alpha` | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `moz-extension://00000000-0000-4000-8000-000000000009/popup-iframe.html` |
| `direct-web-page`           | `http://127.0.0.1:33321/alpha` | ZeroOmega:: [Direct]<br>(not using any proxy)                                 | ``    | `moz-extension://00000000-0000-4000-8000-000000000009/popup-iframe.html` |
| `system-web-page`           | `http://127.0.0.1:33321/alpha` | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `moz-extension://00000000-0000-4000-8000-000000000009/popup-iframe.html` |
| `system-second-tab`         | `http://127.0.0.1:33321/beta`  | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `moz-extension://00000000-0000-4000-8000-000000000009/popup-iframe.html` |
| `system-first-tab-inactive` | `http://127.0.0.1:33321/alpha` | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `moz-extension://00000000-0000-4000-8000-000000000009/popup-iframe.html` |
| `system-internal-page`      | `about:support`                | ZeroOmega:: [System Proxy]<br>(controlled by other extensions or environment) | ``    | `moz-extension://00000000-0000-4000-8000-000000000009/popup-iframe.html` |

## Installed UI capture

- Options title: `ZeroOmega Options (Z​er​oOmega)`.
- Popup title: `Z​eroOmega Popup`.
- Popup viewport: `1366 × 682`.
- Popup document extent: `1366 × 682`.
- Screenshots: `options-zh-CN.png` and `popup-zh-CN.png` in the workflow Artifact.

## Acceptance boundary

This is real execution of the exact official Firefox package through Selenium WebDriver and WebDriver BiDi installation. It captures runtime title/Badge/Popup state and installed extension pages. Headless execution does not provide an operating-system screenshot of the browser toolbar icon itself; exact icon geometry/assets remain covered by source and package evidence. User-profile, Switch/PAC result, temporary-rule, Inspect and external-control states remain open.
