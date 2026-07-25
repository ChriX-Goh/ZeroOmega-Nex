import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { Browser, Builder, By, Key, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000008';
const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference(
    'extensions.webextensions.uuids',
    JSON.stringify({ [addonId]: extensionUuid }),
  );
const driver = await new Builder()
  .forBrowser(Browser.FIREFOX)
  .setFirefoxOptions(options)
  .build();

try {
  const installedId = await driver.installAddon(extensionPath, true);
  assert.equal(installedId, addonId, 'Firefox returned an unexpected add-on ID');

  await driver.get(`moz-extension://${extensionUuid}/options.html`);
  let profileName;
  try {
    profileName = await driver.wait(
      until.elementLocated(By.css('input[aria-label="Profile name"]')),
      15_000,
    );
    await driver.wait(until.elementIsVisible(profileName), 15_000);
  } catch (error) {
    console.error(`[Firefox Options URL] ${await driver.getCurrentUrl()}`);
    console.error(`[Firefox Options title] ${await driver.getTitle()}`);
    console.error(
      `[Firefox Options body] ${await driver.executeScript('return document.body?.innerText ?? "";')}`,
    );
    console.error(`[Firefox Options source] ${(await driver.getPageSource()).slice(0, 20_000)}`);
    try {
      const browserLogs = await driver.manage().logs().get('browser');
      console.error(`[Firefox browser logs] ${JSON.stringify(browserLogs)}`);
    } catch (logError) {
      console.error(
        `[Firefox browser logs unavailable] ${logError instanceof Error ? logError.message : String(logError)}`,
      );
    }
    throw error;
  }
  assert.equal(await profileName.getAttribute('value'), 'Proxy');

  await profileName.clear();
  await profileName.sendKeys('Firefox E2E Proxy', Key.TAB);
  const apply = await driver.findElement(
    By.xpath("//button[normalize-space(.)='Apply changes']"),
  );
  await driver.wait(until.elementIsEnabled(apply), 15_000);
  await apply.click();
  await driver.wait(
    until.elementLocated(
      By.xpath("//*[contains(normalize-space(.), 'Draft matches the currently applied revision.') ]"),
    ),
    20_000,
  );

  const historyButton = await driver.findElement(
    By.xpath("//button[normalize-space(.)='Snapshot History']"),
  );
  await historyButton.click();
  await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space(.)='Configuration History']")),
    15_000,
  );
  await driver.wait(
    until.elementLocated(By.xpath("//*[starts-with(normalize-space(.), 'Snapshot pac-')]")),
    20_000,
  );

  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
  await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., 'Firefox E2E Proxy')]")),
    15_000,
  );
  const direct = await driver.findElement(By.xpath("//button[contains(., 'Direct')]"));
  await direct.click();
  await driver.wait(until.elementIsDisabled(direct), 15_000);

  console.log(`Firefox extension E2E passed for ${installedId}.`);
} finally {
  await driver.quit();
}
