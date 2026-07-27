import { describe, expect, it } from 'vitest';

import {
  MemoryProfileWorkflowRepository,
  createDefaultProfileSpec,
  createProfileWorkflowState,
  type ProfileWorkflowRuleSourceUpdateService,
} from '@zeroomega-nex/profile-workflow';

import {
  RULE_SOURCE_UPDATE_ALARM_NAME,
  RULE_SOURCE_UPDATE_SCAN_PERIOD_MINUTES,
  registerRuleSourceScheduler,
  type RuleSourceSchedulerAlarm,
  type RuleSourceSchedulerApi,
} from './rule-source-scheduler';

class MemorySecretStore {
  async getSecret(): Promise<string | undefined> {
    return undefined;
  }

  async putSecret(): Promise<void> {}

  async removeSecret(): Promise<void> {}
}

class FakeSchedulerApi implements RuleSourceSchedulerApi {
  readonly created: Array<{ name: string; periodInMinutes: number }> = [];
  readonly listeners = new Set<(alarm: RuleSourceSchedulerAlarm) => void>();
  permissionGranted = true;
  permissionOrigins: readonly string[] = [];

  readonly alarms = {
    create: async (name: string, info: { readonly periodInMinutes: number }) => {
      this.created.push({ name, periodInMinutes: info.periodInMinutes });
    },
    onAlarm: {
      addListener: (listener: (alarm: RuleSourceSchedulerAlarm) => void) => {
        this.listeners.add(listener);
      },
      removeListener: (listener: (alarm: RuleSourceSchedulerAlarm) => void) => {
        this.listeners.delete(listener);
      },
    },
  };

  readonly permissions = {
    contains: async ({ origins }: { readonly origins: readonly string[] }) => {
      this.permissionOrigins = origins;
      return this.permissionGranted;
    },
  };

  fire(name: string): void {
    for (const listener of this.listeners) listener({ name });
  }
}

function scheduledState() {
  const spec = createDefaultProfileSpec({
    documentId: 'document-scheduler',
    revisionId: 'revision-scheduler',
    createdAt: '2026-07-27T00:00:00.000Z',
    deviceId: 'device-scheduler',
  });
  spec.settings.ruleSourceUpdateIntervalMinutes = 60;
  spec.ruleSources.push({
    id: 'source-scheduled',
    name: 'Scheduled rules',
    format: 'autoproxy',
    location: {
      kind: 'url',
      url: 'https://rules.example.invalid/scheduled.txt',
      content: 'old scheduled cache',
    },
  });
  return createProfileWorkflowState(spec);
}

function updateService(downloads: string[]): ProfileWorkflowRuleSourceUpdateService {
  return {
    secretStore: new MemorySecretStore(),
    downloader: {
      async download(request) {
        downloads.push(request.url);
        return { content: `scheduled content ${downloads.length}`, bytes: 19 };
      },
    },
    now: () => '2026-07-27T06:00:00.000Z',
  };
}

describe('Rule Source scheduler', () => {
  it('registers one periodic alarm and refreshes due sources on startup', async () => {
    const repository = new MemoryProfileWorkflowRepository(scheduledState());
    const api = new FakeSchedulerApi();
    const downloads: string[] = [];
    const scheduler = registerRuleSourceScheduler(api, {
      repository,
      updateService: updateService(downloads),
      now: () => '2026-07-27T06:00:00.000Z',
    });

    await expect(scheduler.initialScan).resolves.toEqual({
      considered: 1,
      updated: 1,
      failed: 0,
      conflicted: 0,
      skippedPermission: 0,
    });
    expect(api.created).toEqual([
      {
        name: RULE_SOURCE_UPDATE_ALARM_NAME,
        periodInMinutes: RULE_SOURCE_UPDATE_SCAN_PERIOD_MINUTES,
      },
    ]);
    expect(api.permissionOrigins).toEqual(['https://rules.example.invalid/*']);
    expect(downloads).toEqual(['https://rules.example.invalid/scheduled.txt']);
    expect((await repository.read())?.draft.ruleSources[0]?.location).toEqual({
      kind: 'url',
      url: 'https://rules.example.invalid/scheduled.txt',
      content: 'scheduled content 1',
    });

    scheduler.dispose();
    expect(api.listeners.size).toBe(0);
  });

  it('does not request missing permissions or mutate the workflow', async () => {
    const initial = scheduledState();
    const repository = new MemoryProfileWorkflowRepository(initial);
    const api = new FakeSchedulerApi();
    api.permissionGranted = false;
    const downloads: string[] = [];
    const scheduler = registerRuleSourceScheduler(api, {
      repository,
      updateService: updateService(downloads),
      now: () => '2026-07-27T06:00:00.000Z',
    });

    await expect(scheduler.initialScan).resolves.toMatchObject({
      considered: 1,
      skippedPermission: 1,
      updated: 0,
    });
    expect(downloads).toEqual([]);
    expect(await repository.read()).toEqual(initial);
    scheduler.dispose();
  });

  it('uses lastAttemptAt to avoid retrying a failed source every minute', async () => {
    const initial = {
      ...scheduledState(),
      ruleSourceUpdates: {
        'source-scheduled': {
          sourceId: 'source-scheduled',
          url: 'https://rules.example.invalid/scheduled.txt',
          lastAttemptAt: '2026-07-27T05:30:00.000Z',
          lastError: { occurredAt: '2026-07-27T05:30:00.000Z', message: 'offline' },
        },
      },
    };
    const repository = new MemoryProfileWorkflowRepository(initial);
    const api = new FakeSchedulerApi();
    const downloads: string[] = [];
    const scheduler = registerRuleSourceScheduler(api, {
      repository,
      updateService: updateService(downloads),
      now: () => '2026-07-27T06:00:00.000Z',
    });

    await expect(scheduler.initialScan).resolves.toMatchObject({ considered: 0, updated: 0 });
    expect(downloads).toEqual([]);
    scheduler.dispose();
  });

  it('coalesces overlapping startup and alarm scans', async () => {
    const repository = new MemoryProfileWorkflowRepository(scheduledState());
    const api = new FakeSchedulerApi();
    let release: (() => void) | undefined;
    let calls = 0;
    const service: ProfileWorkflowRuleSourceUpdateService = {
      secretStore: new MemorySecretStore(),
      downloader: {
        async download() {
          calls += 1;
          await new Promise<void>((resolve) => {
            release = resolve;
          });
          return { content: 'coalesced content', bytes: 17 };
        },
      },
    };
    const scheduler = registerRuleSourceScheduler(api, { repository, updateService: service });
    const second = scheduler.scanNow();
    api.fire(RULE_SOURCE_UPDATE_ALARM_NAME);
    expect(calls).toBe(1);
    release?.();
    await Promise.all([scheduler.initialScan, second]);
    expect(calls).toBe(1);
    scheduler.dispose();
  });
});
