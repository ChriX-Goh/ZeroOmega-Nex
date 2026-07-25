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
    "  import LegacyImportPanel from './LegacyImportPanel.svelte';\n  import SwitchProfileEditor from './SwitchProfileEditor.svelte';",
    "  import LegacyImportPanel from './LegacyImportPanel.svelte';\n  import SnapshotHistoryPanel from './SnapshotHistoryPanel.svelte';\n  import SwitchProfileEditor from './SwitchProfileEditor.svelte';",
    'snapshot history panel import',
)

replace_once(
    "  type OptionsSection = 'profiles' | 'import';",
    "  type OptionsSection = 'profiles' | 'import' | 'history';",
    'history section type',
)

replace_once(
    '''      <button type="button" disabled>Interface</button>
      <button type="button" disabled>About</button>''',
    '''      <button
        type="button"
        class:active={activeSection === 'history'}
        disabled={!state || saving || view?.busy}
        on:click={() => (activeSection = 'history')}>Snapshot History</button
      >
      <button type="button" disabled>Interface</button>
      <button type="button" disabled>About</button>''',
    'history navigation button',
)

replace_once(
    '''    {:else if activeSection === 'import' && state}
      <header class="editor-heading">''',
    '''    {:else if activeSection === 'history' && state}
      <header class="editor-heading">
        <div class="profile-title">
          <div>
            <h1>Snapshot History</h1>
            <p>Inspect verified PAC snapshots without exposing PAC source or secret material.</p>
          </div>
        </div>
      </header>
      <SnapshotHistoryPanel disabled={saving || view?.busy === true} />
    {:else if activeSection === 'import' && state}
      <header class="editor-heading">''',
    'history editor branch',
)

path.write_text(text)
