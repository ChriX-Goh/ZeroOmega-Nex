# Audit Evidence 01B — Official ZeroOmega v3.5.0 Release Packages

## Authority

- Repository: `zero-peak/ZeroOmega`.
- Release tag: `v3.5.0`.
- Download source: official GitHub release assets only.
- Capture runner: Ubuntu 24.04 GitHub-hosted runner.

## Exact packages

| Target   | Asset                  |   Bytes | SHA-256                                                            | Extracted files |
| -------- | ---------------------- | ------: | ------------------------------------------------------------------ | --------------: |
| Chromium | `chromium-release.zip` | 1900340 | `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce` |             353 |
| Firefox  | `firefox-release.zip`  | 1900377 | `666ce976022ed379601b896f9138ada82a29aabfe0154bf2bf1ae779e3319cda` |             353 |

Both ZIP integrity tests passed before extraction.

## Manifest evidence

### Chromium

```json
{
  "target": "chromium",
  "name": "Proxy SwitchyOmega 3 (ZeroOmega)",
  "version": "3.5.0",
  "manifest_version": 3,
  "action": {
    "default_icon": {
      "16": "img/icons/omega-action-16.png",
      "19": "img/icons/omega-action-19.png",
      "24": "img/icons/omega-action-24.png",
      "32": "img/icons/omega-action-32.png"
    },
    "default_title": "__MSG_manifest_icon_default_title__",
    "default_popup": "popup-iframe.html"
  },
  "permissions": [
    "proxy",
    "tabs",
    "alarms",
    "storage",
    "unlimitedStorage",
    "webRequest",
    "webRequestAuthProvider",
    "contextMenus"
  ],
  "host_permissions": ["<all_urls>"],
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+Shift+O"
      }
    }
  },
  "background": {
    "service_worker": "x-background.js",
    "type": "module"
  },
  "options_page": "options.html",
  "options_ui": {
    "page": "options.html",
    "browser_style": false,
    "open_in_tab": true
  },
  "browser_specific_settings": null
}
```

### Firefox

```json
{
  "target": "firefox",
  "name": "Proxy SwitchyOmega 3 (ZeroOmega)",
  "version": "3.5.0",
  "manifest_version": 3,
  "action": {
    "default_icon": {
      "16": "img/icons/omega-action-16.png",
      "19": "img/icons/omega-action-19.png",
      "24": "img/icons/omega-action-24.png",
      "32": "img/icons/omega-action-32.png"
    },
    "default_title": "__MSG_manifest_icon_default_title__",
    "default_popup": "popup/index.html"
  },
  "permissions": [
    "proxy",
    "tabs",
    "alarms",
    "storage",
    "unlimitedStorage",
    "webRequest",
    "webRequestBlocking",
    "contextMenus"
  ],
  "host_permissions": ["<all_urls>"],
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+Shift+O"
      }
    }
  },
  "background": {
    "scripts": ["x-background.js"],
    "type": "module"
  },
  "options_page": null,
  "options_ui": {
    "page": "options.html",
    "browser_style": false,
    "open_in_tab": true
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "suziwen1@gmail.com",
      "strict_min_version": "112.0"
    }
  }
}
```

## Acceptance boundary

These are the exact official installable packages required for runtime reference. Package integrity and manifest identity are source-captured. Installed toolbar screenshots, per-tab transitions and browser-specific runtime observations remain open and must not be inferred from package inspection alone.
