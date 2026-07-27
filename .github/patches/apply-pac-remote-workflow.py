from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:160]!r}')
    target.write_text(text.replace(old, new, 1))


# Commands: contract imports and PAC update service.
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  ProfileWorkflowApplyContext,
  ProfileWorkflowRepository,
  ProfileWorkflowRevisionHistoryEntry,
  ProfileWorkflowRuleSourceUpdateView,
''',
    '''  ProfileWorkflowApplyContext,
  ProfileWorkflowPacSourceUpdateView,
  ProfileWorkflowRepository,
  ProfileWorkflowRevisionHistoryEntry,
  ProfileWorkflowRuleSourceUpdateView,
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''import {
  inspectProfileWorkflowRuleSourceUpdate,
  updateProfileWorkflowRuleSource,
  type ProfileWorkflowRuleSourceUpdateService,
} from './rule-source-update.js';
''',
    '''import {
  inspectProfileWorkflowPacSourceUpdate,
  updateProfileWorkflowPacSource,
  type ProfileWorkflowPacSourceUpdateService,
} from './pac-source-update.js';
import {
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
      readonly action: 'update-rule-source';
      readonly expectedGeneration: number;
      readonly sourceId: string;
    }
''',
    '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'update-rule-source';
      readonly expectedGeneration: number;
      readonly sourceId: string;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'get-pac-source-update-status';
      readonly profileId: string;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'update-pac-source';
      readonly expectedGeneration: number;
      readonly profileId: string;
    }
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''      readonly revisionHistory?: readonly ProfileWorkflowRevisionHistoryEntry[];
      readonly ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView;
      readonly secretValue?: string;
''',
    '''      readonly revisionHistory?: readonly ProfileWorkflowRevisionHistoryEntry[];
      readonly ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView;
      readonly pacSourceUpdate?: ProfileWorkflowPacSourceUpdateView;
      readonly secretValue?: string;
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''        | 'rollback-failed'
        | 'rule-source-update-failed';
''',
    '''        | 'rollback-failed'
        | 'rule-source-update-failed'
        | 'pac-source-update-failed';
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''      readonly view?: ProfileWorkflowView;
      readonly ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView;
    };
''',
    '''      readonly view?: ProfileWorkflowView;
      readonly ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView;
      readonly pacSourceUpdate?: ProfileWorkflowPacSourceUpdateView;
    };
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''function responseWithRuleSourceUpdate(
  state: ProfileWorkflowState,
  update: ProfileWorkflowRuleSourceUpdateView,
): Extract<ProfileWorkflowCommandResponse, { readonly ok: true }> {
  return { ...response(state), ruleSourceUpdate: update };
}
''',
    '''function responseWithRuleSourceUpdate(
  state: ProfileWorkflowState,
  update: ProfileWorkflowRuleSourceUpdateView,
): Extract<ProfileWorkflowCommandResponse, { readonly ok: true }> {
  return { ...response(state), ruleSourceUpdate: update };
}

function responseWithPacSourceUpdate(
  state: ProfileWorkflowState,
  update: ProfileWorkflowPacSourceUpdateView,
): Extract<ProfileWorkflowCommandResponse, { readonly ok: true }> {
  return { ...response(state), pacSourceUpdate: update };
}
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  message: string,
  state?: ProfileWorkflowState,
  ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView,
): ProfileWorkflowCommandResponse {
''',
    '''  message: string,
  state?: ProfileWorkflowState,
  ruleSourceUpdate?: ProfileWorkflowRuleSourceUpdateView,
  pacSourceUpdate?: ProfileWorkflowPacSourceUpdateView,
): ProfileWorkflowCommandResponse {
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''    ...(ruleSourceUpdate === undefined ? {} : { ruleSourceUpdate }),
  };
}
''',
    '''    ...(ruleSourceUpdate === undefined ? {} : { ruleSourceUpdate }),
    ...(pacSourceUpdate === undefined ? {} : { pacSourceUpdate }),
  };
}
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''    case 'update-rule-source':
      return (
        validGeneration(record.expectedGeneration) &&
        typeof record.sourceId === 'string' &&
        record.sourceId.length > 0
      );
''',
    '''    case 'update-rule-source':
      return (
        validGeneration(record.expectedGeneration) &&
        typeof record.sourceId === 'string' &&
        record.sourceId.length > 0
      );
    case 'get-pac-source-update-status':
      return typeof record.profileId === 'string' && record.profileId.length > 0;
    case 'update-pac-source':
      return (
        validGeneration(record.expectedGeneration) &&
        typeof record.profileId === 'string' &&
        record.profileId.length > 0
      );
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  rollbackService?: ProfileWorkflowSnapshotRollbackService,
  ruleSourceUpdateService?: ProfileWorkflowRuleSourceUpdateService,
  externalProfileService?: ProfileWorkflowExternalProfileService,
''',
    '''  rollbackService?: ProfileWorkflowSnapshotRollbackService,
  ruleSourceUpdateService?: ProfileWorkflowRuleSourceUpdateService,
  externalProfileService?: ProfileWorkflowExternalProfileService,
  pacSourceUpdateService?: ProfileWorkflowPacSourceUpdateService,
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
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
    '''  if (command.action === 'get-rule-source-update-status') {
    if (!ruleSourceUpdateService) {
      return failure('invalid', 'Rule Source update service is unavailable', state);
    }
    const update = inspectProfileWorkflowRuleSourceUpdate(state, command.sourceId);
    return update === undefined
      ? failure('invalid', `Rule Source ${command.sourceId} is not a remote URL source`, state)
      : responseWithRuleSourceUpdate(state, update);
  }

  if (command.action === 'get-pac-source-update-status') {
    if (!pacSourceUpdateService) {
      return failure('invalid', 'PAC update service is unavailable', state);
    }
    const update = inspectProfileWorkflowPacSourceUpdate(state, command.profileId);
    return update === undefined
      ? failure('invalid', `PAC profile ${command.profileId} is not a remote URL source`, state)
      : responseWithPacSourceUpdate(state, update);
  }
