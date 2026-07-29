from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new))


# Pure typed workflow operation.
operations = Path('packages/profile-workflow/src/profile-operations.ts')
replace_once(
    operations,
    """export function duplicateProfileDraft(
  spec: ProfileSpec,
  sourceProfileId: string,
  idFactory: ProfileWorkflowIdFactory,
): ProfileWorkflowProfileMutation {
""",
    """function normalizedProfileName(name: string): string {
  return name.trim();
}

function reservedProfileName(name: string): boolean {
  return name.startsWith('__') || /^(?:direct|system)$/iu.test(name);
}

export function duplicateProfileDraft(
  spec: ProfileSpec,
  sourceProfileId: string,
  idFactory: ProfileWorkflowIdFactory,
): ProfileWorkflowProfileMutation {
""",
    'profile-name helpers',
)
insert_anchor = """export interface ProfileReferenceBlocker {
"""
rename_operation = """export function renameProfileDraft(
  spec: ProfileSpec,
  profileId: string,
  requestedName: string,
): ProfileSpec {
  const draft = cloneProfileSpecDraft(spec);
  const profile = draft.profiles.find((candidate) => candidate.id === profileId);
  if (!profile) throw new RangeError(`profile ${profileId} does not exist`);

  const name = normalizedProfileName(requestedName);
  if (!name) throw new TypeError('profile name is required');
  if (reservedProfileName(name)) throw new TypeError('profile name is reserved');
  if (
    draft.profiles.some(
      (candidate) =>
        candidate.id !== profileId &&
        candidate.name.localeCompare(name, undefined, { sensitivity: 'base' }) === 0,
    )
  ) {
    throw new TypeError('profile name already exists');
  }

  profile.name = name;
  if (profile.kind === 'switch' && profile.attachedRuleListProfileId !== undefined) {
    const attached = draft.profiles.find(
      (candidate): candidate is RuleListProfile =>
        candidate.id === profile.attachedRuleListProfileId && candidate.kind === 'rule-list',
    );
    if (!attached) {
      throw new RangeError(`attached Rule List profile ${profile.attachedRuleListProfileId} does not exist`);
    }
    attached.name = `__ruleListOf_${name}`;
    const source = draft.ruleSources.find((candidate) => candidate.id === attached.sourceId);
    if (!source) throw new RangeError(`rule source ${attached.sourceId} does not exist`);
    source.name = `${name} attached rules`;
  }

  assertValidDraft(draft);
  return draft;
}

"""
if operations.read_text().count(insert_anchor) != 1:
    raise SystemExit('rename operation insertion anchor mismatch')
operations.write_text(operations.read_text().replace(insert_anchor, rename_operation + insert_anchor))

index = Path('packages/profile-workflow/src/index.ts')
replace_once(
    index,
    """  listProfileReferenceBlockers,
  replaceProfileReferencesDraft,
""",
    """  listProfileReferenceBlockers,
  renameProfileDraft,
  replaceProfileReferencesDraft,
""",
    'rename operation export',
)

operation_tests = Path('packages/profile-workflow/src/profile-operations.test.ts')
replace_once(
    operation_tests,
    """  listProfileReferenceBlockers,
  replaceProfileReferencesDraft,
""",
    """  listProfileReferenceBlockers,
  renameProfileDraft,
  replaceProfileReferencesDraft,
""",
    'rename test import',
)
test_anchor = """  it('deletes a Switch profile together with its hidden attached Rule List and source', () => {
"""
tests = """  it('renames a profile without changing its identity or references', () => {
    const renamed = renameProfileDraft(workflowFixture(), 'profile-primary', '  Renamed Proxy  ');

    expect(renamed.profiles.find((profile) => profile.id === 'profile-primary')?.name).toBe(
      'Renamed Proxy',
    );
    expect(renamed.settings.quickSwitch.routes).toContainEqual({
      kind: 'profile',
      profileId: 'profile-primary',
    });
    expect(validateProfileSpec(renamed).valid).toBe(true);
  });

  it('renames a Switch profile together with its hidden attached Rule List and source', () => {
    const ids = deterministicIds();
    const created = createSwitchProfileDraft(workflowFixture(), ids, 'Owner');
    const attached = createAttachedRuleListDraft(created.draft, created.profileId, ids);
    const before = inspectAttachedRuleList(attached, created.profileId);
    const renamed = renameProfileDraft(attached, created.profileId, 'Renamed Owner');
    const after = inspectAttachedRuleList(renamed, created.profileId);

    expect(before).toBeDefined();
    expect(after?.profile.id).toBe(before?.profile.id);
    expect(after?.source.id).toBe(before?.source.id);
    expect(after?.profile.name).toBe('__ruleListOf_Renamed Owner');
    expect(after?.source.name).toBe('Renamed Owner attached rules');
    expect(validateProfileSpec(renamed).valid).toBe(true);
  });

  it('rejects empty, reserved, conflicting, and missing profile renames', () => {
    expect(() => renameProfileDraft(workflowFixture(), 'profile-primary', '   ')).toThrow(
      'profile name is required',
    );
    expect(() => renameProfileDraft(workflowFixture(), 'profile-primary', '__hidden')).toThrow(
      'profile name is reserved',
    );
    expect(() => renameProfileDraft(workflowFixture(), 'profile-primary', 'system')).toThrow(
      'profile name is reserved',
    );
    expect(() => renameProfileDraft(workflowFixture(), 'profile-secondary', 'proxy')).toThrow(
      'profile name already exists',
    );
    expect(() => renameProfileDraft(workflowFixture(), 'missing-profile', 'Renamed')).toThrow(
      'does not exist',
    );
  });

"""
if operation_tests.read_text().count(test_anchor) != 1:
    raise SystemExit('rename tests insertion anchor mismatch')
