from pathlib import Path

path = Path('scripts/e2e-firefox.mjs')
text = path.read_text()
old = """  await setControlValue(conditionSelect, 'ip');
  const ipNetwork = await driver.wait(
    until.elementLocated(By.css('[data-switch-condition-field="ipNetwork"]')),
    10_000,
  );
  assert.equal(await ipNetwork.getAttribute('placeholder'), '127.0.0.1/8');
  await setControlValue(ipNetwork, '198.51.100.0/24');
  await setControlValue(conditionSelect, 'false');
  await driver.wait(until.elementLocated(By.css('[data-switch-false-condition]')), 10_000);
  await setControlValue(conditionSelect, 'host-wildcard');
  const hostPattern = await driver.wait(
    until.elementLocated(By.css('[data-switch-condition-field="pattern"]')),
    10_000,
  );
"""
new = """  const selectFirefoxCondition = async (kind) => {
    const currentSelect = await driver.wait(
      until.elementLocated(By.css('[data-switch-rule-row] [data-switch-condition-select]')),
      10_000,
    );
    await setControlValue(currentSelect, kind);
    await driver.wait(async () => {
      const latestSelect = await driver.findElement(
        By.css('[data-switch-rule-row] [data-switch-condition-select]'),
      );
      return (await latestSelect.getAttribute('value')) === kind;
    }, 10_000);
  };

  await selectFirefoxCondition('ip');
  const ipNetwork = await driver.wait(
    until.elementLocated(By.css('[data-switch-condition-field="ipNetwork"]')),
    10_000,
  );
  assert.equal(await ipNetwork.getAttribute('placeholder'), '127.0.0.1/8');
  await setControlValue(ipNetwork, '198.51.100.0/24');
  await selectFirefoxCondition('false');
  await driver.wait(until.elementLocated(By.css('[data-switch-false-condition]')), 10_000);
  await selectFirefoxCondition('host-wildcard');
  const hostPattern = await driver.wait(
    until.elementLocated(By.css('[data-switch-condition-field="pattern"]')),
    10_000,
  );
"""
if text.count(old) != 1:
    raise SystemExit(f'Firefox rerender-sensitive Switch block matches: {text.count(old)}')
path.write_text(text.replace(old, new))
print('Reacquire Firefox Switch condition selector after every Svelte rerender.')
