from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = "  await options.getByRole('button', { name: 'Add condition', exact: true }).click();\n"
new = "  await options.locator('.add-condition-row button').click();\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one Switch Add condition locator, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
