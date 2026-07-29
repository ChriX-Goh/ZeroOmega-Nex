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
text = text.replace(old, new)

old = """  await createSwitch.click();
"""
new = """  await createSwitch.click();
  await driver.wait(
    async () => (await driver.findElements(By.css('.new-profile-dialog'))).length === 0,
    20_000,
    'Firefox Switch creation dialog did not close',
  );
  await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space(.)='Firefox Rule Source E2E']")),
    20_000,
  );
  await driver.wait(async () =>
    driver.executeAsyncScript(`
      const done = arguments[0];
      browser.storage.local.get('zeroomega-nex/profile-workflow/v1/state').then((values) => {
        const workflow = values['zeroomega-nex/profile-workflow/v1/state'];
        const selected = workflow?.draft?.profiles?.find(
          (candidate) => candidate.id === workflow?.selectedProfileId,
        );
        done(Boolean(
          selected?.kind === 'switch' &&
          selected.name === 'Firefox Rule Source E2E' &&
          selected.attachedRuleListProfileId === undefined
        ));
      }, (error) => done(String(error)));
    `),
    20_000,
    'Firefox newly created Switch profile did not settle before condition editing',
  );
"""
if text.count(old) != 1:
    raise SystemExit(f'Firefox Switch creation click matches: {text.count(old)}')
text = text.replace(old, new)

old = """  const attachRuleListSection = await driver.wait(
    until.elementLocated(By.css('[data-attach-rule-list-section]')),
    20_000,
  );
  await attachRuleListSection.findElement(By.css('button')).click();
  const attachedRuleList = await driver.wait(
    until.elementLocated(By.css('[data-attached-rule-list-config][data-typed-locale="zh-TW"]')),
    20_000,
  );
"""
new = """  const attachRuleListSection = await driver.wait(
    until.elementLocated(By.css('[data-attach-rule-list-section]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(attachRuleListSection), 10_000);
  const attachRuleListButton = await attachRuleListSection.findElement(By.css('button'));
  await driver.wait(until.elementIsEnabled(attachRuleListButton), 10_000);
  await attachRuleListButton.click();
  await driver.wait(async () =>
    driver.executeAsyncScript(`
      const done = arguments[0];
      browser.storage.local.get('zeroomega-nex/profile-workflow/v1/state').then((values) => {
        const workflow = values['zeroomega-nex/profile-workflow/v1/state'];
        const selected = workflow?.draft?.profiles?.find(
          (candidate) => candidate.id === workflow?.selectedProfileId,
        );
        const attached = selected?.attachedRuleListProfileId
          ? workflow?.draft?.profiles?.find(
              (candidate) => candidate.id === selected.attachedRuleListProfileId,
            )
          : undefined;
        done(Boolean(selected?.kind === 'switch' && attached?.kind === 'rule-list'));
      }, (error) => done(String(error)));
    `),
    20_000,
    'Firefox Rule List attachment did not settle in Draft',
  );
  const attachedRuleList = await driver.wait(
    until.elementLocated(By.css('[data-attached-rule-list-config][data-typed-locale="zh-TW"]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(attachedRuleList), 10_000);
"""
if text.count(old) != 1:
    raise SystemExit(f'Firefox Rule List attachment block matches: {text.count(old)}')
path.write_text(text.replace(old, new))
print('Stabilized Firefox Switch creation, condition Draft, and Rule List attachment transitions.')
