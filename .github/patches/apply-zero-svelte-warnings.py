from pathlib import Path
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


# New Profile: neutral dialog container and programmatic first focus instead of autofocus.
replace_once(
    'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n",
    "  import { onMount, tick } from 'svelte';\n\n  import ProfileIcon from '../../components/ProfileIcon.svelte';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
    '''  let submitting = false;

  $: normalizedName = name.trim();
''',
    '''  let submitting = false;
  let nameInput: HTMLInputElement | undefined;

  onMount(() => {
    void tick().then(() => {
      if (!disabled) nameInput?.focus();
    });
  });

  $: normalizedName = name.trim();
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
    '''  <section
    class="new-profile-dialog"
    role="dialog"
''',
    '''  <div
    class="new-profile-dialog"
    role="dialog"
    tabindex="-1"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
    '''        <input
          autofocus
          aria-describedby="new-profile-name-message"
''',
    '''        <input
          bind:this={nameInput}
          data-new-profile-name-input
          aria-describedby="new-profile-name-message"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
    '''  </section>
</div>
''',
    '''  </div>
</div>
''',
)

# Fixed Profile: alert belongs inside the table cell; auth dialog receives focus explicitly.
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    '''  import type {
    ProfileWorkflowIdFactory,
    ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';
''',
    '''  import type {
    ProfileWorkflowIdFactory,
    ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';
  import { tick } from 'svelte';
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    '''  let showPassword = false;

  $: profile = spec.profiles.find(
''',
    '''  let showPassword = false;
  let authUsernameInput: HTMLInputElement | undefined;

  $: profile = spec.profiles.find(
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    '''    authError = '';
    showPassword = false;
    if (!authSecretRef) return;
''',
    '''    authError = '';
    showPassword = false;
    void tick().then(() => authUsernameInput?.focus());
    if (!authSecretRef) return;
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    '''                <tr class="row-error">
                  <td colspan="5" role="alert">{rowErrors[row.key]}</td>
                </tr>
''',
    '''                <tr class="row-error">
                  <td colspan="5"><span role="alert">{rowErrors[row.key]}</span></td>
                </tr>
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    '''    <section
      class="auth-dialog"
      data-fixed-auth-dialog
      role="dialog"
''',
    '''    <div
      class="auth-dialog"
      data-fixed-auth-dialog
      role="dialog"
      tabindex="-1"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    '''          <input
            aria-label="Username"
''',
    '''          <input
            bind:this={authUsernameInput}
            aria-label="Username"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
    '''    </section>
  </div>
{/if}

<style>
''',
    '''    </div>
  </div>
{/if}

<style>
''',
)

# PAC authentication dialog uses the same neutral/focus pattern.
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  import {
    attachedRuleListProfileIds,
    type ProfileWorkflowPacSourceUpdateView,
    type ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';
''',
    '''  import {
    attachedRuleListProfileIds,
    type ProfileWorkflowPacSourceUpdateView,
    type ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';
  import { tick } from 'svelte';
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  let showAuthPassword = false;

  $: profile = spec.profiles.find(
''',
    '''  let showAuthPassword = false;
  let authUsernameInput: HTMLInputElement | undefined;

  $: profile = spec.profiles.find(
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''    authError = '';
    showAuthPassword = false;
    if (!authSecretRef) return;
''',
    '''    authError = '';
    showAuthPassword = false;
    void tick().then(() => authUsernameInput?.focus());
    if (!authSecretRef) return;
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''    <section
      class="auth-dialog"
      data-pac-auth-dialog
      role="dialog"
''',
    '''    <div
      class="auth-dialog"
      data-pac-auth-dialog
      role="dialog"
      tabindex="-1"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''          <input
            aria-label="PAC authentication username"
''',
    '''          <input
            bind:this={authUsernameInput}
            aria-label="PAC authentication username"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''    </section>
  </div>
{/if}

<style>
''',
    '''    </div>
  </div>
{/if}

<style>
''',
)

# Deletion dialogs: neutral containers and deterministic initial focus.
replace_once(
    'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
    "  import type { ProfileReferenceBlocker } from '@zeroomega-nex/profile-workflow';\n",
    "  import type { ProfileReferenceBlocker } from '@zeroomega-nex/profile-workflow';\n  import { onMount, tick } from 'svelte';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
    '''  export let onConfirm: () => Promise<void>;
</script>
''',
    '''  export let onConfirm: () => Promise<void>;

  let initialButton: HTMLButtonElement | undefined;

  onMount(() => {
    void tick().then(() => initialButton?.focus());
  });
</script>
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
    '''    <section
      class="deletion-dialog"
      role="alertdialog"
''',
    '''    <div
      class="deletion-dialog"
      role="alertdialog"
      tabindex="-1"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
    '''        <button type="button" data-profile-deletion-close onclick={onCancel}>Close</button>
''',
    '''        <button bind:this={initialButton} type="button" data-profile-deletion-close onclick={onCancel}
          >Close</button
        >
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
    '''    </section>
  {:else}
    <section
      class="deletion-dialog"
      role="dialog"
''',
    '''    </div>
  {:else}
    <div
      class="deletion-dialog"
      role="dialog"
      tabindex="-1"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
    '''        <button type="button" data-profile-deletion-cancel {disabled} onclick={onCancel}
''',
    '''        <button
          bind:this={initialButton}
          type="button"
          data-profile-deletion-cancel
          {disabled}
          onclick={onCancel}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
    '''    </section>
  {/if}
''',
    '''    </div>
  {/if}
''',
)

# Fail all future Svelte warnings in CI.
replace_once(
    'apps/extension/package.json',
    '    "check": "svelte-check --tsconfig ./tsconfig.json",\n',
    '    "check": "svelte-check --tsconfig ./tsconfig.json --fail-on-warnings",\n',
)

# Component rendering contracts for neutral dialogs and removed autofocus.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    expect(blocked).toContain('role="alertdialog"');
''',
    '''    expect(blocked).toContain('<div class="deletion-dialog" role="alertdialog" tabindex="-1"');
''',
)
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    expect(confirm).toContain('role="dialog"');
''',
    '''    expect(confirm).toContain('<div class="deletion-dialog" role="dialog" tabindex="-1"');
''',
)
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    expect(body).toContain('role="dialog"');
    expect(body).toContain('Profile name');
''',
    '''    expect(body).toContain('<div class="new-profile-dialog" role="dialog" tabindex="-1"');
    expect(body).toContain('data-new-profile-name-input');
    expect(body).not.toContain('autofocus');
    expect(body).toContain('Profile name');
''',
)

# Real browser focus checks for New Profile, Fixed auth, PAC auth, and deletion dialogs.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await authDialog.getByRole('heading', { name: '代理登录', exact: true }).waitFor();
  await authDialog.getByLabel('用户名', { exact: true }).fill('chromium-e2e');
''',
    '''  await authDialog.getByRole('heading', { name: '代理登录', exact: true }).waitFor();
  const fixedAuthUsername = authDialog.getByLabel('用户名', { exact: true });
  await assertEventually(
    async () => fixedAuthUsername.evaluate((element) => element === document.activeElement),
    'Fixed authentication dialog did not focus the username field',
  );
  await fixedAuthUsername.fill('chromium-e2e');
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  const pacAuthDialog = options.locator('[data-pac-auth-dialog]');
  await pacAuthDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await pacAuthDialog.getByLabel('PAC authentication username').fill('pac-e2e-user');
''',
    '''  const pacAuthDialog = options.locator('[data-pac-auth-dialog]');
  await pacAuthDialog.waitFor({ state: 'visible', timeout: 20_000 });
  const pacAuthUsername = pacAuthDialog.getByLabel('PAC authentication username');
  await assertEventually(
    async () => pacAuthUsername.evaluate((element) => element === document.activeElement),
    'PAC authentication dialog did not focus the username field',
  );
  await pacAuthUsername.fill('pac-e2e-user');
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  const newVirtualDialog = virtualOptions.locator('.new-profile-dialog');
  await newVirtualDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await newVirtualDialog.locator('.profile-name-field input').fill('Stable Alias');
''',
    '''  const newVirtualDialog = virtualOptions.locator('.new-profile-dialog');
  await newVirtualDialog.waitFor({ state: 'visible', timeout: 20_000 });
  const newVirtualName = newVirtualDialog.locator('[data-new-profile-name-input]');
  await assertEventually(
    async () => newVirtualName.evaluate((element) => element === document.activeElement),
    'New Profile dialog did not focus the profile-name field',
  );
  await newVirtualName.fill('Stable Alias');
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await blockedDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  const blockerNames = await blockedDeletion
''',
    '''  await blockedDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await assertEventually(
    async () =>
      blockedDeletion
        .locator('[data-profile-deletion-close]')
        .evaluate((element) => element === document.activeElement),
    'Blocked deletion dialog did not focus its Close action',
  );
  const blockerNames = await blockedDeletion
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await confirmDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await confirmDeletion.locator('[data-profile-deletion-confirm]').click();
''',
    '''  await confirmDeletion.waitFor({ state: 'visible', timeout: 20_000 });
  await assertEventually(
    async () =>
      confirmDeletion
        .locator('[data-profile-deletion-cancel]')
        .evaluate((element) => element === document.activeElement),
    'Deletion confirmation dialog did not focus its Cancel action',
  );
  await confirmDeletion.locator('[data-profile-deletion-confirm]').click();
''',
)

# Permanent source guard and docs.
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''    'Profile headers must export current-Draft PAC and Switch rule-list files with original filenames, UTF-8 MIME, legacy fallback warning, raw PAC validation, and real Chromium downloads.',
  ],
''',
    '''    'Profile headers must export current-Draft PAC and Switch rule-list files with original filenames, UTF-8 MIME, legacy fallback warning, raw PAC validation, and real Chromium downloads.',
  ],
  [
    !newProfileDialog.includes('<section') &&
      newProfileDialog.includes('class="new-profile-dialog"') &&
      newProfileDialog.includes('role="dialog"') &&
      newProfileDialog.includes('data-new-profile-name-input') &&
      newProfileDialog.includes('nameInput?.focus()') &&
      !newProfileDialog.includes('autofocus') &&
      !fixedProfile.includes('<section\n      class="auth-dialog"') &&
      fixedProfile.includes('authUsernameInput?.focus()') &&
      fixedProfile.includes('<span role="alert">{rowErrors[row.key]}</span>') &&
      !pacProfileEditor.includes('<section\n      class="auth-dialog"') &&
      pacProfileEditor.includes('authUsernameInput?.focus()') &&
      !profileDeletionDialog.includes('<section') &&
      profileDeletionDialog.includes('initialButton?.focus()') &&
      extensionPackage.includes('--fail-on-warnings') &&
      chromiumE2e.includes('Fixed authentication dialog did not focus the username field') &&
      chromiumE2e.includes('PAC authentication dialog did not focus the username field') &&
      chromiumE2e.includes('New Profile dialog did not focus the profile-name field') &&
      chromiumE2e.includes('Blocked deletion dialog did not focus its Close action'),
    'All Options dialogs must use neutral role containers, deterministic initial focus, valid alert placement, and a permanent fail-on-warnings Svelte check.',
  ],
''',
)

