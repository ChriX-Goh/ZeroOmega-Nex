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

function popupSpec(): ProfileSpec {
  const spec = workflowFixture();
  spec.settings.interface.addConditionsToBottom = false;
  spec.profiles.push({
    id: 'profile-switch',
    name: 'Auto Switch',
    kind: 'switch',
    defaultRoute: { kind: 'direct' },
    rules: [
      {
        id: 'rule-existing',
        condition: { kind: 'host-wildcard', pattern: '*.existing.example' },
        route: { kind: 'profile', profileId: 'profile-primary' },
      },
    ],
  });
  spec.settings.startup.route = { kind: 'profile', profileId: 'profile-switch' };
  return spec;
}

class Initializer implements ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec {
    return popupSpec();
  }
}

class PopupDriver implements ProfileWorkflowActivationDriver {
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
    return { snapshotId: 'snapshot-popup-condition' };
  }

  async rollback(): Promise<void> {}

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    return { activeRoute: structuredClone(this.activeRoute) };
  }
}

function service(driver: PopupDriver): ProfileWorkflowApplyService {
  return {
    driver,
    createContext: () => ({
      applyId: 'apply-popup-condition',
      revisionId: 'revision-popup-condition',
      startedAt: '2026-07-27T07:00:00.000Z',
      completedAt: '2026-07-27T07:00:01.000Z',
      deviceId: 'device-popup',
    }),
  };
}

const command = {
  channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  action: 'add-current-site-condition',
  expectedAppliedRevisionId: 'revision-applied',
  switchProfileId: 'profile-switch',
  ruleId: 'rule-popup',
  condition: { kind: 'host-wildcard', pattern: '*.example.co.uk' },
  route: { kind: 'profile', profileId: 'profile-secondary' },
} as const;

describe('Popup current-site command', () => {
  it('adds, verifies, applies, and keeps the active Switch route', async () => {
    const repository = new MemoryProfileWorkflowRepository(createProfileWorkflowState(popupSpec()));
    const driver = new PopupDriver();
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      command,
      service(driver),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.view.dirty).toBe(false);
    expect(result.state.applied.revision.id).toBe('revision-popup-condition');
    const profile = result.state.applied.profiles.find(
      (candidate) => candidate.id === 'profile-switch',
    );
    if (!profile || profile.kind !== 'switch') throw new Error('missing Switch Profile');
    expect(profile.rules[0]).toMatchObject({
      id: 'rule-popup',
      condition: { kind: 'host-wildcard', pattern: '*.example.co.uk' },
      route: { kind: 'profile', profileId: 'profile-secondary' },
    });
    expect(driver.activated[0]?.route).toEqual({ kind: 'profile', profileId: 'profile-switch' });
  });

  it('rejects Popup persistence while Options has unapplied Draft work', async () => {
    const initial = createProfileWorkflowState(popupSpec());
    const draft = cloneProfileSpec(initial.draft);
    draft.profiles[0]!.name = 'Unapplied Options edit';
    const dirty = replaceProfileWorkflowDraft(initial, draft);
    const repository = new MemoryProfileWorkflowRepository(dirty);
    const result = await executeProfileWorkflowCommand(
      repository,
      new Initializer(),
      command,
      service(new PopupDriver()),
    );
    expect(result).toMatchObject({
      ok: false,
      code: 'invalid',
      message: expect.stringContaining('Apply or discard Options changes'),
      view: { dirty: true },
    });
  });

  it('rejects direct, Virtual, or stale active-profile claims', async () => {
    const repository = new MemoryProfileWorkflowRepository(createProfileWorkflowState(popupSpec()));
    const driver = new PopupDriver();
    driver.activeRoute = { kind: 'direct' };
    await expect(
      executeProfileWorkflowCommand(repository, new Initializer(), command, service(driver)),
    ).resolves.toMatchObject({
      ok: false,
      code: 'invalid',
      message: expect.stringContaining('active Switch Profile'),
    });
  });
});
