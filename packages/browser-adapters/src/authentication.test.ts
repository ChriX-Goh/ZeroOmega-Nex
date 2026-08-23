import { describe, expect, it } from 'vitest';

import {
  ProxyAuthenticationHandler,
  type ProxyAuthenticationBinding,
  type ProxyAuthenticationBindingProvider,
  type ProxyAuthenticationSecretProvider,
} from './authentication.js';

class BindingProvider implements ProxyAuthenticationBindingProvider {
  constructor(public bindings: readonly ProxyAuthenticationBinding[]) {}

  async getBindings(): Promise<readonly ProxyAuthenticationBinding[]> {
    return this.bindings;
  }
}

class SecretProvider implements ProxyAuthenticationSecretProvider {
  readonly values = new Map<string, string>();

  async getSecret(secretRef: string): Promise<string | undefined> {
    return this.values.get(secretRef);
  }
}

const binding: ProxyAuthenticationBinding = {
  endpointId: 'endpoint-http',
  protocol: 'http',
  host: 'proxy.example.invalid',
  port: 8080,
  username: 'alice',
  passwordSecretRef: 'secret/proxy-password',
};

function challenge(overrides: Record<string, unknown> = {}) {
  return {
    isProxy: true,
    requestId: 'request-1',
    scheme: 'Basic',
    challenger: { host: 'proxy.example.invalid', port: 8080 },
    ...overrides,
  } as const;
}

describe('bounded proxy authentication handler', () => {
  it('supplies credentials only for matching proxy challenges', async () => {
    const bindings = new BindingProvider([binding]);
    const secrets = new SecretProvider();
    secrets.values.set(binding.passwordSecretRef, 'correct horse battery staple');
    const handler = new ProxyAuthenticationHandler(bindings, secrets);

    await expect(handler.handle(challenge())).resolves.toEqual({
      authCredentials: {
        username: 'alice',
        password: 'correct horse battery staple',
      },
    });
  });

  it('uses one PAC all-proxy credential only when no exact endpoint binding matches', async () => {
    const handler = new ProxyAuthenticationHandler(
      {
        getBindings: async () => [
          {
            scope: 'all-proxies',
            profileId: 'pac-all',
            username: 'pac-user',
            passwordSecretRef: 'secret-pac-all',
          },
          {
            endpointId: 'exact-proxy',
            protocol: 'http',
            host: 'exact.example.invalid',
            port: 8080,
            username: 'exact-user',
            passwordSecretRef: 'secret-exact',
          },
        ],
      },
      {
        getSecret: async (ref) =>
          ref === 'secret-pac-all'
            ? 'pac-password'
            : ref === 'secret-exact'
              ? 'exact-password'
              : undefined,
      },
    );

    await expect(
      handler.handle({
        isProxy: true,
        requestId: 'pac-wildcard',
        scheme: 'basic',
        challenger: { host: 'other.example.invalid', port: 3128 },
        proxyInfo: { host: 'other.example.invalid', port: 3128, type: 'http' },
      }),
    ).resolves.toEqual({ authCredentials: { username: 'pac-user', password: 'pac-password' } });

    await expect(
      handler.handle({
        isProxy: true,
        requestId: 'pac-exact',
        scheme: 'basic',
        challenger: { host: 'exact.example.invalid', port: 8080 },
        proxyInfo: { host: 'exact.example.invalid', port: 8080, type: 'http' },
      }),
    ).resolves.toEqual({ authCredentials: { username: 'exact-user', password: 'exact-password' } });
  });

  it('does not answer ambiguous PAC all-proxy credentials', async () => {
    const handler = new ProxyAuthenticationHandler(
      {
        getBindings: async () => [
          {
            scope: 'all-proxies',
            profileId: 'pac-one',
            username: 'one',
            passwordSecretRef: 'secret-one',
          },
          {
            scope: 'all-proxies',
            profileId: 'pac-two',
            username: 'two',
            passwordSecretRef: 'secret-two',
          },
        ],
      },
      { getSecret: async () => 'password' },
    );
    await expect(
      handler.handle({
        isProxy: true,
        requestId: 'pac-ambiguous',
        scheme: 'basic',
        challenger: { host: 'proxy.example.invalid', port: 8080 },
      }),
    ).resolves.toBeUndefined();
  });

  it('ignores ordinary website authentication and unsupported schemes', async () => {
    const handler = new ProxyAuthenticationHandler(
      new BindingProvider([binding]),
      new SecretProvider(),
    );
    await expect(handler.handle(challenge({ isProxy: false }))).resolves.toBeUndefined();
    await expect(handler.handle(challenge({ scheme: 'Negotiate' }))).resolves.toBeUndefined();
  });

  it('uses Firefox proxyInfo when present and enforces protocol matching', async () => {
    const secrets = new SecretProvider();
    secrets.values.set(binding.passwordSecretRef, 'password');
    const handler = new ProxyAuthenticationHandler(new BindingProvider([binding]), secrets);
    await expect(
      handler.handle(
        challenge({
          proxyInfo: { host: 'PROXY.EXAMPLE.INVALID', port: 8080, type: 'http' },
        }),
      ),
    ).resolves.toMatchObject({ authCredentials: { username: 'alice' } });

    handler.forgetRequest('request-1');
    await expect(
      handler.handle(
        challenge({
          proxyInfo: { host: 'proxy.example.invalid', port: 8080, type: 'https' },
        }),
      ),
    ).resolves.toBeUndefined();
  });

  it('does not handle SOCKS proxy authentication', async () => {
    const handler = new ProxyAuthenticationHandler(
      new BindingProvider([binding]),
      new SecretProvider(),
    );
    await expect(
      handler.handle(
        challenge({
          proxyInfo: { host: 'proxy.example.invalid', port: 8080, type: 'socks' },
        }),
      ),
    ).resolves.toBeUndefined();
  });

  it('refuses ambiguous bindings or missing secret material', async () => {
    const duplicate = { ...binding, endpointId: 'endpoint-duplicate', username: 'bob' };
    const secrets = new SecretProvider();
    secrets.values.set(binding.passwordSecretRef, 'password');
    await expect(
      new ProxyAuthenticationHandler(new BindingProvider([binding, duplicate]), secrets).handle(
        challenge(),
      ),
    ).resolves.toBeUndefined();

    await expect(
      new ProxyAuthenticationHandler(new BindingProvider([binding]), new SecretProvider()).handle(
        challenge(),
      ),
    ).resolves.toBeUndefined();
  });

  it('tries each request only once until completion is reported', async () => {
    const secrets = new SecretProvider();
    secrets.values.set(binding.passwordSecretRef, 'password');
    const handler = new ProxyAuthenticationHandler(new BindingProvider([binding]), secrets);
    await expect(handler.handle(challenge())).resolves.toBeDefined();
    await expect(handler.handle(challenge())).resolves.toBeUndefined();
    handler.forgetRequest('request-1');
    await expect(handler.handle(challenge())).resolves.toBeDefined();
  });

  it('bounds remembered request identifiers', async () => {
    const secrets = new SecretProvider();
    secrets.values.set(binding.passwordSecretRef, 'password');
    const handler = new ProxyAuthenticationHandler(new BindingProvider([binding]), secrets, {
      maxTrackedRequests: 2,
    });
    await handler.handle(challenge({ requestId: 'request-1' }));
    await handler.handle(challenge({ requestId: 'request-2' }));
    await handler.handle(challenge({ requestId: 'request-3' }));
    await expect(handler.handle(challenge({ requestId: 'request-1' }))).resolves.toBeDefined();
  });
});
