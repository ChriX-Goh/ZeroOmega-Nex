from pathlib import Path
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:160]!r}')
    target.write_text(text.replace(old, new, 1))


Path('apps/extension/src/entrypoints/options/PacProfileEditor.svelte').write_text(r'''<script lang="ts">
  import {
    cloneProfileSpecDraft,
    type PacProfile,
    type ProfileRouteTarget,
    type ProfileSpec,
    type RuleSourceHeader,
    type UserProfile,
  } from '@zeroomega-nex/profile-spec';
  import {
    attachedRuleListProfileIds,
    type ProfileWorkflowPacSourceUpdateView,
  } from '@zeroomega-nex/profile-workflow';

  export let spec: ProfileSpec;
  export let profileId: string;
  export let disabled = false;
  export let onReplaceDraft: (draft: ProfileSpec) => Promise<boolean>;
  export let onGetPacSourceUpdateStatus: (
    profileId: string,
  ) => Promise<ProfileWorkflowPacSourceUpdateView | undefined> = async () => undefined;
  export let onUpdatePacSource: (
    profileId: string,
    url: string,
  ) => Promise<ProfileWorkflowPacSourceUpdateView | undefined> = async () => undefined;

  let profile: PacProfile | undefined;
  let routeProfiles: readonly UserProfile[] = [];
  let referenced = false;
  let updateView: ProfileWorkflowPacSourceUpdateView | undefined;
  let updateLoading = false;
  let loadedUpdateKey = '';

  $: profile = spec.profiles.find(
    (candidate): candidate is PacProfile => candidate.id === profileId && candidate.kind === 'pac',
  );
  $: {
    const hidden = attachedRuleListProfileIds(spec);
    routeProfiles = spec.profiles.filter(
      (candidate) => candidate.id !== profileId && !hidden.has(candidate.id),
    );
    referenced = spec.profiles.some(
      (candidate) => candidate.id !== profileId && profileReferences(candidate, profileId),
    );
  }
  $: {
    const key = profile?.source.kind === 'url' ? `${profile.id}:${profile.source.url}` : '';
    if (key !== loadedUpdateKey) {
      loadedUpdateKey = key;
      updateView = undefined;
      if (profile?.source.kind === 'url' && isRemoteUrl(profile.source.url)) {
        void loadUpdateStatus(profile.id);
      }
    }
  }

  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
      .value;
  }

  function profileReferences(candidate: UserProfile, targetId: string): boolean {
    const references: ProfileRouteTarget[] =
      candidate.kind === 'switch'
        ? [candidate.defaultRoute, ...candidate.rules.map((rule) => rule.route)]
        : candidate.kind === 'rule-list'
          ? [candidate.matchRoute, candidate.defaultRoute]
          : candidate.kind === 'virtual'
            ? [candidate.targetRoute]
            : candidate.kind === 'pac' || candidate.kind === 'auto-detect'
              ? candidate.fallbackRoute
                ? [candidate.fallbackRoute]
                : []
              : [];
    return references.some((route) => route.kind === 'profile' && route.profileId === targetId);
  }

  function isFileUrl(url: string): boolean {
    return url.trim().toLowerCase().startsWith('file:');
  }

  function isRemoteUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  async function mutateProfile(update: (target: PacProfile) => void): Promise<void> {
    const draft = cloneProfileSpecDraft(spec);
    const target = draft.profiles.find(
      (candidate): candidate is PacProfile => candidate.id === profileId && candidate.kind === 'pac',
    );
    if (!target) return;
    update(target);
    await onReplaceDraft(draft);
  }

  async function updateUrl(value: string): Promise<void> {
    const url = value.trim();
    await mutateProfile((target) => {
      const script = target.source.script ?? '';
      target.source = url
        ? { kind: 'url', url, ...(script ? { script } : {}) }
        : { kind: 'inline', script };
    });
  }

  async function clearUrl(): Promise<void> {
    await updateUrl('');
  }

  async function updateScript(script: string): Promise<void> {
    await mutateProfile((target) => {
      if (target.source.kind !== 'inline') return;
      target.source.script = script;
    });
  }

  async function updateFallback(value: string): Promise<void> {
    const route =
      value === ''
        ? undefined
        : value === 'direct' || value === 'system'
          ? { kind: value }
          : value.startsWith('profile:')
            ? { kind: 'profile' as const, profileId: value.slice('profile:'.length) }
            : undefined;
    await mutateProfile((target) => {
      if (route === undefined) delete target.fallbackRoute;
      else target.fallbackRoute = route;
    });
  }

  function routeValue(route: ProfileRouteTarget | undefined): string {
    if (!route) return '';
    return route.kind === 'profile' ? `profile:${route.profileId}` : route.kind;
  }

  async function mutateHeaders(update: (headers: RuleSourceHeader[]) => void): Promise<void> {
    await mutateProfile((target) => {
      const headers = structuredClone(target.headers ?? []);
      update(headers);
      if (headers.length === 0) delete target.headers;
      else target.headers = headers;
    });
  }

  async function addHeader(): Promise<void> {
    await mutateHeaders((headers) => {
      headers.push({ name: '', value: { kind: 'literal', value: '' } });
    });
  }

  async function updateHeaderName(index: number, name: string): Promise<void> {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (header) header.name = name.trim();
    });
  }

  async function updateHeaderKind(index: number, kind: 'literal' | 'secret'): Promise<void> {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (!header) return;
      header.value =
        kind === 'literal'
          ? { kind: 'literal', value: '' }
          : { kind: 'secret', secretRef: `secret-header-${crypto.randomUUID()}` };
    });
  }

  async function updateHeaderValue(index: number, value: string): Promise<void> {
    await mutateHeaders((headers) => {
      const header = headers[index];
      if (!header) return;
      header.value =
        header.value.kind === 'literal'
          ? { kind: 'literal', value }
          : { kind: 'secret', secretRef: value.trim() };
    });
  }

  async function removeHeader(index: number): Promise<void> {
    await mutateHeaders((headers) => headers.splice(index, 1));
  }

  async function loadUpdateStatus(id: string): Promise<void> {
    updateView = await onGetPacSourceUpdateStatus(id);
  }

  async function downloadNow(): Promise<void> {
    if (!profile || profile.source.kind !== 'url' || !isRemoteUrl(profile.source.url) || updateLoading)
      return;
    updateLoading = true;
    try {
      const updated = await onUpdatePacSource(profile.id, profile.source.url);
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

  function updateSummary(view: ProfileWorkflowPacSourceUpdateView | undefined): string {
    if (!view?.lastAttemptAt) return 'PAC script is obsolete until downloaded.';
    if (view.lastError) {
      return `Last update failed ${formatTimestamp(view.lastError.occurredAt)}. Existing cached script was preserved.`;
    }
    const stale = view.stale ? ' Cached script is stale.' : '';
    const bytes = view.lastBytes === undefined ? '' : ` ${view.lastBytes} bytes.`;
    return `Last updated ${formatTimestamp(view.lastSuccessAt)}.${bytes}${stale}`;
  }
</script>

{#if profile}
  <div data-pac-profile-editor>
    <section class="settings-section" data-pac-url-section>
      <h2>PAC URL</h2>
      <div class="url-row">
        <input
          aria-label="PAC URL"
          value={profile.source.kind === 'url' ? profile.source.url : ''}
          placeholder="https://example.com/proxy.pac"
          {disabled}
          onchange={(event) => updateUrl(valueFrom(event))}
        />
        <button
          type="button"
          aria-label="Clear PAC URL"
          disabled={disabled || profile.source.kind !== 'url'}
          onclick={clearUrl}>Clear</button
        >
      </div>
      <p class="section-help">Leave the URL empty to edit PAC Script directly.</p>
      {#if profile.source.kind === 'url' && isFileUrl(profile.source.url)}
        <p class="file-warning" role="alert" data-pac-file-warning>
          Local file PAC URLs depend on browser file-access capability.
        </p>
        {#if referenced}
          <p class="source-update-error" role="alert">
            A file PAC cannot be referenced by another profile. Use it only as a top-level route.
          </p>
        {/if}
      {/if}
      {#if profile.source.kind === 'url' && !isFileUrl(profile.source.url)}
        <details open={(profile.headers?.length ?? 0) > 0} data-pac-request-headers>
          <summary>Request headers</summary>
          <p class="section-help">Sensitive values use background-owned secret references.</p>
          {#each profile.headers ?? [] as header, index (`${header.name}:${index}`)}
            <div class="header-row">
              <input
                aria-label={`PAC header ${index + 1} name`}
                value={header.name}
                {disabled}
                onchange={(event) => updateHeaderName(index, valueFrom(event))}
              />
              <select
                aria-label={`PAC header ${index + 1} value type`}
                value={header.value.kind}
                {disabled}
                onchange={(event) =>
                  updateHeaderKind(index, valueFrom(event) as 'literal' | 'secret')}
              >
                <option value="literal">Literal</option>
                <option value="secret">Secret reference</option>
              </select>
              <input
                aria-label={`PAC header ${index + 1} value`}
                value={header.value.kind === 'literal'
                  ? header.value.value
                  : header.value.secretRef}
                {disabled}
                onchange={(event) => updateHeaderValue(index, valueFrom(event))}
              />
              <button type="button" {disabled} onclick={() => removeHeader(index)}>Remove</button>
            </div>
          {/each}
          <button type="button" {disabled} onclick={addHeader}>Add header</button>
        </details>
        <div class="download-row">
          <button
            type="button"
            data-pac-source-update-now
            disabled={disabled || updateLoading || !isRemoteUrl(profile.source.url)}
            onclick={downloadNow}
          >
            {updateLoading ? 'Downloading…' : 'Download now'}
          </button>
          <p class:stale={updateView?.stale} role="status" data-pac-source-update-status>
            {updateSummary(updateView)}
          </p>
        </div>
        {#if updateView?.lastError}
          <p class="source-update-error" role="alert">{updateView.lastError.message}</p>
        {/if}
      {/if}
    </section>

    <section class="settings-section" data-pac-script-section>
      <h2>PAC Script</h2>
      {#if profile.source.kind === 'url' && isFileUrl(profile.source.url)}
        <p class="section-help">The browser reads this local file directly; cached script text is hidden.</p>
      {:else}
        <textarea
          class="monospace"
          aria-label="PAC Script"
          rows="20"
          readonly={profile.source.kind === 'url'}
          value={profile.source.script ?? ''}
          {disabled}
          onchange={(event) => updateScript(valueFrom(event))}
        ></textarea>
      {/if}
    </section>

    <section class="settings-section" data-pac-fallback-section>
      <h2>Target capability fallback</h2>
      <p class="section-help">
        Used only when the selected browser cannot activate this PAC source. It does not compose the
        arbitrary PAC script into another profile.
      </p>
      <select
        aria-label="PAC fallback profile"
        value={routeValue(profile.fallbackRoute)}
        {disabled}
        onchange={(event) => updateFallback(valueFrom(event))}
      >
        <option value="">No fallback</option>
        <option value="direct">Direct</option>
        <option value="system">System Proxy</option>
        {#each routeProfiles as target (target.id)}
          <option value={`profile:${target.id}`}>{target.name}</option>
        {/each}
      </select>
    </section>
  </div>
{/if}

<style>
  .url-row,
  .download-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    width: min(100%, 920px);
  }

  .url-row input {
    flex: 1;
  }

  .download-row {
    margin-top: 0.75rem;
  }

  .download-row p {
    margin: 0;
  }

  .stale,
  .source-update-error,
  .file-warning {
    color: var(--danger-text, #b3261e);
  }

  .header-row {
    display: grid;
    grid-template-columns: minmax(10rem, 0.8fr) minmax(9rem, 0.45fr) minmax(13rem, 1fr) auto;
    gap: 0.45rem;
    width: min(100%, 980px);
    margin: 0.55rem 0;
  }

  .monospace {
    width: min(100%, 980px);
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  select {
    width: min(100%, 34rem);
  }

  @media (max-width: 760px) {
    .url-row,
    .download-row {
      align-items: stretch;
      flex-direction: column;
    }

    .header-row {
      grid-template-columns: 1fr;
    }
  }
</style>
''')

