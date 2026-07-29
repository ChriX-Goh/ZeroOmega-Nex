import { PROFILE_SPEC_SCHEMA_VERSION, type ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it, vi } from 'vitest';

import {
  hasProxyAuthenticationPermission,
  profileSpecUsesProxyAuthentication,
  requestProxyAuthenticationPermission,
  runWithProxyAuthenticationPermission,
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

function plainSpec(): ProfileSpec {
  return {
    schemaVersion: PROFILE_SPEC_SCHEMA_VERSION,
    documentId: 'document-permission-test',
    revision: { id: 'revision-permission-test', createdAt: '2026-07-29T00:00:00.000Z' },
    profiles: [
      {
        id: 'profile-fixed-permission-test',
        name: 'Proxy',
        kind: 'fixed',
        proxyByScheme: {},
        bypass: [],
      },
    ],
    proxyEndpoints: [],
    ruleSources: [],
    settings: {
      startup: { revertProxyChanges: false },
      quickSwitch: { enabled: false, routes: [], refreshOnChange: false },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: false,
        exportLegacyRuleList: false,
      },
      ruleSourceUpdateIntervalMinutes: 0,
    },
  };
}

function credentialedSpec(): ProfileSpec {
  const spec = plainSpec();
  const fixed = spec.profiles[0];
  if (!fixed || fixed.kind !== 'fixed') throw new Error('test Fixed profile is missing');
  spec.proxyEndpoints.push({
    id: 'endpoint-auth-e2e',
    name: 'Authenticated proxy',
    protocol: 'http',
    host: '127.0.0.1',
    port: 3128,
    credential: { username: 'alice', passwordSecretRef: 'secret-auth-e2e' },
  });
  fixed.proxyByScheme.fallback = 'endpoint-auth-e2e';
  return spec;
}

describe('proxy authentication permission client', () => {
  it('requests Chromium authentication permissions and origins without a preliminary await', async () => {
    const client = api(false, false);
    await expect(requestProxyAuthenticationPermission(client.value)).resolves.toBe(true);
    expect(client.calls).toEqual([
      [
        'request',
        {
          permissions: ['webRequest', 'webRequestAuthProvider'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
    ]);
  });

  it('checks Firefox permission separately and requests blocking permissions directly', async () => {
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
        'request',
        {
          permissions: ['webRequest', 'webRequestBlocking'],
          origins: ['http://*/*', 'https://*/*'],
        },
      ],
    ]);
  });

  it('detects endpoint and PAC credentials but ignores a credential-free spec', () => {
    const plain = plainSpec();
    expect(profileSpecUsesProxyAuthentication(plain)).toBe(false);
    expect(profileSpecUsesProxyAuthentication(credentialedSpec())).toBe(true);

    const pac = plainSpec();
    pac.profiles.push({
      id: 'pac-auth-e2e',
      name: 'PAC auth',
      kind: 'pac',
      source: { kind: 'inline', script: "function FindProxyForURL(){return 'DIRECT';}" },
      credential: { username: 'pac-user', passwordSecretRef: 'secret-pac-e2e' },
    });
    expect(profileSpecUsesProxyAuthentication(pac)).toBe(true);
  });

  it('does not run the guarded action when permission is denied', async () => {
    const action = vi.fn(async () => 'mutated');
    const client = api(false, false, false);
    await expect(
      runWithProxyAuthenticationPermission(credentialedSpec(), action, client.value),
    ).resolves.toEqual({ granted: false });
    expect(action).not.toHaveBeenCalled();
  });

  it('runs credential-free actions without requesting optional permissions', async () => {
    const action = vi.fn(async () => 'unchanged');
    const client = api(false, false, false);
    await expect(
      runWithProxyAuthenticationPermission(plainSpec(), action, client.value),
    ).resolves.toEqual({ granted: true, value: 'unchanged' });
    expect(client.calls).toEqual([]);
    expect(action).toHaveBeenCalledTimes(1);
  });
});
