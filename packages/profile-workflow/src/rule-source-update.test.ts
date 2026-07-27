import { describe, expect, it } from 'vitest';

import type { ProfileWorkflowRuleSourceDownloader } from './rule-source-update.js';
import {
  inspectProfileWorkflowRuleSourceUpdate,
  updateProfileWorkflowRuleSource,
} from './rule-source-update.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { createProfileWorkflowState, updateProfileWorkflowDraft } from './state.js';
import { workflowFixture } from './test-fixture.js';

class MemorySecretStore {
  readonly values = new Map<string, string>();

  async getSecret(ref: string): Promise<string | undefined> {
    return this.values.get(ref);
  }

  async putSecret(ref: string, value: string): Promise<void> {
    this.values.set(ref, value);
  }

  async removeSecret(ref: string): Promise<void> {
    this.values.delete(ref);
  }
}

function sourceState() {
  const spec = workflowFixture();
  spec.ruleSources.push({
    id: 'source-rules',
    name: 'Remote rules',
    format: 'autoproxy',
    location: {
      kind: 'url',
      url: 'https://rules.example.invalid/list.txt',
      content: 'old cached content',
    },
    headers: [
      { name: 'X-Literal', value: { kind: 'literal', value: 'literal-value' } },
      { name: 'Authorization', value: { kind: 'secret', secretRef: 'secret-rule-auth' } },
    ],
    updateIntervalMinutes: 60,
  });
  return createProfileWorkflowState(spec);
}

function downloader(
  run: ProfileWorkflowRuleSourceDownloader['download'],
): ProfileWorkflowRuleSourceDownloader {
  return { download: run };
}

describe('Rule Source background update service', () => {
  it('resolves secret headers and atomically replaces cached content', async () => {
    const initial = sourceState();
    const repository = new MemoryProfileWorkflowRepository(initial);
    const secrets = new MemorySecretStore();
    secrets.values.set('secret-rule-auth', 'Bearer secret-value');
    const requests: unknown[] = [];

    const result = await updateProfileWorkflowRuleSource(
      repository,
      initial,
      'source-rules',
      {
        secretStore: secrets,
        now: () => '2026-07-27T03:00:00.000Z',
        downloader: downloader(async (request) => {
          requests.push(request);
          return { content: '[AutoProxy 0.2.9]\n||updated.example', bytes: 39 };
        }),
      },
    );

    expect(result.status).toBe('updated');
    if (result.status !== 'updated') throw new Error(result.message);
    expect(requests).toEqual([
      {
        url: 'https://rules.example.invalid/list.txt',
        headers: {
          'X-Literal': 'literal-value',
          Authorization: 'Bearer secret-value',
        },
        timeoutMs: 10_000,
        maxBytes: 4 * 1024 * 1024,
      },
    ]);
    expect(result.state.generation).toBe(initial.generation + 1);
    expect(result.state.draft.ruleSources[0]?.location).toEqual({
      kind: 'url',
      url: 'https://rules.example.invalid/list.txt',
      content: '[AutoProxy 0.2.9]\n||updated.example',
    });
    expect(result.state.applied.ruleSources[0]?.location).toEqual({
      kind: 'url',
      url: 'https://rules.example.invalid/list.txt',
      content: 'old cached content',
    });
    expect(result.update).toMatchObject({
      stale: false,
      lastAttemptAt: '2026-07-27T03:00:00.000Z',
      lastSuccessAt: '2026-07-27T03:00:00.000Z',
      lastBytes: 39,
    });
  });

  it('records a bounded failure while preserving the previous cache', async () => {
    const initial = sourceState();
    const repository = new MemoryProfileWorkflowRepository(initial);
    const secrets = new MemorySecretStore();
    secrets.values.set('secret-rule-auth', 'Bearer secret-value');

    const result = await updateProfileWorkflowRuleSource(
      repository,
      initial,
      'source-rules',
      {
        secretStore: secrets,
        now: () => '2026-07-27T04:00:00.000Z',
        downloader: downloader(async () => {
          throw new Error(`network failed ${'x'.repeat(800)}`);
        }),
      },
    );

    expect(result.status).toBe('failed');
    if (result.status !== 'failed' || !result.state) throw new Error('expected failed state');
    const location = result.state.draft.ruleSources[0]?.location;
    expect(location).toEqual({
      kind: 'url',
      url: 'https://rules.example.invalid/list.txt',
      content: 'old cached content',
    });
    expect(result.message.length).toBeLessThanOrEqual(500);
    expect(result.update?.lastError?.message).toBe(result.message);
  });

  it('does not overwrite a concurrent edit made while downloading', async () => {
    const initial = sourceState();
    const repository = new MemoryProfileWorkflowRepository(initial);
    const secrets = new MemorySecretStore();
    secrets.values.set('secret-rule-auth', 'Bearer secret-value');

    const result = await updateProfileWorkflowRuleSource(
      repository,
      initial,
      'source-rules',
      {
        secretStore: secrets,
        downloader: downloader(async () => {
          const current = await repository.read();
          if (!current) throw new Error('missing workflow state');
          const edited = updateProfileWorkflowDraft(current, (draft) => {
            const source = draft.ruleSources[0];
            if (source?.location.kind === 'url') source.location.url = 'https://changed.invalid/list';
          });
          repository.replaceForTest(edited);
          return { content: 'downloaded after edit', bytes: 21 };
        }),
      },
    );

    expect(result.status).toBe('conflict');
    const persisted = await repository.read();
    expect(persisted?.draft.ruleSources[0]?.location).toEqual({
      kind: 'url',
      url: 'https://changed.invalid/list',
      content: 'old cached content',
    });
  });

  it('rejects browser-controlled headers before any request is sent', async () => {
    const initial = sourceState();
    const source = initial.draft.ruleSources[0];
    if (!source) throw new Error('missing source');
    source.headers = [{ name: 'Cookie', value: { kind: 'secret', secretRef: 'cookie-secret' } }];
    const repository = new MemoryProfileWorkflowRepository(initial);
    const secrets = new MemorySecretStore();
    secrets.values.set('cookie-secret', 'private-cookie');
    let called = false;

    const result = await updateProfileWorkflowRuleSource(
      repository,
      initial,
      'source-rules',
      {
        secretStore: secrets,
        downloader: downloader(async () => {
          called = true;
          return { content: 'not reached', bytes: 11 };
        }),
      },
    );

    expect(result.status).toBe('invalid');
    expect(result.message).toContain('controlled by the browser');
    expect(called).toBe(false);
  });

  it('computes stale state from the source interval without putting status in ProfileSpec', () => {
    const initial = sourceState();
    const withStatus = {
      ...initial,
      ruleSourceUpdates: {
        'source-rules': {
          sourceId: 'source-rules',
          url: 'https://rules.example.invalid/list.txt',
          lastAttemptAt: '2026-07-27T03:00:00.000Z',
          lastSuccessAt: '2026-07-27T03:00:00.000Z',
          lastBytes: 100,
        },
      },
    };

    expect(
      inspectProfileWorkflowRuleSourceUpdate(
        withStatus,
        'source-rules',
        '2026-07-27T03:59:59.000Z',
      )?.stale,
    ).toBe(false);
    expect(
      inspectProfileWorkflowRuleSourceUpdate(
        withStatus,
        'source-rules',
        '2026-07-27T04:00:00.000Z',
      )?.stale,
    ).toBe(true);
    expect('ruleSourceUpdates' in withStatus.draft).toBe(false);
  });
});
