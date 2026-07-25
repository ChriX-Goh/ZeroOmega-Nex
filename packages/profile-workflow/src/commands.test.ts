import { cloneProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  type ProfileWorkflowInitializer,
} from './commands.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { workflowFixture } from './test-fixture.js';

class Initializer implements ProfileWorkflowInitializer {
  calls = 0;

  createInitialProfileSpec() {
    this.calls += 1;
    return workflowFixture();
  }
}

describe('typed profile workflow command service', () => {
  it('initializes once and returns the persisted state', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const initializer = new Initializer();
    const command = { channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL, action: 'get' } as const;
    const first = await executeProfileWorkflowCommand(repository, initializer, command);
    const second = await executeProfileWorkflowCommand(repository, initializer, command);
    expect(first).toMatchObject({
      ok: true,
      state: { generation: 0, selectedProfileId: 'profile-primary' },
      view: { dirty: false },
    });
    expect(second).toEqual(first);
    expect(initializer.calls).toBe(1);
  });

  it('persists a replacement draft with optimistic generation checking', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const initializer = new Initializer();
    const initial = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'get',
    });
    if (!initial.ok) throw new Error(initial.message);
    const draft = cloneProfileSpec(initial.state.draft);
    draft.profiles[0]!.name = 'Edited through command';
    const result = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'replace-draft',
      expectedGeneration: initial.state.generation,
      draft,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.state.generation).toBe(1);
    expect(result.state.applied.revision.id).toBe('revision-applied');
    expect(result.state.draft.profiles[0]!.name).toBe('Edited through command');
    expect(result.state.draft.profiles[1]!.name).toBe('Backup Proxy');
    expect(result.view.dirty).toBe(true);
  });

  it('rejects stale commands and returns the current state for reload', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const initializer = new Initializer();
    const initial = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'get',
    });
    if (!initial.ok) throw new Error(initial.message);
    await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'select-profile',
      expectedGeneration: 0,
      profileId: 'profile-secondary',
    });
    const conflict = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'revert',
      expectedGeneration: 0,
    });
    expect(conflict).toMatchObject({
      ok: false,
      code: 'conflict',
      state: { generation: 1, selectedProfileId: 'profile-secondary' },
    });
  });

  it('selects profiles and reverts edits without browser activation', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const initializer = new Initializer();
    const initial = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'get',
    });
    if (!initial.ok) throw new Error(initial.message);
    const draft = cloneProfileSpec(initial.state.draft);
    draft.profiles[0]!.name = 'Temporary Edit';
    const edited = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'replace-draft',
      expectedGeneration: 0,
      draft,
    });
    if (!edited.ok) throw new Error(edited.message);
    const selected = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'select-profile',
      expectedGeneration: 1,
      profileId: 'profile-secondary',
    });
    if (!selected.ok) throw new Error(selected.message);
    const reverted = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'revert',
      expectedGeneration: 2,
    });
    expect(reverted).toMatchObject({
      ok: true,
      state: {
        generation: 3,
        selectedProfileId: 'profile-secondary',
        draft: { profiles: [{ name: 'Proxy' }, { name: 'Backup Proxy' }] },
      },
      view: { dirty: false },
    });
  });

  it('rejects invalid selected profiles without changing storage', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const initializer = new Initializer();
    await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'get',
    });
    const result = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'select-profile',
      expectedGeneration: 0,
      profileId: 'missing-profile',
    });
    expect(result).toMatchObject({ ok: false, code: 'invalid' });
    await expect(repository.read()).resolves.toMatchObject({
      generation: 0,
      selectedProfileId: 'profile-primary',
    });
  });

  it('validates message envelopes before they reach the repository', () => {
    expect(
      isProfileWorkflowCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'get',
      }),
    ).toBe(true);
    expect(
      isProfileWorkflowCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'revert',
        expectedGeneration: -1,
      }),
    ).toBe(false);
    expect(isProfileWorkflowCommand({ channel: 'other', action: 'get' })).toBe(false);
    expect(isProfileWorkflowCommand(null)).toBe(false);
  });
});
