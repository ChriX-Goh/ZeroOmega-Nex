import type { ProfileSpec } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  type ProfileWorkflowHistoryService,
  type ProfileWorkflowInitializer,
} from './commands.js';
import type {
  ProfileWorkflowRevisionHistoryEntry,
  ProfileWorkflowSnapshotHistoryEntry,
} from './contracts.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { workflowFixture } from './test-fixture.js';

class Initializer implements ProfileWorkflowInitializer {
  createInitialProfileSpec(): ProfileSpec {
    return workflowFixture();
  }
}

const snapshotEntry: ProfileWorkflowSnapshotHistoryEntry = {
  snapshotId: 'snapshot-history-test',
  createdAt: '2026-07-25T16:00:00.000Z',
  sourceDocumentId: 'document-workflow-fixture',
  sourceRevisionId: 'revision-history-test',
  startRoute: { kind: 'profile', profileId: 'profile-primary' },
  target: 'chromium',
  compilerVersion: '0.1.0',
  capability: 'exact',
  scriptSha256Prefix: 'abcdef123456',
  sourceProfileSpecSha256Prefix: '123456abcdef',
  verification: { passed: true, vectorCount: 8, matchedCount: 8 },
  stats: {
    scriptBytes: 1024,
    profileCount: 2,
    endpointCount: 2,
    conditionCount: 3,
    ruleListRuleCount: 0,
  },
  warnings: [],
  active: true,
  lastKnownGood: true,
};

const revisionEntry: ProfileWorkflowRevisionHistoryEntry = {
  documentId: 'document-workflow-fixture',
  revisionId: 'revision-applied',
  createdAt: '2026-07-25T15:55:00.000Z',
  profileCount: 2,
  endpointCount: 2,
  ruleSourceCount: 0,
  applied: true,
};

function historyService(
  snapshots: readonly ProfileWorkflowSnapshotHistoryEntry[] = [snapshotEntry],
  revisions: readonly ProfileWorkflowRevisionHistoryEntry[] = [revisionEntry],
): ProfileWorkflowHistoryService {
  return {
    listSnapshots: async () => structuredClone(snapshots),
    listRevisions: async () => structuredClone(revisions),
  };
}

describe('profile workflow snapshot history command', () => {
  it('recognizes the read-only snapshot history command', () => {
    expect(
      isProfileWorkflowCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'get-snapshot-history',
      }),
    ).toBe(true);
  });

  it('returns redacted snapshot and revision metadata with the current workflow state', async () => {
    const response = await executeProfileWorkflowCommand(
      new MemoryProfileWorkflowRepository(),
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'get-snapshot-history',
      },
      undefined,
      undefined,
      historyService(),
    );

    expect(response).toMatchObject({
      ok: true,
      view: { appliedRevisionId: 'revision-applied' },
      snapshotHistory: [
        {
          snapshotId: 'snapshot-history-test',
          sourceRevisionId: 'revision-history-test',
          active: true,
          lastKnownGood: true,
        },
      ],
      revisionHistory: [
        {
          revisionId: 'revision-applied',
          applied: true,
        },
      ],
    });
    expect(JSON.stringify(response)).not.toContain('FindProxyForURL');
    if (!response.ok) throw new Error('expected successful history response');
    expect(JSON.stringify(response.revisionHistory)).not.toContain('proxy.example.invalid');
    expect(response.snapshotHistory?.some((entry) => 'script' in entry)).toBe(false);
  });

  it('rejects history queries when the service is unavailable', async () => {
    const response = await executeProfileWorkflowCommand(
      new MemoryProfileWorkflowRepository(),
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'get-snapshot-history',
      },
    );

    expect(response).toMatchObject({
      ok: false,
      code: 'invalid',
      message: 'profile workflow history service is unavailable',
    });
  });

  it('maps history storage corruption to a storage failure', async () => {
    const failing: ProfileWorkflowHistoryService = {
      listSnapshots: async () => {
        throw new Error('snapshot snapshot-missing is indexed but unavailable');
      },
      listRevisions: async () => [],
    };
    const response = await executeProfileWorkflowCommand(
      new MemoryProfileWorkflowRepository(),
      new Initializer(),
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'get-snapshot-history',
      },
      undefined,
      undefined,
      failing,
    );

    expect(response).toMatchObject({
      ok: false,
      code: 'storage-failure',
      message: 'snapshot snapshot-missing is indexed but unavailable',
    });
  });
});
