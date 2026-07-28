import { describe, expect, it } from 'vitest';

import {
  hasProxyAuthenticationPermission,
  requestProxyAuthenticationPermission,
} from './proxy-auth-permission-client';

function api(firefox: boolean, contains: boolean, request = true) {
  const calls: unknown[] = [];
  return {
    calls,
    value: {
      runtime: firefox ? { getBrowserInfo: async () => ({ name: 'Firefox' }) } : {},
      permissions: {
        contains: async (details: unknown) => {
          calls.push(['contains', details]);
          return contains;
        },
        request: async (details: unknown) => {
          calls.push(['request', details]);
          return request;
        },
      },
    },
  };
}

describe('proxy authentication permission client', () => {
  it('requests Chromium authentication permissions and origins', async () => {
    const client = api(false, false);
    await expect(requestProxyAuthenticationPermission(client.value)).resolves.toBe(true);
    expect(client.calls).toEqual([
      [
        'contains',
        {
          permissions: ['webRequest', 'webRequestAuthProvider'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
      [
        'request',
        {
          permissions: ['webRequest', 'webRequestAuthProvider'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
    ]);
  });

  it('uses Firefox blocking permissions and skips a redundant request', async () => {
    const client = api(true, true);
    await expect(hasProxyAuthenticationPermission(client.value)).resolves.toBe(true);
    await expect(requestProxyAuthenticationPermission(client.value)).resolves.toBe(true);
    expect(client.calls).toEqual([
      [
        'contains',
        {
          permissions: ['webRequest', 'webRequestBlocking'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
      [
        'contains',
        {
          permissions: ['webRequest', 'webRequestBlocking'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
    ]);
  });
});
