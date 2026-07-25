import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  executeProfileWorkflowCommand,
  type ProfileWorkflowApplyService,
  type ProfileWorkflowInitializer,
} from './commands.js';
import type { ProfileWorkflowActivationDriver, ProfileWorkflowRuntimeView } from './contracts.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { workflowFixture } from './test-fixture.js';

class Initializer implements ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec {
    return workflowFixture();
  }
}

class QuickSwitchDriver implements ProfileWorkflowActivationDriver {
  readonly activations: Array<{ spec: ProfileSpec; route?: ProfileRouteTarget }> = [];
  runtime: ProfileWorkflowRuntimeView = { activeRoute: { kind: 'direct' } };
  error?: Error;

  async activate(spec: ProfileSpec, route?: ProfileRouteTarget): Promise<{ snapshotId: string }> {
    this.activations.push({
      spec: structuredClone(spec),
      ...(route === undefined ? {} : { route }),
    });
    if (this.error) throw this.error;
    this.runtime = {
      activeRoute: route ?? spec.settings.startup.route,
      activeSnapshotId: 'snapshot-quick-switch',
    };
    return { snapshotId: 'snapshot-quick-switch' };
  }

  async rollback(): Promise<void> {}

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    return structuredClone(this.runtime);
  }
}

function service(driver: QuickSwitchDriver): ProfileWorkflowApplyService {
  return {
    driver,
    createContext: () => ({
      applyId: 'unused-apply',
      revisionId: 'unused-revision',
      startedAt: '2026-07-25T10:00:00.000Z',
      completedAt: '2026-07-25T10:00:01.000Z',
    }),
  };
}

describe('profile workflow quick-switch commands', () => {
  it('returns confirmed runtime state with the applied working copy', async () => {
    const driver = new QuickSwitchDriver();
    const result = await executeProfileWorkflowCommand(
      new MemoryProfileWorkflowRepository(),
      new Initializer(),
      { channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL, action: 'get' },
      service(driver),
    );

    expect(result).toMatchObject({
      ok: true,
      state: { applied: { revision: { id: 'revision-applied' } } },
      runtime: { activeRoute: { kind: 'direct' } },
    });
  });

  it('activates a route from the applied quick-switch list without committing Draft state', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const driver = new QuickSwitchDriver();
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'activate-route',
        expectedAppliedRevisionId: 'revision-applied',
        route: { kind: 'profile', profileId: 'profile-secondary' },
      },
      service(driver),
    );

    expect(result).toMatchObject({
      ok: true,
      appliedSnapshotId: 'snapshot-quick-switch',
      state: { generation: 0, applied: { revision: { id: 'revision-applied' } } },
      runtime: { activeRoute: { kind: 'profile', profileId: 'profile-secondary' } },
    });
    expect(driver.activations).toHaveLength(1);
    expect(driver.activations[0]?.route).toEqual({
      kind: 'profile',
      profileId: 'profile-secondary',
    });
    await expect(repository.read()).resolves.toMatchObject({ generation: 0 });
  });

  it('rejects a stale applied revision before browser activation', async () => {
    const driver = new QuickSwitchDriver();
    const result = await executeProfileWorkflowCommand(
      new MemoryProfileWorkflowRepository(),
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'activate-route',
        expectedAppliedRevisionId: 'stale-revision',
        route: { kind: 'direct' },
      },
      service(driver),
    );

    expect(result).toMatchObject({ ok: false, code: 'conflict' });
    expect(driver.activations).toHaveLength(0);
  });

  it('rejects routes outside the applied quick-switch list', async () => {
    const driver = new QuickSwitchDriver();
    const result = await executeProfileWorkflowCommand(
      new MemoryProfileWorkflowRepository(),
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'activate-route',
        expectedAppliedRevisionId: 'revision-applied',
        route: { kind: 'profile', profileId: 'profile-not-listed' },
      },
      service(driver),
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'invalid',
      message: 'route is not present in the applied quick-switch list',
    });
    expect(driver.activations).toHaveLength(0);
  });

  it('surfaces activation failures without mutating the applied revision', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const driver = new QuickSwitchDriver();
    driver.error = new Error('proxy settings are controlled by another extension');
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'activate-route',
        expectedAppliedRevisionId: 'revision-applied',
        route: { kind: 'system' },
      },
      service(driver),
    );

    expect(result).toMatchObject({
      ok: false,
      code: 'activation-failed',
      message: 'proxy settings are controlled by another extension',
      state: { generation: 0, applied: { revision: { id: 'revision-applied' } } },
    });
    await expect(repository.read()).resolves.toMatchObject({ generation: 0 });
  });
});
