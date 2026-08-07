import { readFile } from 'node:fs/promises';

import { exportZeroOmegaBackup, importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

type OriginalOptions = Record<string, unknown>;

const ORIGINAL_COMPLEX_URL = new URL(
  '../../../../fixtures/zeroomega-v2/original-complex-corpus-cd-v3.5.0.bak',
  import.meta.url,
);

const importContext = {
  createdAt: '2026-08-07T02:20:00.000Z',
  documentId: 'document-mig-01-original-complex',
  revisionId: 'revision-mig-01-original-complex',
  deviceId: 'device-mig-01',
} as const;

function userIntent(spec: ProfileSpec) {
  return {
    profiles: spec.profiles,
    proxyEndpoints: spec.proxyEndpoints,
    ruleSources: spec.ruleSources,
    settings: spec.settings,
    extensions: spec.extensions,
  };
}

function originalComplexSemantics(options: OriginalOptions) {
  return {
    schemaVersion: options.schemaVersion,
    startupProfileName: options['-startupProfileName'],
    enableQuickSwitch: options['-enableQuickSwitch'],
    quickSwitchProfiles: options['-quickSwitchProfiles'],
    corpusProxy: options['+corpus proxy'],
    innerSwitch: options['+inner switch'],
    virtualRoute: options['+virtual route'],
    corpusRules: options['+corpus rules'],
    outerSwitch: options['+outer switch'],
    unicodePac: options['+PAC 中文'],
  };
}

describe('MIG-01 original complex corpus migration', () => {
  it('imports and semantically round trips original-runtime Corpus C/D data', async () => {
    const source = await readFile(ORIGINAL_COMPLEX_URL, 'utf8');
    const originalOptions = JSON.parse(source) as OriginalOptions;
    const imported = importZeroOmegaBackup(source, importContext);
    if (!imported.ok) {
      throw new Error(JSON.stringify(imported.report, null, 2));
    }

    expect(imported.candidate.profiles.map((profile) => profile.name)).toEqual(
      expect.arrayContaining([
        'corpus proxy',
        'inner switch',
        'virtual route',
        'corpus rules',
        'outer switch',
        'PAC 中文',
      ]),
    );
    expect(imported.candidate.settings.quickSwitch.enabled).toBe(true);
    expect(imported.candidate.settings.startupRoute).toMatchObject({ kind: 'profile' });

    const exported = exportZeroOmegaBackup(imported.candidate, {
      createdAt: '2026-08-07T02:21:00.000Z',
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) {
      throw new Error(JSON.stringify(exported.issues, null, 2));
    }

    expect(originalComplexSemantics(exported.options)).toEqual(
      originalComplexSemantics(originalOptions),
    );

    const reimported = importZeroOmegaBackup(exported.content, {
      ...importContext,
      createdAt: imported.candidate.revision.createdAt,
      revisionId: imported.candidate.revision.id,
    });
    expect(reimported.ok).toBe(true);
    if (!reimported.ok) {
      throw new Error(JSON.stringify(reimported.report, null, 2));
    }
    expect(userIntent(reimported.candidate)).toEqual(userIntent(imported.candidate));
  });
});