operation_tests.write_text(operation_tests.read_text().replace(test_anchor, tests + test_anchor))

# Independent accessible Rename dialog.
rename_dialog = Path('apps/extension/src/entrypoints/options/ProfileRenameDialog.svelte')
rename_dialog.write_text(
    """<script lang="ts">
  import { onMount, tick } from 'svelte';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText } from '../../lib/ui-messages';

  export let profileName: string;
  export let existingNames: readonly string[] = [];
  export let disabled = false;
  export let locale: AppLocale = currentAppLocale();
  export let onCancel: () => void;
  export let onConfirm: (name: string) => Promise<void>;

  let name = profileName;
  let submitting = false;
  let nameInput: HTMLInputElement | undefined;

  onMount(() => {
    void tick().then(() => {
      if (disabled) return;
      nameInput?.focus();
      nameInput?.select();
    });
  });

  $: normalizedName = name.trim();
  $: duplicate = existingNames.some(
    (candidate) =>
      candidate.localeCompare(normalizedName, undefined, { sensitivity: 'base' }) === 0,
  );
  $: reserved = normalizedName.startsWith('__') || /^(?:direct|system)$/iu.test(normalizedName);
  $: hidden = normalizedName.startsWith('_') && !reserved;
  $: errorKey =
    normalizedName.length === 0
      ? ('newProfile.error.empty' as const)
      : reserved
        ? ('newProfile.error.reserved' as const)
        : duplicate
          ? ('newProfile.error.conflict' as const)
          : undefined;
  $: canRename = !disabled && !submitting && errorKey === undefined;

  async function confirm(): Promise<void> {
    if (!canRename) return;
    submitting = true;
    try {
      await onConfirm(normalizedName);
    } finally {
      submitting = false;
    }
  }
</script>

<div class="rename-backdrop" data-profile-rename-backdrop>
  <div
    class="rename-dialog"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby="profile-rename-title"
    aria-describedby="profile-rename-name-message"
    data-profile-rename-dialog
    data-typed-locale={locale}
  >
    <header>
      <h2 id="profile-rename-title">{uiText('profile.rename.title', locale)}</h2>
      <button
        type="button"
        class="close-button"
        aria-label={uiText('common.close', locale)}
        disabled={submitting}
        onclick={onCancel}>×</button
      >
    </header>
    <div class="dialog-body">
      <label>
        <span>{uiText('profile.rename.label', locale)}</span>
        <input
          bind:this={nameInput}
          data-profile-rename-name-input
          aria-describedby="profile-rename-name-message"
          aria-invalid={errorKey !== undefined}
          value={name}
          disabled={disabled || submitting}
          oninput={(event) => (name = (event.currentTarget as HTMLInputElement).value)}
          onkeydown={(event) => {
            if (event.key === 'Enter') void confirm();
            if (event.key === 'Escape') onCancel();
          }}
        />
      </label>
      <div
        id="profile-rename-name-message"
        class:error-message={errorKey !== undefined}
        class="field-message"
        role={errorKey ? 'alert' : 'status'}
      >
        {#if errorKey}
          {uiText(errorKey, locale)}
        {:else if hidden}
          {uiText('newProfile.hidden', locale)}
        {/if}
      </div>
    </div>
    <footer>
      <button
        type="button"
        data-profile-rename-cancel
        disabled={submitting}
        onclick={onCancel}>{uiText('common.cancel', locale)}</button
      >
      <button
        type="button"
        class="primary"
        data-profile-rename-confirm
        disabled={!canRename}
        onclick={() => void confirm()}
      >
        {submitting
          ? uiText('profile.rename.renaming', locale)
          : uiText('profile.rename.action', locale)}
      </button>
    </footer>
  </div>
</div>

<style>
  .rename-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 42%);
  }

  .rename-dialog {
    width: min(520px, 100%);
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    background: var(--content-bg);
    box-shadow: 0 10px 34px var(--shadow);
  }

  header,
  footer {
    display: flex;
    align-items: center;
    padding: 14px 18px;
  }

  header {
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
  }

  footer {
    justify-content: flex-end;
    gap: 8px;
    border-top: 1px solid var(--border);
  }

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
  }

  .close-button {
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 24px;
  }

  .dialog-body {
    padding: 20px 18px;
  }

  label {
    display: grid;
    gap: 7px;
  }

  input {
    min-height: 34px;
    padding: 6px 9px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--input-bg);
    color: var(--text);
  }

  .field-message {
    min-height: 20px;
    margin-top: 6px;
    color: var(--muted);
    font-size: 12px;
  }

  .error-message {
    color: var(--danger);
  }

  footer button {
    min-height: 32px;
    padding: 5px 13px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--button-bg);
    color: var(--text);
  }

  footer button.primary {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }
</style>
"""
)

