from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new))

Path('scripts/e2e-basic-auth-proxy.mjs').write_text(r'''import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';

function safeEqual(left, right) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export async function createBasicAuthProxyChallengeServer({
  username,
  password,
  marker = 'ZeroOmega Nex proxy authentication passed',
}) {
  const targetPath = `/auth-check/${crypto.randomUUID()}`;
  const targetUrl = `http://zeroomega-auth-target.invalid${targetPath}`;
  const expectedAuthorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  let unauthorizedCount = 0;
  let authorizedCount = 0;
  let targetAuthorizedCount = 0;
  let targetUnauthorizedCount = 0;

  const server = createServer((request, response) => {
    const requestUrl = request.url ?? '';
    const isTarget = requestUrl.includes(targetPath);
    const authorization = String(request.headers['proxy-authorization'] ?? '');
    if (!safeEqual(authorization, expectedAuthorization)) {
      unauthorizedCount += 1;
      if (isTarget) targetUnauthorizedCount += 1;
      response.writeHead(407, {
        'proxy-authenticate': 'Basic realm="ZeroOmega Nex E2E"',
        'cache-control': 'no-store',
        connection: 'close',
        'content-type': 'text/plain; charset=utf-8',
      });
      response.end('Proxy authentication required');
      return;
    }

    authorizedCount += 1;
    if (isTarget) targetAuthorizedCount += 1;
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
    });
    response.end(
      `<!doctype html><html><head><title>Proxy authentication passed</title></head><body><main data-proxy-auth-success>${marker}</main></body></html>`,
    );
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Proxy authentication test server failed to bind');
  }

  return {
    host: '127.0.0.1',
    port: address.port,
    targetUrl,
    marker,
    stats: () => ({
      unauthorizedCount,
      authorizedCount,
      targetUnauthorizedCount,
      targetAuthorizedCount,
    }),
    close: () =>
      new Promise((resolveClose, rejectClose) => {
        server.close((error) => (error ? rejectClose(error) : resolveClose()));
      }),
  };
}
''')

