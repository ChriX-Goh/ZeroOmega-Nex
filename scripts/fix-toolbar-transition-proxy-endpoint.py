from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


chromium_path = Path("scripts/e2e-chromium-toolbar.mjs")
chromium = chromium_path.read_text(encoding="utf-8")
chromium = replace_once(
    chromium,
    """  const expectedTitles = await extensionPage.evaluate(() => {""",
    """  const expectedTitles = await extensionPage.evaluate((proxyPort) => {""",
    "Chromium expected title port input",
)
chromium = replace_once(
    chromium,
    """      fixedProxy: resultTitle('Toolbar Proxy', 'Toolbar Proxy', 'PROXY 127.0.0.1:7890\\n'),""",
    """      fixedProxy: resultTitle(
        'Toolbar Proxy',
        'Toolbar Proxy',
        `PROXY 127.0.0.1:${proxyPort}\\n`,
      ),""",
    "Chromium dynamic proxy detail",
)
chromium = replace_once(
    chromium,
    """      default: chrome.i18n.getMessage('manifest_icon_default_title'),
    };
  });""",
    """      default: chrome.i18n.getMessage('manifest_icon_default_title'),
    };
  }, address.port);""",
    "Chromium expected title evaluate argument",
)
chromium = replace_once(
    chromium,
    """      host: '127.0.0.1',
      port: 7890,
    },""",
    """      host: '127.0.0.1',
      port: address.port,
    },""",
    "Chromium reachable proxy endpoint",
)
chromium_path.write_text(chromium, encoding="utf-8")


firefox_path = Path("scripts/e2e-firefox.mjs")
firefox = firefox_path.read_text(encoding="utf-8")
firefox = replace_once(
    firefox,
    """        host: '127.0.0.1',
        port: 7890,
      },
    ];
    draft.settings.interface.showResultProfileOnActionBadgeText = true;""",
    """        host: '127.0.0.1',
        port: sourceAddress.port,
      },
    ];
    draft.settings.interface.showResultProfileOnActionBadgeText = true;""",
    "Firefox reachable focused proxy endpoint",
)
firefox = replace_once(
    firefox,
    """        'PROXY 127.0.0.1:7890\\n',
        toolbarPopup,""",
    """        `PROXY 127.0.0.1:${sourceAddress.port}\\n`,
        toolbarPopup,""",
    "Firefox dynamic focused proxy detail",
)
firefox_path.write_text(firefox, encoding="utf-8")