# Add files to the UI validator input list.
validator = Path('scripts/validate-ui-compatibility.mjs')
text = validator.read_text()
text = text.replace(
    "const fixedProfilePath = 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte';\n",
    "const fixedProfilePath = 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte';\nconst newProfileDialogPath = 'apps/extension/src/entrypoints/options/NewProfileDialog.svelte';\nconst profileDeletionDialogPathForWarnings =\n  'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte';\nconst extensionPackagePath = 'apps/extension/package.json';\n",
    1,
)
text = text.replace(
    '  fixedProfile,\n  switchProfile,\n',
    '  fixedProfile,\n  newProfileDialog,\n  profileDeletionDialog,\n  extensionPackage,\n  switchProfile,\n',
    1,
)
text = text.replace(
    "  readFile(fixedProfilePath, 'utf8'),\n  readFile(switchProfilePath, 'utf8'),\n",
    "  readFile(fixedProfilePath, 'utf8'),\n  readFile(newProfileDialogPath, 'utf8'),\n  readFile(profileDeletionDialogPathForWarnings, 'utf8'),\n  readFile(extensionPackagePath, 'utf8'),\n  readFile(switchProfilePath, 'utf8'),\n",
    1,
)
validator.write_text(text)

kg = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg.write_text(
    kg.read_text()
    + '''
- Options 模态框的原版信息结构保持不变，但现代 Svelte 可访问性边界收紧：New Profile、Fixed/PAC authentication、删除阻断/确认均使用中性 `div` + `role=dialog/alertdialog`，不再把交互角色强加给 `section`；表格错误在 `td` 内部用 `span role=alert`，避免破坏表格语义。
- New Profile 不再使用 HTML `autofocus`，而是在组件挂载后聚焦名称输入；Fixed/PAC 认证在打开后聚焦用户名；删除对话框聚焦 Close/Cancel。Chromium 对这些真实焦点转移做回归验证。
- `@zeroomega-nex/extension check` 固定使用 `svelte-check --fail-on-warnings`。从此任何 Svelte 编译/可访问性警告都视为 CI 失败，不允许重新积累警告债务。
'''
)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
run_id = os.environ.get('ZERO_WARNING_RUN_ID', 'PENDING')
insert_before = '### Profile-level PAC and Rule List exports\n'
section = f'''### Zero-warning accessible Options dialogs\n\n- The seven remaining Svelte warnings were fully enumerated: New Profile dialog/autofocus, Fixed table alert/auth dialog, PAC auth dialog, and blocked/confirm deletion dialogs.\n- Neutral dialog containers preserve the existing original interaction layout while removing invalid section roles. New Profile, Fixed/PAC authentication, and deletion dialogs now move focus deterministically to their first meaningful control.\n- Table validation keeps native table semantics by placing `role=alert` inside the error cell. Chromium verifies each focus transition through the real Options workflows.\n- The extension check now uses `svelte-check --fail-on-warnings`, permanently making any future warning a CI failure.\n- Integration run `{run_id}`; product commit containing this document.\n\n'''
if insert_before not in status:
    raise SystemExit('zero-warning status insertion anchor missing')
status = status.replace(insert_before, section + insert_before, 1)
status = status.replace(
    '- remaining accessibility warnings in New Profile and Fixed authentication dialogs.\n',
    '',
)
status = status.replace(
    'Continue typed locale coverage and remaining accessibility warnings; keep file PAC activation under an explicit target capability decision.',
    'Continue typed locale coverage; keep file PAC activation under an explicit target capability decision.',
)
status_path.write_text(status)
