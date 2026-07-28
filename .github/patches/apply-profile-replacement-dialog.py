from pathlib import Path
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


Path('apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte').write_text(r'''<script lang="ts">
  import type { ProfileSpec, UserProfile } from '@zeroomega-nex/profile-spec';
  import { attachedRuleListProfileIds } from '@zeroomega-nex/profile-workflow';

  import ProfileIcon from '../../components/ProfileIcon.svelte';

  export let spec: ProfileSpec;
  export let initialFromProfileId: string;
  export let initialToProfileId: string;
  export let disabled = false;
  export let onCancel: () => void;
  export let onConfirm: (fromProfileId: string, toProfileId: string) => Promise<void>;

  let fromProfileId = initialFromProfileId;
  let toProfileId = initialToProfileId;
  let candidates: readonly UserProfile[] = [];
  let fromProfile: UserProfile | undefined;
  let toProfile: UserProfile | undefined;

  $: {
    const hiddenProfileIds = attachedRuleListProfileIds(spec);
    candidates = spec.profiles.filter((profile) => !hiddenProfileIds.has(profile.id));
  }
  $: fromProfile = candidates.find((profile) => profile.id === fromProfileId);
  $: toProfile = candidates.find((profile) => profile.id === toProfileId);

  function profileColor(profile: UserProfile | undefined): string {
    if (!profile) return '#90a4ae';
    const visited = new Set<string>();
    let current: UserProfile | undefined = profile;
    while (current?.kind === 'virtual' && current.targetRoute.kind === 'profile') {
      if (visited.has(current.id)) return '#90a4ae';
      visited.add(current.id);
      current = spec.profiles.find((candidate) => candidate.id === current?.targetRoute.profileId);
    }
    if (current?.kind === 'virtual') {
      return current.targetRoute.kind === 'direct'
        ? (spec.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee')
        : (spec.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88');
    }
    return current?.color ?? '#90a4ae';
  }
</script>

<div class="replacement-backdrop" data-profile-replacement-backdrop>
  <section
    class="replacement-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="profile-replacement-title"
    aria-describedby="profile-replacement-description"
    data-profile-replacement-dialog
  >
    <h2 id="profile-replacement-title">Replace Profile</h2>
    <p id="profile-replacement-description" class="replacement-question">
      Do you really want to replace
      <select
        aria-label="Profile to replace"
        data-profile-replacement-from
        bind:value={fromProfileId}
        {disabled}
      >
        {#each candidates as candidate (candidate.id)}
          <option value={candidate.id}>{candidate.name}</option>
        {/each}
      </select>
      with
      <select
        aria-label="Replacement profile"
        data-profile-replacement-to
        bind:value={toProfileId}
        {disabled}
      >
        {#each candidates as candidate (candidate.id)}
          <option value={candidate.id}>{candidate.name}</option>
        {/each}
      </select>?
    </p>

    <div class="replacement-preview" data-profile-replacement-preview>
      <span class="profile-inline">
        <ProfileIcon kind={fromProfile?.kind ?? 'fixed'} color={profileColor(fromProfile)} size={24} />
        <strong>{fromProfile?.name ?? 'Missing profile'}</strong>
      </span>
      <span class="replacement-arrow" aria-hidden="true">→</span>
      <span class="profile-inline">
        <ProfileIcon kind={toProfile?.kind ?? 'fixed'} color={profileColor(toProfile)} size={24} />
        <strong>{toProfile?.name ?? 'Missing profile'}</strong>
      </span>
    </div>

    <p class="replacement-help">
      If you proceed, all rules pointing to the first profile will use the second profile instead.
      Startup profile, Quick Switch, and other profile references are updated too. The two profiles
      themselves are not changed or deleted.
    </p>

    <div class="dialog-actions">
      <button type="button" data-profile-replacement-cancel disabled={disabled} onclick={onCancel}
        >Cancel</button
      >
      <button
        type="button"
        class="warning"
        data-profile-replacement-confirm
        disabled={disabled || !fromProfile || !toProfile}
        onclick={() => void onConfirm(fromProfileId, toProfileId)}>Replace Profile</button
      >
    </div>
  </section>
</div>

<style>
  .replacement-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 42%);
  }

  .replacement-dialog {
    width: min(680px, 100%);
    padding: 22px;
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    background: var(--content-bg);
    box-shadow: 0 10px 34px var(--shadow);
  }

  h2 {
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 500;
  }

  .replacement-question,
  .replacement-help {
    margin: 0 0 16px;
  }

  .replacement-question select {
    display: inline-block;
    width: auto;
    min-width: 150px;
    margin: 0 5px;
  }

  .replacement-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--page-bg);
  }

  .profile-inline {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .replacement-arrow {
    color: var(--muted);
    font-size: 20px;
  }

  .replacement-help {
    color: var(--muted);
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  button {
    min-height: 32px;
    padding: 5px 13px;
    border: 1px solid var(--border-strong);
    border-radius: 3px;
    background: var(--button-bg);
    color: var(--text);
  }

  button.warning {
    border-color: #b77800;
    background: #b77800;
    color: #fff;
  }
</style>
''')

