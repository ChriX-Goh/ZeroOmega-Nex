from pathlib import Path

chromium = Path('scripts/e2e-chromium.mjs')
text = chromium.read_text()
old = """  const originalConditionKinds = await conditionSelect
    .locator('option[data-switch-condition-selectable-option]')
    .evaluateAll((options) => options.map((option) => option.value));
"""
new = """  const originalConditionKinds = await conditionSelect
    .locator('option')
    .evaluateAll((options) => options.map((option) => option.value));
"""
if text.count(old) != 1:
    raise SystemExit(f'Chromium option reader matches: {text.count(old)}')
chromium.write_text(text.replace(old, new))

firefox = Path('scripts/e2e-firefox.mjs')
text = firefox.read_text()
old = """    `return [...arguments[0].querySelectorAll('option[data-switch-condition-selectable-option]')]
      .map((option) => option.value);`,
"""
new = """    `return [...arguments[0].querySelectorAll('option')].map((option) => option.value);`,
"""
if text.count(old) != 1:
    raise SystemExit(f'Firefox option reader matches: {text.count(old)}')
firefox.write_text(text.replace(old, new))
print('Changed browser Switch matrix checks to read real option values.')
