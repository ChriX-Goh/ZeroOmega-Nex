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
            '  ProfileWorkflowRepository,\n  ProfileWorkflowRuntimeView,',
            '  ProfileWorkflowRepository,\n  ProfileWorkflowRevisionHistoryEntry,\n  ProfileWorkflowRuntimeView,',
            'revision history contract import',
        ),
        (
            '''      readonly snapshotHistory?: readonly ProfileWorkflowSnapshotHistoryEntry[];
    }''',
            '''      readonly snapshotHistory?: readonly ProfileWorkflowSnapshotHistoryEntry[];
      readonly revisionHistory?: readonly ProfileWorkflowRevisionHistoryEntry[];
    }''',
            'revision history response field',
        ),
        (
            '''export interface ProfileWorkflowHistoryService {
  listSnapshots(): Promise<readonly ProfileWorkflowSnapshotHistoryEntry[]>;
}''',
            '''export interface ProfileWorkflowHistoryService {
  listSnapshots(): Promise<readonly ProfileWorkflowSnapshotHistoryEntry[]>;
  listRevisions(
    state: ProfileWorkflowState,
  ): Promise<readonly ProfileWorkflowRevisionHistoryEntry[]>;
}''',
            'revision history service method',
        ),
        (
            '''  runtime?: ProfileWorkflowRuntimeView,
  snapshotHistory?: readonly ProfileWorkflowSnapshotHistoryEntry[],
): ProfileWorkflowCommandResponse {''',
            '''  runtime?: ProfileWorkflowRuntimeView,
  snapshotHistory?: readonly ProfileWorkflowSnapshotHistoryEntry[],
  revisionHistory?: readonly ProfileWorkflowRevisionHistoryEntry[],
): ProfileWorkflowCommandResponse {''',
            'revision history response signature',
        ),
        (
            '''    ...(snapshotHistory === undefined ? {} : { snapshotHistory }),
  };''',
            '''    ...(snapshotHistory === undefined ? {} : { snapshotHistory }),
    ...(revisionHistory === undefined ? {} : { revisionHistory }),
  };''',
            'revision history response payload',
        ),
        (
            '''        await runtimeView(applyService),
        await historyService.listSnapshots(),
      );''',
            '''        await runtimeView(applyService),
        await historyService.listSnapshots(),
        await historyService.listRevisions(state),
      );''',
            'revision history query execution',
        ),
    ],
)

patch(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    [
        (
            '''  BrowserStorageProfileWorkflowRepository,
  createDefaultProfileSpec,''',
            '''  BrowserStorageProfileWorkflowRepository,
  createDefaultProfileSpec,
  listProfileWorkflowRevisionHistory,''',
            'revision history function import',
        ),
        (
            '''function createHistoryService(): ProfileWorkflowHistoryService {
  return {''',
            '''function createHistoryService(
  repository: BrowserStorageProfileWorkflowRepository,
): ProfileWorkflowHistoryService {
  return {''',
            'history service repository parameter',
        ),
        (
            '''      } finally {
        runtime.dispose();
      }
    },
  };
}''',
            '''      } finally {
        runtime.dispose();
      }
    },
    listRevisions: (state) => listProfileWorkflowRevisionHistory(repository, state),
  };
}''',
            'revision history service implementation',
        ),
        (
            '  const historyService = createHistoryService();',
            '  const historyService = createHistoryService(repository);',
            'history service repository wiring',
        ),
    ],
)
