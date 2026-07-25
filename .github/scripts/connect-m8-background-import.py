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
    '    ProfileWorkflowProfileMutation,\n    ProfileWorkflowState,',
    '    ProfileWorkflowProfileMutation,\n    ProfileWorkflowSecretMaterial,\n    ProfileWorkflowState,',
    'import secret material type',
)

replace_once(
    '''  async function replaceDraft(draft: ProfileSpec): Promise<boolean> {
    if (!state) return false;
    return runCommand({
      action: 'replace-draft',
      expectedGeneration: state.generation,
      draft,
    });
  }
''',
    '''  async function replaceDraft(draft: ProfileSpec): Promise<boolean> {
    if (!state) return false;
    return runCommand({
      action: 'replace-draft',
      expectedGeneration: state.generation,
      draft,
    });
  }

  async function acceptImportedDraft(
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
    'background import callback',
)

replace_once(
    '''      <LegacyImportPanel disabled={saving || view?.busy === true} onReplaceDraft={replaceDraft} />''',
    '''      <LegacyImportPanel
        disabled={saving || view?.busy === true}
        generation={state.generation}
        deviceId={state.applied.revision.deviceId ?? 'zeroomega-nex-extension'}
        onAcceptImport={acceptImportedDraft}
      />''',
    'legacy import panel props',
)

path.write_text(text)