# Direct typed strings.
messages = Path('apps/extension/src/lib/ui-messages.ts')
replace_once(
    messages,
    """  'profile.name': { en: 'Profile name', 'zh-CN': '情景模式名称', 'zh-TW': '情境模式名稱' },
  'profile.color': { en: 'Profile color', 'zh-CN': '情景模式颜色', 'zh-TW': '情境模式顏色' },
""",
    """  'profile.name': { en: 'Profile name', 'zh-CN': '情景模式名称', 'zh-TW': '情境模式名稱' },
  'profile.rename.action': { en: 'Rename', 'zh-CN': '重命名', 'zh-TW': '重新命名' },
  'profile.rename.title': {
    en: 'Rename Profile',
    'zh-CN': '重命名情景模式',
    'zh-TW': '重新命名情境模式',
  },
  'profile.rename.label': {
    en: 'New profile name',
    'zh-CN': '新的情景模式名称',
    'zh-TW': '新的情境模式名稱',
  },
  'profile.rename.renaming': {
    en: 'Renaming…',
    'zh-CN': '正在重命名…',
    'zh-TW': '正在重新命名…',
  },
  'profile.color': { en: 'Profile color', 'zh-CN': '情景模式颜色', 'zh-TW': '情境模式顏色' },
""",
    'Rename typed strings',
)
replace_once(
    messages,
    """  'options.confirm.replace': {
""",
    """  'options.confirm.rename': {
    en: 'Apply current changes before renaming this profile?',
    'zh-CN': '重命名此情景模式前，先应用当前更改吗？',
    'zh-TW': '重新命名此情境模式前，先套用目前變更嗎？',
  },
  'options.confirm.replace': {
""",
    'Rename apply confirmation string',
)

# Options integration.
app = Path('apps/extension/src/entrypoints/options/App.svelte')
replace_once(
    app,
    """    listProfileReferenceBlockers,
    parseProfileWorkflowState,
    replaceProfileReferencesDraft,
""",
    """    listProfileReferenceBlockers,
    parseProfileWorkflowState,
    renameProfileDraft,
    replaceProfileReferencesDraft,
""",
    'App rename operation import',
)
replace_once(
    app,
    """  import ProfileDeletionDialog from './ProfileDeletionDialog.svelte';
  import ProfileReplacementDialog from './ProfileReplacementDialog.svelte';
""",
    """  import ProfileDeletionDialog from './ProfileDeletionDialog.svelte';
  import ProfileRenameDialog from './ProfileRenameDialog.svelte';
  import ProfileReplacementDialog from './ProfileReplacementDialog.svelte';
""",
    'App Rename dialog import',
)
replace_once(
    app,
    """  interface PendingProfileReplacement {
    readonly fromProfileId: string;
    readonly toProfileId: string;
  }
""",
    """  interface PendingProfileRename {
    readonly profileId: string;
    readonly profileName: string;
  }

  interface PendingProfileReplacement {
    readonly fromProfileId: string;
    readonly toProfileId: string;
  }
""",
    'pending Rename interface',
)
replace_once(
    app,
    """  let pendingProfileDeletion: PendingProfileDeletion | undefined;
  let pendingProfileReplacement: PendingProfileReplacement | undefined;
""",
    """  let pendingProfileDeletion: PendingProfileDeletion | undefined;
  let pendingProfileRename: PendingProfileRename | undefined;
  let pendingProfileReplacement: PendingProfileReplacement | undefined;
""",
    'pending Rename state',
)
replace_once(
    app,
    """  async function requestProfileReplacement(
""",
    """  async function requestSelectedProfileRename(): Promise<void> {
    if (
      !state ||
      !selectedProfile ||
      saving ||
      view?.busy ||
      !(await commitActiveProfileEditor())
    ) {
      return;
    }
    const profileId = selectedProfile.id;
    if (view?.dirty) {
      const confirmed = globalThis.confirm(uiText('options.confirm.rename', locale));
      if (!confirmed) return;
      const permission = await runWithProxyAuthenticationPermission(state.draft, () =>
        runCommand({
          action: 'apply',
          expectedGeneration: state!.generation,
        }),
      );
      if (!permission.granted) {
        errorMessage = uiText('options.error.proxyAuthPermission', locale);
        return;
      }
      if (!permission.value) return;
    }
    const current = state?.draft.profiles.find((profile) => profile.id === profileId);
    if (!current) {
      errorMessage = uiText('options.error.safeMessage', locale);
      return;
    }
    pendingProfileRename = { profileId, profileName: current.name };
  }

  async function confirmProfileRename(name: string): Promise<void> {
    const request = pendingProfileRename;
    if (!state || !request) return;
    try {
      if (await replaceDraft(renameProfileDraft(state.draft, request.profileId, name))) {
        pendingProfileRename = undefined;
      }
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    }
  }

  async function requestProfileReplacement(
""",
    'Rename request and confirmation',
)
old_update_name = """  async function updateProfileName(name: string): Promise<void> {
    if (!selectedProfile) return;
    const profileId = selectedProfile.id;
    await mutateDraft((draft) => {
      const profile = draft.profiles.find((candidate) => candidate.id === profileId);
      if (!profile) return;
      profile.name = name.trim();
      if (profile.kind !== 'switch' || profile.attachedRuleListProfileId === undefined) return;
      const attached = draft.profiles.find(
        (candidate) =>
          candidate.id === profile.attachedRuleListProfileId && candidate.kind === 'rule-list',
      );
      if (!attached || attached.kind !== 'rule-list') return;
      attached.name = `__ruleListOf_${profile.name}`;
      const source = draft.ruleSources.find((candidate) => candidate.id === attached.sourceId);
      if (source) source.name = `${profile.name} attached rules`;
    });
  }

"""
if app.read_text().count(old_update_name) != 1:
    raise SystemExit('direct profile-name editor function anchor mismatch')
