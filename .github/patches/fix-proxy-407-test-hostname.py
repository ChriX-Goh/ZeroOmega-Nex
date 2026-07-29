from pathlib import Path

Path('scripts/e2e-basic-auth-proxy.mjs').write_text(r'''import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';

function safeEqual(left, right) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function close(server) {
  return new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()));
  });
}

export async function createBasicAuthProxyChallengeServer({
  username,
  password,
  marker = 'ZeroOmega Nex proxy authentication passed',
}) {
  const targetPath = `/auth-check/${crypto.randomUUID()}`;
  const targetUrl = `http://zeroomega-auth-target.test${targetPath}`;
  const expectedAuthorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  let unauthorizedCount = 0;
  let authorizedCount = 0;
  let targetAuthorizedCount = 0;
  let targetUnauthorizedCount = 0;

  const proxyServer = createServer((request, response) => {
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
    proxyServer.once('error', rejectListen);
    proxyServer.listen(0, '127.0.0.1', resolveListen);
  });
  const proxyAddress = proxyServer.address();
  if (!proxyAddress || typeof proxyAddress === 'string') {
    throw new Error('Proxy authentication test server failed to bind');
  }

  return {
    host: '127.0.0.1',
    port: proxyAddress.port,
    targetUrl,
    marker,
    stats: () => ({
      unauthorizedCount,
      authorizedCount,
      targetUnauthorizedCount,
      targetAuthorizedCount,
    }),
    close: () => close(proxyServer),
  };
}
''')

for path_name, prefix, label in [
    ('scripts/e2e-chromium.mjs', 'chromium', 'Chromium'),
    ('scripts/e2e-firefox.mjs', 'firefox', 'Firefox'),
]:
    path = Path(path_name)
    text = path.read_text()
    direct_assertion = f"""  assert.equal(
    {prefix}ProxyStats.directTargetCount,
    0,
    '{label} bypassed the configured authenticated proxy',
  );
"""
    if text.count(direct_assertion) != 1:
        raise SystemExit(f'{label} direct-target assertion mismatch: {text.count(direct_assertion)}')
    path.write_text(text.replace(direct_assertion, ''))

chromium = Path('scripts/e2e-chromium.mjs')
text = chromium.read_text()
old_diagnostics = """  await authenticatedPage.goto(authProxy.targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 20_000,
  });
  await authenticatedPage.waitForTimeout(2_000);
  const chromiumProxyStats = authProxy.stats();
  const chromiumProxySetting = await worker.evaluate(
    async ({ expectedHost, expectedPort }) => {
      const setting = await chrome.proxy.settings.get({ incognito: false });
      const value = setting.value ?? {};
      const pacData = String(value?.pacScript?.data ?? '');
      return {
        levelOfControl: setting.levelOfControl,
        mode: value?.mode ?? null,
        containsExpectedProxy: pacData.includes(`${expectedHost}:${expectedPort}`),
      };
    },
    { expectedHost: authProxy.host, expectedPort: authProxy.port },
  );
  const successMarker = authenticatedPage.locator('[data-proxy-auth-success]');
  const bypassMarker = authenticatedPage.locator('[data-proxy-auth-direct-bypass]');
  const successVisible = await successMarker.isVisible().catch(() => false);
  const bypassVisible = await bypassMarker.isVisible().catch(() => false);
  if (!successVisible) {
    throw new Error(
      `Chromium proxy authentication target failed: ${JSON.stringify({
        currentUrl: authenticatedPage.url(),
        title: await authenticatedPage.title().catch(() => ''),
        bypassVisible,
        stats: chromiumProxyStats,
        proxySetting: chromiumProxySetting,
      })}`,
    );
  }
  assert.equal(await successMarker.innerText(), authProxy.marker);
"""
new_diagnostics = """  let chromiumNavigationError = '';
  try {
    await authenticatedPage.goto(authProxy.targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    });
  } catch (error) {
    chromiumNavigationError = error instanceof Error ? error.message : String(error);
  }
  await authenticatedPage.waitForTimeout(2_000);
  const chromiumProxyStats = authProxy.stats();
  const chromiumProxySetting = await worker.evaluate(
    async ({ expectedHost, expectedPort }) => {
      const setting = await chrome.proxy.settings.get({ incognito: false });
      const value = setting.value ?? {};
      const pacData = String(value?.pacScript?.data ?? '');
      return {
        levelOfControl: setting.levelOfControl,
        mode: value?.mode ?? null,
        containsExpectedProxy: pacData.includes(`${expectedHost}:${expectedPort}`),
      };
    },
    { expectedHost: authProxy.host, expectedPort: authProxy.port },
  );
  const successMarker = authenticatedPage.locator('[data-proxy-auth-success]');
  const successVisible = await successMarker.isVisible().catch(() => false);
  if (!successVisible) {
    throw new Error(
      `Chromium proxy authentication target failed: ${JSON.stringify({
        currentUrl: authenticatedPage.url(),
        title: await authenticatedPage.title().catch(() => ''),
        navigationError: chromiumNavigationError,
        stats: chromiumProxyStats,
        proxySetting: chromiumProxySetting,
      })}`,
    );
  }
  assert.equal(await successMarker.innerText(), authProxy.marker);
"""
if text.count(old_diagnostics) != 1:
    raise SystemExit(f'Chromium diagnostic block mismatch: {text.count(old_diagnostics)}')
chromium.write_text(text.replace(old_diagnostics, new_diagnostics))

validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
old_tokens = """  'targetAuthorizedCount',
  'directTargetCount',
  'data-proxy-auth-success',
  'data-proxy-auth-direct-bypass',
"""
new_tokens = """  'targetAuthorizedCount',
  'zeroomega-auth-target.test',
  'data-proxy-auth-success',
"""
if text.count(old_tokens) != 1:
    raise SystemExit(f'proxy target validator tokens mismatch: {text.count(old_tokens)}')
validator.write_text(text.replace(old_tokens, new_tokens))
