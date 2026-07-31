import json
from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


locale_entries = {
    "en": {
        "browserAction_attachedPrefix": {
            "message": "(attached) ",
            "description": "A prefix prepended to the matching details if an attached profile has matched the request.",
        },
        "browserAction_defaultRuleDetails": {
            "message": "(default)",
            "description": "Matching details if the default condition is used.",
        },
        "browserAction_directResult": {
            "message": "(not using any proxy)",
            "description": "Matching details if no proxy is used for the request.",
        },
        "browserAction_tempRulePrefix": {
            "message": "(temporary rule) ",
            "description": "A prefix prepended to the matching details if a temporary rule has matched the request.",
        },
        "browserAction_titleExternalProxy": {
            "message": "(controlled by other extensions or environment)",
            "description": "The last line of the title of the toolbar icon when the proxy is set by other extensions, policies, command line options, etc.",
        },
        "browserAction_titleInspect": {
            "message": "[Inspect] $URL$",
            "description": "The last line of the title of the toolbar icon while inspecting proxy used for requests on the current tab.",
            "placeholders": {
                "url": {"content": "$2", "example": "http://www.example.com/"},
                "_unused_0": {"content": "$1", "example": "Profile Name"},
            },
        },
        "browserAction_titleWithResult": {
            "message": "ZeroOmega:: $PROFILE$\n$DETAILS$",
            "description": "Title of the toolbar icon, indicating that the last request on the current tab is routed under profile $1, with matching details $3.",
            "placeholders": {
                "details": {"content": "$3", "example": "(default)"},
                "profile": {"content": "$1", "example": "Profile Name"},
                "_unused_0": {"content": "$2", "example": "(another profile)"},
            },
        },
        "manifest_icon_default_title": {
            "message": "Loading...",
            "description": "Default title for the toolbar icon shown while loading.",
        },
    },
    "zh_CN": {
        "browserAction_attachedPrefix": {
            "message": "（附加）",
            "description": "附加情景模式匹配请求时，匹配细节之前的前缀。",
        },
        "browserAction_defaultRuleDetails": {
            "message": "（默认情景模式）",
            "description": "使用默认条件时的匹配细节。",
        },
        "browserAction_directResult": {
            "message": "（未使用代理服务器）",
            "description": "请求未使用代理时的匹配细节。",
        },
        "browserAction_tempRulePrefix": {
            "message": "（临时规则）",
            "description": "临时规则匹配请求时，匹配细节之前的前缀。",
        },
        "browserAction_titleExternalProxy": {
            "message": "（代理服务器由其它扩展或环境控制。）",
            "description": "代理服务器由其它扩展、策略或命令行选项等控制时，工具栏图标的最后一行标题。",
        },
        "browserAction_titleInspect": {
            "message": "[检查] $URL$",
            "description": "检查当前标签页的请求使用的代理服务器时，工具栏图标的最后一行标题。",
            "placeholders": {
                "url": {"content": "$2", "example": "http://www.example.com/"},
                "_unused_0": {"content": "$1", "example": "Profile Name"},
            },
        },
        "browserAction_titleWithResult": {
            "message": "ZeroOmega:: $PROFILE$\n$DETAILS$",
            "description": "工具栏图标的标题，指示当前标签页的最后一个请求依据情景模式 $1 处理，并附匹配细节 $3。",
            "placeholders": {
                "details": {"content": "$3", "example": "(default)"},
                "profile": {"content": "$1", "example": "Profile Name"},
                "_unused_0": {"content": "$2", "example": "(another profile)"},
            },
        },
        "manifest_icon_default_title": {
            "message": "正在加载……",
            "description": "加载时工具栏图标显示的标题。",
        },
    },
    "zh_TW": {
        "browserAction_attachedPrefix": {
            "message": "（附加）",
            "description": "附加情境模式匹配要求時，匹配細節之前的前綴。",
        },
        "browserAction_defaultRuleDetails": {
            "message": "（預設情境模式）",
            "description": "使用預設條件時的匹配細節。",
        },
        "browserAction_directResult": {
            "message": "（未使用 Proxy 伺服器）",
            "description": "要求未使用 Proxy 時的匹配細節。",
        },
        "browserAction_tempRulePrefix": {
            "message": "（暫時規則）",
            "description": "暫時規則匹配要求時，匹配細節之前的前綴。",
        },
        "browserAction_titleExternalProxy": {
            "message": "（Proxy 伺服器由其它擴充功能或環境控制。）",
            "description": "Proxy 伺服器由其它擴充功能、規則或命令列選項等控制時，工具列圖示的最後一行標題。",
        },
        "browserAction_titleInspect": {
            "message": "[檢查] $URL$",
            "description": "檢查目前分頁的要求使用的 Proxy 伺服器時，工具列圖示的最後一行標題。",
            "placeholders": {
                "url": {"content": "$2", "example": "http://www.example.com/"},
                "_unused_0": {"content": "$1", "example": "Profile Name"},
            },
        },
        "browserAction_titleWithResult": {
            "message": "ZeroOmega:: $PROFILE$\n$DETAILS$",
            "description": "工具列圖示的標題，表示目前分頁的最後一個要求依據情境模式 $1 處理，並附匹配細節 $3。",
            "placeholders": {
                "details": {"content": "$3", "example": "(default)"},
                "profile": {"content": "$1", "example": "Profile Name"},
                "_unused_0": {"content": "$2", "example": "(another profile)"},
            },
        },
        "manifest_icon_default_title": {
            "message": "正在載入……",
            "description": "載入時工具列圖示顯示的標題。",
        },
    },
}