app.write_text(app.read_text().replace(old_update_name, ''))
replace_once(
    app,
    """          <button
            type="button"
            disabled={view?.busy || saving || profileExporting}
            onclick={duplicateSelectedProfile}>{uiText('common.duplicate', locale)}</button
          ><button
""",
    """          <button
            type="button"
            data-profile-rename-action
            disabled={view?.busy || saving || profileExporting}
            onclick={() => void requestSelectedProfileRename()}
            >{uiText('profile.rename.action', locale)}</button
          >
          <button
            type="button"
            disabled={view?.busy || saving || profileExporting}
            onclick={duplicateSelectedProfile}>{uiText('common.duplicate', locale)}</button
          ><button
""",
    'profile-header Rename action',
)
old_name_field = """        <label>
          <span>{uiText('profile.name', locale)}</span>
          <input
            aria-label={uiText('profile.name', locale)}
            value={selectedProfile.name}
            disabled={saving || view?.busy}
            onchange={(event) => updateProfileName(valueFrom(event))}
          />
        </label>
"""
if app.read_text().count(old_name_field) != 1:
    raise SystemExit('inline profile-name field anchor mismatch')
app.write_text(app.read_text().replace(old_name_field, ''))
replace_once(
    app,
    """{#if pendingProfileDeletion}
""",
    """{#if pendingProfileRename}
  <ProfileRenameDialog
    {locale}
    profileName={pendingProfileRename.profileName}
    existingNames={allProfiles
      .filter((profile) => profile.id !== pendingProfileRename?.profileId)
      .map((profile) => profile.name)}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileRename = undefined)}
    onConfirm={confirmProfileRename}
  />
{/if}

{#if pendingProfileDeletion}
""",
    'Rename dialog rendering',
)

# Component rendering contract.
components = Path('apps/extension/src/component-rendering.component.spec.ts')
replace_once(
    components,
    """import ProfileDeletionDialog from './entrypoints/options/ProfileDeletionDialog.svelte';
import ProfileReplacementDialog from './entrypoints/options/ProfileReplacementDialog.svelte';
""",
    """import ProfileDeletionDialog from './entrypoints/options/ProfileDeletionDialog.svelte';
import ProfileRenameDialog from './entrypoints/options/ProfileRenameDialog.svelte';
import ProfileReplacementDialog from './entrypoints/options/ProfileReplacementDialog.svelte';
""",
    'Rename component test import',
)
component_anchor = """  it('renders blocked and confirm profile-deletion dialogs without a destructive blocked action', () => {
"""
component_test = """  it('renders the original independent validated Profile Rename dialog', () => {
    const body = render(ProfileRenameDialog, {
      props: {
        profileName: 'Proxy',
        existingNames: ['Backup'],
        locale: 'zh-CN',
        onCancel: () => undefined,
        onConfirm: async () => undefined,
      },
    }).body;

    expect(body).toContain('data-profile-rename-dialog');
    expect(body).toContain('data-profile-rename-name-input');
    expect(body).toContain('data-profile-rename-cancel');
    expect(body).toContain('data-profile-rename-confirm');
    expect(body).toContain('value="Proxy"');
    expect(body).toContain('重命名情景模式');
    expect(body).not.toContain('Rename Profile');
  });

"""
if components.read_text().count(component_anchor) != 1:
    raise SystemExit('Rename component test anchor mismatch')
