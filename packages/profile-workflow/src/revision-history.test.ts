import { cloneProfileSpec, type ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import type { ProfileWorkflowRevisionRepository } from './contracts.js';
import { listProfileWorkflowRevisionHistory } from './revision-history.js';
import { createProfileWorkflowState } from './state.js';
import { workflowFixture } from './test-fixture.js';

function revision(id: string, createdAt: string, parentId?: string): ProfileSpec {
  const spec = cloneProfileSpec(workflowFixture());
  spec.revision = {
    id,
    createdAt,
    ...(parentId === undefined ? {} : { parentId }),
  };
  return spec;
}

function repository(revisions: readonly ProfileSpec[]): ProfileWorkflowRevisionRepository {
  return {
    getRevision: async (revisionId) =>
      structuredClone(revisions.find((spec) => spec.revision.id === revisionId)),
    listRevisions: async () => structuredClone(revisions),
  };
}

describe('ProfileSpec revision history', () => {
  it('returns newest-first metadata and marks the applied revision', async () => {
    const applied = revision('revision-new', '2026-07-25T16:20:00.000Z', 'revision-old');
    const state = createProfileWorkflowState(applied);
    const entries = await listProfileWorkflowRevisionHistory(
      repository([revision('revision-old', '2026-07-25T15:20:00.000Z'), applied]),
      state,
    );

    expect(entries).toEqual([
      {
        documentId: applied.documentId,
        revisionId: 'revision-new',
        parentRevisionId: 'revision-old',
        createdAt: '2026-07-25T16:20:00.000Z',
        profileCount: 2,
        endpointCount: 2,
        ruleSourceCount: 0,
        applied: true,
      },
      {
        documentId: applied.documentId,
        revisionId: 'revision-old',
        createdAt: '2026-07-25T15:20:00.000Z',
        profileCount: 2,
        endpointCount: 2,
        ruleSourceCount: 0,
        applied: false,
      },
    ]);
    expect(JSON.stringify(entries)).not.toContain('proxy.example.invalid');
  });

  it('isolates the current document while retaining foreign revision archives', async () => {
    const current = revision('revision-current', '2026-07-25T17:20:00.000Z');
    const state = createProfileWorkflowState(current);
    const foreign = revision('revision-foreign', '2026-07-25T16:20:00.000Z', 'revision-foreign');
    foreign.documentId = 'document-foreign';

    await expect(
      listProfileWorkflowRevisionHistory(repository([foreign, current]), state),
    ).resolves.toEqual([
      {
        documentId: current.documentId,
        revisionId: 'revision-current',
        createdAt: '2026-07-25T17:20:00.000Z',
        profileCount: 2,
        endpointCount: 2,
        ruleSourceCount: 0,
        applied: true,
      },
    ]);
  });

  it('rejects duplicate revision IDs', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const duplicate = revision('revision-duplicate', '2026-07-25T16:20:00.000Z');

    await expect(
      listProfileWorkflowRevisionHistory(
        repository([duplicate, structuredClone(duplicate)]),
        state,
      ),
    ).rejects.toThrow('revision history contains duplicate ID revision-duplicate');
  });

  it('rejects invalid timestamps and self-parenting revisions', async () => {
    const state = createProfileWorkflowState(workflowFixture());

    await expect(
      listProfileWorkflowRevisionHistory(
        repository([revision('revision-invalid-time', 'not-a-date')]),
        state,
      ),
    ).rejects.toThrow('revision revision-invalid-time has an invalid creation time');

    await expect(
      listProfileWorkflowRevisionHistory(
        repository([
          revision('revision-self-parent', '2026-07-25T16:20:00.000Z', 'revision-self-parent'),
        ]),
        state,
      ),
    ).rejects.toThrow('revision revision-self-parent cannot be its own parent');
  });
});
