from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(source.replace(old, new))


def replace_line(path: str, prefix: str, replacement: str) -> None:
    file = Path(path)
    lines = file.read_text().splitlines()
    matches = [index for index, line in enumerate(lines) if line.startswith(prefix)]
    if len(matches) != 1:
        raise SystemExit(f'{path}: expected one line starting {prefix!r}, found {len(matches)}')
    lines[matches[0]] = replacement
    file.write_text('\n'.join(lines) + '\n')


def remove_line(path: str, exact: str) -> None:
    file = Path(path)
    lines = file.read_text().splitlines()
    matches = [index for index, line in enumerate(lines) if line == exact]
    if len(matches) != 1:
        raise SystemExit(f'{path}: expected one exact line {exact!r}, found {len(matches)}')
    del lines[matches[0]]
    file.write_text('\n'.join(lines) + '\n')


# Core due-source enumeration uses lastAttemptAt, so failed sources do not retry every minute.
replace_once(
    'packages/profile-workflow/src/rule-source-update.ts',
    '''function normalizedMessage(error: unknown): string {
''',
    '''export function listDueProfileWorkflowRuleSourceUpdates(
  state: ProfileWorkflowState,
  now = new Date().toISOString(),
): readonly ProfileWorkflowRuleSourceUpdateView[] {
  const current = timestamp(now);
  return state.draft.ruleSources.flatMap((source) => {
    const view = inspectProfileWorkflowRuleSourceUpdate(state, source.id, now);
    if (!view?.stale) return [];
    const lastAttempt =
      view.lastAttemptAt === undefined ? undefined : timestamp(view.lastAttemptAt);
    const due =
      lastAttempt === undefined ||
      current === undefined ||
      current - lastAttempt >= view.updateIntervalMinutes * 60_000;
    return due ? [view] : [];
  });
}

function normalizedMessage(error: unknown): string {
''',
)
replace_once(
    'packages/profile-workflow/src/index.ts',
    '''  inspectProfileWorkflowRuleSourceUpdate,
  RULE_SOURCE_UPDATE_MAX_BYTES,
''',
    '''  inspectProfileWorkflowRuleSourceUpdate,
  listDueProfileWorkflowRuleSourceUpdates,
  RULE_SOURCE_UPDATE_MAX_BYTES,
''',
)

# Register one scheduler with the existing workflow repository and update service.
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    "import { BrowserRuleSourceDownloader } from './rule-source-downloader';\n",
    '''import { BrowserRuleSourceDownloader } from './rule-source-downloader';
import {
  registerRuleSourceScheduler,
  type RuleSourceSchedulerApi,
} from './rule-source-scheduler';
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''  readonly storage: {
    readonly local: ProfileWorkflowStorageArea & BrowserStorageArea;
  };
}
''',
    '''  readonly storage: {
    readonly local: ProfileWorkflowStorageArea & BrowserStorageArea;
  };
  readonly alarms?: RuleSourceSchedulerApi['alarms'];
  readonly permissions?: RuleSourceSchedulerApi['permissions'];
}
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''  const rollbackService =
    options.authentication === undefined
''',
    '''  const ruleSourceScheduler =
    api.alarms === undefined || api.permissions === undefined
      ? undefined
      : registerRuleSourceScheduler(
          { alarms: api.alarms, permissions: api.permissions },
          {
            repository,
            updateService: ruleSourceUpdateService,
            onError: (error) =>
              console.error('[ZeroOmega Nex] scheduled Rule Source update failed:', error),
          },
        );
  const rollbackService =
    options.authentication === undefined
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''  return {
    dispose: () => api.runtime.onMessage.removeListener(listener),
  };
''',
    '''  return {
    dispose() {
      ruleSourceScheduler?.dispose();
      api.runtime.onMessage.removeListener(listener);
    },
  };
''',
)

# Alarms are required for background scheduling; URL origins remain optional.
replace_once(
    'apps/extension/wxt.config.ts',
    "    permissions: ['proxy', 'storage'],\n",
    "    permissions: ['proxy', 'storage', 'alarms'],\n",
)

