from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(source.replace(old, new))


client = 'apps/extension/src/lib/profile-workflow-client.ts'
replace_once(
    client,
    '''export type ProfileWorkflowCommandInput = ProfileWorkflowCommand extends infer Command
  ? Command extends { readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL }
    ? Omit<Command, 'channel'>
    : never
  : never;

interface ProfileWorkflowClientApi {
''',
    '''export type ProfileWorkflowCommandInput = ProfileWorkflowCommand extends infer Command
  ? Command extends { readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL }
    ? Omit<Command, 'channel'>
    : never
  : never;

export const PROFILE_WORKFLOW_STATE_STORAGE_KEY = 'zeroomega-nex/profile-workflow/v1/state';

export interface ProfileWorkflowStorageChange {
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
}

export type ProfileWorkflowStorageChangeListener = (
  changes: Readonly<Record<string, ProfileWorkflowStorageChange>>,
  areaName: string,
) => void;

interface ProfileWorkflowClientApi {
''',
)
replace_once(
    client,
    '''  readonly permissions?: {
    request(permissions: { origins: string[] }): Promise<boolean>;
  };
}
''',
    '''  readonly permissions?: {
    request(permissions: { origins: string[] }): Promise<boolean>;
  };
  readonly storage?: {
    readonly onChanged: {
      addListener(listener: ProfileWorkflowStorageChangeListener): void;
      removeListener(listener: ProfileWorkflowStorageChangeListener): void;
    };
  };
}
''',
)
replace_once(
    client,
    '''export async function requestRuleSourceOriginPermission(
''',
    '''export function subscribeProfileWorkflowStateChanges(
  listener: () => void,
  api: ProfileWorkflowClientApi = browser as unknown as ProfileWorkflowClientApi,
): () => void {
  if (!api.storage) return () => undefined;
  const storageListener: ProfileWorkflowStorageChangeListener = (changes, areaName) => {
    if (
      areaName === 'local' &&
      Object.prototype.hasOwnProperty.call(changes, PROFILE_WORKFLOW_STATE_STORAGE_KEY)
    ) {
      listener();
    }
  };
  api.storage.onChanged.addListener(storageListener);
  return () => api.storage?.onChanged.removeListener(storageListener);
}

export async function requestRuleSourceOriginPermission(
''',
)

app = 'apps/extension/src/entrypoints/options/App.svelte'
replace_once(
    app,
    '''    requestRuleSourceOriginPermission,
    sendProfileWorkflowCommand,
''',
    '''    requestRuleSourceOriginPermission,
    sendProfileWorkflowCommand,
    subscribeProfileWorkflowStateChanges,
''',
)
replace_once(
    app,
    '''  let profileEditorEpoch = 0;
  let hasUnappliedChanges = false;
''',
    '''  let profileEditorEpoch = 0;
  let hasUnappliedChanges = false;
  let workflowRefreshPending = false;
  let workflowRefreshRunning: Promise<void> | undefined;
''',
)
replace_once(
    app,
    '''  async function loadWorkflow(): Promise<void> {
''',
    '''  async function refreshWorkflowFromStorage(): Promise<void> {
    workflowRefreshPending = true;
    if (saving || workflowRefreshRunning) return;
    const refresh = (async () => {
      saving = true;
      try {
        while (workflowRefreshPending) {
          workflowRefreshPending = false;
          acceptResponse(await sendProfileWorkflowCommand({ action: 'get' }));
        }
      } catch (error) {
        errorMessage = messageFrom(error);
      } finally {
        saving = false;
      }
    })();
    workflowRefreshRunning = refresh;
    try {
      await refresh;
    } finally {
      if (workflowRefreshRunning === refresh) workflowRefreshRunning = undefined;
      if (workflowRefreshPending && !saving) void refreshWorkflowFromStorage();
    }
  }

  function finishSaving(): void {
    saving = false;
    if (workflowRefreshPending) void refreshWorkflowFromStorage();
  }

  async function loadWorkflow(): Promise<void> {
''',
)
source = Path(app).read_text()
count = source.count('''    } finally {
      saving = false;
    }
''')
if count != 4:
    raise SystemExit(f'{app}: expected four saving-finally blocks, found {count}')
source = source.replace(
    '''    } finally {
      saving = false;
    }
''',
    '''    } finally {
      finishSaving();
    }
''',
)
Path(app).write_text(source)
replace_once(
    app,
    '''  onMount(() => {
    themeMode = readThemeMode();
    applyThemeMode(themeMode);
    const handleNavigation = () => void syncNavigationFromLocation();
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    void loadWorkflow().then(() => syncNavigationFromLocation());
    return () => {
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  });
''',
    '''  onMount(() => {
    themeMode = readThemeMode();
    applyThemeMode(themeMode);
    let disposed = false;
    let unsubscribeWorkflowChanges = () => undefined;
    const handleNavigation = () => void syncNavigationFromLocation();
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    void loadWorkflow().then(async () => {
      if (disposed) return;
      unsubscribeWorkflowChanges = subscribeProfileWorkflowStateChanges(() => {
        void refreshWorkflowFromStorage();
      });
      await refreshWorkflowFromStorage();
      if (!disposed) await syncNavigationFromLocation();
    });
    return () => {
      disposed = true;
      unsubscribeWorkflowChanges();
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  });
''',
)

