import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import { Browser, Builder, By, until } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

const extensionPath = resolve('dist/firefox-mv3');
const addonId = 'zeroomega-nex@chrix-goh.github';
const extensionUuid = '00000000-0000-4000-8000-000000000008';
const options = new firefox.Options()
  .addArguments('-headless')
  .setPreference('extensions.allowPrivateBrowsingByDefault', true)
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
    const runtimeDiagnostics = await driver.executeAsyncScript(`
      const done = arguments[0];
      (async () => {
        const result = {
          manifest: browser.runtime.getManifest(),
          storage: await browser.storage.local.get(null),
        };
        try {
          result.response = await browser.runtime.sendMessage({
            channel: 'zeroomega-nex/profile-workflow/v1',
            action: 'get',
          });
        } catch (sendError) {
          result.sendError = {
            message: sendError instanceof Error ? sendError.message : String(sendError),
            stack: sendError instanceof Error ? sendError.stack : undefined,
          };
        }
        result.storageAfterMessage = await browser.storage.local.get(null);
        done(result);
      })().catch((diagnosticError) => done({
        diagnosticError: diagnosticError instanceof Error
          ? { message: diagnosticError.message, stack: diagnosticError.stack }
          : String(diagnosticError),
      }));
    `);
    console.error(`[Firefox runtime diagnostics] ${JSON.stringify(runtimeDiagnostics)}`);
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

  await driver.executeScript(
    `
      const input = arguments[0];
      const value = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    `,
    profileName,
    'Firefox E2E Proxy',
  );
  await driver.wait(async () => (await profileName.getAttribute('value')) === 'Firefox E2E Proxy', 5_000);
  const apply = await driver.wait(until.elementLocated(By.css('.actions button.primary')), 15_000);
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
