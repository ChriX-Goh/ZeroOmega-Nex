from pathlib import Path
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


# PAC editor: background-owned auth.all UI.
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  import {
    attachedRuleListProfileIds,
    type ProfileWorkflowPacSourceUpdateView,
  } from '@zeroomega-nex/profile-workflow';
''',
    '''  import {
    attachedRuleListProfileIds,
    type ProfileWorkflowPacSourceUpdateView,
    type ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  export let disabled = false;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onGetPacSourceUpdateStatus: (
''',
    '''  export let disabled = false;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onReplaceDraftWithSecrets: (
    draft: ProfileSpec,
    materials: readonly ProfileWorkflowSecretMaterial[],
  ) => Promise<boolean> = async (draft) => onReplaceDraft(draft);
  export let onReadSecret: (secretRef: string) => Promise<string> = async () => '';
  export let onGetPacSourceUpdateStatus: (
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  let updateView: ProfileWorkflowPacSourceUpdateView | undefined;
  let updateLoading = false;
  let loadedUpdateKey = '';
''',
    '''  let updateView: ProfileWorkflowPacSourceUpdateView | undefined;
  let updateLoading = false;
  let loadedUpdateKey = '';
  let authOpen = false;
  let authUsername = '';
  let authPassword = '';
  let authOriginalPassword = '';
  let authSecretRef = '';
  let authLoading = false;
  let authSaving = false;
  let authError = '';
  let showAuthPassword = false;
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  function formatTimestamp(value: string | undefined): string {
''',
    '''  async function openAuthentication(): Promise<void> {
    if (!profile || authSaving) return;
    authOpen = true;
    authUsername = profile.credential?.username ?? '';
    authPassword = '';
    authOriginalPassword = '';
    authSecretRef = profile.credential?.passwordSecretRef ?? '';
    authError = '';
    showAuthPassword = false;
    if (!authSecretRef) return;
    authLoading = true;
    try {
      authPassword = await onReadSecret(authSecretRef);
      authOriginalPassword = authPassword;
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
    } finally {
      authLoading = false;
    }
  }

  function closeAuthentication(): void {
    if (authSaving) return;
    authOpen = false;
    authPassword = '';
    authOriginalPassword = '';
    authError = '';
  }

  async function saveAuthentication(): Promise<void> {
    if (!profile || authSaving) return;
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.profiles.find(
      (candidate): candidate is PacProfile =>
        candidate.id === profileId && candidate.kind === 'pac',
    );
    if (!target) {
      authError = 'PAC Profile no longer exists.';
      return;
    }
    const previousRef = target.credential?.passwordSecretRef;
    const secretRef = previousRef ?? `secret-pac-${crypto.randomUUID()}`;
    const username = authUsername.trim();
    target.credential = {
      ...(username ? { username } : {}),
      passwordSecretRef: secretRef,
    };
    const materials: ProfileWorkflowSecretMaterial[] =
      previousRef === undefined || authPassword !== authOriginalPassword
        ? [{ ref: secretRef, value: authPassword }]
        : [];
    authSaving = true;
    authError = '';
    try {
      if (!(await onReplaceDraftWithSecrets(draft, materials))) return;
      authOpen = false;
      authPassword = '';
      authOriginalPassword = '';
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
    } finally {
      authSaving = false;
    }
  }

  async function removeAuthentication(): Promise<void> {
    if (!profile || authSaving) return;
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.profiles.find(
      (candidate): candidate is PacProfile =>
        candidate.id === profileId && candidate.kind === 'pac',
    );
    if (!target) return;
    delete target.credential;
    authSaving = true;
    authError = '';
    try {
      if (!(await onReplaceDraft(draft))) return;
      authOpen = false;
      authPassword = '';
      authOriginalPassword = '';
    } catch (error) {
      authError = error instanceof Error ? error.message : String(error);
    } finally {
      authSaving = false;
    }
  }

  function formatTimestamp(value: string | undefined): string {
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''    <section class="settings-section" data-pac-fallback-section>
''',
    '''    <section class="settings-section" data-pac-authentication>
      <h2>Proxy Authentication</h2>
      <p class="section-help">
        These credentials answer Basic or Digest authentication challenges from any proxy returned by
        this top-level PAC Script. Ordinary website authentication is never answered.
      </p>
      <div class="authentication-row">
        <button
          type="button"
          data-pac-auth-action="edit"
          disabled={disabled || authLoading || authSaving}
          onclick={() => void openAuthentication()}
        >
          {profile.credential ? 'Edit all-proxy authentication' : 'Set all-proxy authentication'}
        </button>
        <span role="status">
          {profile.credential
            ? `Configured${profile.credential.username ? ` for ${profile.credential.username}` : ''}.`
            : 'Not configured.'}
        </span>
      </div>
    </section>

    <section class="settings-section" data-pac-fallback-section>
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''{/if}

<style>
''',
    '''{/if}

{#if authOpen && profile}
  <div class="modal-backdrop" role="presentation">
    <section
      class="auth-dialog"
      data-pac-auth-dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="pac-auth-title"
    >
      <header>
        <h2 id="pac-auth-title">PAC Proxy Authentication</h2>
        <button
          type="button"
          class="close-button"
          aria-label="Close PAC authentication"
          onclick={closeAuthentication}>×</button
        >
      </header>
      <div class="dialog-body">
        <p>
          One credential is used only for proxy authentication challenges while this PAC Profile is
          the active top-level route.
        </p>
        <label>
          Username
          <input
            aria-label="PAC authentication username"
            autocomplete="username"
            value={authUsername}
            disabled={authLoading || authSaving}
            oninput={(event) =>
              (authUsername = (event.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label>
          Password
          <input
            aria-label="PAC authentication password"
            type={showAuthPassword ? 'text' : 'password'}
            autocomplete="current-password"
            value={authPassword}
            disabled={authLoading || authSaving}
            oninput={(event) =>
              (authPassword = (event.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label class="show-password-row">
          <input
            type="checkbox"
            checked={showAuthPassword}
            disabled={authLoading || authSaving}
            onchange={(event) =>
              (showAuthPassword = (event.currentTarget as HTMLInputElement).checked)}
          />
          Show password
        </label>
        {#if authError}<p class="source-update-error" role="alert">{authError}</p>{/if}
      </div>
      <footer>
        {#if profile.credential}
          <button
            type="button"
            class="danger"
            data-pac-auth-action="remove"
            disabled={authLoading || authSaving}
            onclick={() => void removeAuthentication()}>Remove authentication</button
          >
        {/if}
        <span class="dialog-spacer"></span>
        <button type="button" disabled={authSaving} onclick={closeAuthentication}>Cancel</button>
        <button
          type="button"
          class="primary"
          data-pac-auth-action="save"
          disabled={authLoading || authSaving}
          onclick={() => void saveAuthentication()}
        >
          {authSaving ? 'Saving…' : 'Save authentication'}
        </button>
      </footer>
    </section>
  </div>
{/if}

<style>
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  .url-row,
  .download-row {
''',
    '''  .url-row,
  .download-row,
  .authentication-row {
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  .download-row {
    margin-top: 0.75rem;
  }
''',
    '''  .download-row {
    margin-top: 0.75rem;
  }

  .authentication-row {
    justify-content: flex-start;
  }
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
    '''  select {
    width: min(100%, 34rem);
  }
''',
    '''  select {
    width: min(100%, 34rem);
  }

  .modal-backdrop {
    position: fixed;
    z-index: 50;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgb(0 0 0 / 42%);
    padding: 1rem;
  }

  .auth-dialog {
    width: min(100%, 34rem);
    border: 1px solid var(--border-strong);
    border-radius: 4px;
    background: var(--panel-bg);
    box-shadow: 0 14px 40px rgb(0 0 0 / 28%);
  }

  .auth-dialog header,
  .auth-dialog footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border);
    padding: 0.75rem 0.9rem;
  }

  .auth-dialog footer {
    border-top: 1px solid var(--border);
    border-bottom: 0;
  }

  .auth-dialog header h2 {
    flex: 1;
    margin: 0;
  }

  .dialog-body {
    padding: 0.9rem;
  }

  .dialog-body label:not(.show-password-row) {
    display: grid;
    gap: 0.3rem;
    margin-top: 0.65rem;
  }

  .show-password-row {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-top: 0.65rem;
  }

  .dialog-spacer {
    flex: 1;
  }
''',
)

# App passes the existing background secret callbacks.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onGetPacSourceUpdateStatus={getPacSourceUpdateStatus}
''',
    '''          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onReplaceDraftWithSecrets={replaceDraftWithSecrets}
          onReadSecret={readSecret}
          onGetPacSourceUpdateStatus={getPacSourceUpdateStatus}
''',
)

# Component rendering contract includes auth entry and never renders a secret.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    profile.headers = [
      { name: 'X-Component', value: { kind: 'literal', value: 'component-value' } },
    ];
''',
    '''    profile.headers = [
      { name: 'X-Component', value: { kind: 'literal', value: 'component-value' } },
    ];
    profile.credential = {
      username: 'component-user',
      passwordSecretRef: 'secret-pac-component',
    };
''',
)
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''        disabled: false,
        onReplaceDraft: replaceDraft,
      },
''',
    '''        disabled: false,
        onReplaceDraft: replaceDraft,
        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
      },
''',
)
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    expect(body).toContain("function FindProxyForURL() { return 'DIRECT'; }");
  });
''',
    '''    expect(body).toContain("function FindProxyForURL() { return 'DIRECT'; }");
    expect(body).toContain('data-pac-authentication');
    expect(body).toContain('data-pac-auth-action="edit"');
    expect(body).toContain('Configured for component-user.');
    expect(body).not.toContain('secret-pac-component');
  });
''',
)

# Chromium: edit PAC auth before normal Apply, then activate real top-level raw PAC near the end.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await pacScript.press('Tab');

  await options.getByRole('button', { name: 'rule-switchy', exact: true }).click();
''',
    '''  await pacScript.press('Tab');
  await pacEditor.locator('[data-pac-auth-action="edit"]').click();
  const pacAuthDialog = options.locator('[data-pac-auth-dialog]');
  await pacAuthDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await pacAuthDialog.getByLabel('PAC authentication username').fill('pac-e2e-user');
  await pacAuthDialog.getByLabel('PAC authentication password').fill('pac-e2e-secret');
  await pacAuthDialog.locator('[data-pac-auth-action="save"]').click();
  await pacAuthDialog.waitFor({ state: 'detached', timeout: 20_000 });

  await options.getByRole('button', { name: 'rule-switchy', exact: true }).click();
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  options.once('dialog', (dialog) => dialog.accept());
  await attachedRow.getByRole('button', { name: 'Delete attached Rule List' }).click();
  await attachRuleList.waitFor();
  assert.equal(await options.locator('[data-attached-rule-list-row]').count(), 0);

  conflictContext = await chromium.launchPersistentContext(conflictUserDataDir, {
''',
    '''  options.once('dialog', (dialog) => dialog.accept());
  await attachedRow.getByRole('button', { name: 'Delete attached Rule List' }).click();
  await attachRuleList.waitFor();
  assert.equal(await options.locator('[data-attached-rule-list-row]').count(), 0);

  const rawPacActivation = await worker.evaluate(async () => {
    const workflowKey = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(workflowKey))[workflowKey];
    const pac = workflow?.applied?.profiles?.find((profile) => profile.name === 'pac');
    if (!workflow || !pac || pac.kind !== 'pac') throw new Error('Applied PAC profile is missing');
    const response = await chrome.runtime.sendMessage({
      channel: 'zeroomega-nex/profile-workflow/v1',
      action: 'activate-route',
      expectedAppliedRevisionId: workflow.applied.revision.id,
      route: { kind: 'profile', profileId: pac.id },
    });
    return { response, profileId: pac.id, secretRef: pac.credential?.passwordSecretRef };
  });
  assert.equal(rawPacActivation.response?.ok, true, 'Top-level raw PAC activation was rejected');
  assert.doesNotMatch(JSON.stringify(rawPacActivation.response), /pac-e2e-secret/u);
  await assertEventually(async () => {
    const storage = await worker.evaluate(async () => chrome.storage.local.get(null));
    const workflow = storage['zeroomega-nex/profile-workflow/v1/state'];
    const proxyState = storage['zeroomega-nex/browser-proxy/v1/state'];
    const snapshot = proxyState?.activeSnapshotId
      ? storage[`zeroomega-nex/browser-proxy/v1/snapshot/${proxyState.activeSnapshotId}`]
      : undefined;
    const bindings = storage['zeroomega-nex/proxy-auth/v1/bindings'];
    const secret = rawPacActivation.secretRef
      ? storage[`zeroomega-nex/proxy-auth/v1/secret/${rawPacActivation.secretRef}`]
      : undefined;
    return (
      snapshot?.compilerVersion === 'raw-pac/1' &&
      snapshot?.verification?.mode === 'structural' &&
      snapshot?.startRoute?.kind === 'profile' &&
      snapshot.startRoute.profileId === rawPacActivation.profileId &&
      snapshot.script.includes("return 'PROXY proxy.invalid:8080'") &&
      Array.isArray(bindings) &&
      bindings.length === 1 &&
      bindings[0]?.scope === 'all-proxies' &&
      bindings[0]?.profileId === rawPacActivation.profileId &&
      bindings[0]?.username === 'pac-e2e-user' &&
      secret === 'pac-e2e-secret' &&
      !JSON.stringify(workflow).includes('pac-e2e-secret')
    );
  }, 'Raw PAC snapshot, all-proxy binding, or isolated secret was not installed', 20_000);

  conflictContext = await chromium.launchPersistentContext(conflictUserDataDir, {
''',
)

# Permanent guard loads raw activation/authentication implementation.
validator_path = Path('scripts/validate-ui-compatibility.mjs')
validator = validator_path.read_text()
validator = validator.replace(
    "const pacSourceUpdatePath = 'packages/profile-workflow/src/pac-source-update.ts';\n",
    "const pacSourceUpdatePath = 'packages/profile-workflow/src/pac-source-update.ts';\nconst rawPacSnapshotPath = 'packages/pac-compiler/src/raw-snapshot.ts';\nconst profileWorkflowActivationPath =\n  'apps/extension/src/lib/profile-workflow-activation.ts';\nconst proxyAuthenticationPath = 'packages/browser-adapters/src/authentication.ts';\nconst proxyAuthenticationPlanPath = 'packages/browser-adapters/src/authentication-plan.ts';\n",
    1,
)
validator = validator.replace(
    '''  pacProfileEditor,
  pacSourceUpdate,
] = await Promise.all([''',
    '''  pacProfileEditor,
  pacSourceUpdate,
  rawPacSnapshot,
  profileWorkflowActivation,
  proxyAuthentication,
  proxyAuthenticationPlan,
] = await Promise.all([''',
    1,
)
validator = validator.replace(
    '''  readFile(pacProfileEditorPath, 'utf8'),
  readFile(pacSourceUpdatePath, 'utf8'),
]);''',
    '''  readFile(pacProfileEditorPath, 'utf8'),
  readFile(pacSourceUpdatePath, 'utf8'),
  readFile(rawPacSnapshotPath, 'utf8'),
  readFile(profileWorkflowActivationPath, 'utf8'),
  readFile(proxyAuthenticationPath, 'utf8'),
  readFile(proxyAuthenticationPlanPath, 'utf8'),
]);''',
    1,
)
old_guard = '''      legacyImportImplementation.includes('pac.downloaded-cache-preserved') &&
      legacyExport.includes('profile.source.script !== undefined'),
    'PAC URL sources must preserve imported/downloaded cache, use bounded background update records and headers, render original URL/script/file-warning state, and retain Clear URL → inline semantics with Chromium coverage.',
'''
new_guard = '''      legacyImportImplementation.includes('pac.downloaded-cache-preserved') &&
      legacyImportImplementation.includes('secret.unknown-pac-auth-slot') &&
      legacyExport.includes('profile.source.script !== undefined') &&
      legacyExport.includes('secret.pac-credential-omitted') &&
      pacProfileEditor.includes('data-pac-authentication') &&
      pacProfileEditor.includes('data-pac-auth-dialog') &&
      pacProfileEditor.includes('onReplaceDraftWithSecrets') &&
      rawPacSnapshot.includes("RAW_PAC_SNAPSHOT_VERSION = 'raw-pac/1'") &&
      rawPacSnapshot.includes("mode: 'structural'") &&
      profileWorkflowActivation.includes('createRawPacSnapshot') &&
      profileWorkflowActivation.includes('const rawScript = rawPacScript(spec, route)') &&
      proxyAuthentication.includes("scope: 'all-proxies'") &&
      proxyAuthenticationPlan.includes("profile?.kind === 'pac'") &&
      chromiumE2e.includes("snapshot?.compilerVersion === 'raw-pac/1'") &&
      chromiumE2e.includes("bindings[0]?.scope === 'all-proxies'"),
    'PAC must preserve remote cache and original editor states, install arbitrary scripts only as structurally verified top-level raw snapshots, keep nested composition unsupported, and isolate one all-proxy authentication credential in background storage with Chromium evidence.',
'''
if validator.count(old_guard) != 1:
    raise SystemExit('raw PAC permanent guard anchor missing')
validator_path.write_text(validator.replace(old_guard, new_guard, 1))

# Durable knowledge graph.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(
    kg_path.read_text()
    + '''
- 任意 PAC Script 只有“直接作为顶层活动 PAC Profile”时可安装；Switch/Rule List/Virtual 中嵌套引用仍进入 typed PAC capability analysis，并因无法安全组合任意脚本而明确拒绝。顶层脚本生成 `raw-pac/1` 快照，要求非空、无 NUL、存在 `FindProxyForURL`、不超过统一脚本预算；记录 ProfileSpec/script 哈希、target-dependent 警告和 structural 验证，再复用浏览器 install→confirm→rollback/last-known-good 事务。
- `file:` PAC 当前明确不由 inline browser adapter 激活；UI 保留原版警告与“被引用时错误”，运行时在准备认证和修改浏览器前失败。此限制必须作为 target 能力决策保留，不能静默改用旧缓存。
- 原版 PAC `auth.all` 映射为 PacProfile 的一个 `credential` secret ref；密码只存在后台 proxy-auth secret store。顶层 PAC 激活时注册一个 `all-proxies` binding，只响应代理 Basic/Digest challenge；精确 endpoint binding 优先，多个 wildcard binding 视为歧义并拒绝，普通网站认证永不响应。普通 `.bak` 明确省略该凭据并告警。
'''
)

# Audit rows.
audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
updates = {
    'F-05': '| F-05 | PAC Script             | 同上                                     | URL 时下载结果/只读；无 URL 可编辑 | MUST_MATCH | DONE     | PARTIAL  | URL 缓存只读、Clear 后可编辑；直接选择时生成 `raw-pac/1` structural 快照并走浏览器确认事务 | 补 locale 与 Firefox |',
    'F-06': '| F-06 | PAC 认证全部代理       | 同上                                     | 入口和浏览器警告                   | MUST_MATCH | DONE     | PARTIAL  | 独立认证入口；`auth.all` secret ref 后台保存；exact endpoint 优先、单 wildcard、普通网站不响应；单测与 Chromium 覆盖 | 补 locale 与真实 407 人工巡查 |',
    'F-07': '| F-07 | 不支持目标提示         | 同上                                     | 明确错误                           | MUST_MATCH | DONE     | PARTIAL  | 顶层 inline/缓存 PAC 可激活；file/无缓存/无入口点明确失败；嵌套任意 PAC 继续被 capability analysis 阻断 | 补完整 locale 与 Firefox |',
    'J-07': '| J-07 | PAC URL/download/header E2E        | MUST_MATCH | DONE     | Chromium 覆盖真实下载、只读缓存、Clear→inline、认证 secret 隔离、`raw-pac/1` 顶层激活及 all-proxies binding；核心单测覆盖精确优先/歧义拒绝 | 补 Firefox 与真实 407 人工巡查 |',
}
for key, replacement in updates.items():
    matches = [index for index, line in enumerate(lines) if line.startswith(f'| {key} ')]
    if len(matches) != 1:
        raise SystemExit(f'expected one audit row {key}, found {len(matches)}')
    lines[matches[0]] = replacement
audit_path.write_text('\n'.join(lines) + '\n')

# Durable status: synchronize prior stable exact head and add this slice.
status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
run_id = os.environ.get('RAW_PAC_RUN_ID', 'pending')
status = status.replace(
    '**Current product implementation head:** independent Rule List editor product commit containing this document  ',
    '**Current product implementation head:** raw PAC activation/authentication product commit containing this document  ',
)
status = status.replace(
    '**Latest integration verification:** run `30303532476` validates the original independent Rule List Config/URL/Text editor, bounded remote update, URL-clear inline restoration, and Chromium interaction with full `pnpm verify` and regression  ',
    f'**Latest integration verification:** run `{run_id}` validates top-level raw PAC snapshots, browser activation, all-proxy authentication isolation, and Chromium runtime state with full `pnpm verify` and regression  ',
)
status = status.replace(
    '**Last completed exact-Head verification:** `43361d20e065fc83c0fadf54b19ef787df8700f7`; CI `30301191730`, Browser E2E `30301191783`, Parity Documentation `30301191992` passed  ',
    '**Last completed exact-Head verification:** `f5412dc66940849a58f1aa056d1b904cf984490f`; CI `30313437508`, Browser E2E `30313437519`, Parity Documentation `30313437487` passed  ',
)
anchor = '### PAC remote source state machine\n'
section = f'''### Top-level raw PAC activation and all-proxy authentication

- Directly selected inline or downloaded-cache PAC Profiles now create deterministic `raw-pac/1` snapshots instead of entering the generated typed PAC graph.
- Raw snapshots enforce script bounds and entrypoint structure, hash the ProfileSpec and script, record a target-dependent warning plus structural verification, then reuse the existing browser install, confirmation, rollback, and last-known-good transaction.
- Arbitrary PAC remains non-composable: nested references continue to fail typed capability analysis. `file:` and URL sources without cache fail before authentication preparation or browser mutation.
- Original `auth.all` maps to one PAC credential secret ref. The Options dialog reads/writes only through background commands; the password remains in proxy-auth secret storage and ordinary `.bak` export omits it with a warning.
- Runtime authentication gives exact endpoint bindings priority; otherwise exactly one active PAC all-proxy binding may answer proxy Basic/Digest challenges. Ambiguous wildcard credentials and ordinary website challenges receive no credentials.
- Chromium E2E edits PAC credentials, applies the Draft normally, activates the PAC through the typed background command, and verifies the `raw-pac/1` snapshot, all-proxies binding, isolated secret, and absence of plaintext in ProfileSpec or command response.
- Integration run `{run_id}`; product commit containing this document.

'''
if status.count(anchor) != 1:
    raise SystemExit('raw PAC status insertion anchor missing')
status = status.replace(anchor, section + anchor, 1)
status = status.replace(
    '- PAC URL/download/cache/authentication semantics,\n',
    '- PAC localization, Firefox activation/download coverage, real proxy-challenge manual QC, and explicit file-URL target decision,\n',
)
status = status.replace(
    'Add verified top-level raw PAC activation and original all-proxy authentication semantics; keep nested arbitrary PAC composition and file activation under explicit target capability decisions. Do not request repository-owner installation until a consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.',
    'Continue Switch localization/source-editor browser persistence, Virtual browser E2E, and complete localization; keep file PAC activation under an explicit target capability decision. Do not request repository-owner installation until a consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.',
)
status_path.write_text(status)
