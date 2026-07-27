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
    '''export function subscribeProfileWorkflowStateChanges(
  listener: () => void,
''',
    '''export function subscribeProfileWorkflowStateChanges(
  listener: (value: unknown | undefined) => void,
''',
)
replace_once(
    client,
    '''      listener();
''',
    '''      listener(changes[PROFILE_WORKFLOW_STATE_STORAGE_KEY]?.newValue);
''',
)

app = 'apps/extension/src/entrypoints/options/App.svelte'
replace_once(
    app,
    '''    deleteProfileDraft,
    duplicateProfileDraft,
''',
    '''    deleteProfileDraft,
    duplicateProfileDraft,
    inspectProfileWorkflow,
    parseProfileWorkflowState,
''',
)
replace_once(
    app,
    '''  let profileEditorEpoch = 0;
  let hasUnappliedChanges = false;
  let workflowRefreshPending = false;
  let workflowRefreshRunning: Promise<void> | undefined;
''',
    '''  let profileEditorEpoch = 0;
  let hasUnappliedChanges = false;
''',
)
start = '''  async function refreshWorkflowFromStorage(): Promise<void> {
'''
end = '''  async function loadWorkflow(): Promise<void> {
'''
source = Path(app).read_text()
start_index = source.find(start)
end_index = source.find(end, start_index)
if start_index < 0 or end_index < 0:
    raise SystemExit('Options refresh helper block was not found')
source = source[:start_index] + end + source[end_index + len(end):]
if source.count('''    } finally {
      finishSaving();
    }
''') != 4:
    raise SystemExit('Options finishSaving replacement count is not four')
source = source.replace(
    '''    } finally {
      finishSaving();
    }
''',
    '''    } finally {
      saving = false;
    }
''',
)
Path(app).write_text(source)
replace_once(
    app,
    '''    void loadWorkflow().then(async () => {
      if (disposed) return;
      unsubscribeWorkflowChanges = subscribeProfileWorkflowStateChanges(() => {
        void refreshWorkflowFromStorage();
      });
      await refreshWorkflowFromStorage();
      if (!disposed) await syncNavigationFromLocation();
    });
''',
    '''    unsubscribeWorkflowChanges = subscribeProfileWorkflowStateChanges((value) => {
      if (value === undefined) {
        void loadWorkflow();
        return;
      }
      try {
        const nextState = parseProfileWorkflowState(value);
        state = nextState;
        view = inspectProfileWorkflow(nextState);
        errorMessage = '';
      } catch (error) {
        errorMessage = messageFrom(error);
      }
    });
    void loadWorkflow().then(() => {
      if (!disposed) void syncNavigationFromLocation();
    });
''',
)

# The listener unit test may pass opaque values; also assert payload forwarding.
test = 'apps/extension/src/lib/profile-workflow-client.test.ts'
replace_once(
    test,
    '''    let calls = 0;
    const dispose = subscribeProfileWorkflowStateChanges(
      () => {
        calls += 1;
      },
''',
    '''    const values: unknown[] = [];
    const dispose = subscribeProfileWorkflowStateChanges(
      (value) => {
        values.push(value);
      },
''',
)
replace_once(test, 'expect(calls).toBe(0);', 'expect(values).toEqual([]);')
replace_once(test, 'expect(calls).toBe(1);', 'expect(values).toEqual([3]);')
replace_once(
    test,
    '''    expect(calls).toBe(1);
  });
''',
    '''    expect(values).toEqual([3]);
  });
''',
)

# Replace the earlier async-refresh guard with the synchronous validated-state contract.
guard = 'scripts/validate-ui-compatibility.mjs'
replace_once(
    guard,
    '''      optionsApp.includes('refreshWorkflowFromStorage') &&
      optionsApp.includes('workflowRefreshPending') &&
      optionsApp.includes('subscribeProfileWorkflowStateChanges') &&
      optionsApp.includes('finishSaving()'),
    'Options must synchronize background workflow generation changes without overwriting the persistent Switch source editor instance.',
''',
    '''      workflowClient.includes('changes[PROFILE_WORKFLOW_STATE_STORAGE_KEY]?.newValue') &&
      optionsApp.includes('parseProfileWorkflowState(value)') &&
      optionsApp.includes('inspectProfileWorkflow(nextState)') &&
      optionsApp.includes('subscribeProfileWorkflowStateChanges') &&
      !optionsApp.includes('workflowRefreshPending'),
    'Options must synchronously consume validated background workflow-state changes without interrupting chained commands or rebuilding the persistent Switch source editor instance.',
''',
)

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
old = '- Options observes local workflow-state changes from the background, refreshes its generation through a read-only command, and queues refreshes during local writes. The persistent Switch source editor keeps its local text while receiving the newer backing spec, so a later commit merges against current cached Rule Source state.'
new = '- Options observes local workflow-state changes from the background and strictly parses the event payload into current state/view without issuing another command. This avoids interrupting chained operations such as import-and-apply, while the persistent Switch source editor keeps local text and receives the newer backing spec for conflict-free commits.'
if text.count(old) != 1:
    raise SystemExit(f'status chain-race evidence match count: {text.count(old)}')
status.write_text(text.replace(old, new))

knowledge = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
text = knowledge.read_text()
old = 'Options 通过 `storage.onChanged` 监听本地 workflow state，并用只读 `get` 同步 generation；本地写入期间合并刷新，Switch 源码编辑器实例不重建，因此本地源码文本可在最新 backing spec 上提交。'
new = 'Options 通过 `storage.onChanged` 监听本地 workflow state，严格解析事件携带的新状态并同步 view，不插入额外命令；因此不会打断 import-and-apply 等链式操作。Switch 源码编辑器实例不重建，本地源码文本可在最新 backing spec 上提交。'
if text.count(old) != 1:
    raise SystemExit(f'knowledge chain-race evidence match count: {text.count(old)}')
knowledge.write_text(text.replace(old, new))
