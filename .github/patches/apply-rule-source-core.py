from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(source.replace(old, new))


def insert_before(path: str, marker: str, addition: str) -> None:
    replace_once(path, marker, addition + marker)


# Runtime-only Rule Source update metadata belongs to workflow state, never ProfileSpec.
insert_before(
    'packages/profile-workflow/src/contracts.ts',
    'export interface ProfileWorkflowState {\n',
    '''export interface ProfileWorkflowRuleSourceUpdateError {
  readonly occurredAt: string;
  readonly message: string;
}

export interface ProfileWorkflowRuleSourceUpdateRecord {
  readonly sourceId: string;
  readonly url: string;
  readonly lastAttemptAt: string;
  readonly lastSuccessAt?: string;
  readonly lastBytes?: number;
  readonly lastError?: ProfileWorkflowRuleSourceUpdateError;
}

export interface ProfileWorkflowRuleSourceUpdateView extends ProfileWorkflowRuleSourceUpdateRecord {
  readonly updateIntervalMinutes: number;
  readonly stale: boolean;
}

''',
)
replace_once(
    'packages/profile-workflow/src/contracts.ts',
    '''  readonly selectedProfileId?: string;
  readonly pendingApply?: ProfileWorkflowPendingApply;
''',
    '''  readonly selectedProfileId?: string;
  readonly ruleSourceUpdates?: Readonly<Record<string, ProfileWorkflowRuleSourceUpdateRecord>>;
  readonly pendingApply?: ProfileWorkflowPendingApply;
''',
)

# Persist and validate update metadata as part of the same CAS state.
replace_once(
    'packages/profile-workflow/src/storage-repository.ts',
    '''  type ProfileWorkflowRepository,
  type ProfileWorkflowRevisionRepository,
  type ProfileWorkflowState,
''',
    '''  type ProfileWorkflowRepository,
  type ProfileWorkflowRevisionRepository,
  type ProfileWorkflowRuleSourceUpdateRecord,
  type ProfileWorkflowState,
''',
)
insert_before(
    'packages/profile-workflow/src/storage-repository.ts',
    'export function parseProfileWorkflowState(value: unknown): ProfileWorkflowState {\n',
    '''function optionalString(
  value: Record<string, unknown>,
  key: string,
  label: string,
): string | undefined {
  const candidate = value[key];
  if (candidate === undefined) return undefined;
  if (typeof candidate !== 'string' || !candidate) {
    throw new TypeError(`${label}.${key} must be a non-empty string`);
  }
  return candidate;
}

function parseRuleSourceUpdates(
  value: unknown,
): Readonly<Record<string, ProfileWorkflowRuleSourceUpdateRecord>> | undefined {
  if (value === undefined) return undefined;
  const updates = record(value, 'ruleSourceUpdates');
  const parsed: Record<string, ProfileWorkflowRuleSourceUpdateRecord> = {};
  for (const [sourceId, raw] of Object.entries(updates)) {
    if (!sourceId) throw new TypeError('ruleSourceUpdates keys must not be empty');
    const entry = record(raw, `ruleSourceUpdates.${sourceId}`);
    const parsedSourceId = requiredString(entry, 'sourceId', `ruleSourceUpdates.${sourceId}`);
    if (parsedSourceId !== sourceId) {
      throw new TypeError(`ruleSourceUpdates.${sourceId}.sourceId must match its key`);
    }
    const lastBytes = entry.lastBytes;
    if (lastBytes !== undefined && (!Number.isInteger(lastBytes) || Number(lastBytes) < 0)) {
      throw new TypeError(`ruleSourceUpdates.${sourceId}.lastBytes must be a non-negative integer`);
    }
    const lastErrorRaw = entry.lastError;
    const lastError =
      lastErrorRaw === undefined
        ? undefined
        : (() => {
            const error = record(lastErrorRaw, `ruleSourceUpdates.${sourceId}.lastError`);
            return {
              occurredAt: requiredString(
                error,
                'occurredAt',
                `ruleSourceUpdates.${sourceId}.lastError`,
              ),
              message: requiredString(error, 'message', `ruleSourceUpdates.${sourceId}.lastError`),
            };
          })();
    parsed[sourceId] = {
      sourceId,
      url: requiredString(entry, 'url', `ruleSourceUpdates.${sourceId}`),
      lastAttemptAt: requiredString(entry, 'lastAttemptAt', `ruleSourceUpdates.${sourceId}`),
      ...(optionalString(entry, 'lastSuccessAt', `ruleSourceUpdates.${sourceId}`) === undefined
        ? {}
        : {
            lastSuccessAt: optionalString(
              entry,
              'lastSuccessAt',
              `ruleSourceUpdates.${sourceId}`,
            )!,
          }),
      ...(lastBytes === undefined ? {} : { lastBytes: Number(lastBytes) }),
      ...(lastError === undefined ? {} : { lastError }),
    };
  }
  return parsed;
}

''',
)
replace_once(
    'packages/profile-workflow/src/storage-repository.ts',
    '''    ...(selectedProfileId === undefined ? {} : { selectedProfileId }),
    ...(state.pendingApply === undefined ? {} : { pendingApply: parsePending(state.pendingApply) }),
''',
    '''    ...(selectedProfileId === undefined ? {} : { selectedProfileId }),
    ...(parseRuleSourceUpdates(state.ruleSourceUpdates) === undefined
      ? {}
      : { ruleSourceUpdates: parseRuleSourceUpdates(state.ruleSourceUpdates)! }),
    ...(state.pendingApply === undefined ? {} : { pendingApply: parsePending(state.pendingApply) }),
''',
)