''',
)
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  if (command.action === 'read-secret') {
''',
    '''  if (command.action === 'update-pac-source') {
    if (!pacSourceUpdateService) {
      return failure('invalid', 'PAC update service is unavailable', state);
    }
    const result = await updateProfileWorkflowPacSource(
      repository,
      state,
      command.profileId,
      pacSourceUpdateService,
    );
    if (result.status === 'updated') {
      return responseWithPacSourceUpdate(result.state, result.update);
    }
    const code =
      result.status === 'conflict'
        ? 'conflict'
        : result.status === 'storage-failure'
          ? 'storage-failure'
          : result.status === 'invalid'
            ? 'invalid'
            : 'pac-source-update-failed';
    return failure(code, result.message, result.state, undefined, result.update);
  }

  if (command.action === 'read-secret') {
''',
)

# Runtime wiring: same bounded downloader and secret store.
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''  type ProfileWorkflowInitializer,
  type ProfileWorkflowRuleSourceDownloader,
''',
    '''  type ProfileWorkflowInitializer,
  type ProfileWorkflowPacSourceUpdateService,
  type ProfileWorkflowRuleSourceDownloader,
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''function createRuleSourceUpdateService(
  importService: ProfileWorkflowImportService,
  downloader: ProfileWorkflowRuleSourceDownloader,
): ProfileWorkflowRuleSourceUpdateService {
''',
    '''function createRuleSourceUpdateService(
  importService: ProfileWorkflowImportService,
  downloader: ProfileWorkflowRuleSourceDownloader,
): ProfileWorkflowRuleSourceUpdateService & ProfileWorkflowPacSourceUpdateService {
''',
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    '''      ruleSourceUpdateService,
      externalProfileService,
    );
''',
    '''      ruleSourceUpdateService,
      externalProfileService,
      ruleSourceUpdateService,
    );
''',
)

# Scheduler: scan Rule Sources and PAC URLs with one alarm/coalescing lock.
replace_once(
    'apps/extension/src/lib/rule-source-scheduler.ts',
    '''import {
  listDueProfileWorkflowRuleSourceUpdates,
  updateProfileWorkflowRuleSource,
''',
    '''import {
  listDueProfileWorkflowPacSourceUpdates,
  listDueProfileWorkflowRuleSourceUpdates,
  updateProfileWorkflowPacSource,
  updateProfileWorkflowRuleSource,
''',
)
replace_once(
    'apps/extension/src/lib/rule-source-scheduler.ts',
    '''  readonly updateService: ProfileWorkflowRuleSourceUpdateService;
''',
    '''  readonly updateService: ProfileWorkflowRuleSourceUpdateService;
''',
)
# Replace scan body with tagged due items.
replace_once(
    'apps/extension/src/lib/rule-source-scheduler.ts',
    '''  const dueSourceIds = listDueProfileWorkflowRuleSourceUpdates(initial, now).map(
    (source) => source.sourceId,
  );
  const counts = {
    considered: dueSourceIds.length,
''',
    '''  const dueItems = [
    ...listDueProfileWorkflowRuleSourceUpdates(initial, now).map((source) => ({
      kind: 'rule-source' as const,
      id: source.sourceId,
      url: source.url,
    })),
    ...listDueProfileWorkflowPacSourceUpdates(initial, now).map((source) => ({
      kind: 'pac' as const,
      id: source.profileId,
      url: source.url,
    })),
  ];
  const counts = {
    considered: dueItems.length,
''',
)
replace_once(
    'apps/extension/src/lib/rule-source-scheduler.ts',
    '''  for (const sourceId of dueSourceIds) {
    const current = await options.repository.read();
    if (!current) break;
    const currentNow = options.now?.() ?? new Date().toISOString();
    const due = listDueProfileWorkflowRuleSourceUpdates(current, currentNow).find(
      (candidate) => candidate.sourceId === sourceId,
    );
    if (!due) continue;

    const origin = permissionOrigin(due.url);
''',
    '''  for (const item of dueItems) {
    const current = await options.repository.read();
    if (!current) break;
    const currentNow = options.now?.() ?? new Date().toISOString();
    const due =
      item.kind === 'rule-source'
        ? listDueProfileWorkflowRuleSourceUpdates(current, currentNow).find(
            (candidate) => candidate.sourceId === item.id,
          )
        : listDueProfileWorkflowPacSourceUpdates(current, currentNow).find(
            (candidate) => candidate.profileId === item.id,
          );
    if (!due) continue;

    const origin = permissionOrigin(due.url);
''',
)
replace_once(
    'apps/extension/src/lib/rule-source-scheduler.ts',
    '''    const result = await updateProfileWorkflowRuleSource(
      options.repository,
      current,
      sourceId,
      options.updateService,
    );
''',
    '''    const result =
      item.kind === 'rule-source'
        ? await updateProfileWorkflowRuleSource(
            options.repository,
            current,
            item.id,
            options.updateService,
          )
        : await updateProfileWorkflowPacSource(
            options.repository,
            current,
            item.id,
            options.updateService,
          );
''',
)
