import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

export function workflowFixture(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'document-workflow-test',
    revision: {
      id: 'revision-applied',
      createdAt: '2026-07-25T08:00:00.000Z',
      deviceId: 'device-test',
    },
    profiles: [
      {
        id: 'profile-primary',
        name: 'Proxy',
        color: '#64b5f6',
        kind: 'fixed',
        proxyByScheme: { fallback: 'endpoint-primary' },
        bypass: [{ id: 'bypass-local', pattern: '<local>' }],
      },
      {
        id: 'profile-secondary',
        name: 'Backup Proxy',
        color: '#8bc34a',
        kind: 'fixed',
        proxyByScheme: { fallback: 'endpoint-secondary' },
        bypass: [],
      },
    ],
    proxyEndpoints: [
      {
        id: 'endpoint-primary',
        name: 'Primary endpoint',
        protocol: 'http',
        host: 'proxy.example.invalid',
        port: 8080,
      },
      {
        id: 'endpoint-secondary',
        name: 'Secondary endpoint',
        protocol: 'https',
        host: 'backup.example.invalid',
        port: 8443,
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
        routes: [
          { kind: 'profile', profileId: 'profile-primary' },
          { kind: 'profile', profileId: 'profile-secondary' },
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
