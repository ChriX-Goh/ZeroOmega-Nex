from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = "independentRuleEditor.getByLabel('Rule List URL')"
new = "independentRuleEditor.getByRole('textbox', { name: 'Rule List URL', exact: true })"
count = text.count(old)
if count != 2:
    raise SystemExit(f'expected two independent Rule List URL selectors, found {count}')
path.write_text(text.replace(old, new))
