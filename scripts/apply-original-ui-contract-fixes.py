import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


path = 'scripts/e2e-chromium.mjs'
replace_once(
    path,
    """  await worker.evaluate(async () =>
    chrome.proxy.settings.set({
      scope: 'regular',
      value: {
        mode: 'fixed_servers',
        rules: {
          fallbackProxy: { scheme: 'socks5', host: 'external.e2e.invalid', port: 1080 },
          proxyForHttp: { scheme: 'http', host: 'external-http.e2e.invalid', port: 8080 },
          bypassList: ['<local>', 'localhost', '*.external.internal'],
        },
      },
    }),
  );
  let externalOwnership;""",
    """  const externalProxySetting = await worker.evaluate(async () => {
    await new Promise((resolveSet, rejectSet) => {
      chrome.proxy.settings.set(
        {
          scope: 'regular',
          value: {
            mode: 'fixed_servers',
            rules: {
              fallbackProxy: {
                scheme: 'socks5',
                host: 'external.e2e.invalid',
                port: 1080,
              },
              proxyForHttp: {
                scheme: 'http',
                host: 'external-http.e2e.invalid',
                port: 8080,
              },
              bypassList: ['<local>', 'localhost', '*.external.internal'],
            },
          },
        },
        () => {
          const error = chrome.runtime.lastError;
          if (error) rejectSet(new Error(error.message));
          else resolveSet();
        },
      );
    });
    return chrome.proxy.settings.get({ incognito: false });
  });
  assert.equal(
    externalProxySetting.value?.mode,
    'fixed_servers',
    'Chromium did not confirm the external fixed proxy setting before ownership inspection',
  );
  assert.equal(
    externalProxySetting.value?.rules?.fallbackProxy?.host,
    'external.e2e.invalid',
    'Chromium external fallback proxy did not converge before ownership inspection',
  );
  assert.equal(
    externalProxySetting.value?.rules?.proxyForHttp?.host,
    'external-http.e2e.invalid',
    'Chromium external HTTP proxy did not converge before ownership inspection',
  );
  let externalOwnership;""",
)

subprocess.run(['pnpm', 'exec', 'prettier', '--write', path], check=True)
