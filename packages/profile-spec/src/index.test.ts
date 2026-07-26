import { describe, expect, it } from 'vitest';

import {
  PROFILE_SPEC_SCHEMA_VERSION,
  profileSpecJsonSchema,
  validateProfileSpec,
  type ProfileSpec,
  type SwitchRule,
} from './index.js';

function conditionRules(): SwitchRule[] {
  return [
    { id: 'rule-true', condition: { kind: 'true' }, route: { kind: 'direct' } },
    {
      id: 'rule-false',
      condition: { kind: 'false', annotation: 'never' },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-url-regex',
      condition: { kind: 'url-regex', pattern: '^https://example\\.com/' },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-url-wildcard',
      condition: { kind: 'url-wildcard', pattern: 'https://*.example.com/*' },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-host-regex',
      condition: { kind: 'host-regex', pattern: '(^|\\.)example\\.com$' },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-host-wildcard',
      condition: { kind: 'host-wildcard', pattern: '*.example.com' },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-bypass',
      condition: { kind: 'bypass', pattern: '<local>' },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-keyword',
      condition: { kind: 'keyword', pattern: 'example', httpOnly: true },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-ip',
      condition: { kind: 'ip', address: '2001:db8::', prefixLength: 32 },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-levels',
      condition: { kind: 'host-levels', min: 1, max: 4 },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-weekday',
      condition: { kind: 'weekday', days: ['mon', 'fri'], timezone: 'local' },
      route: { kind: 'direct' },
    },
    {
      id: 'rule-time',
      condition: { kind: 'time', startHour: 8, endHour: 18, timezone: 'local' },
      route: { kind: 'direct' },
    },
  ];
}

function validSpec(): ProfileSpec {
  return {
    schemaVersion: PROFILE_SPEC_SCHEMA_VERSION,
    documentId: 'document-main',
    revision: {
      id: 'revision-1',
      createdAt: '2026-07-25T00:00:00.000Z',
      deviceId: 'device-test',
    },
    profiles: [
      {
        id: 'profile-fixed',
        name: 'Proxy',
        color: '#64b5f6',
        kind: 'fixed',
        proxyByScheme: { fallback: 'endpoint-main' },
        bypass: [{ id: 'bypass-local', pattern: '<local>' }],
      },
      {
        id: 'profile-switch',
        name: 'Auto Switch',
        color: '#8bc34a',
        kind: 'switch',
        rules: conditionRules(),
        defaultRoute: { kind: 'profile', profileId: 'profile-fixed' },
      },
      {
        id: 'profile-rules',
        name: 'Rule List',
        kind: 'rule-list',
        sourceId: 'source-main',
        matchRoute: { kind: 'profile', profileId: 'profile-fixed' },
        defaultRoute: { kind: 'direct' },
      },
      {
        id: 'profile-pac',
        name: 'PAC',
        kind: 'pac',
        source: {
          kind: 'inline',
          script: 'function FindProxyForURL() { return "DIRECT"; }',
        },
        headers: [
          {
            name: 'Authorization',
            value: { kind: 'secret', secretRef: 'secret-pac-authorization' },
          },
        ],
        fallbackRoute: { kind: 'direct' },
      },
      {
        id: 'profile-auto',
        name: 'Auto Detect',
        kind: 'auto-detect',
        fallbackRoute: { kind: 'system' },
      },
    ],
    proxyEndpoints: [
      {
        id: 'endpoint-main',
        name: 'Main proxy',
        protocol: 'http',
        host: '127.0.0.1',
        port: 7890,
        credential: {
          username: 'proxy-user',
          passwordSecretRef: 'secret-proxy-password',
        },
      },
    ],
    ruleSources: [
      {
        id: 'source-main',
        name: 'Main rules',
        format: 'autoproxy',
        location: { kind: 'url', url: 'https://example.com/rules.txt' },
        headers: [
          { name: 'User-Agent', value: { kind: 'literal', value: 'ZeroOmega Nex' } },
          {
            name: 'Authorization',
            value: { kind: 'secret', secretRef: 'secret-rule-authorization' },
          },
        ],
      },
    ],
    settings: {
      startup: {
        route: { kind: 'profile', profileId: 'profile-switch' },
        revertProxyChanges: true,
      },
      quickSwitch: {
        enabled: true,
        routes: [
          { kind: 'profile', profileId: 'profile-switch' },
          { kind: 'profile', profileId: 'profile-fixed' },
          { kind: 'direct' },
          { kind: 'system' },
        ],
        refreshOnChange: false,
      },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: true,
        exportLegacyRuleList: false,
        builtInProfiles: {
          direct: { color: '#9e9e9e' },
          system: { color: '#607d8b' },
        },
      },
      ruleSourceUpdateIntervalMinutes: 1440,
      sync: { backend: 'none' },
    },
    extensions: {
      'zeroomega/import-summary': {
        importedProfiles: 5,
      },
    },
  };
}

function issueCodes(input: unknown): string[] {
  return validateProfileSpec(input).issues.map((entry) => entry.code);
}

