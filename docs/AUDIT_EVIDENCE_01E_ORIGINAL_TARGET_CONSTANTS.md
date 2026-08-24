# Audit Evidence 01E — Original ZeroOmega v3.5.0 Toolbar Target Constants

## Authority

- Package: exact official `chromium-release.zip` from release `v3.5.0`.
- Package SHA-256: `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`.
- Manifest entry: `manifest.json`.

## Compiled manifest toolbar contract

```json
{
  "action": {
    "default_icon": {
      "16": "img/icons/omega-action-16.png",
      "19": "img/icons/omega-action-19.png",
      "24": "img/icons/omega-action-24.png",
      "32": "img/icons/omega-action-32.png"
    },
    "default_popup": "popup-iframe.html",
    "default_title": "__MSG_manifest_icon_default_title__"
  },
  "commands": {
    "_execute_action": {
      "suggested_key": {
        "default": "Alt+Shift+O"
      }
    }
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
  ]
}
```

## Compiled locale entries

### `en`

- Package entry: `_locales/en/messages.json`.

```json
{
  "browserAction_attachedPrefix": {
    "message": "(RL) "
  },
  "browserAction_defaultRuleDetails": {
    "message": "(default)"
  },
  "browserAction_directResult": {
    "message": "DIRECT"
  },
  "browserAction_tempRulePrefix": {
    "message": "(TEMP) "
  },
  "browserAction_titleExternalProxy": {
    "message": "Note: The proxy settings are currently controlled by other app(s)."
  },
  "browserAction_titleInspect": {
    "message": "[Inspect] $URL$",
    "placeholders": {
      "URL": {
        "content": "$1"
      },
      "_unused_0": {
        "content": "$0"
      }
    }
  },
  "browserAction_titleWithResult": {
    "message": "ZeroOmega:: $PROFILE$\n$DETAILS$",
    "placeholders": {
      "DETAILS": {
        "content": "$3"
      },
      "PROFILE": {
        "content": "$1"
      },
      "_unused_0": {
        "content": "$0"
      },
      "_unused_2": {
        "content": "$2"
      }
    }
  },
  "manifest_icon_default_title": {
    "message": "Loading…"
  }
}
```

### `zh_CN`

- Package entry: `_locales/zh_CN/messages.json`.

```json
{
  "browserAction_attachedPrefix": {
    "message": "(列表) "
  },
  "browserAction_defaultRuleDetails": {
    "message": "(默认)"
  },
  "browserAction_directResult": {
    "message": "直接连接"
  },
  "browserAction_tempRulePrefix": {
    "message": "(临时) "
  },
  "browserAction_titleExternalProxy": {
    "message": "注意：其他应用正在控制当前代理设置。"
  },
  "browserAction_titleInspect": {
    "message": "[检查] $URL$",
    "placeholders": {
      "URL": {
        "content": "$1"
      },
      "_unused_0": {
        "content": "$0"
      }
    }
  },
  "browserAction_titleWithResult": {
    "message": "ZeroOmega:: $PROFILE$\n$DETAILS$",
    "placeholders": {
      "DETAILS": {
        "content": "$3"
      },
      "PROFILE": {
        "content": "$1"
      },
      "_unused_0": {
        "content": "$0"
      },
      "_unused_2": {
        "content": "$2"
      }
    }
  },
  "manifest_icon_default_title": {
    "message": "正在加载……"
  }
}
```

### `zh_TW`

- Package entry: `_locales/zh_TW/messages.json`.

```json
{
  "browserAction_attachedPrefix": {
    "message": "(清單) "
  },
  "browserAction_defaultRuleDetails": {
    "message": "(預設)"
  },
  "browserAction_directResult": {
    "message": "直接連線"
  },
  "browserAction_tempRulePrefix": {
    "message": "(臨時) "
  },
  "browserAction_titleExternalProxy": {
    "message": "注意：其他應用正在控制目前代理設定。"
  },
  "browserAction_titleInspect": {
    "message": "[檢查] $URL$",
    "placeholders": {
      "URL": {
        "content": "$1"
      },
      "_unused_0": {
        "content": "$0"
      }
    }
  },
  "browserAction_titleWithResult": {
    "message": "ZeroOmega:: $PROFILE$\n$DETAILS$",
    "placeholders": {
      "DETAILS": {
        "content": "$3"
      },
      "PROFILE": {
        "content": "$1"
      },
      "_unused_0": {
        "content": "$0"
      },
      "_unused_2": {
        "content": "$2"
      }
    }
  },
  "manifest_icon_default_title": {
    "message": "正在載入……"
  }
}
```

## Acceptance boundary

This evidence fixes the compiled Chrome-extension message schema, placeholder names/content, manifest Action paths, command shortcut and permission list. It does not by itself modify Nex or prove runtime parity.
