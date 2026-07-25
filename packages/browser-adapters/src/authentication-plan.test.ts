import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { createProxyAuthenticationPlan } from './authentication-plan.js';

function profileSpec(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'document-auth-plan-test',
    revision: {
      id: 'revision-auth-plan-test',
      createdAt: '2026-07-25T15:30:00.000Z',
    },
    profiles: [
      {
        id: 'profile-primary',
        name: 'Primary',
        kind: 'fixed',
        proxyByScheme: { fallback: 'endpoint-primary' },
        bypass: [],
      },
      {
        id: 'profile-secondary',
        name: 'Secondary',
        kind: 'fixed',
        proxyByScheme: { fallback: 'endpoint-secondary' },
        bypass: [],
      },
      {
        id: 'profile-unreachable',
        name: 'Unreachable',
        kind: 'fixed',
        proxyByScheme: { fallback: 'endpoint-unreachable' },
        bypass: [],
      },
      {
        id: 'profile-switch',
        name: 'Switch',
        kind: 'switch',
        rules: [
          {
            id: 'rule-secondary',
            condition: { kind: 'host-wildcard', pattern: '*.example.invalid' },
            route: { kind: 'profile', profileId: 'profile-secondary' },
          },
        ],
        defaultRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
    ],
    proxyEndpoints: [
      {
        id: 'endpoint-primary',
        protocol: 'http',
        host: 'primary.example.invalid',
        port: 8080,
        credential: {
          username: 'primary-user',
          passwordSecretRef: 'secret-primary',
        },
      },
      {
        id: 'endpoint-secondary',
        protocol: 'https',
        host: 'secondary.example.invalid',
        port: 8443,
        credential: {
          passwordSecretRef: 'secret-secondary',
        },
      },
      {
        id: 'endpoint-unreachable',
        protocol: 'http',
        host: 'unreachable.example.invalid',
        port: 8888,
        credential: {
          username: 'unreachable-user',
          passwordSecretRef: 'secret-unreachable',
        },
      },
    ],
    ruleSources: [],
    settings: {
      startup: {
        route: { kind: 'profile', profileId: 'profile-primary' },
        revertProxyChanges: true,
      },
      quickSwitch: {
        enabled: true,
        routes: [{ kind: 'profile', profileId: 'profile-primary' }],
        refreshOnChange: false,
      },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: true,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: false,
        exportLegacyRuleList: false,
      },
      ruleSourceUpdateIntervalMinutes: 1440,
      sync: { backend: 'none' },
    },
  };
}

describe('proxy authentication planning', () => {
  it('requires no authentication for Direct or System routes', () => {
    const spec = profileSpec();

    expect(createProxyAuthenticationPlan(spec, { kind: 'direct' })).toEqual({
      bindings: [],
      unsupported: [],
    });
    expect(createProxyAuthenticationPlan(spec, { kind: 'system' })).toEqual({
      bindings: [],
      unsupported: [],
    });
  });

  it('creates an HTTP binding only for the reachable Fixed Profile endpoint', () => {
    const plan = createProxyAuthenticationPlan(profileSpec(), {
      kind: 'profile',
      profileId: 'profile-primary',
    });

    expect(plan).toEqual({
      bindings: [
        {
          endpointId: 'endpoint-primary',
          protocol: 'http',
          host: 'primary.example.invalid',
          port: 8080,
          username: 'primary-user',
          passwordSecretRef: 'secret-primary',
        },
      ],
      unsupported: [],
    });
  });

  it('collects every possible authenticated route behind a Switch Profile', () => {
    const plan = createProxyAuthenticationPlan(profileSpec(), {
      kind: 'profile',
      profileId: 'profile-switch',
    });

    expect(plan.bindings.map((binding) => binding.endpointId)).toEqual([
      'endpoint-primary',
      'endpoint-secondary',
    ]);
    expect(plan.bindings[1]?.username).toBe('');
    expect(plan.bindings.map((binding) => binding.endpointId)).not.toContain(
      'endpoint-unreachable',
    );
  });

  it('reports reachable SOCKS credentials as unsupported instead of silently dropping them', () => {
    const spec = profileSpec();
    spec.proxyEndpoints[0] = {
      id: 'endpoint-primary',
      protocol: 'socks5',
      host: 'socks.example.invalid',
      port: 1080,
      credential: {
        username: 'socks-user',
        passwordSecretRef: 'secret-socks',
      },
    };

    expect(
      createProxyAuthenticationPlan(spec, {
        kind: 'profile',
        profileId: 'profile-primary',
      }),
    ).toEqual({
      bindings: [],
      unsupported: [{ endpointId: 'endpoint-primary', protocol: 'socks5' }],
    });
  });

  it('terminates safely when an invalid cyclic profile graph is supplied', () => {
    const spec = profileSpec();
    spec.profiles.push(
      {
        id: 'profile-cycle-a',
        name: 'Cycle A',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'profile-cycle-b' },
      },
      {
        id: 'profile-cycle-b',
        name: 'Cycle B',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'profile-cycle-a' },
      },
    );

    expect(
      createProxyAuthenticationPlan(spec, {
        kind: 'profile',
        profileId: 'profile-cycle-a',
      }),
    ).toEqual({ bindings: [], unsupported: [] });
  });
});
