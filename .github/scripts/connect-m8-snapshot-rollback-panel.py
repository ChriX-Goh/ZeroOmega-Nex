from pathlib import Path

path = Path('apps/extension/src/entrypoints/options/App.svelte')
text = path.read_text()


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    text = text.replace(old, new, 1)


replace_once(
    '''  async function acceptImportedDraft(
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    return runCommand({
      action: 'accept-import',
      expectedGeneration,
      candidate,
      secretMaterials,
    });
  }
''',
    '''  async function acceptImportedDraft(
    expectedGeneration: number,
    candidate: ProfileSpec,
    secretMaterials: readonly ProfileWorkflowSecretMaterial[],
  ): Promise<boolean> {
    return runCommand({
      action: 'accept-import',
      expectedGeneration,
      candidate,
      secretMaterials,
    });
  }

  async function rollbackSnapshot(
    expectedGeneration: number,
    snapshotId: string,
  ): Promise<boolean> {
    return runCommand({
      action: 'rollback-snapshot',
      expectedGeneration,
      snapshotId,
    });
  }
''',
    'snapshot rollback callback',
)

replace_once(
    '''            <h1>Snapshot History</h1>
            <p>Inspect verified PAC snapshots without exposing PAC source or secret material.</p>''',
    '''            <h1>Configuration History</h1>
            <p>Inspect revisions and verified PAC snapshots, or restore a previous verified state.</p>''',
    'configuration history heading',
)

replace_once(
    '''      <SnapshotHistoryPanel disabled={saving || view?.busy === true} />''',
    '''      <SnapshotHistoryPanel
        disabled={saving || view?.busy === true}
        dirty={view?.dirty === true}
        generation={state.generation}
        onRollbackSnapshot={rollbackSnapshot}
      />''',
    'snapshot rollback panel props',
)

path.write_text(text)