components.write_text(components.read_text().replace(component_anchor, component_test + component_anchor))

# Chromium: replace direct inline rename with original-style action/dialog and apply-before-dialog.
chromium = Path('scripts/e2e-chromium.mjs')
text = chromium.read_text()
old = """  const profileName = options.getByLabel('情景模式名称');
  try {
    await profileName.waitFor({ state: 'visible', timeout: 15_000 });
"""
new = """  const profileHeading = options.getByRole('heading', {
    name: 'Proxy',
    exact: true,
    level: 1,
  });
  try {
    await profileHeading.waitFor({ state: 'visible', timeout: 15_000 });
"""
if text.count(old) != 1:
    raise SystemExit('Chromium initial profile heading anchor mismatch')
text = text.replace(old, new)
text = text.replace("  assert.equal(await profileName.inputValue(), 'Proxy');\n", '')
if text.count("  await profileName.waitFor({ state: 'visible' });\n") != 2:
    raise SystemExit('Chromium profile heading wait count mismatch')
text = text.replace(
    "  await profileName.waitFor({ state: 'visible' });\n",
    "  await profileHeading.waitFor({ state: 'visible' });\n",
)
old_rename = """  await options.getByRole('button', { name: 'Proxy', exact: true }).click();
  await profileHeading.waitFor({ state: 'visible' });
  await profileName.fill('Chromium E2E Proxy');
  await profileName.press('Tab');
  const apply = options.getByRole('button', { name: '应用选项' });
  await apply.waitFor({ state: 'visible' });
  await assertEventually(async () => !(await apply.isDisabled()), 'Apply button remained disabled');
  await apply.click();
"""
new_rename = """  await options.getByRole('button', { name: 'Proxy', exact: true }).click();
  await profileHeading.waitFor({ state: 'visible' });
  assert.equal(await options.getByLabel('情景模式名称').count(), 0);
  const apply = options.getByRole('button', { name: '应用选项' });
  await apply.waitFor({ state: 'visible' });
  await assertEventually(
    async () => !(await apply.isDisabled()),
    'Proxy edits did not leave an applicable Draft before Rename',
  );
  options.once('dialog', async (dialog) => {
    assert.match(dialog.message(), /重命名此情景模式前，先应用当前更改吗/u);
    await dialog.accept();
  });
  await options.locator('[data-profile-rename-action]').click();
  const renameDialog = options.locator('[data-profile-rename-dialog]');
  await renameDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          JSON.stringify(workflow.draft) === JSON.stringify(workflow.applied)
        );
      }),
    'Rename dialog opened before the dirty Draft was applied',
    20_000,
  );
  const renameInput = renameDialog.locator('[data-profile-rename-name-input]');
  await assertEventually(
    async () => renameInput.evaluate((element) => element === document.activeElement),
    'Rename dialog did not focus the name field',
  );
  assert.equal(await renameInput.inputValue(), 'Proxy');
  await renameInput.fill('');
  assert.equal(await renameDialog.locator('[data-profile-rename-confirm]').isDisabled(), true);
  await renameInput.fill('direct');
  assert.equal(await renameDialog.locator('[data-profile-rename-confirm]').isDisabled(), true);
  await renameInput.fill('Backup');
  assert.equal(await renameDialog.locator('[data-profile-rename-confirm]').isDisabled(), true);
  await renameInput.fill('_Hidden Proxy');
  assert.equal(await renameDialog.locator('[data-profile-rename-confirm]').isDisabled(), false);
  assert.match(await renameDialog.innerText(), /左侧列表中隐藏/u);
  await renameInput.fill('Chromium E2E Proxy');
  await renameDialog.locator('[data-profile-rename-confirm]').click();
  await renameDialog.waitFor({ state: 'detached', timeout: 20_000 });
  await options
    .getByRole('heading', { name: 'Chromium E2E Proxy', exact: true, level: 1 })
    .waitFor();
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        const draft = workflow?.draft?.profiles?.find((profile) => profile.id === 'profile-default-proxy');
        const applied = workflow?.applied?.profiles?.find(
          (profile) => profile.id === 'profile-default-proxy',
        );
        return draft?.name === 'Chromium E2E Proxy' && applied?.name === 'Proxy';
      }),
    'Rename did not remain inside the Draft boundary before Apply',
  );
  await assertEventually(async () => !(await apply.isDisabled()), 'Rename did not enable Apply');
  await apply.click();
"""
if text.count(old_rename) != 1:
    raise SystemExit('Chromium direct rename replacement anchor mismatch')
