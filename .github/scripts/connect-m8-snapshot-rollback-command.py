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
            '''import {
  createProfileWorkflowState,''',
            '''import {
  rollbackProfileWorkflowSnapshot,
  type ProfileWorkflowSnapshotRollbackService,
} from './snapshot-rollback.js';
import {
  createProfileWorkflowState,''',
            'snapshot rollback imports',
        ),
        (
            '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'revert' | 'apply';
      readonly expectedGeneration: number;
    }
  | {''',
            '''  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'revert' | 'apply';
      readonly expectedGeneration: number;
    }
  | {
      readonly channel: typeof PROFILE_WORKFLOW_MESSAGE_CHANNEL;
      readonly action: 'rollback-snapshot';
      readonly expectedGeneration: number;
      readonly snapshotId: string;
    }
  | {''',
            'snapshot rollback command',
        ),
        (
            "        | 'activation-failed';",
            "        | 'activation-failed'\n        | 'rollback-failed';",
            'rollback failure response code',
        ),
        (
            '''    case 'revert':
    case 'apply':
      return validGeneration(record.expectedGeneration);''',
            '''    case 'revert':
    case 'apply':
      return validGeneration(record.expectedGeneration);
    case 'rollback-snapshot':
      return (
        validGeneration(record.expectedGeneration) &&
        typeof record.snapshotId === 'string' &&
        record.snapshotId.length > 0
      );''',
            'rollback command validation',
        ),
        (
            '''  importService?: ProfileWorkflowImportService,
  historyService?: ProfileWorkflowHistoryService,
): Promise<ProfileWorkflowCommandResponse> {''',
            '''  importService?: ProfileWorkflowImportService,
  historyService?: ProfileWorkflowHistoryService,
  rollbackService?: ProfileWorkflowSnapshotRollbackService,
): Promise<ProfileWorkflowCommandResponse> {''',
            'rollback service execution parameter',
        ),
        (
            '''  if (command.action === 'apply') {
    if (!applyService) {''',
            '''  if (command.action === 'rollback-snapshot') {
    if (!rollbackService) {
      return failure(
        'invalid',
        'profile workflow snapshot rollback service is unavailable',
        state,
      );
    }
    const result = await rollbackProfileWorkflowSnapshot(
      repository,
      state,
      command.snapshotId,
      rollbackService,
    );
    if (result.status === 'rolled-back') {
      return response(
        result.state,
        result.snapshotId,
        await runtimeView(applyService),
      );
    }
    return failure(
      result.status === 'busy'
        ? 'busy'
        : result.status === 'conflict'
          ? 'conflict'
          : result.status === 'invalid'
            ? 'invalid'
            : result.status === 'rollback-failed'
              ? 'rollback-failed'
              : 'activation-failed',
      result.message,
      result.state,
    );
  }

  if (command.action === 'apply') {
    if (!applyService) {''',
            'rollback command execution',
        ),
    ],
)

patch(
    'packages/profile-workflow/src/index.ts',
    [
        (
            '''export {
  createProfileWorkflowCandidate,''',
            '''export {
  rollbackProfileWorkflowSnapshot,
  type ProfileWorkflowSnapshotRollbackPreparation,
  type ProfileWorkflowSnapshotRollbackResult,
  type ProfileWorkflowSnapshotRollbackService,
} from './snapshot-rollback.js';
export {
  createProfileWorkflowCandidate,''',
            'snapshot rollback exports',
        )
    ],
)