# Virtual editor delegates the general replacement workflow to Options.
replace_once(
    'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
    '''  import {
    attachedRuleListProfileIds,
    replaceProfileReferencesDraft,
  } from '@zeroomega-nex/profile-workflow';
''',
    "  import { attachedRuleListProfileIds } from '@zeroomega-nex/profile-workflow';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
    '''  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
''',
    '''  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onRequestReplacement: (
    fromProfileId: string,
    toProfileId: string,
  ) => Promise<void>;
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
    '''  async function replaceTargetReferences(): Promise<void> {
    if (!profile || profile.targetRoute.kind !== 'profile') return;
    const confirmed = globalThis.confirm(
      `Replace references to the target profile with “${profile.name}”? The target profile itself is not deleted.`,
    );
    if (!confirmed) return;
    await onReplaceDraft(
      replaceProfileReferencesDraft(spec, profile.targetRoute.profileId, profile.id),
    );
  }
''',
    '''  async function replaceTargetReferences(): Promise<void> {
    if (!profile || profile.targetRoute.kind !== 'profile') return;
    await onRequestReplacement(profile.targetRoute.profileId, profile.id);
  }
''',
)

# App owns the Apply-before-dialog boundary and typed Draft replacement.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''    listProfileReferenceBlockers,
    parseProfileWorkflowState,
''',
    '''    listProfileReferenceBlockers,
    parseProfileWorkflowState,
    replaceProfileReferencesDraft,
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "  import ProfileDeletionDialog from './ProfileDeletionDialog.svelte';\n",
    "  import ProfileDeletionDialog from './ProfileDeletionDialog.svelte';\n  import ProfileReplacementDialog from './ProfileReplacementDialog.svelte';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  interface PendingProfileDeletion {
    readonly profileId: string;
    readonly profileName: string;
    readonly blockers: readonly ProfileReferenceBlocker[];
  }

  type InterfaceFlag =
''',
    '''  interface PendingProfileDeletion {
    readonly profileId: string;
    readonly profileName: string;
    readonly blockers: readonly ProfileReferenceBlocker[];
  }

  interface PendingProfileReplacement {
    readonly fromProfileId: string;
    readonly toProfileId: string;
  }

  type InterfaceFlag =
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  let pendingProfileDeletion: PendingProfileDeletion | undefined;
''',
    '''  let pendingProfileDeletion: PendingProfileDeletion | undefined;
  let pendingProfileReplacement: PendingProfileReplacement | undefined;
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  async function updateProfileName(name: string): Promise<void> {
''',
    '''  async function requestProfileReplacement(
    fromProfileId: string,
    toProfileId: string,
  ): Promise<void> {
    if (!state || saving || view?.busy || !(await commitActiveProfileEditor())) return;
    if (view?.dirty) {
      const confirmed = globalThis.confirm(
        'Apply current changes before replacing profile references?',
      );
      if (!confirmed) return;
      const applied = await runCommand({
        action: 'apply',
        expectedGeneration: state.generation,
      });
      if (!applied) return;
    }
    if (
      !state.draft.profiles.some((profile) => profile.id === fromProfileId) ||
      !state.draft.profiles.some((profile) => profile.id === toProfileId)
    ) {
      errorMessage = 'A replacement endpoint no longer exists.';
      return;
    }
    pendingProfileReplacement = { fromProfileId, toProfileId };
  }

  async function confirmProfileReplacement(
    fromProfileId: string,
    toProfileId: string,
  ): Promise<void> {
    if (!state) return;
    try {
      if (
        await replaceDraft(
          replaceProfileReferencesDraft(state.draft, fromProfileId, toProfileId),
        )
      ) {
        pendingProfileReplacement = undefined;
      }
    } catch (error) {
      errorMessage = messageFrom(error);
    }
  }

  async function updateProfileName(name: string): Promise<void> {
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
''',
    '''          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onRequestReplacement={requestProfileReplacement}
        />
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''{#if pendingProfileDeletion}
  <ProfileDeletionDialog
    profileName={pendingProfileDeletion.profileName}
    blockers={pendingProfileDeletion.blockers}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileDeletion = undefined)}
    onConfirm={confirmProfileDeletion}
  />
{/if}
''',
    '''{#if pendingProfileDeletion}
  <ProfileDeletionDialog
    profileName={pendingProfileDeletion.profileName}
    blockers={pendingProfileDeletion.blockers}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileDeletion = undefined)}
    onConfirm={confirmProfileDeletion}
  />
{/if}

{#if pendingProfileReplacement && state}
  <ProfileReplacementDialog
    spec={state.draft}
    initialFromProfileId={pendingProfileReplacement.fromProfileId}
    initialToProfileId={pendingProfileReplacement.toProfileId}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileReplacement = undefined)}
    onConfirm={confirmProfileReplacement}
  />
{/if}
''',
)

