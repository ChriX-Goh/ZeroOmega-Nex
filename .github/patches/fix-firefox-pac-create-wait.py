from pathlib import Path

path = Path('scripts/e2e-firefox.mjs')
text = path.read_text()
old = """  const pacChoice = await driver.findElement(By.css('[data-new-profile-kind=\"pac\"]'));
  await pacChoice.click();
  const createPac = await driver.findElement(By.css('[data-new-profile-create]'));
  await driver.wait(until.elementIsEnabled(createPac), 10_000);
  await createPac.click();
  const pacEditor = await driver.wait(
    until.elementLocated(By.css('[data-pac-profile-editor][data-typed-locale=\"zh-TW\"]')),
    20_000,
  );
"""
new = """  const pacChoice = await driver.findElement(By.css('[data-new-profile-kind=\"pac\"]'));
  await pacChoice.click();
  await driver.wait(async () => pacChoice.isSelected(), 5_000);
  const createPac = await driver.findElement(By.css('[data-new-profile-create]'));
  await driver.wait(until.elementIsEnabled(createPac), 10_000);
  await createPac.click();
  let pacEditor;
  try {
    await driver.wait(
      async () => (await driver.findElements(By.css('.new-profile-dialog'))).length === 0,
      20_000,
    );
    pacEditor = await driver.wait(
      until.elementLocated(By.css('[data-pac-profile-editor][data-typed-locale=\"zh-TW\"]')),
      20_000,
    );
  } catch (error) {
    await logDiagnostics('remote PAC creation');
    throw error;
  }
"""
if text.count(old) != 1:
    raise SystemExit(f'expected one PAC creation block, found {text.count(old)}')
path.write_text(text.replace(old, new))
