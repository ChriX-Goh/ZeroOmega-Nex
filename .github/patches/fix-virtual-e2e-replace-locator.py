from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = "  await virtualEditor.locator('[data-virtual-replace]').click();\n"
new = "  await virtualOptions.locator('[data-virtual-replace]').click();\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one Virtual replace locator, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
