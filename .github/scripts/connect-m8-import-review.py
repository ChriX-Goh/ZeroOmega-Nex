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
    'apps/extension/package.json',
    [
        (
            '    "@zeroomega-nex/core-contracts": "workspace:*",\n    "@zeroomega-nex/pac-compiler": "workspace:*",',
            '    "@zeroomega-nex/core-contracts": "workspace:*",\n    "@zeroomega-nex/legacy-zeroomega": "workspace:*",\n    "@zeroomega-nex/pac-compiler": "workspace:*",',
            'legacy importer dependency',
        )
    ],
)

patch(
    'pnpm-lock.yaml',
    [
        (
            "      '@zeroomega-nex/core-contracts':\n        specifier: workspace:*\n        version: link:../../packages/core-contracts\n      '@zeroomega-nex/pac-compiler':",
            "      '@zeroomega-nex/core-contracts':\n        specifier: workspace:*\n        version: link:../../packages/core-contracts\n      '@zeroomega-nex/legacy-zeroomega':\n        specifier: workspace:*\n        version: link:../../packages/legacy-zeroomega\n      '@zeroomega-nex/pac-compiler':",
            'legacy importer lock entry',
        )
    ],
)

patch(
    'apps/extension/src/entrypoints/options/App.svelte',
    [
        (
            "  import AdvancedProfileEditor from './AdvancedProfileEditor.svelte';\n  import SwitchProfileEditor from './SwitchProfileEditor.svelte';",
            "  import AdvancedProfileEditor from './AdvancedProfileEditor.svelte';\n  import LegacyImportPanel from './LegacyImportPanel.svelte';\n  import SwitchProfileEditor from './SwitchProfileEditor.svelte';",
            'import panel component import',
        ),
        (
            "  let state: ProfileWorkflowState | undefined;",
            "  type OptionsSection = 'profiles' | 'import';\n\n  let activeSection: OptionsSection = 'profiles';\n  let state: ProfileWorkflowState | undefined;",
            'options section state',
        ),
        (
            '''  async function selectProfile(profileId: string): Promise<void> {
    if (!state || state.selectedProfileId === profileId) return;
''',
            '''  async function selectProfile(profileId: string): Promise<void> {
    activeSection = 'profiles';
    if (!state || state.selectedProfileId === profileId) return;
''',
            'profile section selection',
        ),
        (
            '''      <button type="button" disabled>Import / Export</button>''',
            '''      <button
        type="button"
        class:active={activeSection === 'import'}
        disabled={!state || saving || view?.busy}
        on:click={() => (activeSection = 'import')}>Import / Export</button
      >''',
            'import navigation button',
        ),
        (
            '''    {:else if selectedProfile && state}
      <header class="editor-heading">''',
            '''    {:else if activeSection === 'import' && state}
      <header class="editor-heading">
        <div class="profile-title">
          <div>
            <h1>Import / Export</h1>
            <p>Review legacy backups before they enter the Draft working copy.</p>
          </div>
        </div>
      </header>
      <LegacyImportPanel
        disabled={saving || view?.busy === true}
        onReplaceDraft={replaceDraft}
      />
    {:else if selectedProfile && state}
      <header class="editor-heading">''',
            'import editor branch',
        ),
    ],
)