# Chromium verifies the real alarm listener after forcing the persisted source due.
replace_once(
    'scripts/e2e-chromium.mjs',
    "const remoteRuleText = '[AutoProxy 0.2.9]\\n||downloaded.e2e.invalid';\nlet receivedRuleHeader = '';\n",
    "let remoteRuleText = '[AutoProxy 0.2.9]\\n||downloaded.e2e.invalid';\nlet receivedRuleHeader = '';\nlet ruleRequestCount = 0;\n",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''const ruleServer = createServer((request, response) => {
  receivedRuleHeader = String(request.headers['x-e2e'] ?? '');
''',
    '''const ruleServer = createServer((request, response) => {
  ruleRequestCount += 1;
  receivedRuleHeader = String(request.headers['x-e2e'] ?? '');
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  assert.equal(receivedRuleHeader, 'attached');

  options.once('dialog', (dialog) => dialog.accept());
''',
    '''  assert.equal(receivedRuleHeader, 'attached');

  const scheduledRuleText = '[AutoProxy 0.2.9]\\n||scheduled.e2e.invalid';
  remoteRuleText = scheduledRuleText;
  await worker.evaluate(
    async ({ sourceUrl, alarmName }) => {
      const key = 'zeroomega-nex/profile-workflow/v1/state';
      const values = await chrome.storage.local.get(key);
      const state = values[key];
      const source = state?.draft?.ruleSources?.find(
        (candidate) => candidate.location?.kind === 'url' && candidate.location.url === sourceUrl,
      );
      if (!state || !source) throw new Error('Scheduled Rule Source fixture was not found');
      const update = state.ruleSourceUpdates?.[source.id];
      if (!update) throw new Error('Scheduled Rule Source update record was not found');
      update.lastAttemptAt = '2000-01-01T00:00:00.000Z';
      update.lastSuccessAt = '2000-01-01T00:00:00.000Z';
      delete update.lastError;
      await chrome.storage.local.set({ [key]: state });
      chrome.alarms.create(alarmName, { when: Date.now() + 250 });
    },
    {
      sourceUrl: remoteRuleUrl,
      alarmName: 'zeroomega-nex/rule-source-update-scan',
    },
  );
  await assertEventually(
    async () =>
      worker.evaluate(
        async ({ sourceUrl, expected }) => {
          const key = 'zeroomega-nex/profile-workflow/v1/state';
          const values = await chrome.storage.local.get(key);
          const source = values[key]?.draft?.ruleSources?.find(
            (candidate) => candidate.location?.kind === 'url' && candidate.location.url === sourceUrl,
          );
          return source?.location?.content === expected;
        },
        { sourceUrl: remoteRuleUrl, expected: scheduledRuleText },
      ),
    'Scheduled Rule Source alarm did not refresh due cached content',
    20_000,
  );
  assert.equal(ruleRequestCount >= 2, true);
  assert.equal(receivedRuleHeader, 'attached');

  options.once('dialog', (dialog) => dialog.accept());
''',
)

# Permanent compatibility guard for scheduler architecture and browser proof.
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    "const ruleSourceDownloaderPath = 'apps/extension/src/lib/rule-source-downloader.ts';\n",
    '''const ruleSourceDownloaderPath = 'apps/extension/src/lib/rule-source-downloader.ts';
const ruleSourceSchedulerPath = 'apps/extension/src/lib/rule-source-scheduler.ts';
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  ruleSourceDownloader,
  ruleSourceUpdate,
''',
    '''  ruleSourceDownloader,
  ruleSourceScheduler,
  ruleSourceUpdate,
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''  readFile(ruleSourceDownloaderPath, 'utf8'),
  readFile(ruleSourceUpdatePath, 'utf8'),
''',
    '''  readFile(ruleSourceDownloaderPath, 'utf8'),
  readFile(ruleSourceSchedulerPath, 'utf8'),
  readFile(ruleSourceUpdatePath, 'utf8'),
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''      ruleSourceUpdate.includes('old cached content') === false,
    'Remote Rule Sources must use background-only bounded downloads, user-granted host permission, safe secret headers, atomic CAS replacement, and preserved old cache on failure.',
  ],
''',
    '''      ruleSourceUpdate.includes('old cached content') === false,
    'Remote Rule Sources must use background-only bounded downloads, user-granted host permission, safe secret headers, atomic CAS replacement, and preserved old cache on failure.',
  ],
  [
    manifest.includes("permissions: ['proxy', 'storage', 'alarms']") &&
      runtime.includes('registerRuleSourceScheduler') &&
      ruleSourceScheduler.includes("RULE_SOURCE_UPDATE_ALARM_NAME = 'zeroomega-nex/rule-source-update-scan'") &&
      ruleSourceScheduler.includes('RULE_SOURCE_UPDATE_SCAN_PERIOD_MINUTES = 1') &&
      ruleSourceScheduler.includes('listDueProfileWorkflowRuleSourceUpdates') &&
      ruleSourceScheduler.includes('api.permissions.contains') &&
      ruleSourceScheduler.includes('if (running) return running') &&
      ruleSourceUpdate.includes('export function listDueProfileWorkflowRuleSourceUpdates'),
    'Remote Rule Sources must use one coalesced alarm scheduler, scan on startup, refresh only due sources with existing host permission, and wait each interval after success or failure.',
  ],
''',
)

# Update source-backed documents. Translation remains partial, but functional D-19 is complete.
replace_line(
    'docs/UI_AUDIT_MATRIX.md',
    '| D-19 |',
    '| D-19 | 附属立即下载     | 同上                                           | 下载状态/更新时间/错误                     | MUST_MATCH | DONE     | PARTIAL | 已有手动与自动更新：单一 alarms 扫描器启动即扫、每分钟检查、按源 interval/lastAttempt 判定到期；只使用已授权 origin；安全 header/secret、10 秒/4 MiB、原子缓存、状态及 Chromium alarm E2E 完整 | locale 与长期运行巡查  |',
)
replace_line(
    'docs/MILESTONE_8_STATUS.md',
    '- Automatic interval scheduling remains separate.',
    '- Automatic interval scheduling now uses one coalesced alarm, scans on startup, retries only after each source interval, and skips origins without prior permission. Chromium E2E triggers the real alarm and verifies a second cached-content refresh.',
)
remove_line(
    'docs/MILESTONE_8_STATUS.md',
    '- attached Rule List automatic interval scheduling and startup/due-source refresh,',
)
replace_line(
    'docs/MILESTONE_8_STATUS.md',
    'Implement automatic Rule Source interval scheduling and startup/due-source refresh, or take the next higher-priority source-backed blocker from the audit matrix. The next slice must update the knowledge graph and audit matrix in the same product commit and pass full integration plus exact-Head CI, Chromium/Firefox E2E, and Parity Documentation. Do not request repository-owner installation until a new consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.',
    'Proceed to the next higher-priority source-backed blocker: Popup/current-site condition injection and `addConditionsToBottom` ordering, unless a repository audit identifies a stricter dependency. The next slice must update the knowledge graph and audit matrix in the same product commit and pass full integration plus exact-Head CI, Chromium/Firefox E2E, and Parity Documentation. Do not request repository-owner installation until a new consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.',
)

knowledge = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
lines = knowledge.read_text().splitlines()
needle = '- “立即下载”由后台网络服务执行：'
matches = [index for index, line in enumerate(lines) if line.startswith(needle)]
if len(matches) != 1:
    raise SystemExit(f'knowledge Rule Source line mismatch: {len(matches)}')
lines[matches[0]] = lines[matches[0]].replace(
    '自动按 interval 调度仍是独立缺口。',
    '自动更新使用单一 alarms 扫描器：后台启动立即扫描，之后每分钟检查；每个源按 lastAttempt 与自身/全局 interval 判定到期，失败不会每分钟轰炸；无既有 host permission 时静默跳过，不在后台请求权限。',
)
knowledge.write_text('\n'.join(lines) + '\n')