text = text.replace(old_rename, new_rename)
old_creation = """    const profileNameInput = creationOptions.getByLabel('情景模式名称');
    await profileNameInput.waitFor({ state: 'visible', timeout: 20_000 });
    assert.equal(await profileNameInput.inputValue(), name);
    await editor().waitFor({ state: 'visible', timeout: 20_000 });
"""
new_creation = """    await creationOptions
      .getByRole('heading', { name, exact: true, level: 1 })
      .waitFor({ state: 'visible', timeout: 20_000 });
    assert.equal(await creationOptions.getByLabel('情景模式名称').count(), 0);
    await editor().waitFor({ state: 'visible', timeout: 20_000 });
"""
if text.count(old_creation) != 1:
    raise SystemExit('Chromium creation name assertion anchor mismatch')
text = text.replace(old_creation, new_creation)
chromium.write_text(text)

# Firefox: initial heading and independent Rename dialog, after first normal Apply.
firefox = Path('scripts/e2e-firefox.mjs')
text = firefox.read_text()
old = """  let profileName;
  try {
    profileName = await driver.wait(
      until.elementLocated(By.css('input[aria-label="情境模式名稱"]')),
      15_000,
    );
    await driver.wait(until.elementIsVisible(profileName), 15_000);
"""
new = """  let profileHeading;
  try {
    profileHeading = await driver.wait(
      until.elementLocated(By.xpath("//h1[normalize-space(.)='Proxy']")),
      15_000,
    );
    await driver.wait(until.elementIsVisible(profileHeading), 15_000);
"""
if text.count(old) != 1:
    raise SystemExit('Firefox initial profile heading anchor mismatch')
text = text.replace(old, new)
text = text.replace("  assert.equal(await profileName.getAttribute('value'), 'Proxy');\n", '')
old_direct = """  await driver.executeScript(
    `
      const input = arguments[0];
      const value = arguments[1];
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    `,
    profileName,
    'Firefox E2E Proxy',
  );
  await driver.wait(
    async () => (await profileName.getAttribute('value')) === 'Firefox E2E Proxy',
    5_000,
  );
  const apply = await driver.wait(until.elementLocated(By.css('.actions button.primary')), 15_000);
  await driver.wait(until.elementIsEnabled(apply), 15_000);
  await apply.click();
"""
new_direct = """  const apply = await driver.wait(until.elementLocated(By.css('.actions button.primary')), 15_000);
  await driver.wait(until.elementIsEnabled(apply), 15_000);
  await apply.click();
"""
if text.count(old_direct) != 1:
    raise SystemExit('Firefox direct rename removal anchor mismatch')
text = text.replace(old_direct, new_direct)
post_permission_anchor = """    'Firefox Apply did not grant proxy-authentication permissions',
  );

"""
rename_flow = """    'Firefox Apply did not grant proxy-authentication permissions',
  );
  assert.equal(
    (await driver.findElements(By.css('input[aria-label="情境模式名稱"]'))).length,
    0,
    'Firefox still exposed the removed inline profile-name field',
  );
  const renameAction = await driver.findElement(By.css('[data-profile-rename-action]'));
  await renameAction.click();
  const renameDialog = await driver.wait(
    until.elementLocated(By.css('[data-profile-rename-dialog]')),
    10_000,
  );
  const renameInput = await renameDialog.findElement(By.css('[data-profile-rename-name-input]'));
  assert.equal(await renameInput.getAttribute('value'), 'Proxy');
  await setControlValue(renameInput, 'Firefox E2E Proxy');
  const renameConfirm = await renameDialog.findElement(By.css('[data-profile-rename-confirm]'));
  await driver.wait(until.elementIsEnabled(renameConfirm), 10_000);
  await renameConfirm.click();
  await driver.wait(until.stalenessOf(renameDialog), 10_000);
  await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space(.)='Firefox E2E Proxy']")),
    10_000,
  );
  await driver.wait(until.elementIsEnabled(apply), 15_000);
  await apply.click();
  await driver.wait(
    async () =>
      driver.executeAsyncScript(`
        const done = arguments[0];
        browser.runtime.sendMessage({
          channel: 'zeroomega-nex/profile-workflow/v1',
          action: 'get',
        }).then((response) => {
          const draft = response?.state?.draft?.profiles?.find(
            (profile) => profile.id === 'profile-default-proxy',
          );
          const applied = response?.state?.applied?.profiles?.find(
            (profile) => profile.id === 'profile-default-proxy',
          );
          done(draft?.name === 'Firefox E2E Proxy' && applied?.name === 'Firefox E2E Proxy');
        }, (error) => done(String(error)));
      `),
    20_000,
    'Firefox Rename did not commit through normal Apply',
  );

"""
if text.count(post_permission_anchor) != 1:
    raise SystemExit('Firefox Rename flow insertion anchor mismatch')
text = text.replace(post_permission_anchor, rename_flow)
firefox.write_text(text)