# Export the service and contracts.
insert_before(
    'packages/profile-workflow/src/index.ts',
    "export { listProfileWorkflowRevisionHistory } from './revision-history.js';\n",
    '''export {
  inspectProfileWorkflowRuleSourceUpdate,
  RULE_SOURCE_UPDATE_MAX_BYTES,
  RULE_SOURCE_UPDATE_TIMEOUT_MS,
  updateProfileWorkflowRuleSource,
  type ProfileWorkflowRuleSourceDownloader,
  type ProfileWorkflowRuleSourceDownloadRequest,
  type ProfileWorkflowRuleSourceDownloadResult,
  type ProfileWorkflowRuleSourceUpdateResult,
  type ProfileWorkflowRuleSourceUpdateService,
} from './rule-source-update.js';
''',
)
replace_once(
    'packages/profile-workflow/src/index.ts',
    '''  type ProfileWorkflowRepository,
  type ProfileWorkflowRevisionHistoryEntry,
''',
    '''  type ProfileWorkflowRepository,
  type ProfileWorkflowRevisionHistoryEntry,
  type ProfileWorkflowRuleSourceUpdateError,
  type ProfileWorkflowRuleSourceUpdateRecord,
  type ProfileWorkflowRuleSourceUpdateView,
''',
)

# Typed commands for status inspection and manual updates.
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  ProfileWorkflowRevisionHistoryEntry,
  ProfileWorkflowRuntimeView,
''',
    '''  ProfileWorkflowRevisionHistoryEntry,
  ProfileWorkflowRuleSourceUpdateView,
  ProfileWorkflowRuntimeView,
''',
)
insert_before(
    'packages/profile-workflow/src/commands.ts',
    "import {\n  rollbackProfileWorkflowSnapshot,\n",
    '''import {
  inspectProfileWorkflowRuleSourceUpdate,
  updateProfileWorkflowRuleSource,
  type ProfileWorkflowRuleSourceUpdateService,
} from './rule-source-update.js';
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'get-snapshot-history';
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'replace-draft';
''',
    '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'get-snapshot-history';
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'get-rule-source-update-status';
      readonly sourceId: string;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'update-rule-source';
      readonly expectedGeneration: number;
      readonly sourceId: string;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'replace-draft';
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''      readonly revisionHistory?: readonly ProfileWorkflowRevisionHistoryEntry[];
      readonly secretValue?: string;
''',
    '''      readonly revisionHistory?: readonly ProfileWorkflowRevisionHistoryEntry[];
      readonly ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView;
      readonly secretValue?: string;
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''        | 'apply-failed'
        | 'activation-failed'
        | 'rollback-failed';
      readonly message: string;
      readonly state?: ProfileWorkflowState;
      readonly view?: ProfileWorkflowView;
''',
    '''        | 'apply-failed'
        | 'activation-failed'
        | 'rollback-failed'
        | 'rule-source-update-failed';
      readonly message: string;
      readonly state?: ProfileWorkflowState;
      readonly view?: ProfileWorkflowView;
      readonly ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView;
''',
)
insert_before(
    'packages/profile-workflow/src/commands.ts',
    'function failure(\n',
    '''function responseWithRuleSourceUpdate(
  state: ProfileWorkflowState,
  update: ProfileWorkflowRuleSourceUpdateView,
): Extract<ProfileWorkflowCommandResponse, { readonly ok: true }> {
  return { ...response(state), ruleSourceUpdate: update };
}

''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''function failure(
  code: Extract<ProfileWorkflowCommandResponse, { ok: false }>['code'],
  message: string,
  state?: ProfileWorkflowState,
): ProfileWorkflowCommandResponse {
''',
    '''function failure(
  code: Extract<ProfileWorkflowCommandResponse, { ok: false }>['code'],
  message: string,
  state?: ProfileWorkflowState,
  ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView,
): ProfileWorkflowCommandResponse {
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''        }),
  };
}

async function runtimeView(
''',
    '''        }),
    ...(ruleSourceUpdate === undefined ? {} : { ruleSourceUpdate }),
  };
}

async function runtimeView(
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''    case 'get':
    case 'get-snapshot-history':
      return true;
    case 'replace-draft':
''',
    '''    case 'get':
    case 'get-snapshot-history':
      return true;
    case 'get-rule-source-update-status':
      return typeof record.sourceId === 'string' && record.sourceId.length > 0;
    case 'update-rule-source':
      return (
        validGeneration(record.expectedGeneration) &&
        typeof record.sourceId === 'string' &&
        record.sourceId.length > 0
      );
    case 'replace-draft':
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  historyService?: ProfileWorkflowHistoryService,
  rollbackService?: ProfileWorkflowSnapshotRollbackService,
): Promise<ProfileWorkflowCommandResponse> {
''',
    '''  historyService?: ProfileWorkflowHistoryService,
  rollbackService?: ProfileWorkflowSnapshotRollbackService,
  ruleSourceUpdateService?: ProfileWorkflowRuleSourceUpdateService,
): Promise<ProfileWorkflowCommandResponse> {
''',
)
insert_before(
    'packages/profile-workflow/src/commands.ts',
    "  if (command.action === 'activate-route') {\n",
    '''  if (command.action === 'get-rule-source-update-status') {
    if (!ruleSourceUpdateService) {
      return failure('invalid', 'Rule Source update service is unavailable', state);
    }
    const update = inspectProfileWorkflowRuleSourceUpdate(state, command.sourceId);
    return update === undefined
      ? failure('invalid', `Rule Source ${command.sourceId} is not a remote URL source`, state)
      : responseWithRuleSourceUpdate(state, update);
  }

''',
)
insert_before(
    'packages/profile-workflow/src/commands.ts',
    "  if (command.action === 'read-secret') {\n",
    '''  if (command.action === 'update-rule-source') {
    if (!ruleSourceUpdateService) {
      return failure('invalid', 'Rule Source update service is unavailable', state);
    }
    const result = await updateProfileWorkflowRuleSource(
      repository,
      state,
      command.sourceId,
      ruleSourceUpdateService,
    );
    if (result.status === 'updated') {
      return responseWithRuleSourceUpdate(result.state, result.update);
    }
    const code =
      result.status === 'conflict'
        ? 'conflict'
        : result.status === 'storage-failure'
          ? 'storage-failure'
          : result.status === 'invalid'
            ? 'invalid'
            : 'rule-source-update-failed';
    return failure(code, result.message, result.state, result.update);
  }

''',
)

