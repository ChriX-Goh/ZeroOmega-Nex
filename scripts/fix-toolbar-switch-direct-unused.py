from pathlib import Path


def remove_once(path_name: str, block: str, label: str) -> None:
    path = Path(path_name)
    text = path.read_text(encoding='utf-8')
    count = text.count(block)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    path.write_text(text.replace(block, '', 1), encoding='utf-8')


remove_once(
    'scripts/e2e-chromium-toolbar.mjs',
    """      switchDefault: resultTitle(
        'Toolbar Switch',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\\nPROXY 127.0.0.1:${proxyPort}\\n`,
      ),
""",
    'Chromium obsolete Switch Fixed-default expectation',
)

remove_once(
    'scripts/e2e-firefox.mjs',
    """    const switchDefaultAction = {
      ...(await literalFirefoxActionState(
        'Toolbar Switch',
        'Toolbar Proxy',
        `${defaultDetail} => Toolbar Proxy\\nPROXY 127.0.0.1:${sourceAddress.port}\\n`,
        toolbarPopup,
      )),
      badgeText: 'Tool',
    };
""",
    'Firefox obsolete Switch Fixed-default expectation',
)
