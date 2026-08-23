import { expect, it } from 'vitest';

import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

import { compilePac } from './compiler.js';

function virtualSpec(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'document-virtual',
    revision: { id: 'revision-virtual', createdAt: '2026-07-26T00:00:00.000Z' },
    profiles: [
      {
        id: 'profile-fixed',
        name: 'Fixed',
        kind: 'fixed',
        proxyByScheme: { fallback: 'endpoint-fixed' },
        bypass: [],
      },
      {
        id: 'profile-virtual',
        name: 'Virtual',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-fixed' },
      },
    ],
    proxyEndpoints: [
      { id: 'endpoint-fixed', name: 'Fixed', protocol: 'http', host: 'proxy.test', port: 8080 },
    ],
    ruleSources: [],
    settings: {
      startup: { route: { kind: 'direct' }, revertProxyChanges: true },
      quickSwitch: { enabled: true, routes: [{ kind: 'direct' }], refreshOnChange: false },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
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

it('compiles a Virtual profile as a stable alias to its target', () => {
  const result = compilePac(virtualSpec(), { kind: 'profile', profileId: 'profile-virtual' });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  expect(result.artifact.script).toContain('function zoProfile0');
  expect(result.analysis.reachableProfileIds).toEqual(['profile-virtual', 'profile-fixed']);
});