# Register the browser downloader and secret store in the background runtime.
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowStorageArea,
''',
    '''  type ProfileWorkflowRuleSourceDownloader,
  type ProfileWorkflowRuleSourceUpdateService,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowStorageArea,
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    "import { currentBrowserProxyRuntime } from './browser-proxy-runtime';\n",
    "import { currentBrowserProxyRuntime } from './browser-proxy-runtime';\nimport { BrowserRuleSourceDownloader } from './rule-source-downloader';\n",
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''export interface ProfileWorkflowRuntimeOptions {
  readonly activationDriver?: ProfileWorkflowActivationDriver;
  readonly authentication?: ProfileWorkflowAuthenticationCoordinator;
}
''',
    '''export interface ProfileWorkflowRuntimeOptions {
  readonly activationDriver?: ProfileWorkflowActivationDriver;
  readonly authentication?: ProfileWorkflowAuthenticationCoordinator;
  readonly ruleSourceDownloader?: ProfileWorkflowRuleSourceDownloader;
}
''',
)
insert_before(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    'function createHistoryService(\n',
    '''function createRuleSourceUpdateService(
  importService: ProfileWorkflowImportService,
  downloader: ProfileWorkflowRuleSourceDownloader,
): ProfileWorkflowRuleSourceUpdateService {
  return {
    downloader,
    secretStore: importService.secretStore,
  };
}

''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''  const importService = createImportService(api);
  const historyService = createHistoryService(repository);
''',
    '''  const importService = createImportService(api);
  const historyService = createHistoryService(repository);
  const ruleSourceUpdateService = createRuleSourceUpdateService(
    importService,
    options.ruleSourceDownloader ?? new BrowserRuleSourceDownloader(),
  );
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''      historyService,
      rollbackService,
    );
''',
    '''      historyService,
      rollbackService,
      ruleSourceUpdateService,
    );
''',
)

# Permission requests must stay on the user gesture in Options.
replace_once(
    'apps/extension/src/lib/profile-workflow-client.ts',
    '''interface ProfileWorkflowClientApi {
  readonly runtime: {
    sendMessage(message: ProfileWorkflowCommand): Promise<unknown>;
  };
}
''',
    '''interface ProfileWorkflowClientApi {
  readonly runtime: {
    sendMessage(message: ProfileWorkflowCommand): Promise<unknown>;
  };
  readonly permissions?: {
    contains(permissions: { origins: string[] }): Promise<boolean>;
    request(permissions: { origins: string[] }): Promise<boolean>;
  };
}
''',
)
insert_before(
    'apps/extension/src/lib/profile-workflow-client.ts',
    'export async function sendProfileWorkflowCommand(\n',
    '''function permissionOrigin(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return `${parsed.protocol}//${parsed.hostname}/*`;
  } catch {
    return undefined;
  }
}

export async function requestRuleSourceOriginPermission(
  url: string,
  api: ProfileWorkflowClientApi = browser as unknown as ProfileWorkflowClientApi,
): Promise<boolean> {
  const origin = permissionOrigin(url);
  if (!origin || !api.permissions) return false;
  const permissions = { origins: [origin] };
  if (await api.permissions.contains(permissions)) return true;
  return api.permissions.request(permissions);
}

''',
)
