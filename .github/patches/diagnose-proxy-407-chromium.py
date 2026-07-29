from pathlib import Path

path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
old = """  await authenticatedPage.goto(authProxy.targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 20_000,
  });
  await authenticatedPage.locator('[data-proxy-auth-success]').waitFor({ timeout: 20_000 });
  assert.equal(
    await authenticatedPage.locator('[data-proxy-auth-success]').innerText(),
    authProxy.marker,
  );
  const chromiumProxyStats = authProxy.stats();
"""
new = """  await authenticatedPage.goto(authProxy.targetUrl, {
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
if text.count(old) != 1:
    raise SystemExit(f'Chromium 407 navigation anchor mismatch: {text.count(old)}')
path.write_text(text.replace(old, new))
