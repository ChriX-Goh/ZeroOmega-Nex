from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = "const independentApply = options.getByRole('button', { name: 'Apply changes', exact: true });"
new = "const independentApply = options.locator('.actions button.apply');"
if text.count(old) != 1:
    raise SystemExit(f'expected one independent Apply selector, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
