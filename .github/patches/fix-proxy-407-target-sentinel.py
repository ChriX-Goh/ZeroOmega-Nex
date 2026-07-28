from pathlib import Path

Path('scripts/e2e-basic-auth-proxy.mjs').write_text(r'''import { timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';

function safeEqual(left, right) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function nonLoopbackIpv4() {
  for (const values of Object.values(networkInterfaces())) {
    for (const value of values ?? []) {
      if (value.family === 'IPv4' && !value.internal) return value.address;
    }
  }
  throw new Error('Proxy authentication E2E requires a non-loopback IPv4 address');
}

function listen(server, host) {
  return new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, host, resolveListen);
  });
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
  const targetHost = nonLoopbackIpv4();
  let directTargetCount = 0;
  const targetServer = createServer((_request, response) => {
    directTargetCount += 1;
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
    });
    response.end(
      '<!doctype html><html><body><main data-proxy-auth-direct-bypass>Proxy was bypassed</main></body></html>',
    );
  });
  await listen(targetServer, '0.0.0.0');
  const targetAddress = targetServer.address();
  if (!targetAddress || typeof targetAddress === 'string') {
    await close(targetServer);
    throw new Error('Proxy authentication target sentinel failed to bind');
  }
  const targetUrl = `http://${targetHost}:${targetAddress.port}${targetPath}`;

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

  try {
    await listen(proxyServer, '127.0.0.1');
  } catch (error) {
    await close(targetServer);
    throw error;
  }
  const proxyAddress = proxyServer.address();
  if (!proxyAddress || typeof proxyAddress === 'string') {
    await Promise.all([close(proxyServer), close(targetServer)]);
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
      directTargetCount,
    }),
    close: () => Promise.all([close(proxyServer), close(targetServer)]).then(() => undefined),
  };
}
''')

for path_name, label in [
    ('scripts/e2e-chromium.mjs', 'Chromium'),
    ('scripts/e2e-firefox.mjs', 'Firefox'),
]:
    path = Path(path_name)
    text = path.read_text()
    old = """  assert.equal(
    {prefix}ProxyStats.authorizedCount >= 1 && {prefix}ProxyStats.targetAuthorizedCount >= 1,
    true,
    '{label} did not retry the target with extension-supplied proxy credentials',
  );
""".format(prefix=label.lower(), label=label)
    new = old + """  assert.equal(
    {prefix}ProxyStats.directTargetCount,
    0,
    '{label} bypassed the configured authenticated proxy',
  );
""".format(prefix=label.lower(), label=label)
    if text.count(old) != 1:
        raise SystemExit(f'{label} proxy stats anchor mismatch: {text.count(old)}')
    path.write_text(text.replace(old, new))

validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
old = """  'targetAuthorizedCount',
  'data-proxy-auth-success',
]);
"""
new = """  'targetAuthorizedCount',
  'directTargetCount',
  'data-proxy-auth-success',
  'data-proxy-auth-direct-bypass',
]);
"""
if text.count(old) != 1:
    raise SystemExit(f'proxy server validator anchor mismatch: {text.count(old)}')
validator.write_text(text.replace(old, new))
