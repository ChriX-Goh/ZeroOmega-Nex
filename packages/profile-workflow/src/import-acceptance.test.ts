import { cloneProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  acceptProfileWorkflowImport,
  normalizeImportedProfileWorkflowDraft,
  type ProfileWorkflowSecretStore,
} from './import-acceptance.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { createProfileWorkflowState } from './state.js';
import { workflowFixture } from './test-fixture.js';

class MemorySecretStore implements ProfileWorkflowSecretStore {
  readonly values = new Map<string, string>();
  putCalls = 0;
  failPutCall?: number;
  failRemoveReference?: string;

  async getSecret(secretRef: string): Promise<string | undefined> {
    return this.values.get(secretRef);
  }

  async putSecret(secretRef: string, secret: string): Promise<void> {
    this.putCalls += 1;
    if (this.failPutCall === this.putCalls) {
      throw new Error(`put failed for ${secretRef}`);
    }
    this.values.set(secretRef, secret);
  }

  async removeSecret(secretRef: string): Promise<void> {
    if (this.failRemoveReference === secretRef) {
      throw new Error(`remove failed for ${secretRef}`);
    }
    this.values.delete(secretRef);
  }
}

function importedCandidate() {
  const candidate = cloneProfileSpec(workflowFixture());
  candidate.documentId = 'document-from-legacy-backup';
  candidate.revision = {
    id: 'revision-from-legacy-backup',
    createdAt: '2026-07-25T15:00:00.000Z',
  };
  candidate.profiles[0]!.name = 'Imported Primary Proxy';
  return candidate;
}

describe('profile workflow import acceptance', () => {
  it('normalizes imported identity to the current workflow document and revision', () => {
    const state = createProfileWorkflowState(workflowFixture());
    const normalized = normalizeImportedProfileWorkflowDraft(state, importedCandidate());

    expect(normalized.documentId).toBe(state.applied.documentId);
    expect(normalized.revision).toEqual(state.applied.revision);
    expect(normalized.profiles[0]?.name).toBe('Imported Primary Proxy');
  });

  it('persists secrets and atomically replaces Draft without returning secret values', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    const secrets = new MemorySecretStore();

    const result = await acceptProfileWorkflowImport(
      repository,
      state,
      importedCandidate(),
      [
        { ref: 'secret-import-one', value: 'first-secret-value' },
        { ref: 'secret-import-two', value: 'second-secret-value' },
      ],
      secrets,
    );

    expect(result).toMatchObject({
      status: 'accepted',
      state: {
        generation: 1,
        applied: { documentId: state.applied.documentId },
        draft: {
          documentId: state.applied.documentId,
          revision: state.applied.revision,
          profiles: [{ name: 'Imported Primary Proxy' }],
        },
      },
    });
    expect(secrets.values).toEqual(
      new Map([
        ['secret-import-one', 'first-secret-value'],
        ['secret-import-two', 'second-secret-value'],
      ]),
    );
    expect(JSON.stringify(result)).not.toContain('first-secret-value');
    expect(JSON.stringify(result)).not.toContain('second-secret-value');
  });

  it('restores overwritten and newly created secrets after a Draft commit conflict', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    repository.failNextCompareAndSwap = true;
    const secrets = new MemorySecretStore();
    secrets.values.set('secret-existing', 'previous-value');

    const result = await acceptProfileWorkflowImport(
      repository,
      state,
      importedCandidate(),
      [
        { ref: 'secret-existing', value: 'replacement-value' },
        { ref: 'secret-new', value: 'new-value' },
      ],
      secrets,
    );

    expect(result).toMatchObject({ status: 'conflict' });
    expect(secrets.values).toEqual(new Map([['secret-existing', 'previous-value']]));
    await expect(repository.read()).resolves.toEqual(state);
  });

  it('rolls back secrets when a later secret write fails', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    const secrets = new MemorySecretStore();
    secrets.values.set('secret-existing', 'previous-value');
    secrets.failPutCall = 2;

    const result = await acceptProfileWorkflowImport(
      repository,
      state,
      importedCandidate(),
      [
        { ref: 'secret-existing', value: 'replacement-value' },
        { ref: 'secret-failing', value: 'failing-value' },
      ],
      secrets,
    );

    expect(result).toMatchObject({
      status: 'storage-failure',
      message: 'put failed for secret-failing',
    });
    expect(secrets.values).toEqual(new Map([['secret-existing', 'previous-value']]));
    await expect(repository.read()).resolves.toEqual(state);
  });

  it('reports rollback failure without exposing secret values', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    repository.failNextCompareAndSwap = true;
    const secrets = new MemorySecretStore();
    secrets.failRemoveReference = 'secret-new';

    const result = await acceptProfileWorkflowImport(
      repository,
      state,
      importedCandidate(),
      [{ ref: 'secret-new', value: 'sensitive-value' }],
      secrets,
    );

    expect(result).toMatchObject({ status: 'rollback-failed' });
    expect(JSON.stringify(result)).not.toContain('sensitive-value');
  });

  it('rejects secret-bearing imports when no background secret store is available', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);

    const result = await acceptProfileWorkflowImport(
      repository,
      state,
      importedCandidate(),
      [{ ref: 'secret-import', value: 'secret-value' }],
    );

    expect(result).toMatchObject({
      status: 'invalid',
      message: 'profile workflow import secret store is unavailable',
    });
    await expect(repository.read()).resolves.toEqual(state);
  });

  it('rejects conflicting duplicate secret references before writing', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    const secrets = new MemorySecretStore();

    const result = await acceptProfileWorkflowImport(
      repository,
      state,
      importedCandidate(),
      [
        { ref: 'secret-duplicate', value: 'value-one' },
        { ref: 'secret-duplicate', value: 'value-two' },
      ],
      secrets,
    );

    expect(result).toMatchObject({
      status: 'invalid',
      message: 'imported secret reference secret-duplicate has conflicting values',
    });
    expect(secrets.values.size).toBe(0);
  });
});
