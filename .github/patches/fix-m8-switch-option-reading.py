from pathlib import Path

chromium = Path('scripts/e2e-chromium.mjs')
text = chromium.read_text()
old = """  const originalConditionKinds = await conditionSelect
    .locator('option[data-switch-condition-selectable-option]')
    .evaluateAll((options) => options.map((option) => option.value));
"""
new = """  await assertEventually(
    async () => (await conditionSelect.locator('option').count()) === 10,
    'Original Switch condition options did not finish rendering',
  );
  const originalConditionKinds = await conditionSelect
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
text = text.replace(old, new)
anchor = """  const originalConditionKinds = await driver.executeScript(
"""
wait = """  await driver.wait(
    async () =>
      Number(
        await driver.executeScript(
          `return arguments[0].querySelectorAll('option').length;`,
          conditionSelect,
        ),
      ) === 10,
    10_000,
  );
"""
if text.count(anchor) != 1:
    raise SystemExit(f'Firefox option wait anchor matches: {text.count(anchor)}')
firefox.write_text(text.replace(anchor, wait + anchor))
print('Wait for the ten real browser Switch options before reading their values.')
