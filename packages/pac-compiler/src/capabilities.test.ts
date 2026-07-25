import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { analyzePacCompatibility } from './capabilities.js';

function spec(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'document-pac-capability',
    revision: {
      id: 'revision-pac-capability',
      createdAt: '2026-07-25T05:30:00.000Z',
    },
    profiles: [
      {
        id: 'fixed',
        name: 'Fixed',
        kind: 'fixed',
        proxyByScheme: { fallback: 'proxy-http' },
        bypass: [{ id: 'local', pattern: '<local>' }],
      },
      {
        id: 'switch-http',
        name: 'Switch HTTP',
        kind: 'switch',
        rules: [
          {
            id: 'http-path',
            condition: { kind: 'url-wildcard', pattern: 'http://example.invalid/*' },
            route: { kind: 'profile', profileId: 'fixed' },
          },
        ],
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'switch-https',
        name: 'Switch HTTPS',
        kind: 'switch',
        rules: [
          {
            id: 'https-path',
            condition: { kind: 'url-wildcard', pattern: 'https://example.invalid/private/*' },
            route: { kind: 'profile', profileId: 'fixed' },
          },
        ],
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'rule-list',
        name: 'Rule List',
        kind: 'rule-list',
        sourceId: 'inline-rules',
        matchRoute: { kind: 'profile', profileId: 'fixed' },
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'remote-rule-list',
        name: 'Remote Rule List',
        kind: 'rule-list',
        sourceId: 'remote-rules',
        matchRoute: { kind: 'profile', profileId: 'fixed' },
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'arbitrary-pac',
        name: 'Arbitrary PAC',
        kind: 'pac',
        source: { kind: 'inline', script: "function FindProxyForURL(){return 'DIRECT';}" },
      },
      {
        id: 'auto-detect',
        name: 'Auto Detect',
        kind: 'auto-detect',
      },
    ],
    proxyEndpoints: [
      {
        id: 'proxy-http',
        name: 'Authenticated HTTP',
        protocol: 'http',
        host: 'proxy.example.invalid',
        port: 8080,
        credential: {
          username: 'fixture-user',
          passwordSecretRef: 'secret/proxy-password',
        },
      },
    ],
    ruleSources: [
      {
        id: 'inline-rules',
        name: 'Inline rules',
        format: 'autoproxy',
        location: {
          kind: 'inline',
          content: '[AutoProxy 0.2.9]\n||example.invalid\n@@||direct.example.invalid\n',
        },
      },
      {
        id: 'remote-rules',
        name: 'Remote rules',
        format: 'autoproxy',
        location: { kind: 'url', url: 'https://rules.example.invalid/list.txt' },
      },
    ],
    settings: {
      startup: { revertProxyChanges: true },
      quickSwitch: { enabled: false, routes: [], refreshOnChange: false },
      interface: {
        confirmDeletion: true,
        showInspectMenu: false,
        addConditionsToBottom: true,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: false,
        showAdvancedConditions: false,
        exportLegacyRuleList: false,
      },
      ruleSourceUpdateIntervalMinutes: 1440,
    },
  };
}

describe('PAC capability analysis', () => {
  it('accepts Direct and an HTTP-only wildcard graph as exact', () => {
    const direct = analyzePacCompatibility(spec(), { kind: 'direct' });
    expect(direct.capability).toBe('exact');
    expect(direct.canCompileExact).toBe(true);
    expect(direct.reachableProfileIds).toEqual([]);

    const http = analyzePacCompatibility(spec(), {
      kind: 'profile',
      profileId: 'switch-http',
    });
    expect(http.capability).toBe('exact');
    expect(http.canCompileExact).toBe(true);
    expect(http.reachableProfileIds).toEqual(['switch-http', 'fixed']);
    expect(http.reachableEndpointIds).toEqual(['proxy-http']);
    expect(http.issues).toContainEqual(
      expect.objectContaining({
        code: 'endpoint.authentication-external',
        blocking: false,
      }),
    );
  });

  it('marks HTTPS path matching as target-dependent without hiding it', () => {
    const result = analyzePacCompatibility(spec(), {
      kind: 'profile',
      profileId: 'switch-https',
    });
    expect(result.capability).toBe('target-dependent');
    expect(result.canCompileExact).toBe(false);
    expect(result.canCompileWithTargetDependentSemantics).toBe(true);
    expect(result.issues.map((issue) => issue.code)).toContain(
      'condition.url-wildcard-target-dependent',
    );
  });

  it('compiles inline AutoProxy host rules but blocks unavailable remote content', () => {
    const inline = analyzePacCompatibility(spec(), {
      kind: 'profile',
      profileId: 'rule-list',
    });
    expect(inline.capability).toBe('exact');
    expect(inline.reachableProfileIds).toEqual(['rule-list', 'fixed']);

    const remote = analyzePacCompatibility(spec(), {
      kind: 'profile',
      profileId: 'remote-rule-list',
    });
    expect(remote.capability).toBe('unsupported');
    expect(remote.canCompileWithTargetDependentSemantics).toBe(false);
    expect(remote.issues.map((issue) => issue.code)).toContain(
      'rule-source.content-unavailable',
    );
  });

  it('blocks System, arbitrary PAC, and auto-detect routes', () => {
    const system = analyzePacCompatibility(spec(), { kind: 'system' });
    expect(system.capability).toBe('unsupported');
    expect(system.issues[0]?.code).toBe('route.system-unsupported');

    for (const profileId of ['arbitrary-pac', 'auto-detect']) {
      const result = analyzePacCompatibility(spec(), { kind: 'profile', profileId });
      expect(result.capability, profileId).toBe('unsupported');
      expect(result.canCompileWithTargetDependentSemantics, profileId).toBe(false);
    }
  });

  it('does not let unreachable unsupported profiles block an exact graph', () => {
    const result = analyzePacCompatibility(spec(), {
      kind: 'profile',
      profileId: 'fixed',
    });
    expect(result.capability).toBe('exact');
    expect(result.reachableProfileIds).toEqual(['fixed']);
    expect(result.issues.map((issue) => issue.code)).not.toContain(
      'profile.pac-nesting-unsupported',
    );
  });

  it('rejects missing references and runtime cycles even for invalid input objects', () => {
    const missing = analyzePacCompatibility(spec(), {
      kind: 'profile',
      profileId: 'missing-profile',
    });
    expect(missing.capability).toBe('unsupported');
    expect(missing.issues[0]?.code).toBe('profile.missing');

    const cyclic = spec();
    cyclic.profiles = [
      {
        id: 'cycle-a',
        name: 'Cycle A',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'cycle-b' },
      },
      {
        id: 'cycle-b',
        name: 'Cycle B',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'profile', profileId: 'cycle-a' },
      },
    ];
    const result = analyzePacCompatibility(cyclic, {
      kind: 'profile',
      profileId: 'cycle-a',
    });
    expect(result.capability).toBe('unsupported');
    expect(result.issues.map((issue) => issue.code)).toContain('profile.reference-cycle');
  });

  it('marks Unicode endpoint hosts as requiring target verification', () => {
    const value = spec();
    value.proxyEndpoints[0]!.host = '代理.example.invalid';
    const result = analyzePacCompatibility(value, {
      kind: 'profile',
      profileId: 'fixed',
    });
    expect(result.capability).toBe('target-dependent');
    expect(result.issues.map((issue) => issue.code)).toContain('endpoint.host-needs-ascii');
  });
});
