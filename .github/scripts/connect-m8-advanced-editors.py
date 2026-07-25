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
    'packages/profile-workflow/src/profile-operations.ts',
    [
        (
            "export type ProfileWorkflowIdKind = 'profile' | 'endpoint' | 'bypass' | 'rule';",
            "export type ProfileWorkflowIdKind = 'profile' | 'endpoint' | 'bypass' | 'rule' | 'source';",
            'source identifier kind',
        )
    ],
)

patch(
    'packages/profile-workflow/src/index.ts',
    [
        (
            "export { applyProfileWorkflow } from './apply.js';",
            "export {\n  createAutoDetectProfileDraft,\n  createPacProfileDraft,\n  createRuleListProfileDraft,\n} from './advanced-profile-operations.js';\nexport { applyProfileWorkflow } from './apply.js';",
            'advanced operation exports',
        )
    ],
)

app_replacements = [
    (
        '    createFixedProfileDraft,\n    createSwitchProfileDraft,',
        '    createAutoDetectProfileDraft,\n    createFixedProfileDraft,\n    createPacProfileDraft,\n    createRuleListProfileDraft,\n    createSwitchProfileDraft,',
        'advanced creation imports',
    ),
    (
        "  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';\n  import SwitchProfileEditor from './SwitchProfileEditor.svelte';",
        "  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';\n  import AdvancedProfileEditor from './AdvancedProfileEditor.svelte';\n  import SwitchProfileEditor from './SwitchProfileEditor.svelte';",
        'advanced editor component import',
    ),
    (
        '''  async function createSwitchProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createSwitchProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }
''',
        '''  async function createSwitchProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createSwitchProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function createRuleListProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createRuleListProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function createPacProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createPacProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function createAutoDetectProfile(): Promise<void> {
    if (!state) return;
    try {
      await replaceDraftAndSelect(createAutoDetectProfileDraft(state.draft, createWorkflowId));
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }
''',
        'advanced creation functions',
    ),
    (
        '''    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createSwitchProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New switch profile</span>
    </button>
''',
        '''    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createSwitchProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New switch profile</span>
    </button>
    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createRuleListProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New rule list</span>
    </button>
    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createPacProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New PAC profile</span>
    </button>
    <button
      type="button"
      class="add-profile"
      disabled={!state || view?.busy || saving}
      on:click={createAutoDetectProfile}
    >
      <span aria-hidden="true">＋</span>
      <span>New auto-detect profile</span>
    </button>
''',
        'advanced creation buttons',
    ),
    (
        '''      {:else}
        <section class="settings-section">
          <h2>{profileType(selectedProfile)} editor</h2>
          <p class="section-help">
            This ProfileSpec is real and selectable. Its specialized editor is not implemented yet.
          </p>
        </section>
      {/if}
''',
        '''      {:else if
        selectedProfile.kind === 'rule-list' ||
        selectedProfile.kind === 'pac' ||
        selectedProfile.kind === 'auto-detect'}
        <AdvancedProfileEditor
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
      {/if}
''',
        'advanced editor branch',
    ),
]
patch('apps/extension/src/entrypoints/options/App.svelte', app_replacements)
