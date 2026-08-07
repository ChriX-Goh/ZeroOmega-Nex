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

const ORIGINAL_DEFAULT_URL = new URL(
  '../../../../fixtures/zeroomega-v2/original-default-v3.5.0.bak',
  import.meta.url,
);
const importContext = {
  createdAt: '2026-08-07T05:25:00.000Z',
  documentId: 'document-mig-01-duplicate-name',
  revisionId: 'revision-mig-01-duplicate-name',
  deviceId: 'device-mig-01',
} as const;

function quickSwitchNames(spec: ProfileSpec): string[] {
  const profileNameById = new Map(spec.profiles.map((profile) => [profile.id, profile.name]));
  return spec.settings.quickSwitch.routes.map((route) =>
    route.kind === 'profile'
      ? (profileNameById.get(route.profileId) ?? route.profileId)
      : route.kind,
  );
}

describe('MIG-01 original duplicate-name normalization transaction', () => {
  it('normalizes repeated Quick Switch names before accept, Apply, export, and re-import', async () => {
    const options = JSON.parse(await readFile(ORIGINAL_DEFAULT_URL, 'utf8')) as Record<
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

    const imported = importZeroOmegaBackup(JSON.stringify(options), importContext);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(JSON.stringify(imported.report, null, 2));
    expect(quickSwitchNames(imported.candidate)).toEqual(['proxy', 'auto switch', 'system']);

    const initial = structuredClone(imported.candidate);
    initial.settings.quickSwitch.enabled = false;
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
    expect(quickSwitchNames(accepted.state.draft)).toEqual(['proxy', 'auto switch', 'system']);

    const activated: ProfileSpec[] = [];
    const driver: ProfileWorkflowActivationDriver = {
      async activate(candidate) {
        activated.push(structuredClone(candidate));
        return { snapshotId: 'snapshot-mig-01-duplicate-name' };
      },
      async rollback() {},
    };
    const applied = await applyProfileWorkflow(repository, driver, {
      applyId: 'apply-mig-01-duplicate-name',
      revisionId: 'revision-mig-01-duplicate-name-applied',
      startedAt: '2026-08-07T05:26:00.000Z',
      completedAt: '2026-08-07T05:26:01.000Z',
      deviceId: 'device-mig-01',
    });
    expect(applied.status).toBe('applied');
    if (applied.status !== 'applied') throw new Error(applied.message);
    expect(quickSwitchNames(activated[0]!)).toEqual(['proxy', 'auto switch', 'system']);
    expect(quickSwitchNames(applied.state.applied)).toEqual(['proxy', 'auto switch', 'system']);

    const exported = exportZeroOmegaBackup(applied.state.applied, {
      createdAt: '2026-08-07T05:27:00.000Z',
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues, null, 2));
    expect(exported.options['-quickSwitchProfiles']).toEqual(['proxy', 'auto switch', 'system']);

    const reimported = importZeroOmegaBackup(exported.content, {
      ...importContext,
      createdAt: applied.state.applied.revision.createdAt,
      revisionId: applied.state.applied.revision.id,
    });
    expect(reimported.ok).toBe(true);
    if (!reimported.ok) throw new Error(JSON.stringify(reimported.report, null, 2));
    expect(quickSwitchNames(reimported.candidate)).toEqual(['proxy', 'auto switch', 'system']);
    expect(
      reimported.report.items.some(
        (item) => item.code === 'settings.quick-switch-duplicate-normalized',
      ),
    ).toBe(false);
  });
});
