from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(source.replace(old, new))


# App-level typed command callbacks and host-permission user gesture.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''    ProfileWorkflowSecretMaterial,
    ProfileWorkflowState,
''',
    '''    ProfileWorkflowRuleSourceUpdateView,
    ProfileWorkflowSecretMaterial,
    ProfileWorkflowState,
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';\n",
    '''  import {
    requestRuleSourceOriginPermission,
    sendProfileWorkflowCommand,
  } from '../../lib/profile-workflow-client';
''',
)
marker = '''  async function acceptImportedAndApply(
'''
addition = '''  async function getRuleSourceUpdateStatus(
    sourceId: string,
  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-rule-source-update-status',
        sourceId,
      });
      acceptResponse(response);
      return response.ruleSourceUpdate;
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    } finally {
      saving = false;
    }
  }

  async function updateRuleSource(
    sourceId: string,
    url: string,
  ): Promise<ProfileWorkflowRuleSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    let granted = false;
    try {
      granted = await requestRuleSourceOriginPermission(url);
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    }
    if (!granted) {
      errorMessage = 'Host permission is required before downloading this Rule List URL.';
      return undefined;
    }
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'update-rule-source',
        expectedGeneration: state.generation,
        sourceId,
      });
      acceptResponse(response);
      return response.ruleSourceUpdate;
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    } finally {
      saving = false;
    }
  }

'''
replace_once('apps/extension/src/entrypoints/options/App.svelte', marker, addition + marker)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''            onReplaceDraft={replaceDraft}
            onRegisterBeforeAction={registerBeforeProfileEditorAction}
            onSourceDirtyChange={updateProfileEditorDirty}
''',
    '''            onReplaceDraft={replaceDraft}
            onGetRuleSourceUpdateStatus={getRuleSourceUpdateStatus}
            onUpdateRuleSource={updateRuleSource}
            onRegisterBeforeAction={registerBeforeProfileEditorAction}
            onSourceDirtyChange={updateProfileEditorDirty}
''',
)

# Forward callbacks through the Switch editor.
replace_once(
    'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
    '''    type ProfileWorkflowIdFactory,
    type SwitchSourceError,
''',
    '''    type ProfileWorkflowIdFactory,
    type ProfileWorkflowRuleSourceUpdateView,
    type SwitchSourceError,
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
    '''  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onRegisterBeforeAction: (guard: (() => Promise<boolean>) | undefined) => void;
''',
    '''  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onGetRuleSourceUpdateStatus: (
    sourceId: string,
  ) => Promise<ProfileWorkflowRuleSourceUpdateView | undefined> = async () => undefined;
  export let onUpdateRuleSource: (
    sourceId: string,
    url: string,
  ) => Promise<ProfileWorkflowRuleSourceUpdateView | undefined> = async () => undefined;
  export let onRegisterBeforeAction: (guard: (() => Promise<boolean>) | undefined) => void;
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
    '''    <AttachedRuleListConfig {spec} switchProfileId={profileId} {disabled} {onReplaceDraft} />
''',
    '''    <AttachedRuleListConfig
      {spec}
      switchProfileId={profileId}
      {disabled}
      {onReplaceDraft}
      {onGetRuleSourceUpdateStatus}
      {onUpdateRuleSource}
    />
''',
)

# Remote source status, manual update button, and preserved-cache messaging.
path = Path('apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte')
source = path.read_text()
source = source.replace(
    '''    type RuleSourceHeader,
  } from '@zeroomega-nex/profile-spec';
  import { inspectAttachedRuleList } from '@zeroomega-nex/profile-workflow';
''',
    '''    type RuleSourceHeader,
  } from '@zeroomega-nex/profile-spec';
  import {
    inspectAttachedRuleList,
    type ProfileWorkflowRuleSourceUpdateView,
  } from '@zeroomega-nex/profile-workflow';
''',
)
source = source.replace(
    '''  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;

  let state = inspectAttachedRuleList(spec, switchProfileId);
  let headerItems: readonly RuleSourceHeader[] = [];
