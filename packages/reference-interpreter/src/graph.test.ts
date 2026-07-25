import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { evaluateProfileGraph } from './graph.js';

function baseSpec(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'document-graph-test',
    revision: {
      id: 'revision-graph-test',
      createdAt: '2026-07-25T04:00:00.000Z',
    },
    profiles: [
      {
        id: 'fixed-main',
        name: 'Fixed Main',
        kind: 'fixed',
        proxyByScheme: {
          fallback: 'endpoint-fallback',
          http: 'endpoint-http',
          https: 'endpoint-https',
        },
        bypass: [
          { id: 'bypass-local', pattern: '<local>' },
          { id: 'bypass-internal', pattern: '*.internal.example.invalid' },
        ],
      },
      {
        id: 'switch-main',
        name: 'Switch Main',
        kind: 'switch',
        rules: [
          {
            id: 'rule-private',
            condition: { kind: 'host-wildcard', pattern: '*.private.example.invalid' },
            route: { kind: 'profile', profileId: 'fixed-main' },
          },
        ],
        defaultRoute: { kind: 'system' },
      },
      {
        id: 'switch-outer',
        name: 'Switch Outer',
        kind: 'switch',
        rules: [
          {
            id: 'rule-nested',
            condition: { kind: 'true' },
            route: { kind: 'profile', profileId: 'switch-main' },
          },
        ],
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'pac-main',
        name: 'PAC Main',
        kind: 'pac',
        source: { kind: 'url', url: 'https://pac.example.invalid/proxy.pac' },
      },
    ],
    proxyEndpoints: [
      {
        id: 'endpoint-fallback',
        name: 'Fallback',
        protocol: 'socks5',
        host: '127.0.0.1',
        port: 1080,
      },
      {
        id: 'endpoint-http',
        name: 'HTTP',
        protocol: 'http',
        host: 'proxy.example.invalid',
        port: 8080,
      },
      {
        id: 'endpoint-https',
        name: 'HTTPS',
        protocol: 'https',
        host: 'secure-proxy.example.invalid',
        port: 8443,
      },
    ],
    ruleSources: [],
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

const privateRequest = {
  url: 'https://api.private.example.invalid/path',
  host: 'api.private.example.invalid',
  scheme: 'https',
} as const;

describe('reference profile graph evaluator', () => {
  it('resolves nested switch profiles to the scheme-specific proxy endpoint', () => {
    const result = evaluateProfileGraph(
      baseSpec(),
      { kind: 'profile', profileId: 'switch-outer' },
      privateRequest,
    );
    expect(result.status).toBe('resolved');
    if (result.status !== 'resolved') throw new Error(result.reason);
    expect(result.route.kind).toBe('proxy');
    if (result.route.kind !== 'proxy') throw new Error('expected proxy route');
    expect(result.route.endpointId).toBe('endpoint-https');
    expect(result.trace.filter((entry) => entry.action === 'enter-profile')).toHaveLength(3);
    expect(result.trace.some((entry) => entry.ruleId === 'rule-private' && entry.matched)).toBe(
      true,
    );
  });

  it('applies fixed-profile bypass entries before endpoint selection', () => {
    const result = evaluateProfileGraph(
      baseSpec(),
      { kind: 'profile', profileId: 'fixed-main' },
      { url: 'http://printer/', host: 'printer', scheme: 'http' },
    );
    expect(result.status).toBe('resolved');
    if (result.status !== 'resolved') throw new Error(result.reason);
    expect(result.route).toEqual({ kind: 'direct' });
    expect(
      result.trace.some(
        (entry) =>
          entry.action === 'fixed-bypass' && entry.bypassId === 'bypass-local' && entry.matched,
      ),
    ).toBe(true);
  });

  it('uses the switch default route when no ordered rule matches', () => {
    const result = evaluateProfileGraph(
      baseSpec(),
      { kind: 'profile', profileId: 'switch-main' },
      { url: 'https://public.example.invalid/', host: 'public.example.invalid', scheme: 'https' },
    );
    expect(result.status).toBe('resolved');
    if (result.status !== 'resolved') throw new Error(result.reason);
    expect(result.route).toEqual({ kind: 'system' });
    expect(result.trace.some((entry) => entry.action === 'switch-default')).toBe(true);
  });

  it('routes directly when a fixed profile has no endpoint for the request scheme', () => {
    const spec = baseSpec();
    const fixed = spec.profiles.find((profile) => profile.id === 'fixed-main');
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing fixed profile');
    fixed.proxyByScheme = { http: 'endpoint-http' };

    const result = evaluateProfileGraph(
      spec,
      { kind: 'profile', profileId: fixed.id },
      { url: 'ftp://files.example.invalid/', host: 'files.example.invalid', scheme: 'ftp' },
    );
    expect(result.status).toBe('resolved');
    if (result.status !== 'resolved') throw new Error(result.reason);
    expect(result.route).toEqual({ kind: 'direct' });
    expect(result.trace.some((entry) => entry.action === 'fixed-unmapped-direct')).toBe(true);
  });

  it('rejects a missing proxy endpoint instead of silently falling back', () => {
    const spec = baseSpec();
    const fixed = spec.profiles.find((profile) => profile.id === 'fixed-main');
    if (!fixed || fixed.kind !== 'fixed') throw new Error('missing fixed profile');
    fixed.proxyByScheme.https = 'missing-endpoint';

    const result = evaluateProfileGraph(
      spec,
      { kind: 'profile', profileId: fixed.id },
      privateRequest,
    );
    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') throw new Error('expected invalid decision');
    expect(result.reason).toContain('missing-endpoint');
  });

  it('detects profile cycles even when an invalid spec bypasses validation', () => {
    const spec = baseSpec();
    spec.profiles = [
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

    const result = evaluateProfileGraph(
      spec,
      { kind: 'profile', profileId: 'cycle-a' },
      privateRequest,
    );
    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') throw new Error('expected invalid decision');
    expect(result.reason).toContain('cycle-a -> cycle-b -> cycle-a');
  });

  it('rejects disabled selected profiles', () => {
    const spec = baseSpec();
    const fixed = spec.profiles.find((profile) => profile.id === 'fixed-main');
    if (!fixed) throw new Error('missing profile');
    fixed.enabled = false;

    const result = evaluateProfileGraph(
      spec,
      { kind: 'profile', profileId: fixed.id },
      privateRequest,
    );
    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') throw new Error('expected invalid decision');
    expect(result.reason).toContain('disabled');
  });

  it('marks arbitrary PAC execution as target-dependent and indeterminate', () => {
    const result = evaluateProfileGraph(
      baseSpec(),
      { kind: 'profile', profileId: 'pac-main' },
      privateRequest,
    );
    expect(result.status).toBe('indeterminate');
    if (result.status !== 'indeterminate') throw new Error('expected indeterminate decision');
    expect(result.support).toBe('target-dependent');
    expect(result.trace.at(-1)?.action).toBe('pac');
  });

  it('enforces a deterministic maximum profile depth', () => {
    const spec = baseSpec();
    const result = evaluateProfileGraph(
      spec,
      { kind: 'profile', profileId: 'switch-outer' },
      privateRequest,
      { maxProfileDepth: 1 },
    );
    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') throw new Error('expected invalid decision');
    expect(result.reason).toContain('maximum depth 1');
  });
});
