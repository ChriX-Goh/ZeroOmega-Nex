import {
  cloneProfileSpec,
  type ProfileRouteTarget,
  type ProfileSpec,
} from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  executeProfileWorkflowCommand,
  type ProfileWorkflowApplyService,
  type ProfileWorkflowInitializer,
} from './commands.js';
import type { ProfileWorkflowActivationDriver, ProfileWorkflowRuntimeView } from './contracts.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { createProfileWorkflowState, replaceProfileWorkflowDraft } from './state.js';
import { workflowFixture } from './test-fixture.js';

function resultSpec(): ProfileSpec {
  const spec = workflowFixture();
  spec.profiles.push(
    {
      id: 'profile-switch',
      name: 'Auto Switch',
      kind: 'switch',
      defaultRoute: { kind: 'direct' },
      rules: [],
    },
    {
      id: 'profile-virtual',
      name: 'Virtual route',
      kind: 'virtual',
      targetRoute: { kind: 'direct' },
    },
  );
  return spec;
}

class Initializer implements ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec {
    return resultSpec();
  }
}

class ResultDriver implements ProfileWorkflowActivationDriver {
  readonly activated: Array<{ spec: ProfileSpec; route?: ProfileRouteTarget }> = [];
  activeRoute: ProfileRouteTarget = { kind: 'profile', profileId: 'profile-switch' };

  async activate(
    candidate: ProfileSpec,
    route?: ProfileRouteTarget,
  ): Promise<{ snapshotId: string }> {
    this.activated.push({
      spec: cloneProfileSpec(candidate),
      ...(route ? { route: structuredClone(route) } : {}),
    });
    return { snapshotId: 'snapshot-popup-result' };
  }

  async rollback(): Promise<void> {}

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    return { activeRoute: structuredClone(this.activeRoute) };
  }
}

function service(driver: ResultDriver): ProfileWorkflowApplyService {
  return {
    driver,
    createContext: () => ({
      applyId: 'apply-popup-result',
      revisionId: 'revision-popup-result',
      startedAt: '2026-07-27T08:00:00.000Z',
      completedAt: '2026-07-27T08:00:01.000Z',
      deviceId: 'device-popup-result',
    }),
  };
}

const command = {
  channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  action: 'set-popup-profile-result',
  expectedAppliedRevisionId: 'revision-applied',
  profileId: 'profile-switch',
  route: { kind: 'profile', profileId: 'profile-secondary' },
} as const;

describe('Popup result-profile command', () => {
  it('changes a Switch default, applies, and preserves the active route', async () => {
    const repository = new MemoryProfileWorkflowRepository(
      createProfileWorkflowState(resultSpec()),
    );
    const driver = new ResultDriver();
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      command,
      service(driver),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    const profile = result.state.applied.profiles.find(
      (candidate) => candidate.id === 'profile-switch',
    );
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch Profile');
    expect(profile.defaultRoute).toEqual({ kind: 'profile', profileId: 'profile-secondary' });
    expect(result.view.dirty).toBe(false);
    expect(driver.activated[0]?.route).toEqual({ kind: 'profile', profileId: 'profile-switch' });
  });

  it('changes a Virtual target through the same verified transaction', async () => {
    const repository = new MemoryProfileWorkflowRepository(
      createProfileWorkflowState(resultSpec()),
    );
    const driver = new ResultDriver();
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        ...command,
        profileId: 'profile-virtual',
        route: { kind: 'profile', profileId: 'profile-primary' },
      },
      service(driver),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    const profile = result.state.applied.profiles.find(
      (candidate) => candidate.id === 'profile-virtual',
    );
    if (!profile || profile.kind !== 'virtual') throw new Error('missing Virtual Profile');
    expect(profile.targetRoute).toEqual({ kind: 'profile', profileId: 'profile-primary' });
  });

  it('does not overwrite unapplied Options work', async () => {
    const initial = createProfileWorkflowState(resultSpec());
    const draft = cloneProfileSpec(initial.draft);
    draft.profiles[0]!.name = 'Unapplied work';
    const repository = new MemoryProfileWorkflowRepository(
      replaceProfileWorkflowDraft(initial, draft),
    );
    await expect(
      executeProfileWorkflowCommand(
        repository,
        new Initializer(),
        command,
        service(new ResultDriver()),
      ),
    ).resolves.toMatchObject({
      ok: false,
      code: 'invalid',
      message: expect.stringContaining('Apply or discard Options changes'),
      view: { dirty: true },
    });
  });
});
