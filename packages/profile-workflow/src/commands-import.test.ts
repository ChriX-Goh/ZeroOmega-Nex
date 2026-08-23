import { cloneProfileSpec, type ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  type ProfileWorkflowImportService,
  type ProfileWorkflowInitializer,
} from './commands.js';
import type { ProfileWorkflowSecretStore } from './import-acceptance.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { createProfileWorkflowState } from './state.js';
import { workflowFixture } from './test-fixture.js';

class Initializer implements ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec {
    return workflowFixture();
  }
}

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

function importedCandidate(): ProfileSpec {
  const candidate = cloneProfileSpec(workflowFixture());
  candidate.documentId = 'legacy-import-document';
  candidate.revision = {
    id: 'legacy-import-revision',
    createdAt: '2026-07-25T15:20:00.000Z',
  };
  candidate.profiles[0]!.name = 'Imported Through Command';
  return candidate;
}

function importService(store: MemorySecretStore): ProfileWorkflowImportService {
  return { secretStore: store };
}

describe('profile workflow import command', () => {
  it('recognizes only structurally valid import commands', () => {
    expect(
      isProfileWorkflowCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'accept-import',
        expectedGeneration: 0,
        candidate: importedCandidate(),
        secretMaterials: [{ ref: 'secret-one', value: 'value-one' }],
      }),
    ).toBe(true);
    expect(
      isProfileWorkflowCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'accept-import',
        expectedGeneration: 0,
        candidate: importedCandidate(),
        secretMaterials: [{ ref: 'secret-one' }],
      }),
    ).toBe(false);
  });

  it('accepts imported content through the background service and omits secret values', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    const secrets = new MemorySecretStore();

    const response = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'accept-import',
        expectedGeneration: state.generation,
        candidate: importedCandidate(),
        secretMaterials: [{ ref: 'secret-one', value: 'sensitive-value' }],
      },
      undefined,
      importService(secrets),
    );

    expect(response).toMatchObject({
      ok: true,
      state: {
        generation: 1,
        applied: { documentId: state.applied.documentId },
        draft: { documentId: state.applied.documentId },
      },
      view: { dirty: true },
    });
    if (!response.ok) throw new Error('expected successful import response');
    expect(response.state.draft.profiles[0]?.name).toBe('Imported Through Command');
    expect(secrets.values.get('secret-one')).toBe('sensitive-value');
    expect(JSON.stringify(response)).not.toContain('sensitive-value');
  });

  it('rejects a stale generation before writing secrets', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    const secrets = new MemorySecretStore();

    const response = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'accept-import',
        expectedGeneration: state.generation + 1,
        candidate: importedCandidate(),
        secretMaterials: [{ ref: 'secret-one', value: 'sensitive-value' }],
      },
      undefined,
      importService(secrets),
    );

    expect(response).toMatchObject({ ok: false, code: 'conflict' });
    expect(secrets.values.size).toBe(0);
  });

  it('rejects secret-bearing imports when the background secret service is absent', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);

    const response = await executeProfileWorkflowCommand(repository, new Initializer(), {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'accept-import',
      expectedGeneration: state.generation,
      candidate: importedCandidate(),
      secretMaterials: [{ ref: 'secret-one', value: 'sensitive-value' }],
    });

    expect(response).toMatchObject({
      ok: false,
      code: 'invalid',
      message: 'profile workflow import secret store is unavailable',
    });
    expect(JSON.stringify(response)).not.toContain('sensitive-value');
  });
});

describe('profile workflow secret commands', () => {
  it('reads a secret only when the current configuration references it', async () => {
    const spec = workflowFixture();
    spec.proxyEndpoints[0]!.credential = {
      username: 'alice',
      passwordSecretRef: 'secret-proxy-password',
    };
    const state = createProfileWorkflowState(spec);
    const repository = new MemoryProfileWorkflowRepository(state);
    const secrets = new MemorySecretStore();
    secrets.values.set('secret-proxy-password', 'correct horse');

    const response = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'read-secret',
        expectedGeneration: state.generation,
        secretRef: 'secret-proxy-password',
      },
      undefined,
      importService(secrets),
    );

    expect(response).toMatchObject({ ok: true, secretValue: 'correct horse' });
  });

  it('does not remove a secret while Draft or Applied still references it', async () => {
    const spec = workflowFixture();
    spec.proxyEndpoints[0]!.credential = {
      username: 'alice',
      passwordSecretRef: 'secret-proxy-password',
    };
    const state = createProfileWorkflowState(spec);
    const repository = new MemoryProfileWorkflowRepository(state);
    const secrets = new MemorySecretStore();
    secrets.values.set('secret-proxy-password', 'correct horse');

    const response = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'remove-secret',
        expectedGeneration: state.generation,
        secretRef: 'secret-proxy-password',
      },
      undefined,
      importService(secrets),
    );

    expect(response).toMatchObject({ ok: false, code: 'invalid' });
    expect(secrets.values.get('secret-proxy-password')).toBe('correct horse');
  });

  it('removes an orphaned secret', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(state);
    const secrets = new MemorySecretStore();
    secrets.values.set('secret-orphan', 'unused');

    const response = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'remove-secret',
        expectedGeneration: state.generation,
        secretRef: 'secret-orphan',
      },
      undefined,
      importService(secrets),
    );

    expect(response).toMatchObject({ ok: true });
    expect(secrets.values.has('secret-orphan')).toBe(false);
  });
});