# Component rendering contract.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    "import ProfileDeletionDialog from './entrypoints/options/ProfileDeletionDialog.svelte';\n",
    "import ProfileDeletionDialog from './entrypoints/options/ProfileDeletionDialog.svelte';\nimport ProfileReplacementDialog from './entrypoints/options/ProfileReplacementDialog.svelte';\n",
)
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''  it('renders blocked and confirm profile-deletion dialogs without a destructive blocked action', () => {
''',
    '''  it('renders the original two-selector Profile replacement dialog and endpoint preview', () => {
    const source = createVirtualProfileDraft(baseSpec(), idFactory(), 'Alias');
    const from = source.draft.profiles.find((profile) => profile.id === 'profile-default-fixed');
    if (!from) throw new Error('default Fixed profile missing');
    const { body } = render(ProfileReplacementDialog, {
      props: {
        spec: source.draft,
        initialFromProfileId: from.id,
        initialToProfileId: source.profileId,
        onCancel: () => undefined,
        onConfirm: async () => undefined,
      },
    });
    expect(body).toContain('data-profile-replacement-dialog');
    expect(body).toContain('data-profile-replacement-from');
    expect(body).toContain('data-profile-replacement-to');
    expect(body).toContain('data-profile-replacement-preview');
    expect(body).toContain('The two profiles themselves are not changed or deleted.');
  });

  it('renders blocked and confirm profile-deletion dialogs without a destructive blocked action', () => {
''',
)

# Chromium replacement dialog: Apply-before-open, arbitrary selectors, preview, then typed migration + Apply.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  virtualOptions.once('dialog', (dialog) => dialog.accept());
  await virtualOptions.locator('[data-virtual-replace]').click();
  await assertEventually(
''',
    '''  virtualOptions.once('dialog', async (dialog) => {
    assert.match(dialog.message(), /Apply current changes before replacing profile references/u);
    await dialog.accept();
  });
  await virtualOptions.locator('[data-virtual-replace]').click();
  const replacementDialog = virtualOptions.locator('[data-profile-replacement-dialog]');
  await replacementDialog.waitFor({ state: 'visible', timeout: 20_000 });
  const replacementFrom = replacementDialog.locator('[data-profile-replacement-from]');
  const replacementTo = replacementDialog.locator('[data-profile-replacement-to]');
  assert.equal(await replacementFrom.inputValue(), virtualIds.targetId);
  assert.equal(await replacementTo.inputValue(), virtualIds.aliasId);
  await assertEventually(
    async () =>
      virtualWorker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          JSON.stringify(workflow.draft) === JSON.stringify(workflow.applied)
        );
      }),
    'Profile replacement dialog opened before the dirty Draft was applied',
    20_000,
  );
  await replacementFrom.selectOption({ label: 'Unrelated Proxy' });
  assert.match(await replacementDialog.locator('[data-profile-replacement-preview]').innerText(), /Unrelated Proxy/u);
  await replacementFrom.selectOption(virtualIds.targetId);
  await replacementTo.selectOption({ label: 'Existing Alias' });
  assert.match(await replacementDialog.locator('[data-profile-replacement-preview]').innerText(), /Existing Alias/u);
  await replacementTo.selectOption(virtualIds.aliasId);
  await replacementDialog.locator('[data-profile-replacement-confirm]').click();
  await assertEventually(
''',
)

# Permanent guard.
validator = Path('scripts/validate-ui-compatibility.mjs')
lines = validator.read_text().splitlines()
for index, line in enumerate(lines):
    if line.strip() == "const profileDeletionDialogPath =":
        # insert before two-line deletion path declaration
        lines[index:index] = [
            'const profileReplacementDialogPath =',
            "  'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte';",
        ]
        break
else:
    raise SystemExit('replacement dialog path anchor missing')
for index, line in enumerate(lines):
    if line.strip() == 'profileDeletionDialog,':
        lines.insert(index, '  profileReplacementDialog,')
        break
else:
    raise SystemExit('replacement dialog destructuring anchor missing')
for index, line in enumerate(lines):
    if line.strip() == "readFile(profileDeletionDialogPath, 'utf8'),":
        lines.insert(index, "  readFile(profileReplacementDialogPath, 'utf8'),")
        break
else:
    raise SystemExit('replacement dialog read anchor missing')
validator.write_text('\n'.join(lines) + '\n')

replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''    'Profile deletion must block typed references with an explicit referrer dialog, collapse hidden attached Rule Lists to their owner, and only delete unreferenced profiles through Draft plus normal Apply.',
  ],
''',
    '''    'Profile deletion must block typed references with an explicit referrer dialog, collapse hidden attached Rule Lists to their owner, and only delete unreferenced profiles through Draft plus normal Apply.',
  ],
  [
    virtualProfile.includes('onRequestReplacement') &&
      !virtualProfile.includes('globalThis.confirm') &&
      optionsApp.includes('requestProfileReplacement') &&
      optionsApp.includes('Apply current changes before replacing profile references?') &&
      optionsApp.includes('replaceProfileReferencesDraft') &&
      optionsApp.includes('<ProfileReplacementDialog') &&
      profileReplacementDialog.includes('data-profile-replacement-from') &&
      profileReplacementDialog.includes('data-profile-replacement-to') &&
      profileReplacementDialog.includes('data-profile-replacement-preview') &&
      profileReplacementDialog.includes('The two profiles') &&
      chromiumE2e.includes('Profile replacement dialog opened before the dirty Draft was applied') &&
      chromiumE2e.includes("replacementFrom.selectOption({ label: 'Unrelated Proxy' })") &&
      chromiumE2e.includes("replacementTo.selectOption({ label: 'Existing Alias' })"),
    'Virtual replacement must open the original general two-selector dialog after the dirty-Draft Apply boundary, preview both endpoints, and produce one typed replacement Draft without changing either profile.',
  ],
''',
)

# Durable source-backed docs.
kg = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg.write_text(
    kg.read_text()
    + '''
- 原版通用 Replace Profile 实际只有 Virtual 页面入口，但 `master.coffee` 的 `$rootScope.replaceProfile(fromName, toName)` 会先执行 `applyOptionsConfirm()`，再打开 `replace_profile.jade`；对话框内 `fromName` 与 `toName` 都是可重新选择的普通 Profile，而不是固定确认框。
- `replace_profile.jade` 同时展示两个 Profile 的行内预览与箭头；帮助文案明确所有规则、Startup、Quick Switch 等引用会从 from 改为 to，但 from/to 两个 Profile 本身均不改变也不删除。
- Nex 因此由 Options 持有 Apply-before-dialog 边界与 `replaceProfileReferencesDraft` 事务；Virtual 编辑器只传入默认端点。对话框排除隐藏附属 Rule List，但允许用户把 from/to 改为任意可见 Profile；确认后只更新 Draft，仍需正常 Apply。
'''
)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
audit = audit_path.read_text()
audit = audit.replace(
    '| B-06 | 替换情景模式引用  | `replace_profile.jade`、`options.coffee` | 批量把 from 引用替换为 to      | MUST_MATCH | PARTIAL  | PARTIAL | Virtual shortcut 已有完整 typed replace-ref transaction 与 Chromium 全链；通用页头 Replace 入口仍缺 | 增加通用 Replace 对话框       |',
    '| B-06 | 替换情景模式引用  | `replace_profile.jade`、`master.coffee` | Virtual 入口打开双选择器通用对话框；批量把 from 引用替换为 to | MUST_MATCH | DONE | PARTIAL | Apply-before-dialog、双端选择/预览、完整 typed transaction、端点保留及 Chromium 全链均已验证 | 补完整 locale |',
)
audit_path.write_text(audit)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
run_id = os.environ.get('PROFILE_REPLACEMENT_RUN_ID', 'PENDING')
insert_before = '### Profile deletion and reference protection\n'
section = f'''### General Replace Profile dialog\n\n- Original v3.5.0 exposes replacement from the Virtual page, but the modal is general: both `from` and `to` remain selectable, both endpoints are previewed, and the help text covers rules, Startup, Quick Switch, and other options while preserving both profiles.\n- Nex now applies any dirty Draft before opening the dialog, then uses the existing complete typed replacement transaction to produce a new Draft. The two endpoint profiles remain unchanged and the migration still requires normal Apply.\n- Hidden attached Rule Lists are excluded from both selectors. Chromium verifies the Apply-before-open boundary, arbitrary selector changes and previews, complete cross-type reference migration, endpoint preservation, and final Apply.\n- Integration run `{run_id}`; product commit containing this document.\n\n'''
if insert_before not in status:
    raise SystemExit('replacement status insertion anchor missing')
status = status.replace(insert_before, section + insert_before, 1)
status = status.replace(
    'Continue the general Replace Profile dialog, profile-level export actions, and typed locale coverage; keep file PAC activation under an explicit target capability decision.',
    'Continue profile-level PAC/Rule List export actions and typed locale coverage; keep file PAC activation under an explicit target capability decision.',
)
status_path.write_text(status)