''',
    '''  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onGetRuleSourceUpdateStatus: (
    sourceId: string,
  ) => Promise<ProfileWorkflowRuleSourceUpdateView | undefined> = async () => undefined;
  export let onUpdateRuleSource: (
    sourceId: string,
    url: string,
  ) => Promise<ProfileWorkflowRuleSourceUpdateView | undefined> = async () => undefined;

  let state = inspectAttachedRuleList(spec, switchProfileId);
  let headerItems: readonly RuleSourceHeader[] = [];
  let updateView: ProfileWorkflowRuleSourceUpdateView | undefined;
  let updateLoading = false;
  let loadedUpdateKey = '';
''',
)
source = source.replace(
    '''  $: state = inspectAttachedRuleList(spec, switchProfileId);
  $: headerItems = state?.source.headers ?? [];

  function valueFrom(event: Event): string {
''',
    '''  $: state = inspectAttachedRuleList(spec, switchProfileId);
  $: headerItems = state?.source.headers ?? [];
  $: {
    const source = state?.source;
    const key = source?.location.kind === 'url' ? `${source.id}:${source.location.url}` : '';
    if (key !== loadedUpdateKey) {
      loadedUpdateKey = key;
      updateView = undefined;
      if (source?.location.kind === 'url') void loadUpdateStatus(source.id);
    }
  }

  function valueFrom(event: Event): string {
''',
)
insert = '''
  async function loadUpdateStatus(sourceId: string): Promise<void> {
    updateView = await onGetRuleSourceUpdateStatus(sourceId);
  }

  async function downloadNow(): Promise<void> {
    const source = state?.source;
    if (!source || source.location.kind !== 'url' || !source.location.url || updateLoading) return;
    updateLoading = true;
    try {
      const updated = await onUpdateRuleSource(source.id, source.location.url);
      if (updated) updateView = updated;
    } finally {
      updateLoading = false;
    }
  }

  function formatTimestamp(value: string | undefined): string {
    if (!value) return 'never';
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleString();
  }

  function updateSummary(view: ProfileWorkflowRuleSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return 'Never downloaded.';
    if (view.lastError) {
      return `Last update failed ${formatTimestamp(view.lastError.occurredAt)}. Existing cached content was preserved.`;
    }
    const stale = view.stale ? ' Cached content is stale.' : '';
    const bytes = view.lastBytes === undefined ? '' : ` ${view.lastBytes} bytes.`;
    return `Last updated ${formatTimestamp(view.lastSuccessAt)}.${bytes}${stale}`;
  }
'''
marker = '  async function mutateSource(update: (source: RuleSource) => void): Promise<void> {\n'
if source.count(marker) != 1:
    raise SystemExit('AttachedRuleListConfig mutateSource marker mismatch')
source = source.replace(marker, insert + '\n' + marker)
old = '''      <p class="section-help">
        URL content is read-only after download. Network download and update status are handled by a
        separate background service slice.
      </p>
      <textarea
'''
new = '''      <div class="rule-source-update-actions">
        <button
          type="button"
          data-rule-source-update-now
          disabled={disabled || updateLoading || !state.source.location.url}
          on:click={downloadNow}
        >
          {updateLoading ? 'Downloading…' : 'Download now'}
        </button>
        <p class:stale={updateView?.stale} role="status" data-rule-source-update-status>
          {updateSummary(updateView)}
        </p>
      </div>
      {#if updateView?.lastError}
        <p class="source-update-error" role="alert">{updateView.lastError.message}</p>
      {/if}
      <p class="section-help">
        Remote content is downloaded by the background service with isolated credentials, bounded
        size, and atomic cache replacement. Failed downloads keep the previous cache.
      </p>
      <textarea
'''
if source.count(old) != 1:
    raise SystemExit(f'AttachedRuleListConfig URL help mismatch: {source.count(old)}')
source = source.replace(old, new)
style_marker = '''  .header-row {
'''
style = '''  .rule-source-update-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.5rem 0;
  }

  .rule-source-update-actions button {
    min-height: 32px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--button-bg);
    padding: 5px 10px;
  }

  .rule-source-update-actions p {
    margin: 0;
  }

  .rule-source-update-actions .stale,
  .source-update-error {
    color: var(--danger-text, #b3261e);
  }

'''
if source.count(style_marker) != 1:
    raise SystemExit('AttachedRuleListConfig style marker mismatch')
source = source.replace(style_marker, style + style_marker)
path.write_text(source)