# Canonical accounting and stable records.
audit = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith('| B-03 |'):
        lines[index] = '| B-03 | 重命名按钮/对话框 | `profile.jade`、`rename_profile.jade`          | 页头按钮，校验同新建                                          | MUST_MATCH | DONE     | COMPLETE | 页头独立 Rename 动作、Apply-before-dialog、typed 三语可访问对话框、必填/保留名/重名/隐藏名校验、Draft 边界、Switch 附属 Rule List/源同步改名及 Chromium/Firefox 回归均已验证 | 保持双浏览器回归 |'
        break
else:
    raise SystemExit('B-03 matrix row was not found')
for index, line in enumerate(lines):
    if line.startswith('- **仍开放的 MUST_MATCH：4 项。**'):
        lines[index] = '- **仍开放的 MUST_MATCH：3 项。** C-09 协议能力矩阵、D-04 条件类型矩阵、D-05 条件字段矩阵。'
        break
else:
    raise SystemExit('four-item MUST_MATCH summary was not found')
record_index = next(
    (
        index
        for index, line in enumerate(lines)
        if line.startswith('| 2026-07-29 | 完成 PAC 目标能力信号')
    ),
    -1,
)
if record_index == -1:
    raise SystemExit('matrix Rename update-record anchor was not found')
lines.insert(
    record_index + 1,
    '| 2026-07-29 | 恢复原版 Profile 页头 Rename 动作与独立对话框；完成 Apply-before-dialog、名称校验、Draft/Apply、附属 Rule List/源事务及 Chromium/Firefox 回归；开放 MUST_MATCH 降至 3 项 |',
)
audit.write_text('\n'.join(lines) + '\n')

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
text = text.replace(
    '- Typed deletion blockers, general Replace Profile dialog, profile PAC export, and Switch Rule List export.\n',
    '- Original profile-header Rename action and independent validated dialog, including Apply-before-dialog and attached Rule List/source rename transactions.\n- Typed deletion blockers, general Replace Profile dialog, profile PAC export, and Switch Rule List export.\n',
)
text = text.replace(
    'The canonical matrix contains 126 rows: `DONE=119`, `PARTIAL=7`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.',
    'The canonical matrix contains 126 rows: `DONE=120`, `PARTIAL=6`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.',
)
text = text.replace(
    """Four release-blocking `MUST_MATCH` rows remain:

1. B-03 — original-style Rename action and dialog parity.
2. C-09 — protocol/target capability matrix.
3. D-04 — Switch condition-type matrix acceptance.
4. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
    """Three release-blocking `MUST_MATCH` rows remain:

1. C-09 — protocol/target capability matrix.
2. D-04 — Switch condition-type matrix acceptance.
3. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
)
text = text.replace('Proceed to B-03 Rename parity.', 'Proceed to C-09 protocol/target capability acceptance.')
status.write_text(text)

checkpoint = Path('docs/MILESTONE_8_SESSION_7_CHECKPOINT.md')
text = checkpoint.read_text()
text = text.replace(
    'The canonical matrix now honestly reports `DONE=119`, `PARTIAL=7`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.',
    'The canonical matrix now honestly reports `DONE=120`, `PARTIAL=6`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.',
)
section_anchor = '## Direction and scope assessment\n'
section = """### Original Profile Rename acceptance

- The Profile header restores the source-backed Rename action; the inline profile-name editor is removed.
- Dirty editor state commits first and the user explicitly accepts normal Apply before the Rename dialog opens.
- The independent typed dialog initializes and focuses the current name, then enforces the same empty, reserved, case-insensitive conflict, and hidden-name rules as New Profile.
- Rename changes remain in Draft until normal Apply; profile identity IDs and route references do not change.
- A Switch rename transaction also updates its hidden attached Rule List name and associated Rule Source name.
- Chromium verifies Apply-before-dialog, all validation branches, Draft isolation, navigation/header updates, and final Apply. Firefox verifies the independent dialog and final Apply.
- B-03 is `DONE`; release-blocking `MUST_MATCH` rows fall from four to three.

"""
if text.count(section_anchor) != 1:
    raise SystemExit('checkpoint Rename section anchor mismatch')
text = text.replace(section_anchor, section + section_anchor)
text = text.replace(
    'Four release-blocking `MUST_MATCH` rows remain:',
    'Three release-blocking `MUST_MATCH` rows remain:',
)
text = text.replace(
    """1. B-03 — original-style Rename action/dialog parity or a justified source-backed decision.
2. C-09 — protocol/target capability matrix.
3. D-04 — Switch condition-type matrix acceptance.
4. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
    """1. C-09 — protocol/target capability matrix.
2. D-04 — Switch condition-type matrix acceptance.
3. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
)
text = text.replace(
    '3. Implement and verify B-03 Rename parity.\n4. Complete or explicitly scope C-09, D-04, and D-05 without weakening acceptance criteria.',
    '3. Complete or explicitly scope C-09, D-04, and D-05 without weakening acceptance criteria.',
)
checkpoint.write_text(text)

