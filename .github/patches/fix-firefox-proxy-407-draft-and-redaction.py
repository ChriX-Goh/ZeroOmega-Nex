from pathlib import Path

path = Path('scripts/e2e-firefox.mjs')
text = path.read_text()

old_runtime = """      const result = {
        manifest: browser.runtime.getManifest(),
        incognitoAllowed: await browser.extension.isAllowedIncognitoAccess(),
        proxyState: await browser.proxy.settings.get({}),
        storage: await browser.storage.local.get(null),
      };
"""
new_runtime = """      const redactStorage = (storage) => Object.fromEntries(
        Object.entries(storage).map(([key, value]) => [
          key,
          key.includes('/secret/') ? '<redacted>' : value,
        ]),
      );
      const result = {
        manifest: browser.runtime.getManifest(),
        incognitoAllowed: await browser.extension.isAllowedIncognitoAccess(),
        proxyState: await browser.proxy.settings.get({}),
        storage: redactStorage(await browser.storage.local.get(null)),
      };
"""
if text.count(old_runtime) != 1:
    raise SystemExit(f'Firefox runtime diagnostics storage anchor mismatch: {text.count(old_runtime)}')
text = text.replace(old_runtime, new_runtime)
old_after = """      result.storageAfterMessage = await browser.storage.local.get(null);
"""
new_after = """      result.storageAfterMessage = redactStorage(await browser.storage.local.get(null));
"""
if text.count(old_after) != 1:
    raise SystemExit(f'Firefox storage-after-message anchor mismatch: {text.count(old_after)}')
text = text.replace(old_after, new_after)

old_port = """  await setControlValue(fallbackServer, authProxy.host);
  await setControlValue(fallbackPort, String(authProxy.port));
  const authenticationButton = await fallbackRow.findElement(
"""
new_port = """  await setControlValue(fallbackServer, authProxy.host);
  await driver.wait(
    until.elementIsEnabled(fallbackPort),
    10_000,
    'Firefox port input did not re-enable after committing the proxy host',
  );
  await setControlValue(fallbackPort, String(authProxy.port));
  await driver.wait(
    async () => (await fallbackPort.getAttribute('value')) === String(authProxy.port),
    10_000,
    'Firefox port input did not retain the dynamic proxy port',
  );
  await driver.wait(
    async () =>
      driver.executeAsyncScript(
        `
          const expectedHost = arguments[0];
          const expectedPort = arguments[1];
          const done = arguments[2];
          browser.runtime.sendMessage({
            channel: 'zeroomega-nex/profile-workflow/v1',
            action: 'get',
          }).then((response) => done(Boolean(
            response?.ok && response.state?.draft?.proxyEndpoints?.some(
              (endpoint) => endpoint.host === expectedHost && endpoint.port === expectedPort,
            )
          )), (error) => done(String(error)));
        `,
        authProxy.host,
        authProxy.port,
      ),
    15_000,
    'Firefox Fixed editor did not persist the dynamic proxy endpoint before authentication',
  );
  const authenticationButton = await fallbackRow.findElement(
"""
if text.count(old_port) != 1:
    raise SystemExit(f'Firefox dynamic port anchor mismatch: {text.count(old_port)}')
text = text.replace(old_port, new_port)

old_after_direct = """  await direct.click();
  await driver.wait(until.elementIsDisabled(direct), 15_000);

  await driver.get(`moz-extension://${extensionUuid}/temp-rules.html`);
"""
new_after_direct = """  await direct.click();
  await driver.wait(until.elementIsDisabled(direct), 15_000);
  assert.equal(
    await driver.executeAsyncScript(`
      const done = arguments[0];
      browser.permissions.remove({
        permissions: ['webRequest', 'webRequestBlocking'],
        origins: ['http://*/*', 'https://*/*'],
      }).then(done, (error) => done(String(error)));
    `),
    true,
    'Firefox could not remove the broad proxy-authentication permission after returning Direct',
  );
  assert.equal(
    await driver.executeAsyncScript(`
      const done = arguments[0];
      browser.permissions.contains({
        permissions: ['webRequest', 'webRequestBlocking'],
        origins: ['http://*/*', 'https://*/*'],
      }).then(done, (error) => done(String(error)));
    `),
    false,
    'Firefox broad proxy-authentication permission remained after returning Direct',
  );

  await driver.get(`moz-extension://${extensionUuid}/temp-rules.html`);
"""
if text.count(old_after_direct) != 1:
    raise SystemExit(f'Firefox post-Direct permission reset anchor mismatch: {text.count(old_after_direct)}')
text = text.replace(old_after_direct, new_after_direct)
path.write_text(text)

validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
old = """requireAll('Firefox real proxy challenge', firefoxE2e, [
  "createBasicAuthProxyChallengeServer",
  "permissions: ['webRequest', 'webRequestBlocking']",
  'Firefox proxy never emitted a real 407 challenge',
  'targetAuthorizedCount >= 1',
]);
"""
new = """requireAll('Firefox real proxy challenge', firefoxE2e, [
  "createBasicAuthProxyChallengeServer",
  "permissions: ['webRequest', 'webRequestBlocking']",
  "key.includes('/secret/') ? '<redacted>' : value",
  'Firefox port input did not re-enable after committing the proxy host',
  'Firefox Fixed editor did not persist the dynamic proxy endpoint before authentication',
  'Firefox proxy never emitted a real 407 challenge',
  'targetAuthorizedCount >= 1',
  'Firefox broad proxy-authentication permission remained after returning Direct',
]);
"""
if text.count(old) != 1:
    raise SystemExit(f'Firefox proxy validator block mismatch: {text.count(old)}')
validator.write_text(text.replace(old, new))
