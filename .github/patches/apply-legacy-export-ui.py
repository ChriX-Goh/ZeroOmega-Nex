from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:140]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """  async function applyDraft(): Promise<void> {
    if (!state || !hasUnappliedChanges || !(await commitActiveProfileEditor())) return;
    if (!view?.dirty) return;
    await runCommand({
      action: 'apply',
      expectedGeneration: state.generation,
    });
  }

  function applyStatus(): string {""",
    """  async function applyDraft(): Promise<void> {
    if (!state || !hasUnappliedChanges || !(await commitActiveProfileEditor())) return;
    if (!view?.dirty) return;
    await runCommand({
      action: 'apply',
      expectedGeneration: state.generation,
    });
  }

  async function prepareLegacyExport(): Promise<ProfileSpec | undefined> {
    if (!state || saving || view?.busy || !(await commitActiveProfileEditor())) return undefined;
    if (view?.dirty) {
      const confirmed = globalThis.confirm(
        'Apply current changes before exporting the Options backup?',
      );
      if (!confirmed) return undefined;
      const applied = await runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
      if (!applied) return undefined;
    }
    return state ? structuredClone(state.applied) : undefined;
  }

  function applyStatus(): string {""",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """        deviceId={state.applied.revision.deviceId ?? 'zeroomega-nex-extension'}
        onAcceptImport={acceptImportedDraft}""",
    """        deviceId={state.applied.revision.deviceId ?? 'zeroomega-nex-extension'}
        onPrepareExport={prepareLegacyExport}
        onAcceptImport={acceptImportedDraft}""",
)
