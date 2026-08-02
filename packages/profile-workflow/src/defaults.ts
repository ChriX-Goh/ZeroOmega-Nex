import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

export interface DefaultProfileSpecOptions {
  readonly documentId: string;
  readonly revisionId: string;
  readonly createdAt: string;
  readonly deviceId?: string;
}

export const DEFAULT_FIXED_PROFILE_ID = 'profile-default-proxy' as const;
export const DEFAULT_SWITCH_PROFILE_ID = 'profile-default-auto-switch' as const;
export const DEFAULT_PROXY_ENDPOINT_ID = 'endpoint-default-proxy' as const;

export function createDefaultProfileSpec(options: DefaultProfileSpecOptions): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: options.documentId,
    revision: {
      id: options.revisionId,
      createdAt: options.createdAt,
      ...(options.deviceId === undefined ? {} : { deviceId: options.deviceId }),
    },
    profiles: [
      {
        id: DEFAULT_FIXED_PROFILE_ID,
        name: 'proxy',
        color: '#99ccee',
        kind: 'fixed',
        proxyByScheme: { fallback: DEFAULT_PROXY_ENDPOINT_ID },
        bypass: [
          { id: 'bypass-loopback-ipv4', pattern: '127.0.0.1' },
          { id: 'bypass-loopback-ipv6', pattern: '::1' },
          { id: 'bypass-localhost', pattern: 'localhost' },
        ],
      },
      {
        id: DEFAULT_SWITCH_PROFILE_ID,
        name: 'auto switch',
        color: '#99dd99',
        kind: 'switch',
        rules: [
          {
            id: 'rule-default-internal-direct',
            condition: { kind: 'host-wildcard', pattern: 'internal.example.com' },
            route: { kind: 'direct' },
          },
          {
            id: 'rule-default-example-proxy',
            condition: { kind: 'host-wildcard', pattern: '*.example.com' },
            route: { kind: 'profile', profileId: DEFAULT_FIXED_PROFILE_ID },
          },
        ],
        defaultRoute: { kind: 'direct' },
      },
    ],
    proxyEndpoints: [
      {
        id: DEFAULT_PROXY_ENDPOINT_ID,
        name: 'proxy',
        protocol: 'http',
        host: 'proxy.example.com',
        port: 8080,
      },
    ],
    ruleSources: [],
    settings: {
      startup: {
        revertProxyChanges: true,
      },
      quickSwitch: {
        enabled: false,
        routes: [
          { kind: 'direct' },
          { kind: 'system' },
          { kind: 'profile', profileId: DEFAULT_FIXED_PROFILE_ID },
          { kind: 'profile', profileId: DEFAULT_SWITCH_PROFILE_ID },
        ],
        refreshOnChange: true,
      },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        monitorWebRequests: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: false,
        exportLegacyRuleList: false,
        builtInProfiles: {
          direct: { color: '#99ccee' },
          system: { color: '#99ccee' },
        },
      },
      ruleSourceUpdateIntervalMinutes: 1440,
      sync: { backend: 'none' },
    },
  };
}
