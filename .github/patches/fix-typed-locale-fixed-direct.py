from pathlib import Path

path = Path('.github/patches/apply-typed-locale-batch-one.py')
text = path.read_text()
old = "  'fixed.default': { en: '(default)', 'zh-CN': '(默认)', 'zh-TW': '(預設)' },\n"
new = old + "  'fixed.direct': { en: 'DIRECT', 'zh-CN': '直接连接', 'zh-TW': '直接連線' },\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one Fixed direct catalog anchor, found {text.count(old)}')
text = text.replace(old, new, 1)
old_use = "uiText('route.direct', locale)}</option>\",\n"
new_use = "uiText('fixed.direct', locale)}</option>\",\n"
if text.count(old_use) != 1:
    raise SystemExit(f'expected one Fixed direct template key, found {text.count(old_use)}')
path.write_text(text.replace(old_use, new_use, 1))
