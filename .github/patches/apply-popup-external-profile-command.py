from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


replace_once(
    'packages/profile-workflow/src/commands.ts',
    """import type {
  ProfileWorkflowActivationDriver,
""",
    """import {
  createExternalProfileDraft,
  type ProfileWorkflowExternalProfileService,
} from './external-profile.js';
import type {
  ProfileWorkflowActivationDriver,
""",
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    """  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'add-current-site-condition';
      readonly expectedAppliedRevisionId: string;
      readonly switchProfileId: string;
      readonly ruleId: string;
      readonly condition: PopupSiteCondition;
      readonly route: ProfileRouteTarget;
    };
""",
    """  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'add-current-site-condition';
      readonly expectedAppliedRevisionId: string;
      readonly switchProfileId: string;
      readonly ruleId: string;
      readonly condition: PopupSiteCondition;
      readonly route: ProfileRouteTarget;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'import-external-profile';
      readonly expectedAppliedRevisionId: string;
      readonly name: string;
    };
""",
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    """    case 'add-current-site-condition':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        typeof record.switchProfileId === 'string' &&
        record.switchProfileId.length > 0 &&
        typeof record.ruleId === 'string' &&
        record.ruleId.length > 0 &&
        validPopupCondition(record.condition) &&
        validRoute(record.route)
      );
""",
    """    case 'add-current-site-condition':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        typeof record.switchProfileId === 'string' &&
        record.switchProfileId.length > 0 &&
        typeof record.ruleId === 'string' &&
        record.ruleId.length > 0 &&
        validPopupCondition(record.condition) &&
        validRoute(record.route)
      );
    case 'import-external-profile':
      return (
        typeof record.expectedAppliedRevisionId === 'string' &&
        record.expectedAppliedRevisionId.length > 0 &&
        typeof record.name === 'string'
      );
""",
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    """  rollbackService?: ProfileWorkflowSnapshotRollbackService,
  ruleSourceUpdateService?: ProfileWorkflowRuleSourceUpdateService,
): Promise<ProfileWorkflowCommandResponse> {
""",
    """  rollbackService?: ProfileWorkflowSnapshotRollbackService,
  ruleSourceUpdateService?: ProfileWorkflowRuleSourceUpdateService,
  externalProfileService?: ProfileWorkflowExternalProfileService,
): Promise<ProfileWorkflowCommandResponse> {
""",
)
insert_point = """  if (command.action === 'activate-route') {
"""
branch = r'''  if (command.action === 'import-external-profile') {
    if (state.applied.revision.id !== command.expectedAppliedRevisionId) {
      return failure(
        'conflict',
        `expected applied revision ${command.expectedAppliedRevisionId}, current revision is ${state.applied.revision.id}`,
        state,
      );
    }
    if (state.pendingApply) {
      return failure('busy', 'profile workflow is busy applying another revision', state);
    }
    if (!applyService || !externalProfileService) {
      return failure('invalid', 'external profile import service is unavailable', state);
    }
    if (inspectProfileWorkflow(state).dirty) {
      return failure(
        'invalid',
        'Apply or discard Options changes before importing an external profile from Popup',
        state,
      );
    }
    const runtime = await runtimeView(applyService);
    if (runtime?.activeRoute?.kind !== 'system') {
      return failure(
        'invalid',
        'external profiles can only be imported while System Proxy is the active route',
        state,
      );
    }

    let mutation;
    try {
      const candidate = await externalProfileService.readCandidate(state.applied);
      if (!candidate) {
        return failure('invalid', 'the current browser proxy configuration cannot be imported', state);
      }
      mutation = createExternalProfileDraft(
        state.applied,
        candidate,
        command.name,
        externalProfileService.createId,
      );
    } catch (error) {
      return failure('invalid', errorMessage(error), state);
    }

    const route: ProfileRouteTarget = { kind: 'profile', profileId: mutation.profileId };
    if (!mutation.created) {
      try {
        const activated = await applyService.driver.activate(state.applied, route);
        return response(state, activated.snapshotId, await runtimeView(applyService));
      } catch (error) {
        return failure('activation-failed', errorMessage(error), state);
      }
    }

    let edited: ProfileWorkflowState;
    try {
      edited = replaceProfileWorkflowDraft(state, mutation.draft);
      if (!(await repository.compareAndSwap(state.generation, edited))) {
        const current = await repository.read();
        return failure(
          'conflict',
          'profile workflow changed before the external profile could be persisted',
          current,
        );
      }
    } catch (error) {
      return failure('storage-failure', errorMessage(error), state);
    }

    const result = await applyProfileWorkflow(repository, applyService.driver, {
      ...applyService.createContext(edited),
      startRoute: route,
    });
    if (result.status === 'applied') {
      return response(result.state, result.snapshotId, await runtimeView(applyService));
    }
    return failure(
      result.status === 'busy'
        ? 'busy'
        : result.status === 'conflict'
          ? 'conflict'
          : result.status === 'failed'
            ? 'apply-failed'
            : 'invalid',
      result.message,
      result.state,
    );
  }

'''
replace_once(
    'packages/profile-workflow/src/commands.ts',
    insert_point,
    branch + insert_point,
)

