import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_MESSAGE_CHANNEL,
  executeProfileWorkflowCommand,
  isProfileWorkflowCommand,
  type ProfileWorkflowInitializer,
} from './commands.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import type { ProfileWorkflowRuleSourceUpdateService } from './rule-source-update.js';
import { workflowFixture } from './test-fixture.js';

class Initializer implements ProfileWorkflowInitializer {
  createInitialProfileSpec() {
    const spec = workflowFixture();
    spec.ruleSources.push({
      id: 'source-command',
      name: 'Command rules',
      format: 'autoproxy',
      location: { kind: 'url', url: 'https://rules.example.invalid/command.txt' },
    });
    return spec;
  }
}

const service: ProfileWorkflowRuleSourceUpdateService = {
  secretStore: {
    async getSecret() {
      return undefined;
    },
    async putSecret() {},
    async removeSecret() {},
  },
  downloader: {
    async download() {
      return { content: '[AutoProxy 0.2.9]\n||command.example', bytes: 37 };
    },
  },
  now: () => '2026-07-27T05:00:00.000Z',
};

describe('Rule Source update commands', () => {
  it('recognizes status and update commands', () => {
    expect(
      isProfileWorkflowCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'get-rule-source-update-status',
        sourceId: 'source-command',
      }),
    ).toBe(true);
    expect(
      isProfileWorkflowCommand({
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'update-rule-source',
        expectedGeneration: 0,
        sourceId: 'source-command',
      }),
    ).toBe(true);
  });

  it('returns persisted status and the updated Draft through typed responses', async () => {
    const repository = new MemoryProfileWorkflowRepository();
    const initializer = new Initializer();
    const initial = await executeProfileWorkflowCommand(repository, initializer, {
      channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
      action: 'get',
    });
    if (!initial.ok) throw new Error(initial.message);

    const never = await executeProfileWorkflowCommand(
      repository,
      initializer,
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'get-rule-source-update-status',
        sourceId: 'source-command',
      },
      undefined,
      undefined,
      undefined,
      undefined,
      service,
    );
    expect(never).toMatchObject({
      ok: true,
      ruleSourceUpdate: { stale: true, url: 'https://rules.example.invalid/command.txt' },
    });

    const updated = await executeProfileWorkflowCommand(
      repository,
      initializer,
      {
        channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL,
        action: 'update-rule-source',
        expectedGeneration: initial.state.generation,
        sourceId: 'source-command',
      },
      undefined,
      undefined,
      undefined,
      undefined,
      service,
    );
    expect(updated).toMatchObject({
      ok: true,
      state: { generation: 1 },
      ruleSourceUpdate: {
        stale: false,
        lastSuccessAt: '2026-07-27T05:00:00.000Z',
      },
    });
    if (!updated.ok) throw new Error(updated.message);
    expect(updated.state.draft.ruleSources[0]?.location).toEqual({
      kind: 'url',
      url: 'https://rules.example.invalid/command.txt',
      content: '[AutoProxy 0.2.9]\n||command.example',
    });
  });
});
