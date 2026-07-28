from pathlib import Path

path = Path('.github/patches/apply-typed-locale-batch-one.py')
text = path.read_text()
old = "    '<h2>Proxy servers</h2>': \"<h2>{uiText('fixed.proxyServers', locale)}</h2>\",\n"
new = "    '<section class=\"settings-section fixed-proxy-section\">': '<section class=\"settings-section fixed-proxy-section\" data-typed-locale={locale}>',\n    '<h2>Proxy servers</h2>': \"<h2>{uiText('fixed.proxyServers', locale)}</h2>\",\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one Fixed typed locale marker anchor, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