# Permanent client listener unit test.
Path('apps/extension/src/lib/profile-workflow-client.test.ts').write_text('''import { describe, expect, it } from 'vitest';

import {
  PROFILE_WORKFLOW_STATE_STORAGE_KEY,
  subscribeProfileWorkflowStateChanges,
  type ProfileWorkflowStorageChangeListener,
} from './profile-workflow-client';

class FakeStorageChanges {
  readonly listeners = new Set<ProfileWorkflowStorageChangeListener>();

  addListener(listener: ProfileWorkflowStorageChangeListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: ProfileWorkflowStorageChangeListener): void {
    this.listeners.delete(listener);
  }

  fire(changes: Readonly<Record<string, { readonly newValue?: unknown }>>, areaName: string): void {
    for (const listener of this.listeners) listener(changes, areaName);
  }
}

describe('profile workflow storage synchronization', () => {
  it('subscribes only to local workflow-state changes and disposes cleanly', () => {
    const onChanged = new FakeStorageChanges();
    let calls = 0;
    const dispose = subscribeProfileWorkflowStateChanges(
      () => {
        calls += 1;
      },
      {
        runtime: { sendMessage: async () => undefined },
        storage: { onChanged },
      },
    );

    onChanged.fire({ other: { newValue: 1 } }, 'local');
    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 2 } }, 'sync');
    expect(calls).toBe(0);

    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 3 } }, 'local');
    expect(calls).toBe(1);

    dispose();
    expect(onChanged.listeners.size).toBe(0);
    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 4 } }, 'local');
    expect(calls).toBe(1);
  });
});
''')

# Require the live-generation synchronization permanently.
guard = 'scripts/validate-ui-compatibility.mjs'
replace_once(
    guard,
    "const runtimePath = 'apps/extension/src/lib/profile-workflow-runtime.ts';\n",
    "const runtimePath = 'apps/extension/src/lib/profile-workflow-runtime.ts';\nconst workflowClientPath = 'apps/extension/src/lib/profile-workflow-client.ts';\n",
)
replace_once(
    guard,
    '''  runtime,
  ruleSourceDownloader,
''',
    '''  runtime,
  workflowClient,
  ruleSourceDownloader,
''',
)
replace_once(
    guard,
    '''  readFile(runtimePath, 'utf8'),
  readFile(ruleSourceDownloaderPath, 'utf8'),
''',
    '''  readFile(runtimePath, 'utf8'),
  readFile(workflowClientPath, 'utf8'),
  readFile(ruleSourceDownloaderPath, 'utf8'),
''',
)
replace_once(
    guard,
    '''    'Remote Rule Sources must use one coalesced alarm scheduler, scan on startup, refresh only due sources with existing host permission, and wait each interval after success or failure.',
  ],
''',
    '''    'Remote Rule Sources must use one coalesced alarm scheduler, scan on startup, refresh only due sources with existing host permission, and wait each interval after success or failure.',
  ],
  [
    workflowClient.includes('PROFILE_WORKFLOW_STATE_STORAGE_KEY') &&
      workflowClient.includes('subscribeProfileWorkflowStateChanges') &&
      workflowClient.includes("areaName === 'local'") &&
      optionsApp.includes('refreshWorkflowFromStorage') &&
      optionsApp.includes('workflowRefreshPending') &&
      optionsApp.includes('subscribeProfileWorkflowStateChanges') &&
      optionsApp.includes('finishSaving()'),
    'Options must synchronize background workflow generation changes without overwriting the persistent Switch source editor instance.',
  ],
''',
)

# Source-backed evidence for the cross-context consistency boundary.
status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
old = '- Automatic interval scheduling now uses one coalesced alarm, scans on startup, retries only after each source interval, and skips origins without prior permission. Chromium E2E triggers the real alarm and verifies a second cached-content refresh.'
new = old + '\n- Options observes local workflow-state changes from the background, refreshes its generation through a read-only command, and queues refreshes during local writes. The persistent Switch source editor keeps its local text while receiving the newer backing spec, so a later commit merges against current cached Rule Source state.'
if text.count(old) != 1:
    raise SystemExit(f'status synchronization evidence match count: {text.count(old)}')
status.write_text(text.replace(old, new))

knowledge = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
text = knowledge.read_text()
needle = '无既有 host permission 时静默跳过，不在后台请求权限。'
addition = needle + ' Options 通过 `storage.onChanged` 监听本地 workflow state，并用只读 `get` 同步 generation；本地写入期间合并刷新，Switch 源码编辑器实例不重建，因此本地源码文本可在最新 backing spec 上提交。'
if text.count(needle) != 1:
    raise SystemExit(f'knowledge synchronization evidence match count: {text.count(needle)}')
knowledge.write_text(text.replace(needle, addition))

matrix = Path('docs/UI_AUDIT_MATRIX.md')
lines = matrix.read_text().splitlines()
matches = [index for index, line in enumerate(lines) if line.startswith('| D-19 |')]
if len(matches) != 1:
    raise SystemExit(f'D-19 synchronization evidence match count: {len(matches)}')
lines[matches[0]] = lines[matches[0]].replace(
    '状态及 Chromium alarm E2E 完整',
    '状态、Options generation 同步及 Chromium alarm 后继续编辑/删除 E2E 完整',
)
matrix.write_text('\n'.join(lines) + '\n')