for locale, entries in locale_entries.items():
    path = Path(f"apps/extension/public/_locales/{locale}/messages.json")
    messages = json.loads(path.read_text(encoding="utf-8"))
    messages.update(entries)
    path.write_text(
        json.dumps(messages, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

wxt_path = Path("apps/extension/wxt.config.ts")
wxt = wxt_path.read_text(encoding="utf-8")
wxt = replace_once(
    wxt,
    """const icons = {
  16: 'icon/16.png',
  32: 'icon/32.png',
  48: 'icon/48.png',
  128: 'icon/128.png',
} as const;""",
    """const icons = {
  16: 'icon/16.png',
  32: 'icon/32.png',
  48: 'icon/48.png',
  128: 'icon/128.png',
} as const;

const originalActionIcons = {
  16: 'icon/original-action-16.png',
  19: 'icon/original-action-19.png',
  24: 'icon/original-action-24.png',
  32: 'icon/original-action-32.png',
} as const;""",
    "wxt icons",
)
wxt = replace_once(
    wxt,
    """      'activeTab',
      'contextMenus',""",
    """      'activeTab',
      'contextMenus',
      'tabs',""",
    "wxt tabs permission",
)
wxt = replace_once(
    wxt,
    """    action: {
      default_title: '__MSG_actionTitle__',
      default_icon: icons,
    },""",
    """    action: {
      default_title: '__MSG_manifest_icon_default_title__',
      default_icon: originalActionIcons,
      default_popup: browser === 'firefox' ? 'popup/index.html' : 'popup-iframe.html',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+O',
        },
        description: 'Toggle the proxy setting',
      },
    },""",
    "wxt action contract",
)
wxt_path.write_text(wxt, encoding="utf-8")

inspect_path = Path("scripts/inspect-manifests.mjs")
inspect = inspect_path.read_text(encoding="utf-8")
inspect = replace_once(
    inspect,
    "['proxy', 'storage', 'alarms', 'activeTab', 'contextMenus']",
    "['proxy', 'storage', 'alarms', 'activeTab', 'contextMenus', 'tabs']",
    "manifest required permissions",
)
inspect = replace_once(
    inspect,
    """  if (!manifest.action?.default_popup) {
    throw new Error(`${relative(repositoryRoot.pathname, file)} is missing the popup entrypoint.`);
  }
  if (!manifest.options_ui?.page) {""",
    """  const expectedPopup = gecko ? 'popup/index.html' : 'popup-iframe.html';
  if (manifest.action?.default_popup !== expectedPopup) {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} has invalid Action popup: ${manifest.action?.default_popup ?? '(missing)'}`,
    );
  }
  if (manifest.action?.default_title !== '__MSG_manifest_icon_default_title__') {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} has invalid Action default title: ${manifest.action?.default_title ?? '(missing)'}`,
    );
  }
  const actionIcons = manifest.action?.default_icon ?? {};
  assertExactSet(Object.keys(actionIcons), ['16', '19', '24', '32'], 'Action icon sizes', file);
  for (const [size, iconPath] of Object.entries(actionIcons)) {
    if (iconPath !== `icon/original-action-${size}.png`) {
      throw new Error(
        `${relative(repositoryRoot.pathname, file)} has invalid Action icon ${size}: ${iconPath}`,
      );
    }
  }
  const executeAction = manifest.commands?._execute_action;
  if (executeAction?.suggested_key?.default !== 'Alt+Shift+O') {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} has invalid Action shortcut: ${executeAction?.suggested_key?.default ?? '(missing)'}`,
    );
  }
  if (executeAction?.description !== 'Toggle the proxy setting') {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} has invalid Action shortcut description.`,
    );
  }
  if (!manifest.options_ui?.page) {""",
    "manifest action assertions",
)
inspect = inspect.replace(
    "proxy/storage/alarms/activeTab/contextMenus required",
    "proxy/storage/alarms/activeTab/contextMenus/tabs required",
)
inspect_path.write_text(inspect, encoding="utf-8")

knowledge_path = Path("docs/ORIGINAL_KNOWLEDGE_GRAPH.md")
knowledge = knowledge_path.read_text(encoding="utf-8")
marker = "## 21. Session 8 工具栏目标常量纠偏"
if marker not in knowledge:
    knowledge += """

## 21. Session 8 工具栏目标常量纠偏

### 21.1 权威证据

- 官方 Chromium v3.5.0 包 SHA-256：`4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`。
- 编译 manifest 与 `en` / `zh_CN` / `zh_TW` 词条：`AUDIT_EVIDENCE_01E_ORIGINAL_TARGET_CONSTANTS.md`。
- 原版静态 Action Blob：16 `46f3348f...`、19 `3498aa0d...`、24 `adfe3560...`、32 `07e41189...`。

### 21.2 固定目标契约

```text
Chromium manifest Popup = popup-iframe.html
Firefox manifest Popup = popup/index.html
每标签页运行时 Popup = popup-iframe.html
Action 默认标题 = __MSG_manifest_icon_default_title__
Action 静态尺寸 = 16 / 19 / 24 / 32
快捷键 = Alt+Shift+O
必需权限新增 tabs
结果标题接收三参数，但编译模板只显示 $1 与 $3；$2 必须继续传入并保持未使用占位符
```

### 21.3 当前实施边界

- 精确静态资产、三套编译词条、两个 Popup 兼容入口和 manifest 目标常量在本切片接入。
- 该切片只修正安装后的默认 Action 契约；每标签页结果仍需真实协调器、解析器和 `browser.action` 绑定。
- 不因 manifest 绿色测试关闭 `KG-ICON-001` 或任何 `TB-*` 行。
"""
knowledge_path.write_text(knowledge, encoding="utf-8")

ui_path = Path("docs/UI_AUDIT_MATRIX.md")
ui = ui_path.read_text(encoding="utf-8")
marker = "## Session 8 Toolbar Contract Correction"
if marker not in ui:
    ui += """

## Session 8 Toolbar Contract Correction

| ID   | Area                              | Original reference                                                | Required behavior                                                                      | Classification | Nex status | Edge     | Acceptance evidence                                      |
| ---- | --------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------- | ---------- | -------- | -------------------------------------------------------- |
| H-13 | Compiled toolbar locale contract  | `AUDIT_EVIDENCE_01E_ORIGINAL_TARGET_CONSTANTS.md`                  | Preserve exact default/result/detail keys, placeholder objects and three-argument call | `MUST_MATCH`   | `DONE`     | `SAME`   | locale validation plus compiled-package evidence         |
| J-06 | Target Action manifest defaults   | official Chromium/Firefox v3.5.0 packages and runtime evidence    | Preserve target Popup path, default title, 16/19/24/32 fallback icons and shortcut     | `MUST_MATCH`   | `PARTIAL`  | `MIXED`  | built-manifest audit; runtime coordinator still required |
| J-07 | Per-tab Action runtime convergence | source/runtime toolbar matrix and `DELIVERY_ORDER_01_TOOLBAR_STATE.md` | Route tab/profile/Inspect/temp/external state through one coordinator                   | `MUST_MATCH`   | `MISSING`  | `MISSING` | real Chromium/Firefox Action-state tests and owner PASS  |

This section supersedes any older implication that toolbar target constants or localization are unknown. It does not supersede the project-wide failure state or authorize a candidate.
"""
ui_path.write_text(ui, encoding="utf-8")

index_path = Path("docs/ACTIVE_PARITY_AUDIT_INDEX.md")
index = index_path.read_text(encoding="utf-8")
index = replace_once(
    index,
    "`AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`",
    "`AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`; `AUDIT_EVIDENCE_01E_ORIGINAL_TARGET_CONSTANTS.md`",
    "active evidence list",
)
index = replace_once(
    index,
    "- current manifest uses a different green static icon and incomplete original size/permission/shortcut contract;",
    "- the current slice replaces the Action defaults with exact 16/19/24/32 original fallback assets, localized loading title, target Popup paths, `tabs` permission and `Alt+Shift+O`; per-tab runtime convergence remains absent;",
    "active manifest gap",
)
index_path.write_text(index, encoding="utf-8")

order_path = Path("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md")
order = order_path.read_text(encoding="utf-8")
order = replace_once(
    order,
    "- Firefox runtime evidence: `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`.",
    "- Firefox runtime evidence: `AUDIT_EVIDENCE_01D_ORIGINAL_FIREFOX_RUNTIME.md`.\n- Compiled target constants: `AUDIT_EVIDENCE_01E_ORIGINAL_TARGET_CONSTANTS.md`.",
    "order evidence",
)
order = replace_once(
    order,
    "| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | different fallback/manifest contract                            | `BROKEN_IN_NEX`                              | exact original-compatible assets/title and target manifest tests |",
    "| `TB-001` | Static fallback Ω assets and localized default title                  | source, packages                   | exact target fallback assets/title/Popup/shortcut/permission defaults implemented; runtime default clearing still open | `PARTIAL` | real target manifest plus default/internal-page Action verification |",
    "TB-001",
)
order_path.write_text(order, encoding="utf-8")
