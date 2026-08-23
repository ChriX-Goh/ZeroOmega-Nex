import { readFile } from 'node:fs/promises';

import { exportZeroOmegaBackup, importZeroOmegaBackup } from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  acceptProfileWorkflowImport,
  applyProfileWorkflow,
  createProfileWorkflowState,
  MemoryProfileWorkflowRepository,
  type ProfileWorkflowActivationDriver,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

type OriginalOptions = Record<string, unknown>;

const ORIGINAL_COMPLEX_URL = new URL(
  '../../../../fixtures/zeroomega-v2/original-complex-corpus-cd-v3.5.0.bak',
  import.meta.url,
);
const SAFE_UNKNOWN_METADATA_KEY = 'x-benign-metadata';
const SAFE_UNKNOWN_METADATA_VALUE = {
  label: 'opaque-round-trip',
  ordinal: 7,
  tags: ['alpha', '中文'],
  nested: { note: 'preserve exactly' },
} as const;

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
  const corpusRules = options['+corpus rules'];
  const corpusRuleIntent =
    corpusRules && typeof corpusRules === 'object' && !Array.isArray(corpusRules)
      ? Object.fromEntries(Object.entries(corpusRules).filter(([key]) => key !== 'pacScript'))
      : corpusRules;
  return {
    schemaVersion: options.schemaVersion,
    startupProfileName: options['-startupProfileName'],
    enableQuickSwitch: options['-enableQuickSwitch'],
    quickSwitchProfiles: options['-quickSwitchProfiles'],
    corpusProxy: options['+corpus proxy'],
    innerSwitch: options['+inner switch'],
    virtualRoute: options['+virtual route'],
    corpusRules: corpusRuleIntent,
    outerSwitch: options['+outer switch'],
    unicodePac: options['+PAC 中文'],
  };
}

function expectSafeUnknownMetadata(spec: ProfileSpec) {
  const corpusRules = spec.profiles.find((profile) => profile.name === 'corpus rules');
  expect(corpusRules?.kind).toBe('rule-list');
  expect(corpusRules?.legacy?.fields?.[SAFE_UNKNOWN_METADATA_KEY]).toEqual(
    SAFE_UNKNOWN_METADATA_VALUE,
  );
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
    expectSafeUnknownMetadata(imported.candidate);
    expect(imported.candidate.settings.quickSwitch.enabled).toBe(true);
    const profileNameById = new Map(
      imported.candidate.profiles.map((profile) => [profile.id, profile.name]),
    );
    expect(
      imported.candidate.settings.quickSwitch.routes.map((route) =>
        route.kind === 'profile' ? profileNameById.get(route.profileId) : route.kind,
      ),
    ).toEqual(['outer switch', 'PAC 中文']);
    expect(imported.candidate.settings.startup.route).toMatchObject({ kind: 'profile' });

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
    expect(
      (exported.options['+corpus rules'] as Record<string, unknown> | undefined)?.[
        SAFE_UNKNOWN_METADATA_KEY
      ],
    ).toEqual(SAFE_UNKNOWN_METADATA_VALUE);

    const reimported = importZeroOmegaBackup(exported.content, {
      ...importContext,
      createdAt: imported.candidate.revision.createdAt,
      revisionId: imported.candidate.revision.id,
    });
    expect(reimported.ok).toBe(true);
    if (!reimported.ok) {
      throw new Error(JSON.stringify(reimported.report, null, 2));
    }
    expectSafeUnknownMetadata(reimported.candidate);
    expect(userIntent(reimported.candidate)).toEqual(userIntent(imported.candidate));
  });

  it('preserves complex Quick Switch routes and safe metadata through accept and Apply', async () => {
    const source = await readFile(ORIGINAL_COMPLEX_URL, 'utf8');
    const imported = importZeroOmegaBackup(source, importContext);
    if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));
    expectSafeUnknownMetadata(imported.candidate);

    const initial = structuredClone(imported.candidate);
    initial.settings.quickSwitch.routes = [];
    const initialState = createProfileWorkflowState(initial);
    const repository = new MemoryProfileWorkflowRepository(initialState);
    const accepted = await acceptProfileWorkflowImport(
      repository,
      initialState,
      imported.candidate,
      imported.secretMaterials,
    );
    expect(accepted.status).toBe('accepted');
    if (accepted.status !== 'accepted') throw new Error(accepted.message);

    const activated: ProfileSpec[] = [];
    const driver: ProfileWorkflowActivationDriver = {
      async activate(candidate) {
        activated.push(structuredClone(candidate));
        return { snapshotId: 'snapshot-mig-01-original-complex' };
      },
      async rollback() {},
    };
    const applied = await applyProfileWorkflow(repository, driver, {
      applyId: 'apply-mig-01-original-complex',
      revisionId: 'revision-mig-01-original-complex-applied',
      startedAt: '2026-08-07T02:21:00.000Z',
      completedAt: '2026-08-07T02:21:01.000Z',
      deviceId: 'device-mig-01',
    });
    expect(applied.status).toBe('applied');
    if (applied.status !== 'applied') throw new Error(applied.message);
    expect(activated[0]?.settings.quickSwitch.routes).toEqual(
      imported.candidate.settings.quickSwitch.routes,
    );
    expect(applied.state.applied.settings.quickSwitch.routes).toEqual(
      imported.candidate.settings.quickSwitch.routes,
    );
    expectSafeUnknownMetadata(activated[0]!);
    expectSafeUnknownMetadata(applied.state.applied);
  });

  it('rejects risk-bearing unknown metadata instead of preserving it opaquely', async () => {
    const source = await readFile(ORIGINAL_COMPLEX_URL, 'utf8');
    const riskyOptions = JSON.parse(source) as OriginalOptions;
    const corpusRules = riskyOptions['+corpus rules'];
    if (!corpusRules || typeof corpusRules !== 'object' || Array.isArray(corpusRules)) {
      throw new Error('Original-runtime Corpus D Rule List profile was not available');
    }
    (corpusRules as Record<string, unknown>)['x-auth-token'] = 'not-a-real-secret';

    const rejected = importZeroOmegaBackup(JSON.stringify(riskyOptions), {
      ...importContext,
      revisionId: 'revision-mig-01-original-complex-risky',
    });
    expect(rejected.ok).toBe(false);
    expect(rejected.report.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: 'rejected',
          code: 'field.unknown-behavior',
        }),
      ]),
    );
  });
});
