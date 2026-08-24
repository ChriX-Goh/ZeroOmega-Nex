import { timingSafeEqual } from 'node:crypto';
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
