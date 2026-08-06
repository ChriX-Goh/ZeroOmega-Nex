import { readFile } from 'node:fs/promises';

import {
  exportZeroOmegaBackup,
  importZeroOmegaBackup,
} from '@zeroomega-nex/legacy-zeroomega';
import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  acceptProfileWorkflowImport,
  applyProfileWorkflow,
  createProfileWorkflowState,
  MemoryProfileWorkflowRepository,
  type ProfileWorkflowActivationDriver,
  type ProfileWorkflowApplyContext,
  type ProfileWorkflowSecretStore,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

const ORIGINAL_DEFAULT_URL = new URL(
  '../../../../fixtures/zeroomega-v2/original-default-v3.5.0.bak',
  import.meta.url,
);

const importContext = {
  createdAt: '2026-08-06T06:00:00.000Z',
  documentId: 'document-mig-01-original-default',
  revisionId: 'revision-mig-01-original-default',
  deviceId: 'device-mig-01',
} as const;

const applyContext: ProfileWorkflowApplyContext = {
  applyId: 'apply-mig-01-original-default',
  revisionId: 'revision-mig-01-original-default-applied',
  startedAt: '2026-08-06T06:01:00.000Z',
  completedAt: '2026-08-06T06:01:01.000Z',
  deviceId: 'device-mig-01',
};

class MemorySecretStore implements ProfileWorkflowSecretStore {
  readonly values = new Map<string, string>();

  async getSecret(secretRef: string): Promise<string | undefined> {
    return this.values.get(secretRef);
  }

  async putSecret(secretRef: string, secret: string): Promise<void> {
    this.values.set(secretRef, secret);
  }

  async removeSecret(secretRef: string): Promise<void> {
    this.values.delete(secretRef);
  }
}

class ActivationDriver implements ProfileWorkflowActivationDriver {
  readonly activated: ProfileSpec[] = [];
  readonly rolledBack: ProfileSpec[] = [];
  activateError?: Error;

  async activate(candidate: ProfileSpec): Promise<{ snapshotId: string }> {
    this.activated.push(structuredClone(candidate));
    if (this.activateError) throw this.activateError;
    return { snapshotId: 'snapshot-mig-01-original-default' };
  }

  async rollback(previousApplied: ProfileSpec): Promise<void> {
    this.rolledBack.push(structuredClone(previousApplied));
  }
}

function userIntent(spec: ProfileSpec) {
  return {
    profiles: spec.profiles,
    proxyEndpoints: spec.proxyEndpoints,
    ruleSources: spec.ruleSources,
    settings: spec.settings,
    extensions: spec.extensions,
  };
}

function preImportApplied(candidate: ProfileSpec): ProfileSpec {
  const applied = structuredClone(candidate);
  applied.profiles[0]!.name = 'Pre-import placeholder';
  return applied;
}

async function originalDefaultImport() {
  const source = await readFile(ORIGINAL_DEFAULT_URL, 'utf8');
  const result = importZeroOmegaBackup(source, importContext);
  if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));
  return { source, result };
}

async function acceptedRepository() {
  const { source, result } = await originalDefaultImport();
  const initialApplied = preImportApplied(result.candidate);
  const repository = new MemoryProfileWorkflowRepository(
    createProfileWorkflowState(initialApplied),
  );
  const secretStore = new MemorySecretStore();
  const initialState = await repository.read();
  if (!initialState) throw new Error('profile workflow state is unavailable');

  const accepted = await acceptProfileWorkflowImport(
    repository,
    initialState,
    result.candidate,
    result.secretMaterials,
    secretStore,
  );
  expect(accepted.status).toBe('accepted');
  if (accepted.status !== 'accepted') throw new Error(accepted.message);

  return {
    source,
    imported: result,
    initialApplied,
    repository,
    secretStore,
    accepted,
  };
}

describe('MIG-01 original default migration transaction', () => {
  it('accepts, applies, exports, and re-imports the original runtime backup', async () => {
    const migration = await acceptedRepository();

    expect(userIntent(migration.accepted.state.applied)).toEqual(
      userIntent(migration.initialApplied),
    );
    expect(userIntent(migration.accepted.state.draft)).toEqual(
      userIntent(migration.imported.candidate),
    );

    const driver = new ActivationDriver();
    const applied = await applyProfileWorkflow(
      migration.repository,
      driver,
      applyContext,
    );
    expect(applied.status).toBe('applied');
    if (applied.status !== 'applied') throw new Error(applied.message);

    expect(driver.activated).toHaveLength(1);
    expect(userIntent(driver.activated[0]!)).toEqual(
      userIntent(migration.imported.candidate),
    );
    expect(userIntent(applied.state.applied)).toEqual(
      userIntent(migration.imported.candidate),
    );
    expect(applied.state.draft).toEqual(applied.state.applied);

    const exported = exportZeroOmegaBackup(applied.state.applied, {
      createdAt: '2026-08-06T06:02:00.000Z',
    });
    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error(JSON.stringify(exported.issues, null, 2));

    const originalOptions = JSON.parse(migration.source) as Record<string, unknown>;
    expect(exported.options).toMatchObject({
      schemaVersion: 2,
      '-startupProfileName': originalOptions['-startupProfileName'],
      '-quickSwitchProfiles': originalOptions['-quickSwitchProfiles'],
      '+proxy': originalOptions['+proxy'],
      '+auto switch': originalOptions['+auto switch'],
    });

    const reimported = importZeroOmegaBackup(exported.content, {
      ...importContext,
      createdAt: applied.state.applied.revision.createdAt,
      revisionId: applied.state.applied.revision.id,
    });
    expect(reimported.ok).toBe(true);
    if (!reimported.ok) throw new Error(JSON.stringify(reimported.report, null, 2));
    expect(userIntent(reimported.candidate)).toEqual(
      userIntent(applied.state.applied),
    );
    expect(migration.secretStore.values).toEqual(new Map());
  });

  it('keeps the previous active state and the accepted import draft when Apply fails', async () => {
    const migration = await acceptedRepository();
    const secretsBeforeApply = new Map(migration.secretStore.values);
    const driver = new ActivationDriver();
    driver.activateError = new Error('forced browser activation failure');

    const applied = await applyProfileWorkflow(
      migration.repository,
      driver,
      applyContext,
    );
    expect(applied).toMatchObject({
      status: 'failed',
      stage: 'activate',
      message: 'forced browser activation failure',
    });

    const state = await migration.repository.read();
    expect(state).toBeDefined();
    expect(userIntent(state!.applied)).toEqual(
      userIntent(migration.initialApplied),
    );
    expect(userIntent(state!.draft)).toEqual(
      userIntent(migration.imported.candidate),
    );
    expect(state!.pendingApply).toBeUndefined();
    expect(migration.secretStore.values).toEqual(secretsBeforeApply);
    expect(driver.rolledBack).toHaveLength(0);
  });
});
