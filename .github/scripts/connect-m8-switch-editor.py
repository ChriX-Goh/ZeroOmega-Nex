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
    '    ProxyEndpoint,\n    UserProfile,',
    '    ProxyEndpoint,\n    SwitchProfile,\n    UserProfile,',
    'SwitchProfile type import',
)
replace_once(
    '    createFixedProfileDraft,\n    deleteProfileDraft,',
    '    createFixedProfileDraft,\n    createSwitchProfileDraft,\n    deleteProfileDraft,',
    'createSwitchProfileDraft import',
)
replace_once(
    "  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';",
    "  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';\n  import SwitchProfileEditor from './SwitchProfileEditor.svelte';",
    'SwitchProfileEditor component import',
)
replace_once(
    '  let fixedProfile: FixedProfile | undefined;\n  let endpoint: ProxyEndpoint | undefined;',
    '  let fixedProfile: FixedProfile | undefined;\n  let switchProfile: SwitchProfile | undefined;\n  let endpoint: ProxyEndpoint | undefined;',
    'switch profile state',
)
replace_once(
    "  $: fixedProfile = selectedProfile?.kind === 'fixed' ? selectedProfile : undefined;\n  $: endpoint = fixedProfile && state ? findEndpoint(state.draft, fixedProfile) : undefined;",
    "  $: fixedProfile = selectedProfile?.kind === 'fixed' ? selectedProfile : undefined;\n  $: switchProfile = selectedProfile?.kind === 'switch' ? selectedProfile : undefined;\n  $: endpoint = fixedProfile && state ? findEndpoint(state.draft, fixedProfile) : undefined;",
    'switch profile derivation',
)
replace_once(
    '''  async function createProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createFixedProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }
''',
    '''  async function createFixedProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createFixedProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function createSwitchProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createSwitchProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }
''',
    'profile creation functions',
)
replace_once(
    '''    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New profile</span>
    </button>
''',
    '''    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createFixedProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New fixed profile</span>
    </button>
    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createSwitchProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New switch profile</span>
    </button>
''',
    'profile creation buttons',
)
replace_once(
    '''      {:else}
        <section class="settings-section">
          <h2>{profileType(selectedProfile)} editor</h2>
          <p class="section-help">
            This ProfileSpec is real and selectable. Its specialized editor follows after the Fixed
            Profile workflow is verified.
          </p>
        </section>
      {/if}
''',
    '''      {:else if switchProfile}
        <SwitchProfileEditor
          spec={state.draft}
          profileId={switchProfile.id}
          disabled={saving || view?.busy}
          idFactory={createWorkflowId}
          onReplaceDraft={replaceDraft}
        />
      {:else}
        <section class="settings-section">
          <h2>{profileType(selectedProfile)} editor</h2>
          <p class="section-help">
            This ProfileSpec is real and selectable. Its specialized editor is not implemented yet.
          </p>
        </section>
      {/if}
''',
    'Switch Profile editor branch',
)

path.write_text(text)