# Chromium: replace the fictional endpoint with the controlled 407 proxy and navigate through it.
chromium = Path('scripts/e2e-chromium.mjs')
replace_once(
    chromium,
    """import { chromium } from '@playwright/test';

""",
    """import { chromium } from '@playwright/test';

import { createBasicAuthProxyChallengeServer } from './e2e-basic-auth-proxy.mjs';

""",
    'Chromium proxy helper import',
)
replace_once(
    chromium,
    """const onlineBackupUrl = `http://127.0.0.1:${ruleAddress.port}/online-backup`;
let context;
""",
    """const onlineBackupUrl = `http://127.0.0.1:${ruleAddress.port}/online-backup`;
const proxyAuthUsername = 'chromium-e2e';
const proxyAuthPassword = 'chromium-e2e-password';
const authProxy = await createBasicAuthProxyChallengeServer({
  username: proxyAuthUsername,
  password: proxyAuthPassword,
  marker: 'Chromium authenticated proxy request passed',
});
let context;
""",
    'Chromium proxy server creation',
)
replace_once(
    chromium,
    """  await fallbackServer.fill('proxy.e2e.invalid');
  await fallbackServer.press('Tab');
  await assertEventually(
    async () => !(await fallbackRow.locator('[data-proxy-action="authentication"]').isDisabled()),
    'Fixed Profile authentication button remained disabled after saving the endpoint',
  );
""",
    """  await fallbackServer.fill(authProxy.host);
  await fallbackServer.press('Tab');
  await fallbackPort.fill(String(authProxy.port));
  await fallbackPort.press('Tab');
  await assertEventually(
    async () => !(await fallbackRow.locator('[data-proxy-action="authentication"]').isDisabled()),
    'Fixed Profile authentication button remained disabled after saving the endpoint',
  );
""",
    'Chromium controlled endpoint configuration',
)
replace_once(
    chromium,
    """  assert.equal(
    await httpRow.locator('[data-proxy-field="server"]').getAttribute('placeholder'),
    'proxy.e2e.invalid',
  );
  assert.equal(
    await httpRow.locator('[data-proxy-field="port"]').getAttribute('placeholder'),
    '80',
  );
""",
    """  assert.equal(
    await httpRow.locator('[data-proxy-field="server"]').getAttribute('placeholder'),
    authProxy.host,
  );
  assert.equal(
    await httpRow.locator('[data-proxy-field="port"]').getAttribute('placeholder'),
    String(authProxy.port),
  );
""",
    'Chromium inherited proxy placeholders',
)
replace_once(
    chromium,
    """  await fixedAuthUsername.fill('chromium-e2e');
  await authDialog.getByRole('textbox', { name: '密码', exact: true }).fill('not-a-real-secret');
""",
    """  await fixedAuthUsername.fill(proxyAuthUsername);
  await authDialog.getByRole('textbox', { name: '密码', exact: true }).fill(proxyAuthPassword);
""",
    'Chromium auth credentials',
)
replace_once(
    chromium,
    """  await apply.click();
  await options.getByText('当前设置已全部应用。').waitFor({ state: 'visible', timeout: 20_000 });

  const popup = await context.newPage();
""",
    """  await apply.click();
  await options.getByText('当前设置已全部应用。').waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await worker.evaluate(async () =>
      chrome.permissions.contains({
        permissions: ['webRequest', 'webRequestAuthProvider'],
        origins: ['http://*/*', 'https://*/*'],
      }),
    ),
    true,
    'Chromium Apply did not grant proxy-authentication permissions',
  );

  const popup = await context.newPage();
""",
    'Chromium auth permission assertion',
)
replace_once(
    chromium,
    """  await assertEventually(
    async () => customProfile.isDisabled(),
    'Custom profile did not become active',
  );

  await options.getByRole('button', { name: '配置历史' }).click();
""",
    """  await assertEventually(
    async () => customProfile.isDisabled(),
    'Custom profile did not become active',
  );

  const authenticatedPage = await context.newPage();
  await authenticatedPage.goto(authProxy.targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 20_000,
  });
  await authenticatedPage.locator('[data-proxy-auth-success]').waitFor({ timeout: 20_000 });
  assert.equal(
    await authenticatedPage.locator('[data-proxy-auth-success]').innerText(),
    authProxy.marker,
  );
  const chromiumProxyStats = authProxy.stats();
  assert.equal(
    chromiumProxyStats.unauthorizedCount >= 1,
    true,
    'Chromium proxy never emitted a real 407 challenge',
  );
  assert.equal(
    chromiumProxyStats.authorizedCount >= 1 && chromiumProxyStats.targetAuthorizedCount >= 1,
    true,
    'Chromium did not retry the target with extension-supplied proxy credentials',
  );
  await authenticatedPage.close();

  await options.getByRole('button', { name: '配置历史' }).click();
""",
    'Chromium real 407 navigation',
)
replace_once(
    chromium,
    """  await new Promise((resolveClose) => ruleServer.close(resolveClose));
  await rm(userDataDir, { recursive: true, force: true });
""",
    """  await new Promise((resolveClose) => ruleServer.close(resolveClose));
  await authProxy.close();
  await rm(userDataDir, { recursive: true, force: true });
""",
    'Chromium proxy server cleanup',
)

