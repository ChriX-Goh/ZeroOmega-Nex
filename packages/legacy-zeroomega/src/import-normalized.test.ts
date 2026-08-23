import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { exportZeroOmegaBackup, importZeroOmegaBackup } from './index.js';

const FIXTURE_ROOT = new URL('../../../fixtures/zeroomega-v2/', import.meta.url);
const context = {
  createdAt: '2026-08-07T05:25:00.000Z',
  documentId: 'document-duplicate-name-runtime',
  revisionId: 'revision-duplicate-name-runtime',
  deviceId: 'device-duplicate-name-runtime',
} as const;

async function fixture(name: string): Promise<string> {
  return readFile(new URL(name, FIXTURE_ROOT), 'utf8');
}

function quickSwitchNames(
  result: Extract<ReturnType<typeof importZeroOmegaBackup>, { ok: true }>,
): string[] {
  const profileNameById = new Map(
    result.candidate.profiles.map((profile) => [profile.id, profile.name]),
  );
  return result.candidate.settings.quickSwitch.routes.map((route) =>
    route.kind === 'profile'
      ? (profileNameById.get(route.profileId) ?? route.profileId)
      : route.kind,
  );
}

describe('ZeroOmega original-runtime duplicate-name normalization', () => {
  it('keeps the first valid Quick Switch name and omits later duplicates', async () => {
    const options = JSON.parse(await fixture('original-default-v3.5.0.bak')) as Record<
      string,
      unknown
    >;
    options['-enableQuickSwitch'] = true;
    options['-quickSwitchProfiles'] = [
      'proxy',
      'proxy',
      'auto switch',
      'proxy',
      'system',
      'system',
      'auto switch',
    ];

    const imported = importZeroOmegaBackup(JSON.stringify(options), context);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));

    expect(quickSwitchNames(imported)).toEqual(['proxy', 'auto switch', 'system']);
    const normalized = imported.report.items.filter(
      (item) => item.code === 'settings.quick-switch-duplicate-normalized',
    );
    expect(normalized.map((item) => item.sourcePath)).toEqual([
      '/-quickSwitchProfiles/1',
      '/-quickSwitchProfiles/3',
      '/-quickSwitchProfiles/5',
      '/-quickSwitchProfiles/6',
    ]);
    expect(normalized.every((item) => item.status === 'exact')).toBe(true);

    const exported = exportZeroOmegaBackup(imported.candidate, {
      createdAt: '2026-08-07T05:26:00.000Z',
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues, null, 2));
    expect(exported.options['-quickSwitchProfiles']).toEqual(['proxy', 'auto switch', 'system']);

    const reimported = importZeroOmegaBackup(exported.content, {
      ...context,
      createdAt: imported.candidate.revision.createdAt,
      revisionId: imported.candidate.revision.id,
    });
    expect(reimported.ok).toBe(true);
    if (!reimported.ok) throw new Error(JSON.stringify(reimported.report, null, 2));
    expect(quickSwitchNames(reimported)).toEqual(['proxy', 'auto switch', 'system']);
    expect(
      reimported.report.items.some(
        (item) => item.code === 'settings.quick-switch-duplicate-normalized',
      ),
    ).toBe(false);
  });

  it('continues rejecting duplicate profile identities as invalid legacy state', async () => {
    const rejected = importZeroOmegaBackup(await fixture('invalid/duplicate-name.json'), context);
    expect(rejected.ok).toBe(false);
    expect(rejected.report.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'rejected', code: 'profile.key-name-mismatch' }),
        expect.objectContaining({ status: 'rejected', code: 'profile.duplicate-name' }),
      ]),
    );
  });
});