candidate = Path('docs/MILESTONE_8_RELEASE_CANDIDATE.md')
text = candidate.read_text()
text = text.replace(
    '- target-dependent PAC creation support and unsupported-state explanation;\n',
    '- target-dependent PAC creation support and unsupported-state explanation;\n- original profile-header Rename action, independent validation dialog, and attached Rule List/source rename transaction;\n',
)
text = text.replace(
    """Four release-blocking `MUST_MATCH` rows remain:

1. B-03 — original-style Rename action/dialog parity or a justified source-backed decision.
2. C-09 — protocol/target capability matrix.
3. D-04 — Switch condition-type matrix acceptance.
4. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
    """Three release-blocking `MUST_MATCH` rows remain:

1. C-09 — protocol/target capability matrix.
2. D-04 — Switch condition-type matrix acceptance.
3. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
)
candidate.write_text(text)

graph = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
graph.write_text(
    graph.read_text()
    + """
### Profile Rename transaction boundary

- Original ZeroOmega exposes Rename as a Profile header action and opens a dedicated one-field modal after current changes are accepted; the profile page does not use an always-editable name field.
- Nex preserves that navigation contract while retaining its typed Draft/Applied invariant: dirty profile-editor state is committed and normally Applied before the modal, while the rename itself remains a Draft change until the next normal Apply.
- Rename validation is shared semantically with New Profile: trimmed non-empty names, reserved `direct`/`system` and `__` rejection, case-insensitive conflict detection, and informational single-underscore hidden names.
- Profile IDs and all route references remain stable. Renaming a Switch atomically renames its hidden `__ruleListOf_...` profile and associated Rule Source without changing IDs.
- Chromium covers Apply-before-dialog, validation, Draft isolation, navigation/header convergence, and Apply; Firefox covers the independent dialog and Apply. Workflow unit tests cover ordinary, attached-resource, and invalid-name transactions.
"""
)

validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
read_anchor = """const failures = [];
"""
reads = """const [profileOperations, profileWorkflowIndex, renameDialog, optionsApp, componentRendering] =
  await Promise.all([
    readFile('packages/profile-workflow/src/profile-operations.ts', 'utf8'),
    readFile('packages/profile-workflow/src/index.ts', 'utf8'),
    readFile('apps/extension/src/entrypoints/options/ProfileRenameDialog.svelte', 'utf8'),
    readFile('apps/extension/src/entrypoints/options/App.svelte', 'utf8'),
    readFile('apps/extension/src/component-rendering.component.spec.ts', 'utf8'),
  ]);

"""
if text.count(read_anchor) != 1:
    raise SystemExit('validator Rename read anchor mismatch')
text = text.replace(read_anchor, reads + read_anchor)
guard_anchor = """requireAll('PAC target capability module', browserTargetCapabilities, [
"""
guards = r"""requireAll('Profile Rename workflow operation', profileOperations, [
  'renameProfileDraft',
  'profile name is required',
  'profile name is reserved',
  'profile name already exists',
  '__ruleListOf_${name}',
  '${name} attached rules',
]);
requireAll('Profile Rename export', profileWorkflowIndex, ['renameProfileDraft']);
requireAll('Profile Rename dialog', renameDialog, [
  'data-profile-rename-dialog',
  'data-profile-rename-name-input',
  'data-profile-rename-confirm',
  "'newProfile.error.empty'",
  "'newProfile.error.reserved'",
  "'newProfile.error.conflict'",
]);
requireAll('Profile Rename Options wiring', optionsApp, [
  'data-profile-rename-action',
  'requestSelectedProfileRename',
  "uiText('options.confirm.rename', locale)",
  'renameProfileDraft',
  '<ProfileRenameDialog',
]);
if (optionsApp.includes('onchange={(event) => updateProfileName')) {
  failures.push('Profile page must not restore the direct inline name editor');
}
requireAll('Profile Rename component rendering', componentRendering, [
  'ProfileRenameDialog',
  'data-profile-rename-dialog',
  '重命名情景模式',
]);
requireAll('Profile Rename Chromium acceptance', chromiumE2e, [
  'data-profile-rename-action',
  'Rename dialog opened before the dirty Draft was applied',
  'Rename did not remain inside the Draft boundary before Apply',
  'Chromium E2E Proxy',
]);
requireAll('Profile Rename Firefox acceptance', firefoxE2e, [
  'data-profile-rename-action',
  'data-profile-rename-dialog',
  'Firefox E2E Proxy',
  'Firefox Rename did not commit through normal Apply',
]);

const renameRow = audit.split('\n').find((line) => line.startsWith('| B-03 '));
if (!renameRow || !renameRow.includes('| DONE') || !renameRow.includes('Chromium/Firefox')) {
  failures.push('B-03 must remain DONE with dual-browser Rename evidence');
}

"""
if text.count(guard_anchor) != 1:
    raise SystemExit('validator Rename guard anchor mismatch')
validator.write_text(text.replace(guard_anchor, guards + guard_anchor))
