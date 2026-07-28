from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
replacements = {
    "options.getByLabel('Add quick-switch route')": "options.getByLabel('添加快速切换路由')",
    "ol[aria-label=\"Quick-switch route order\"]": "ol[aria-label=\"快速切换路由顺序\"]",
    "assert.match(dialog.message(), /Apply current changes before replacing profile references/u);":
        "assert.match(dialog.message(), /替换情景模式引用前，先应用当前更改吗/u);",
}
for old, new in replacements.items():
    if text.count(old) != 1:
        raise SystemExit(f'expected one General Chromium selector, found {text.count(old)}: {old!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
