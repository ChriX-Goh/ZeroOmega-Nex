import {
  listDueProfileWorkflowRuleSourceUpdates,
  updateProfileWorkflowRuleSource,
  type ProfileWorkflowRepository,
  type ProfileWorkflowRuleSourceUpdateService,
} from '@zeroomega-nex/profile-workflow';

export const RULE_SOURCE_UPDATE_ALARM_NAME = 'zeroomega-nex/rule-source-update-scan';
export const RULE_SOURCE_UPDATE_SCAN_PERIOD_MINUTES = 1;

export interface RuleSourceSchedulerAlarm {
  readonly name: string;
}

export interface RuleSourceSchedulerAlarmEvent {
  addListener(listener: (alarm: RuleSourceSchedulerAlarm) => void): void;
  removeListener(listener: (alarm: RuleSourceSchedulerAlarm) => void): void;
}

export interface RuleSourceSchedulerApi {
  readonly alarms: {
    create(name: string, alarmInfo: { readonly periodInMinutes: number }): Promise<void> | void;
    readonly onAlarm: RuleSourceSchedulerAlarmEvent;
  };
  readonly permissions: {
    contains(permissions: { readonly origins: readonly string[] }): Promise<boolean>;
  };
}

export interface RuleSourceSchedulerSummary {
  readonly considered: number;
  readonly updated: number;
  readonly failed: number;
  readonly conflicted: number;
  readonly skippedPermission: number;
}

export interface RegisterRuleSourceSchedulerOptions {
  readonly repository: ProfileWorkflowRepository;
  readonly updateService: ProfileWorkflowRuleSourceUpdateService;
  readonly now?: () => string;
  readonly onError?: (error: unknown) => void;
}

export interface RegisteredRuleSourceScheduler {
  readonly initialScan: Promise<RuleSourceSchedulerSummary>;
  scanNow(): Promise<RuleSourceSchedulerSummary>;
  dispose(): void;
}

function permissionOrigin(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return `${parsed.protocol}//${parsed.hostname}/*`;
  } catch {
    return undefined;
  }
}

function emptySummary(): RuleSourceSchedulerSummary {
  return {
    considered: 0,
    updated: 0,
    failed: 0,
    conflicted: 0,
    skippedPermission: 0,
  };
}

async function scanDueRuleSources(
  api: RuleSourceSchedulerApi,
  options: RegisterRuleSourceSchedulerOptions,
): Promise<RuleSourceSchedulerSummary> {
  const initial = await options.repository.read();
  if (!initial) return emptySummary();
  const now = options.now?.() ?? new Date().toISOString();
  const dueSourceIds = listDueProfileWorkflowRuleSourceUpdates(initial, now).map(
    (source) => source.sourceId,
  );
  const counts = {
    considered: dueSourceIds.length,
    updated: 0,
    failed: 0,
    conflicted: 0,
    skippedPermission: 0,
  };

  for (const sourceId of dueSourceIds) {
    const current = await options.repository.read();
    if (!current) break;
    const currentNow = options.now?.() ?? new Date().toISOString();
    const due = listDueProfileWorkflowRuleSourceUpdates(current, currentNow).find(
      (candidate) => candidate.sourceId === sourceId,
    );
    if (!due) continue;

    const origin = permissionOrigin(due.url);
    if (!origin || !(await api.permissions.contains({ origins: [origin] }))) {
      counts.skippedPermission += 1;
      continue;
    }

    const result = await updateProfileWorkflowRuleSource(
      options.repository,
      current,
      sourceId,
      options.updateService,
    );
    if (result.status === 'updated') counts.updated += 1;
    else if (result.status === 'conflict') counts.conflicted += 1;
    else counts.failed += 1;
  }

  return counts;
}

export function registerRuleSourceScheduler(
  api: RuleSourceSchedulerApi,
  options: RegisterRuleSourceSchedulerOptions,
): RegisteredRuleSourceScheduler {
  let disposed = false;
  let running: Promise<RuleSourceSchedulerSummary> | undefined;
  const onError = options.onError ?? ((error: unknown) => console.error(error));

  const scanNow = (): Promise<RuleSourceSchedulerSummary> => {
    if (disposed) return Promise.resolve(emptySummary());
    if (running) return running;
    const scan = scanDueRuleSources(api, options);
    running = scan;
    void scan.finally(() => {
      if (running === scan) running = undefined;
    });
    return scan;
  };

  const alarmListener = (alarm: RuleSourceSchedulerAlarm): void => {
    if (alarm.name !== RULE_SOURCE_UPDATE_ALARM_NAME) return;
    void scanNow().catch(onError);
  };

  api.alarms.onAlarm.addListener(alarmListener);
  void Promise.resolve(
    api.alarms.create(RULE_SOURCE_UPDATE_ALARM_NAME, {
      periodInMinutes: RULE_SOURCE_UPDATE_SCAN_PERIOD_MINUTES,
    }),
  ).catch(onError);
  const initialScan = scanNow();
  void initialScan.catch(onError);

  return {
    initialScan,
    scanNow,
    dispose() {
      disposed = true;
      api.alarms.onAlarm.removeListener(alarmListener);
    },
  };
}
