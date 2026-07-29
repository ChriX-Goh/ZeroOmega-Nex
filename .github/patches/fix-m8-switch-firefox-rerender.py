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
new = """  const firefoxDraftCondition = async () =>
    driver.executeAsyncScript(`
      const done = arguments[0];
      browser.storage.local.get('zeroomega-nex/profile-workflow/v1/state').then((values) => {
        const workflow = values['zeroomega-nex/profile-workflow/v1/state'];
        const profile = workflow?.draft?.profiles?.find(
          (candidate) => candidate.name === 'Firefox Rule Source E2E',
        );
        done(profile?.kind === 'switch' ? profile.rules?.[0]?.condition : undefined);
      }, (error) => done({ error: String(error) }));
    `);
  const selectFirefoxCondition = async (kind) => {
    const currentSelect = await driver.wait(
      until.elementLocated(By.css('[data-switch-rule-row] [data-switch-condition-select]')),
      10_000,
    );
    await setControlValue(currentSelect, kind);
    await driver.wait(async () => (await firefoxDraftCondition())?.kind === kind, 10_000);
  };

  await selectFirefoxCondition('ip');
  const ipNetwork = await driver.wait(
    until.elementLocated(By.css('[data-switch-condition-field="ipNetwork"]')),
    10_000,
  );
  assert.equal(await ipNetwork.getAttribute('placeholder'), '127.0.0.1/8');
  await setControlValue(ipNetwork, '198.51.100.0/24');
  await driver.wait(async () => {
    const condition = await firefoxDraftCondition();
    return (
      condition?.kind === 'ip' &&
      condition.address === '198.51.100.0' &&
      condition.prefixLength === 24
    );
  }, 10_000);
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
print('Wait for Firefox Switch Draft CAS convergence after every condition mutation.')