# Firefox: configure the same controlled endpoint and credentials through the Traditional Chinese UI.
firefox = Path('scripts/e2e-firefox.mjs')
replace_once(
    firefox,
    """import firefox from 'selenium-webdriver/firefox.js';

""",
    """import firefox from 'selenium-webdriver/firefox.js';

import { createBasicAuthProxyChallengeServer } from './e2e-basic-auth-proxy.mjs';

""",
    'Firefox proxy helper import',
)
replace_once(
    firefox,
    """const onlineBackupPermissionOrigin = 'http://localhost/*';

const extensionPath = resolve('dist/firefox-mv3');
""",
    """const onlineBackupPermissionOrigin = 'http://localhost/*';
const proxyAuthUsername = 'firefox-e2e';
const proxyAuthPassword = 'firefox-e2e-password';
const authProxy = await createBasicAuthProxyChallengeServer({
  username: proxyAuthUsername,
  password: proxyAuthPassword,
  marker: 'Firefox authenticated proxy request passed',
});

const extensionPath = resolve('dist/firefox-mv3');
""",
    'Firefox proxy server creation',
)
replace_once(
    firefox,
    """  await driver.executeScript(
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
""",
    """  const fixedTable = await driver.wait(
    until.elementLocated(By.css('[data-fixed-proxy-table]')),
    15_000,
  );
  const fallbackRow = await fixedTable.findElement(By.css('[data-proxy-scheme="fallback"]'));
  const fallbackProtocol = await fallbackRow.findElement(By.css('[data-proxy-field="protocol"]'));
  const fallbackServer = await fallbackRow.findElement(By.css('[data-proxy-field="server"]'));
  const fallbackPort = await fallbackRow.findElement(By.css('[data-proxy-field="port"]'));
  await setControlValue(fallbackProtocol, 'http');
  await driver.wait(async () => (await fallbackPort.getAttribute('value')) === '80', 10_000);
  await setControlValue(fallbackServer, authProxy.host);
  await setControlValue(fallbackPort, String(authProxy.port));
  const authenticationButton = await fallbackRow.findElement(
    By.css('[data-proxy-action="authentication"]'),
  );
  await driver.wait(until.elementIsEnabled(authenticationButton), 10_000);
  await authenticationButton.click();
  const authDialog = await driver.wait(
    until.elementLocated(By.css('[data-fixed-auth-dialog]')),
    10_000,
  );
  const authInputs = await authDialog.findElements(By.css('input'));
  assert.equal(authInputs.length >= 2, true, 'Firefox authentication dialog inputs are missing');
  await setControlValue(authInputs[0], proxyAuthUsername);
  await setControlValue(authInputs[1], proxyAuthPassword);
  const saveAuthentication = await authDialog.findElement(By.css('[data-auth-action="save"]'));
  await driver.wait(until.elementIsEnabled(saveAuthentication), 10_000);
  await saveAuthentication.click();
  await driver.wait(until.stalenessOf(authDialog), 10_000);

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
""",
    'Firefox Fixed/auth UI configuration',
)
replace_once(
    firefox,
    """  } catch (error) {
    await logDiagnostics('Apply');
    throw error;
  }

  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
""",
    """  } catch (error) {
    await logDiagnostics('Apply');
    throw error;
  }
  assert.equal(
    await driver.executeAsyncScript(`
      const done = arguments[0];
      browser.permissions.contains({
        permissions: ['webRequest', 'webRequestBlocking'],
        origins: ['http://*/*', 'https://*/*'],
      }).then(done, (error) => done(String(error)));
    `),
    true,
    'Firefox Apply did not grant proxy-authentication permissions',
  );

  await driver.get(`moz-extension://${extensionUuid}/popup.html`);
""",
    'Firefox auth permission assertion',
)
replace_once(
    firefox,
    """  await customProfile.click();
  await driver.wait(until.elementIsDisabled(customProfile), 20_000);

  await driver.get(`moz-extension://${extensionUuid}/options.html#/history`);
""",
    """  await customProfile.click();
  await driver.wait(until.elementIsDisabled(customProfile), 20_000);

  await driver.get(authProxy.targetUrl);
  const authenticatedMarker = await driver.wait(
    until.elementLocated(By.css('[data-proxy-auth-success]')),
    20_000,
  );
  assert.equal(await authenticatedMarker.getText(), authProxy.marker);
  const firefoxProxyStats = authProxy.stats();
  assert.equal(
    firefoxProxyStats.unauthorizedCount >= 1,
    true,
    'Firefox proxy never emitted a real 407 challenge',
  );
  assert.equal(
    firefoxProxyStats.authorizedCount >= 1 && firefoxProxyStats.targetAuthorizedCount >= 1,
    true,
    'Firefox did not retry the target with extension-supplied proxy credentials',
  );

  await driver.get(`moz-extension://${extensionUuid}/options.html#/history`);
""",
    'Firefox real 407 navigation',
)
replace_once(
    firefox,
    """    await new Promise((resolveClose, rejectClose) => {
      sourceServer.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
""",
    """    await new Promise((resolveClose, rejectClose) => {
      sourceServer.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
    await authProxy.close();
""",
    'Firefox proxy server cleanup',
)
