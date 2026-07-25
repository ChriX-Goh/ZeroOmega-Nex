import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

export interface DefaultProfileSpecOptions {
  readonly documentId: string;
  readonly revisionId: string;
  readonly createdAt: string;
  readonly deviceId?: string;
}

export const DEFAULT_FIXED_PROFILE_ID = 'profile-default-proxy' as const;
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
        name: 'Proxy',
        color: '#64b5f6',
        kind: 'fixed',
        proxyByScheme: { fallback: DEFAULT_PROXY_ENDPOINT_ID },
        bypass: [
          { id: 'bypass-localhost', pattern: 'localhost' },
          { id: 'bypass-loopback', pattern: '127.0.0.1' },
          { id: 'bypass-local', pattern: '<local>' },
        ],
      },
    ],
    proxyEndpoints: [
      {
        id: DEFAULT_PROXY_ENDPOINT_ID,
        name: 'Proxy endpoint',
        protocol: 'http',
        host: '127.0.0.1',
        port: 7890,
      },
    ],
    ruleSources: [],
    settings: {
      startup: {
        route: { kind: 'profile', profileId: DEFAULT_FIXED_PROFILE_ID },
        revertProxyChanges: true,
      },
      quickSwitch: {
        enabled: true,
        routes: [
          { kind: 'profile', profileId: DEFAULT_FIXED_PROFILE_ID },
          { kind: 'direct' },
          { kind: 'system' },
        ],
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
        builtInProfiles: {
          direct: { color: '#bdbdbd' },
          system: { color: '#616161' },
        },
      },
      ruleSourceUpdateIntervalMinutes: 1440,
      sync: { backend: 'none' },
    },
  };
}