Path('packages/profile-workflow/src/external-profile-command.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import type { ProfileWorkflowActivationDriver } from './contracts.js';
import { executeProfileWorkflowCommand } from './commands.js';
import type { ProfileWorkflowExternalProfileService } from './external-profile.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { createProfileWorkflowState } from './state.js';
import { workflowFixture } from './test-fixture.js';

function service(): ProfileWorkflowExternalProfileService {
  let index = 0;
  return {
    readCandidate: async () => ({
      kind: 'fixed',
      proxyByScheme: {
        fallback: { protocol: 'http', host: 'external.example', port: 8080 },
      },
      bypass: ['<local>'],
    }),
    createId: (kind) => `${kind}-external-${++index}`,
  };
}

function driver(activeRoute = { kind: 'system' } as const): ProfileWorkflowActivationDriver & {
  readonly routes: unknown[];
} {
  const routes: unknown[] = [];
  return {
    routes,
    async activate(_candidate, route) {
      routes.push(route);
      return { snapshotId: `snapshot-${routes.length}` };
    },
    async rollback() {},
    async inspectRuntime() {
      return { activeRoute };
    },
  };
}

describe('external profile Popup command', () => {
  it('atomically imports, applies, and activates a Fixed profile', async () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const repository = new MemoryProfileWorkflowRepository(initial);
    const activation = driver();
    const response = await executeProfileWorkflowCommand(
      repository,
      { createInitialProfileSpec: workflowFixture },
      {
        channel: 'zeroomega-nex/profile-workflow/v1',
        action: 'import-external-profile',
        expectedAppliedRevisionId: initial.applied.revision.id,
        name: 'External Proxy',
      },
      {
        driver: activation,
        createContext: () => ({
          applyId: 'apply-external',
          revisionId: 'revision-external',
          startedAt: '2026-07-27T16:00:00.000Z',
          completedAt: '2026-07-27T16:00:01.000Z',
        }),
      },
      undefined,
      undefined,
      undefined,
      undefined,
      service(),
    );
    expect(response.ok).toBe(true);
    if (!response.ok) return;
    const imported = response.state.applied.profiles.find((profile) => profile.name === 'External Proxy');
    expect(imported?.kind).toBe('fixed');
    expect(response.state.draft.revision.id).toBe(response.state.applied.revision.id);
    expect(activation.routes.at(-1)).toEqual({ kind: 'profile', profileId: imported?.id });
  });

  it('rejects dirty Draft and non-System active routes', async () => {
    const initial = createProfileWorkflowState(workflowFixture());
    initial.draft.profiles[0]!.name = 'Dirty';
    const dirty = await executeProfileWorkflowCommand(
      new MemoryProfileWorkflowRepository(initial),
      { createInitialProfileSpec: workflowFixture },
      {
        channel: 'zeroomega-nex/profile-workflow/v1',
        action: 'import-external-profile',
        expectedAppliedRevisionId: initial.applied.revision.id,
        name: 'External Proxy',
      },
      { driver: driver(), createContext: () => ({ applyId: 'a', revisionId: 'r', startedAt: '2026-07-27T16:00:00.000Z', completedAt: '2026-07-27T16:00:01.000Z' }) },
      undefined,
      undefined,
      undefined,
      undefined,
      service(),
    );
    expect(dirty).toMatchObject({ ok: false, code: 'invalid' });

    const clean = createProfileWorkflowState(workflowFixture());
    const wrongRoute = await executeProfileWorkflowCommand(
      new MemoryProfileWorkflowRepository(clean),
      { createInitialProfileSpec: workflowFixture },
      {
        channel: 'zeroomega-nex/profile-workflow/v1',
        action: 'import-external-profile',
        expectedAppliedRevisionId: clean.applied.revision.id,
        name: 'External Proxy',
      },
      { driver: driver({ kind: 'direct' }), createContext: () => ({ applyId: 'a', revisionId: 'r', startedAt: '2026-07-27T16:00:00.000Z', completedAt: '2026-07-27T16:00:01.000Z' }) },
      undefined,
      undefined,
      undefined,
      undefined,
      service(),
    );
    expect(wrongRoute).toMatchObject({ ok: false, code: 'invalid' });
  });
});
''')