describe('ProfileSpec v1', () => {
  it('publishes a JSON Schema 2020-12 contract', () => {
    expect(profileSpecJsonSchema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(profileSpecJsonSchema.properties.schemaVersion.const).toBe('1.0');
  });

  it('accepts all profile and condition variants in a valid document', () => {
    const result = validateProfileSpec(validSpec());
    expect(result.valid).toBe(true);
    expect(result.value).toEqual(validSpec());
    expect(result.issues).toEqual([]);
  });

  it('reports structural schema violations before semantic validation', () => {
    const value = validSpec() as unknown as Record<string, unknown>;
    delete value.settings;
    expect(issueCodes(value)).toContain('schema.required');
  });

  it('rejects duplicate IDs and names', () => {
    const value = validSpec();
    const original = value.profiles[0]!;
    if (original.kind !== 'fixed') throw new Error('fixture mismatch');
    value.profiles.push({
      ...original,
      proxyByScheme: { ...original.proxyByScheme },
      bypass: [],
    });
    const codes = issueCodes(value);
    expect(codes).toContain('profile.duplicate-id');
    expect(codes).toContain('profile.duplicate-name');
  });

  it('accepts a blank fixed profile before proxy endpoints are configured', () => {
    const value = validSpec();
    const fixed = value.profiles[0]!;
    if (fixed.kind !== 'fixed') throw new Error('fixture mismatch');
    fixed.proxyByScheme = {};

    const result = validateProfileSpec(value);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('rejects missing endpoint and profile references', () => {
    const value = validSpec();
    const fixed = value.profiles[0]!;
    if (fixed.kind !== 'fixed') throw new Error('fixture mismatch');
    fixed.proxyByScheme.fallback = 'missing-endpoint';

    const auto = value.profiles[4]!;
    if (auto.kind !== 'auto-detect') throw new Error('fixture mismatch');
    auto.fallbackRoute = { kind: 'profile', profileId: 'missing-profile' };

    const codes = issueCodes(value);
    expect(codes).toContain('endpoint.missing-reference');
    expect(codes).toContain('profile.missing-reference');
  });

  it('detects profile reference cycles', () => {
    const value = validSpec();
    const fixed = value.profiles[0]!;
    value.profiles[0] = {
      id: fixed.id,
      name: fixed.name,
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'profile', profileId: 'profile-switch' },
    };
    expect(issueCodes(value)).toContain('profile.reference-cycle');
  });

  it('rejects invalid regular expressions and IP prefixes', () => {
    const value = validSpec();
    const profile = value.profiles[1]!;
    if (profile.kind !== 'switch') throw new Error('fixture mismatch');
    profile.rules[2]!.condition = { kind: 'url-regex', pattern: '[' };
    profile.rules[8]!.condition = {
      kind: 'ip',
      address: '192.0.2.0',
      prefixLength: 64,
    };
    const codes = issueCodes(value);
    expect(codes).toContain('condition.invalid-regex');
    expect(codes).toContain('condition.invalid-prefix');
  });

  it('requires sensitive request headers to use secret references', () => {
    const value = validSpec();
    value.ruleSources[0]!.headers = [
      {
        name: 'Authorization',
        value: { kind: 'literal', value: 'Bearer plaintext' },
      },
    ];
    expect(issueCodes(value)).toContain('source.sensitive-literal-header');
  });

  it('requires sensitive PAC request headers to use secret references', () => {
    const value = validSpec();
    const pac = value.profiles[3]!;
    if (pac.kind !== 'pac') throw new Error('fixture mismatch');
    pac.headers = [
      {
        name: 'Authorization',
        value: { kind: 'literal', value: 'Bearer plaintext' },
      },
    ];
    expect(issueCodes(value)).toContain('source.sensitive-literal-header');
  });

  it('rejects remote sync without HTTPS and a secret reference', () => {
    const value = validSpec();
    value.settings.sync = {
      backend: 'webdav',
      remoteUri: 'http://example.com/config.json',
      username: 'user',
    };
    const codes = issueCodes(value);
    expect(codes).toContain('source.unsupported-protocol');
    expect(codes).toContain('sync.missing-secret-ref');
  });

  it('rejects non-namespaced extension keys structurally', () => {
    const value = validSpec();
    value.extensions = {
      unsafe: { harmless: true },
    };
    expect(issueCodes(value)).toContain('schema.propertyNames');
  });

  it('rejects secret and generated data inside namespaced extensions', () => {
    const value = validSpec();
    value.extensions = {
      'unsafe/data': {
        password: 'plaintext',
        pacScript: 'generated',
      },
    };
    const codes = issueCodes(value);
    expect(codes).toContain('extensions.secret-field');
    expect(codes).toContain('extensions.generated-field');
  });

  it('keeps target-dependent file PAC as a warning rather than an error', () => {
    const value = validSpec();
    const pac = value.profiles[3]!;
    if (pac.kind !== 'pac') throw new Error('fixture mismatch');
    pac.source = { kind: 'url', url: 'file:///tmp/proxy.pac' };

    const result = validateProfileSpec(value);
    expect(result.valid).toBe(true);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: 'profile.target-dependent-file-pac',
        severity: 'warning',
      }),
    );
  });
});
