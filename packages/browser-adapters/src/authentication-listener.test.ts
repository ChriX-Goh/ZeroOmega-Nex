import { describe, expect, it } from 'vitest';

import {
  PROXY_AUTH_URL_FILTERS,
  registerProxyAuthenticationListener,
  type ProxyAuthenticationCompletionEvent,
  type ProxyAuthenticationPermissionApi,
  type ProxyAuthenticationRequiredEvent,
} from './authentication-listener.js';
import {
  ProxyAuthenticationHandler,
  type ProxyAuthenticationBindingProvider,
  type ProxyAuthenticationChallenge,
  type ProxyAuthenticationResponse,
  type ProxyAuthenticationSecretProvider,
} from './authentication.js';

class Permissions implements ProxyAuthenticationPermissionApi {
  constructor(public granted: boolean) {}
  lastRequest?: { readonly permissions: readonly string[]; readonly origins: readonly string[] };

  async contains(details: {
    readonly permissions: readonly string[];
    readonly origins: readonly string[];
  }): Promise<boolean> {
    this.lastRequest = details;
    return this.granted;
  }
}

class RequiredEvent implements ProxyAuthenticationRequiredEvent {
  listener?: Parameters<ProxyAuthenticationRequiredEvent['addListener']>[0];
  filter?: { readonly urls: readonly string[] };
  extra?: readonly string[];
  removed = false;

  addListener(
    listener: Parameters<ProxyAuthenticationRequiredEvent['addListener']>[0],
    filter: { readonly urls: readonly string[] },
    extraInfoSpec: readonly string[],
  ): void {
    this.listener = listener;
    this.filter = filter;
    this.extra = extraInfoSpec;
  }

  removeListener(): void {
    this.removed = true;
  }
}

class CompletionEvent implements ProxyAuthenticationCompletionEvent {
  listener?: (details: { readonly requestId: string }) => void;
  removed = false;

  addListener(listener: (details: { readonly requestId: string }) => void): void {
    this.listener = listener;
  }

  removeListener(): void {
    this.removed = true;
  }
}

function handler(): ProxyAuthenticationHandler {
  const bindings: ProxyAuthenticationBindingProvider = {
    getBindings: async () => [
      {
        endpointId: 'endpoint',
        protocol: 'http',
        host: 'proxy.example.invalid',
        port: 8080,
        username: 'alice',
        passwordSecretRef: 'secret/password',
      },
    ],
  };
  const secrets: ProxyAuthenticationSecretProvider = {
    getSecret: async () => 'password',
  };
  return new ProxyAuthenticationHandler(bindings, secrets);
}

const challenge: ProxyAuthenticationChallenge = {
  isProxy: true,
  requestId: 'request-1',
  scheme: 'basic',
  challenger: { host: 'proxy.example.invalid', port: 8080 },
};

describe('proxy authentication listener registration', () => {
  it('does not register before optional permissions are granted', async () => {
    const permissions = new Permissions(false);
    const required = new RequiredEvent();
    const registration = await registerProxyAuthenticationListener(
      'chromium',
      permissions,
      { onAuthRequired: required },
      handler(),
    );
    expect(registration.status).toBe('permissions-required');
    expect(required.listener).toBeUndefined();
    expect(permissions.lastRequest).toEqual({
      permissions: ['webRequest', 'webRequestAuthProvider'],
      origins: PROXY_AUTH_URL_FILTERS,
    });
  });

  it('uses asyncBlocking callbacks on Chromium with HTTP(S)-only filters', async () => {
    const required = new RequiredEvent();
    const completed = new CompletionEvent();
    const failed = new CompletionEvent();
    const registration = await registerProxyAuthenticationListener(
      'chromium',
      new Permissions(true),
      { onAuthRequired: required, onCompleted: completed, onErrorOccurred: failed },
      handler(),
    );
    expect(registration.status).toBe('registered');
    expect(required.filter?.urls).toEqual(['http://*/*', 'https://*/*']);
    expect(required.filter?.urls).not.toContain('<all_urls>');
    expect(required.extra).toEqual(['asyncBlocking']);

    const response = await new Promise<ProxyAuthenticationResponse | Record<string, never>>(
      (resolve) => required.listener?.(challenge, resolve),
    );
    expect(response).toEqual({
      authCredentials: { username: 'alice', password: 'password' },
    });
    completed.listener?.({ requestId: 'request-1' });
    registration.dispose();
    expect(required.removed && completed.removed && failed.removed).toBe(true);
  });

  it('uses promise blocking on Firefox and requires no global URL filter', async () => {
    const required = new RequiredEvent();
    const permissions = new Permissions(true);
    const registration = await registerProxyAuthenticationListener(
      'firefox',
      permissions,
      { onAuthRequired: required },
      handler(),
    );
    expect(permissions.lastRequest?.permissions).toEqual(['webRequest', 'webRequestBlocking']);
    expect(required.extra).toEqual(['blocking']);
    expect(required.filter?.urls).toEqual(['http://*/*', 'https://*/*']);
    const result = required.listener?.(challenge);
    await expect(result).resolves.toEqual({
      authCredentials: { username: 'alice', password: 'password' },
    });
    registration.dispose();
  });

  it('returns an empty response when Chromium credential lookup fails', async () => {
    const required = new RequiredEvent();
    const emptyHandler = new ProxyAuthenticationHandler(
      { getBindings: async () => [] },
      { getSecret: async () => undefined },
    );
    await registerProxyAuthenticationListener(
      'chromium',
      new Permissions(true),
      { onAuthRequired: required },
      emptyHandler,
    );
    const response = await new Promise<ProxyAuthenticationResponse | Record<string, never>>(
      (resolve) => required.listener?.(challenge, resolve),
    );
    expect(response).toEqual({});
  });
});
