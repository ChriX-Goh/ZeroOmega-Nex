import { describe, expect, it } from 'vitest';

import type { ProfileRouteTarget } from '@zeroomega-nex/profile-spec';

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

function driver(
  activeRoute: ProfileRouteTarget = { kind: 'system' },
): ProfileWorkflowActivationDriver & {
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
    const imported = response.state.applied.profiles.find(
      (profile) => profile.name === 'External Proxy',
    );
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
      {
        driver: driver(),
        createContext: () => ({
          applyId: 'a',
          revisionId: 'r',
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
      {
        driver: driver({ kind: 'direct' }),
        createContext: () => ({
          applyId: 'a',
          revisionId: 'r',
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
    expect(wrongRoute).toMatchObject({ ok: false, code: 'invalid' });
  });
});
