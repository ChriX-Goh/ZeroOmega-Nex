import { describe, expect, it } from 'vitest';

import { validateProfileSpec } from './validation.js';
import type { ProfileSpec } from './types.js';

function virtualSpec(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'document-virtual-test',
    revision: { id: 'revision-virtual-test', createdAt: '2026-07-26T00:00:00.000Z' },
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

describe('Virtual ProfileSpec', () => {
  it('accepts a stable alias to another route', () => {
    expect(validateProfileSpec(virtualSpec()).valid).toBe(true);
  });

  it('rejects a virtual reference cycle', () => {
    const spec = virtualSpec();
    const fixed = spec.profiles[0]!;
    if (fixed.kind !== 'fixed') throw new Error('fixture mismatch');
    spec.profiles.push({
      id: 'profile-virtual-2',
      name: 'Virtual 2',
      kind: 'virtual',
      targetRoute: { kind: 'profile', profileId: 'profile-virtual' },
    });
    const virtual = spec.profiles[1]!;
    if (virtual.kind !== 'virtual') throw new Error('fixture mismatch');
    virtual.targetRoute = { kind: 'profile', profileId: 'profile-virtual-2' };
    expect(
      validateProfileSpec(spec).issues.some((issue) => issue.code === 'profile.reference-cycle'),
    ).toBe(true);
  });
});
