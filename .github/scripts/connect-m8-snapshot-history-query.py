from pathlib import Path


def patch(path_string: str, replacements: list[tuple[str, str, str]]) -> None:
    path = Path(path_string)
    text = path.read_text()
    for old, new, label in replacements:
        count = text.count(old)
        if count != 1:
            raise SystemExit(f'{path_string} {label}: expected one anchor, found {count}')
        text = text.replace(old, new, 1)
    path.write_text(text)


patch(
    'packages/profile-workflow/src/commands.ts',
    [
        (
            '  ProfileWorkflowRuntimeView,\n  ProfileWorkflowState,',
            '  ProfileWorkflowRuntimeView,\n  ProfileWorkflowSnapshotHistoryEntry,\n  ProfileWorkflowState,',
            'snapshot history contract import',
        ),
        (
            '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'get';
    }
  | {''',
            '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'get';
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'get-snapshot-history';
    }
  | {''',
            'snapshot history command',
        ),
        (
            '''      readonly runtime?: ProfileWorkflowRuntimeView;
    }''',
            '''      readonly runtime?: ProfileWorkflowRuntimeView;
      readonly snapshotHistory?: readonly ProfileWorkflowSnapshotHistoryEntry[];
    }''',
            'snapshot history response field',
        ),
        (
            '''export interface ProfileWorkflowImportService {
  readonly secretStore: ProfileWorkflowSecretStore;
}
''',
            '''export interface ProfileWorkflowImportService {
  readonly secretStore: ProfileWorkflowSecretStore;
}

export interface ProfileWorkflowHistoryService {
  listSnapshots(): Promise<readonly ProfileWorkflowSnapshotHistoryEntry[]>;
}
''',
            'history service contract',
        ),
        (
            '''function response(
  state: ProfileWorkflowState,
  appliedSnapshotId?: string,
  runtime?: ProfileWorkflowRuntimeView,
): ProfileWorkflowCommandResponse {''',
            '''function response(
  state: ProfileWorkflowState,
  appliedSnapshotId?: string,
  runtime?: ProfileWorkflowRuntimeView,
  snapshotHistory?: readonly ProfileWorkflowSnapshotHistoryEntry[],
): ProfileWorkflowCommandResponse {''',
            'response signature',
        ),
        (
            '''    ...(runtime === undefined ? {} : { runtime }),
  };''',
            '''    ...(runtime === undefined ? {} : { runtime }),
    ...(snapshotHistory === undefined ? {} : { snapshotHistory }),
  };''',
            'response snapshot history payload',
        ),
        (
            '''    case 'get':
      return true;''',
            '''    case 'get':
    case 'get-snapshot-history':
      return true;''',
            'history command validation',
        ),
        (
            '''  command: ProfileWorkflowCommand,
  applyService?: ProfileWorkflowApplyService,
  importService?: ProfileWorkflowImportService,
): Promise<ProfileWorkflowCommandResponse> {''',
            '''  command: ProfileWorkflowCommand,
  applyService?: ProfileWorkflowApplyService,
  importService?: ProfileWorkflowImportService,
  historyService?: ProfileWorkflowHistoryService,
): Promise<ProfileWorkflowCommandResponse> {''',
            'history service execution parameter',
        ),
        (
            '''  if (command.action === 'get') {
    return response(state, undefined, await runtimeView(applyService));
  }

  if (command.action === 'activate-route') {''',
            '''  if (command.action === 'get') {
    return response(state, undefined, await runtimeView(applyService));
  }

  if (command.action === 'get-snapshot-history') {
    if (!historyService) {
      return failure('invalid', 'profile workflow history service is unavailable', state);
    }
    try {
      return response(
        state,
        undefined,
        await runtimeView(applyService),
        await historyService.listSnapshots(),
      );
    } catch (error) {
      return failure('storage-failure', errorMessage(error), state);
    }
  }

  if (command.action === 'activate-route') {''',
            'history command execution',
        ),
    ],
)

patch(
    'packages/profile-workflow/src/index.ts',
    [
        (
            '  type ProfileWorkflowCommandResponse,\n  type ProfileWorkflowImportService,',
            '  type ProfileWorkflowCommandResponse,\n  type ProfileWorkflowHistoryService,\n  type ProfileWorkflowImportService,',
            'history service export',
        ),
        (
            '  type ProfileWorkflowRuntimeView,\n  type ProfileWorkflowState,',
            '  type ProfileWorkflowRuntimeView,\n  type ProfileWorkflowSnapshotHistoryEntry,\n  type ProfileWorkflowSnapshotWarning,\n  type ProfileWorkflowState,',
            'history contract exports',
        ),
    ],
)

patch(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    [
        (
            '''import {
  BrowserStorageProxyAuthenticationRepository,
  type BrowserStorageArea,
} from '@zeroomega-nex/browser-adapters';''',
            '''import {
  BrowserStorageProxyAuthenticationRepository,
  listPacSnapshotHistory,
  type BrowserStorageArea,
} from '@zeroomega-nex/browser-adapters';''',
            'history adapter import',
        ),
        (
            '  type ProfileWorkflowCommandResponse,\n  type ProfileWorkflowImportService,',
            '  type ProfileWorkflowCommandResponse,\n  type ProfileWorkflowHistoryService,\n  type ProfileWorkflowImportService,',
            'history service import',
        ),
        (
            "import { BrowserProfileWorkflowActivationDriver } from './profile-workflow-activation';",
            "import { currentBrowserProxyRuntime } from './browser-proxy-runtime';\nimport { BrowserProfileWorkflowActivationDriver } from './profile-workflow-activation';",
            'browser proxy runtime import',
        ),
        (
            '''function createImportService(api: ProfileWorkflowRuntimeApi): ProfileWorkflowImportService {
  return {
    secretStore: new BrowserStorageProxyAuthenticationRepository(api.storage.local),
  };
}
''',
            '''function createImportService(api: ProfileWorkflowRuntimeApi): ProfileWorkflowImportService {
  return {
    secretStore: new BrowserStorageProxyAuthenticationRepository(api.storage.local),
  };
}

function createHistoryService(): ProfileWorkflowHistoryService {
  return {
    async listSnapshots() {
      const runtime = currentBrowserProxyRuntime();
      try {
        return await listPacSnapshotHistory(runtime.repository);
      } finally {
        runtime.dispose();
      }
    },
  };
}
''',
            'history service factory',
        ),
        (
            '''  const importService = createImportService(api);
  const listener = async (''',
            '''  const importService = createImportService(api);
  const historyService = createHistoryService();
  const listener = async (''',
            'history service initialization',
        ),
        (
            '''      applyService,
      importService,
    );''',
            '''      applyService,
      importService,
      historyService,
    );''',
            'history service command wiring',
        ),
    ],
)