# App imports and methods.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''    ProfileWorkflowCommandResponse,
    ProfileWorkflowIdFactory,
''',
    '''    ProfileWorkflowCommandResponse,
    ProfileWorkflowIdFactory,
    ProfileWorkflowPacSourceUpdateView,
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "  import NewProfileDialog from './NewProfileDialog.svelte';\n  import RuleListProfileEditor from './RuleListProfileEditor.svelte';",
    "  import NewProfileDialog from './NewProfileDialog.svelte';\n  import PacProfileEditor from './PacProfileEditor.svelte';\n  import RuleListProfileEditor from './RuleListProfileEditor.svelte';",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  async function acceptImportedAndApply(
''',
    '''  async function getPacSourceUpdateStatus(
    profileId: string,
  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'get-pac-source-update-status',
        profileId,
      });
      acceptResponse(response);
      return response.pacSourceUpdate;
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    } finally {
      saving = false;
    }
  }

  async function updatePacSource(
    profileId: string,
    url: string,
  ): Promise<ProfileWorkflowPacSourceUpdateView | undefined> {
    if (!state || saving) return undefined;
    let granted = false;
    try {
      granted = await requestRuleSourceOriginPermission(url);
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    }
    if (!granted) {
      errorMessage = 'Host permission is required before downloading this PAC URL.';
      return undefined;
    }
    saving = true;
    try {
      const response = await sendProfileWorkflowCommand({
        action: 'update-pac-source',
        expectedGeneration: state.generation,
        profileId,
      });
      acceptResponse(response);
      return response.pacSourceUpdate;
    } catch (error) {
      errorMessage = messageFrom(error);
      return undefined;
    } finally {
      saving = false;
    }
  }

  async function acceptImportedAndApply(
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''      {:else if selectedProfile.kind === 'pac' || selectedProfile.kind === 'auto-detect'}
        <AdvancedProfileEditor
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
''',
    '''      {:else if selectedProfile.kind === 'pac'}
        <PacProfileEditor
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onGetPacSourceUpdateStatus={getPacSourceUpdateStatus}
          onUpdatePacSource={updatePacSource}
        />
      {:else if selectedProfile.kind === 'auto-detect'}
        <AdvancedProfileEditor
          spec={state.draft}
          profileId={selectedProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
''',
)

# Component rendering contracts.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    "import NewProfileDialog from './entrypoints/options/NewProfileDialog.svelte';\nimport RuleListProfileEditor from './entrypoints/options/RuleListProfileEditor.svelte';",
    "import NewProfileDialog from './entrypoints/options/NewProfileDialog.svelte';\nimport PacProfileEditor from './entrypoints/options/PacProfileEditor.svelte';\nimport RuleListProfileEditor from './entrypoints/options/RuleListProfileEditor.svelte';",
)
component_path = Path('apps/extension/src/component-rendering.component.spec.ts')
component = component_path.read_text()
anchor = "  it('renders the inactive legacy import review entry point without secret values', () => {"
test = r'''  it('renders the original PAC URL, headers, download status, and read-only cache sections', () => {
    const mutation = createPacProfileDraft(baseSpec(), idFactory(), 'PAC component');
    const profile = mutation.draft.profiles.find((candidate) => candidate.id === mutation.profileId);
    if (!profile || profile.kind !== 'pac') throw new Error('PAC profile was not created');
    profile.source = {
      kind: 'url',
      url: 'https://pac.example.invalid/proxy.pac',
      script: "function FindProxyForURL() { return 'DIRECT'; }",
    };
    profile.headers = [
      { name: 'X-Component', value: { kind: 'literal', value: 'component-value' } },
    ];
    const { body } = render(PacProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    });

    expect(body).toContain('data-pac-profile-editor');
    expect(body).toContain('data-pac-url-section');
    expect(body).toContain('aria-label="PAC URL"');
    expect(body).toContain('data-pac-request-headers');
    expect(body).toContain('PAC header 1 name');
    expect(body).toContain('data-pac-source-update-now');
    expect(body).toContain('data-pac-source-update-status');
    expect(body).toContain('data-pac-script-section');
    expect(body).toContain('aria-label="PAC Script"');
    expect(body).toContain('readonly');
    expect(body).toContain("function FindProxyForURL() { return &#39;DIRECT&#39;; }");
  });

'''
if component.count(anchor) != 1:
    raise SystemExit('PAC component test insertion anchor missing')
component_path.write_text(component.replace(anchor, test + anchor, 1))

# Chromium E2E server gains a PAC endpoint and PAC UI interaction after the restored backup.
e2e_path = Path('scripts/e2e-chromium.mjs')
e2e = e2e_path.read_text()
e2e = e2e.replace(
    "let remoteRuleText = '[AutoProxy 0.2.9]\\n||downloaded.e2e.invalid';\n",
    "let remoteRuleText = '[AutoProxy 0.2.9]\\n||downloaded.e2e.invalid';\nlet remotePacText = \"function FindProxyForURL(url, host) { return 'DIRECT'; }\\n\";\n",
    1,
)
e2e = e2e.replace(
    "  if (request.url?.startsWith('/diagnostic-error')) {\n    request.socket.destroy();\n    return;\n  }\n  ruleRequestCount += 1;",
    "  if (request.url?.startsWith('/diagnostic-error')) {\n    request.socket.destroy();\n    return;\n  }\n  if (request.url?.startsWith('/proxy.pac')) {\n    response.writeHead(200, {\n      'content-type': 'application/x-ns-proxy-autoconfig; charset=utf-8',\n      'cache-control': 'no-store',\n    });\n    response.end(remotePacText);\n    return;\n  }\n  ruleRequestCount += 1;",
    1,
)
e2e = e2e.replace(
    "const remoteRuleUrl = `http://127.0.0.1:${ruleAddress.port}/rules.txt`;\n",
    "const remoteRuleUrl = `http://127.0.0.1:${ruleAddress.port}/rules.txt`;\nconst remotePacUrl = `http://127.0.0.1:${ruleAddress.port}/proxy.pac`;\n",
    1,
)
anchor = "  await options.getByRole('button', { name: 'rule-switchy', exact: true }).click();"
pac_test = r'''  await options.getByRole('button', { name: 'pac', exact: true }).click();
  const pacEditor = options.locator('[data-pac-profile-editor]');
  await pacEditor.waitFor({ state: 'visible', timeout: 20_000 });
  const pacUrl = pacEditor.getByRole('textbox', { name: 'PAC URL', exact: true });
  await pacUrl.fill(remotePacUrl);
  await pacUrl.press('Tab');
  const pacDownload = pacEditor.locator('[data-pac-source-update-now]');
  await assertEventually(
    async () => !(await pacDownload.isDisabled()),
    'PAC download button remained disabled after saving the URL',
  );
  await pacDownload.click();
  await pacEditor
    .locator('[data-pac-source-update-status]')
    .filter({ hasText: 'Last updated' })
    .waitFor({ timeout: 20_000 });
  const pacScript = pacEditor.getByLabel('PAC Script', { exact: true });
  assert.equal(await pacScript.inputValue(), remotePacText);
  assert.equal(await pacScript.isEditable(), false);
  await pacEditor.getByRole('button', { name: 'Clear PAC URL', exact: true }).click();
  await assertEventually(
    async () => (await pacScript.isEditable()) && (await pacScript.inputValue()) === remotePacText,
    'Clearing PAC URL did not preserve the downloaded script as editable inline text',
  );
  await pacScript.fill("function FindProxyForURL(url, host) { return 'PROXY proxy.invalid:8080'; }\n");
  await pacScript.press('Tab');

'''
if e2e.count(anchor) != 1:
    raise SystemExit('PAC Chromium E2E insertion anchor missing')
e2e_path.write_text(e2e.replace(anchor, pac_test + anchor, 1))

# Permanent guard.
validator_path = Path('scripts/validate-m8-ui.mjs')
validator = validator_path.read_text()
validator = validator.replace(
    "const originalBackupProvenancePath =\n  'fixtures/zeroomega-v2/original-default-v3.5.0.provenance.json';\n",
    "const originalBackupProvenancePath =\n  'fixtures/zeroomega-v2/original-default-v3.5.0.provenance.json';\nconst pacProfileEditorPath = 'apps/extension/src/entrypoints/options/PacProfileEditor.svelte';\nconst pacSourceUpdatePath = 'packages/profile-workflow/src/pac-source-update.ts';\n",
    1,
)
validator = validator.replace(
    "  originalBackupProvenance,\n] = await Promise.all([",
    "  originalBackupProvenance,\n  pacProfileEditor,\n  pacSourceUpdate,\n] = await Promise.all([",
    1,
)
validator = validator.replace(
    "  readFile(originalBackupProvenancePath, 'utf8'),\n]);",
    "  readFile(originalBackupProvenancePath, 'utf8'),\n  readFile(pacProfileEditorPath, 'utf8'),\n  readFile(pacSourceUpdatePath, 'utf8'),\n]);",
    1,
)
req_anchor = "  [\n    popupStyle.includes(\"font-family: 'Segoe UI'\"),"
req = r'''  [
    optionsApp.includes("import PacProfileEditor from './PacProfileEditor.svelte'") &&
      optionsApp.includes("action: 'get-pac-source-update-status'") &&
      optionsApp.includes("action: 'update-pac-source'") &&
      pacProfileEditor.includes('data-pac-profile-editor') &&
      pacProfileEditor.includes('data-pac-url-section') &&
      pacProfileEditor.includes('data-pac-request-headers') &&
      pacProfileEditor.includes('data-pac-source-update-now') &&
      pacProfileEditor.includes('data-pac-script-section') &&
      pacProfileEditor.includes("readonly={profile.source.kind === 'url'}") &&
      pacProfileEditor.includes('data-pac-file-warning') &&
      pacSourceUpdate.includes('PAC_UPDATE_KEY_PREFIX') &&
      pacSourceUpdate.includes('target.source.script = downloaded.content') &&
      chromiumE2e.includes('data-pac-source-update-now') &&
      chromiumE2e.includes("name: 'Clear PAC URL'") &&
      legacyImportImplementation.includes('pac.downloaded-cache-preserved') &&
      legacyExport.includes('profile.source.script !== undefined'),
    'PAC URL sources must preserve imported/downloaded cache, use bounded background update records and headers, render original URL/script/file-warning state, and retain Clear URL → inline semantics with Chromium coverage.',
  ],
'''
if validator.count(req_anchor) != 1:
    raise SystemExit('PAC permanent guard insertion anchor missing')
validator_path.write_text(validator.replace(req_anchor, req + req_anchor, 1))

# Knowledge graph and status/audit.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(kg_path.read_text() + r'''
- PAC Profile 的 URL 与脚本不是互斥丢弃关系：URL 非空表示 remote 模式，`source.script` 保存最近下载缓存；修改 URL 保留缓存但因更新账本 URL 不匹配而标记 obsolete/stale；清空 URL 将同一缓存转为可编辑 inline script。
- PAC 远程更新复用已验证的后台 downloader、secret header、10 秒/4 MiB 边界、CAS 与单一 alarms 调度器。持久状态仍使用兼容的 `ruleSourceUpdates` 账本，但 PAC 项以 `pac:<profileId>` 键隔离；ProfileSpec 不保存 `lastUpdate` 等运行时字段。
- `file:` PAC 不通过后台下载器；独立编辑页按原版显示本地文件警告，隐藏缓存脚本文本，并在被其他 Profile 引用时明确报错。真正的文件 PAC 激活能力仍需目标适配器范围决定。
''')

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
updates = {
    'F-01': '| F-01 | PAC URL                | `profile_pac.jade`                       | 单独 URL 输入/清除                 | MUST_MATCH | DONE     | PARTIAL | 已恢复独立 URL 输入；URL 存在即 remote，Clear 保留缓存并回到 inline；Chromium E2E 覆盖 | 补 locale 与 Firefox |',
    'F-02': '| F-02 | file URL 警告          | 同上                                     | 按引用和 target 显示               | MUST_MATCH | PARTIAL  | PARTIAL | 已显示 file 警告、被其他 Profile 引用错误并隐藏脚本；目标适配器尚未支持 file 激活 | 明确现代能力范围 |',
    'F-03': '| F-03 | PAC 请求头             | 同上                                     | 远程 URL 时可展开                  | MUST_MATCH | DONE     | PARTIAL | HTTP/HTTPS URL 时显示空白可增删 header；敏感值保持 secret ref；组件守卫覆盖 | 补秘密值编辑 UX 与 locale |',
    'F-04': '| F-04 | PAC 立即下载           | 同上                                     | 更新远程脚本                       | MUST_MATCH | DONE     | PARTIAL | 复用安全 downloader、权限、10 秒/4 MiB、CAS、失败保旧缓存与调度器；Chromium 真实下载覆盖 | 补 Firefox 与 locale |',
    'F-05': '| F-05 | PAC Script             | 同上                                     | URL 时下载结果/只读；无 URL 可编辑 | MUST_MATCH | DONE     | PARTIAL | URL 缓存只读、URL 改变标 obsolete、Clear 后同一脚本可编辑；原版备份导入导出保留 cache | 补激活与 locale |',
}
for key, replacement in updates.items():
    matches = [index for index, line in enumerate(lines) if line.startswith(f'| {key} ')]
    if len(matches) != 1:
        raise SystemExit(f'expected one audit row {key}, found {len(matches)}')
    lines[matches[0]] = replacement
for index, line in enumerate(lines):
    if line.startswith('| J-07 '):
        lines[index] = '| J-07 | PAC URL/download/header E2E        | MUST_MATCH | PARTIAL | Chromium 已覆盖真实 HTTP PAC 下载、状态、只读缓存、Clear→inline；顶层激活/auth 与 Firefox 仍缺 | 补激活、auth、Firefox |'
        break
audit_path.write_text('\n'.join(lines) + '\n')

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
run_id = os.environ.get('PAC_REMOTE_RUN_ID', 'pending')
insert_anchor = '### Independent imported Rule List editor\n'
section = f'''### PAC remote source state machine

- URL PAC now retains an optional downloaded script cache in typed ProfileSpec; runtime timestamps/errors remain outside ProfileSpec in the update ledger.
- Original backup import preserves `pacScript` beside `pacUrl`, and export writes both back, restoring offline/round-trip semantics.
- A dedicated PAC editor restores URL, remote-only headers, Download now/status, read-only downloaded script, Clear URL → retained editable inline script, file warning, and referenced-file error behavior.
- PAC updates reuse the verified optional origin permission, background downloader, secret-header resolution, 10-second/4 MiB bounds, CAS conflict handling, failure-preserves-cache behavior, and coalesced alarm scheduler.
- This slice does not yet declare PAC complete: top-level arbitrary PAC activation, `auth.all`, nested PAC capability boundaries, and file activation remain pending.
- Integration run `{run_id}`; product commit containing this document.

'''
if status.count(insert_anchor) != 1:
    raise SystemExit('PAC status insertion anchor missing')
status = status.replace(insert_anchor, section + insert_anchor, 1)
status = status.replace(
    'Extend the PAC model with remote-script cache/update state, then rebuild its original URL/headers/download/read-only/file-warning/authentication editor and browser coverage.',
    'Add verified top-level raw PAC activation and original all-proxy authentication semantics; keep nested arbitrary PAC composition and file activation under explicit target capability decisions.',
)
status_path.write_text(status)
