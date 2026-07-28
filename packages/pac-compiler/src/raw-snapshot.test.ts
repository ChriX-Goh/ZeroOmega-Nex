import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { createRawPacSnapshot, RAW_PAC_SNAPSHOT_VERSION } from './raw-snapshot.js';

function fixture(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'raw-pac-document',
    revision: {
      id: 'raw-pac-revision',
      createdAt: '2026-07-28T00:00:00.000Z',
    },
    profiles: [
      {
        id: 'pac-raw',
        name: 'Raw PAC',
        kind: 'pac',
        source: {
          kind: 'inline',
          script: "function FindProxyForURL(url, host) { return 'DIRECT'; }",
        },
      },
    ],
    proxyEndpoints: [],
    ruleSources: [],
    settings: {
      startup: { revertProxyChanges: true },
      quickSwitch: { enabled: false, refreshOnChange: false, routes: [] },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: false,
        exportLegacyRuleList: true,
      },
      ruleSourceUpdateIntervalMinutes: 1440,
    },
  };
}

describe('raw PAC snapshots', () => {
  it('creates a deterministic top-level target-dependent snapshot', async () => {
    const spec = fixture();
    const result = await createRawPacSnapshot(
      spec,
      { kind: 'profile', profileId: 'pac-raw' },
      "function FindProxyForURL(url, host) { return 'DIRECT'; }",
      { createdAt: '2026-07-28T00:01:00.000Z' },
      'chromium',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.snapshot.compilerVersion).toBe(RAW_PAC_SNAPSHOT_VERSION);
    expect(result.snapshot.capability).toBe('target-dependent');
    expect(result.snapshot.verification.mode).toBe('structural');
    expect(result.snapshot.script).toContain('FindProxyForURL');
    expect(result.snapshot.snapshotId).toMatch(/^raw-pac-/u);
  });

  it('rejects missing entrypoints and non-PAC routes', async () => {
    const spec = fixture();
    const missing = await createRawPacSnapshot(
      spec,
      { kind: 'profile', profileId: 'pac-raw' },
      "const result = 'DIRECT';",
      { createdAt: '2026-07-28T00:01:00.000Z' },
      'firefox',
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.issues[0]?.code).toBe('raw-pac.missing-entrypoint');

    const wrongRoute = await createRawPacSnapshot(
      spec,
      { kind: 'direct' },
      "function FindProxyForURL() { return 'DIRECT'; }",
      { createdAt: '2026-07-28T00:01:00.000Z' },
      'chromium',
    );
    expect(wrongRoute.ok).toBe(false);
  });
});
