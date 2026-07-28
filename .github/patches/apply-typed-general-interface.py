from pathlib import Path


def replace_once(pathname: str, old: str, new: str) -> None:
    path = Path(pathname)
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{pathname}: expected one anchor, found {count}: {old[:120]!r}')
    path.write_text(text.replace(old, new, 1))


catalog = r'''  'options.documentTitle': {
    en: 'ZeroOmega Nex Options',
    'zh-CN': 'ZeroOmega Nex 选项',
    'zh-TW': 'ZeroOmega Nex 選項',
  },
  'options.navAria': { en: 'ZeroOmega options', 'zh-CN': 'ZeroOmega 选项', 'zh-TW': 'ZeroOmega 選項' },
  'options.nav.settings': { en: 'Settings', 'zh-CN': '设置', 'zh-TW': '設定' },
  'options.nav.profiles': { en: 'Profiles', 'zh-CN': '情景模式', 'zh-TW': '情境模式' },
  'options.nav.actions': { en: 'Actions', 'zh-CN': '操作', 'zh-TW': '操作' },
  'options.nav.interface': { en: 'Interface', 'zh-CN': '界面', 'zh-TW': '介面' },
  'options.nav.general': { en: 'General', 'zh-CN': '通用', 'zh-TW': '一般' },
  'options.nav.theme': { en: 'Theme', 'zh-CN': '主题', 'zh-TW': '佈景主題' },
  'options.nav.builtIn': {
    en: 'Built-in Profiles',
    'zh-CN': '内置情景模式',
    'zh-TW': '內建情境模式',
  },
  'options.nav.newProfile': {
    en: 'New profile…',
    'zh-CN': '新建情景模式…',
    'zh-TW': '新增情境模式…',
  },
  'options.actions.working': { en: 'Working…', 'zh-CN': '处理中…', 'zh-TW': '處理中…' },
  'options.actions.apply': { en: 'Apply changes', 'zh-CN': '应用选项', 'zh-TW': '套用選項' },
  'options.actions.discard': { en: 'Discard changes', 'zh-CN': '撤销更改', 'zh-TW': '復原變更' },
  'options.draft.applying': {
    en: 'Apply is in progress.',
    'zh-CN': '正在应用选项。',
    'zh-TW': '正在套用選項。',
  },
  'options.draft.sourceDirty': {
    en: 'Switch source contains unapplied changes.',
    'zh-CN': '自动切换源代码有尚未应用的更改。',
    'zh-TW': '自動切換原始碼有尚未套用的變更。',
  },
  'options.draft.dirty': {
    en: 'Draft contains unapplied changes.',
    'zh-CN': '有尚未应用的更改。',
    'zh-TW': '有尚未套用的變更。',
  },
  'options.draft.clean': {
    en: 'Draft matches the currently applied revision.',
    'zh-CN': '当前设置已全部应用。',
    'zh-TW': '目前設定已全部套用。',
  },
  'options.error.title': { en: 'Operation failed', 'zh-CN': '操作失败', 'zh-TW': '操作失敗' },
  'options.error.safeMessage': {
    en: 'The operation could not be completed. Retry or review the relevant status panel.',
    'zh-CN': '无法完成此操作。请重试或查看相关状态区域。',
    'zh-TW': '無法完成此操作。請重試或查看相關狀態區域。',
  },
  'options.error.ruleListPermission': {
    en: 'Host permission is required before downloading this Rule List URL.',
    'zh-CN': '下载此规则列表网址前，需要授予网站权限。',
    'zh-TW': '下載此規則清單網址前，需要授予網站權限。',
  },
  'options.error.pacPermission': {
    en: 'Host permission is required before downloading this PAC URL.',
    'zh-CN': '下载此 PAC 网址前，需要授予网站权限。',
    'zh-TW': '下載此 PAC 網址前，需要授予網站權限。',
  },
  'options.error.replacementMissing': {
    en: 'A replacement endpoint no longer exists.',
    'zh-CN': '用于替换的情景模式已不存在。',
    'zh-TW': '用於取代的情境模式已不存在。',
  },
  'options.loading.title': { en: 'Loading profiles', 'zh-CN': '正在加载情景模式', 'zh-TW': '正在載入情境模式' },
  'options.loading.help': {
    en: 'Reading the saved ZeroOmega configuration.',
    'zh-CN': '正在读取已保存的 ZeroOmega 配置。',
    'zh-TW': '正在讀取已儲存的 ZeroOmega 設定。',
  },
  'options.confirm.export': {
    en: 'Apply current changes before exporting the Options backup?',
    'zh-CN': '导出选项备份前，先应用当前更改吗？',
    'zh-TW': '匯出選項備份前，先套用目前變更嗎？',
  },
  'options.confirm.replace': {
    en: 'Apply current changes before replacing profile references?',
    'zh-CN': '替换情景模式引用前，先应用当前更改吗？',
    'zh-TW': '取代情境模式參照前，先套用目前變更嗎？',
  },
  'options.apply.noAttempt': {
    en: 'No Apply attempt recorded.',
    'zh-CN': '尚无应用记录。',
    'zh-TW': '尚無套用記錄。',
  },
  'options.apply.succeeded': {
    en: 'The latest Apply completed successfully.',
    'zh-CN': '最近一次应用已成功完成。',
    'zh-TW': '最近一次套用已成功完成。',
  },
  'options.apply.failed': {
    en: 'The latest Apply failed.',
    'zh-CN': '最近一次应用失败。',
    'zh-TW': '最近一次套用失敗。',
  },
  'general.title': { en: 'General', 'zh-CN': '通用', 'zh-TW': '一般' },
  'general.help': {
    en: 'Startup and quick-switch behavior.',
    'zh-CN': '启动和快速切换行为。',
    'zh-TW': '啟動與快速切換行為。',
  },
  'general.startup.title': { en: 'Startup profile', 'zh-CN': '启动情景模式', 'zh-TW': '啟動情境模式' },
  'general.startup.label': {
    en: 'Profile used when the extension starts',
    'zh-CN': '扩展启动时使用的情景模式',
    'zh-TW': '擴充功能啟動時使用的情境模式',
  },
  'general.startup.aria': { en: 'Startup route', 'zh-CN': '启动路由', 'zh-TW': '啟動路由' },
  'general.startup.keepCurrent': {
    en: 'Keep current browser setting',
    'zh-CN': '保持当前浏览器设置',
    'zh-TW': '保留目前瀏覽器設定',
  },
  'general.startup.revert': {
    en: 'Revert proxy changes when ZeroOmega releases control',
    'zh-CN': 'ZeroOmega 释放控制权时恢复代理更改',
    'zh-TW': 'ZeroOmega 釋放控制權時復原 Proxy 變更',
  },
  'general.quickSwitch.title': { en: 'Quick Switch', 'zh-CN': '快速切换', 'zh-TW': '快速切換' },
  'general.quickSwitch.enable': {
    en: 'Enable quick switching in the popup',
    'zh-CN': '在弹出菜单中启用快速切换',
    'zh-TW': '在彈出式選單中啟用快速切換',
  },
  'general.quickSwitch.refreshTabs': {
    en: 'Refresh active tabs after switching',
    'zh-CN': '切换后刷新活动标签页',
    'zh-TW': '切換後重新整理作用中分頁',
  },
  'general.quickSwitch.orderAria': {
    en: 'Quick-switch route order',
    'zh-CN': '快速切换路由顺序',
    'zh-TW': '快速切換路由順序',
  },
  'general.quickSwitch.up': { en: 'Up', 'zh-CN': '上移', 'zh-TW': '上移' },
  'general.quickSwitch.down': { en: 'Down', 'zh-CN': '下移', 'zh-TW': '下移' },
  'general.quickSwitch.remove': { en: 'Remove', 'zh-CN': '移除', 'zh-TW': '移除' },
  'general.quickSwitch.addAria': {
    en: 'Add quick-switch route',
    'zh-CN': '添加快速切换路由',
    'zh-TW': '加入快速切換路由',
  },
  'general.quickSwitch.addProfile': {
    en: 'Add profile…',
    'zh-CN': '添加情景模式…',
    'zh-TW': '加入情境模式…',
  },
  'general.diagnostics.title': { en: 'Request diagnostics', 'zh-CN': '请求诊断', 'zh-TW': '請求診斷' },
  'general.diagnostics.allow': {
    en: 'Allow bounded request diagnostics',
    'zh-CN': '允许有界请求诊断',
    'zh-TW': '允許有界請求診斷',
  },
  'general.diagnostics.help': {
    en: 'Monitoring starts only from the diagnostics page for this browser session. Headers, bodies, cookies, credentials, query strings, and response content are never collected.',
    'zh-CN': '只有从诊断页明确启动后，才会在当前浏览器会话中监控。不会收集请求头、正文、Cookie、凭据、查询参数或响应内容。',
    'zh-TW': '只有從診斷頁明確啟動後，才會在目前瀏覽器工作階段中監控。不會收集請求標頭、本文、Cookie、憑證、查詢參數或回應內容。',
  },
  'general.diagnostics.permissionGranted': {
    en: 'Browser permission granted.',
    'zh-CN': '浏览器权限已授予。',
    'zh-TW': '瀏覽器權限已授予。',
  },
  'general.diagnostics.requesting': { en: 'Requesting…', 'zh-CN': '正在请求…', 'zh-TW': '正在要求…' },
  'general.diagnostics.grant': {
    en: 'Grant monitoring permission',
    'zh-CN': '授予监控权限',
    'zh-TW': '授予監控權限',
  },
  'general.diagnostics.open': {
    en: 'Open request diagnostics',
    'zh-CN': '打开请求诊断',
    'zh-TW': '開啟請求診斷',
  },
  'general.diagnostics.permissionDenied': {
    en: 'Request monitoring permission was not granted.',
    'zh-CN': '未授予请求监控权限。',
    'zh-TW': '未授予請求監控權限。',
  },
  'general.diagnostics.permissionFailed': {
    en: 'Request monitoring permission could not be requested.',
    'zh-CN': '无法请求监控权限。',
    'zh-TW': '無法要求監控權限。',
  },
  'interface.title': { en: 'Interface', 'zh-CN': '界面', 'zh-TW': '介面' },
  'interface.help': {
    en: 'Behavior matching the original ZeroOmega options page.',
    'zh-CN': '与原版 ZeroOmega 选项页一致的界面行为。',
    'zh-TW': '與原版 ZeroOmega 選項頁一致的介面行為。',
  },
  'interface.confirmation.title': {
    en: 'Confirmation and editing',
    'zh-CN': '确认和编辑',
    'zh-TW': '確認與編輯',
  },
  'interface.confirmDeletion': {
    en: 'Confirm before deleting a profile',
    'zh-CN': '删除情景模式前要求确认',
    'zh-TW': '刪除情境模式前要求確認',
  },
  'interface.addConditionsBottom': {
    en: 'Add new switching conditions to the bottom',
    'zh-CN': '将新的切换条件添加到底部',
    'zh-TW': '將新的切換條件加入底部',
  },
  'interface.showAdvanced': {
    en: 'Show advanced condition types',
    'zh-CN': '显示高级条件类型',
    'zh-TW': '顯示進階條件類型',
  },
  'interface.menus.title': { en: 'Menus and status', 'zh-CN': '菜单和状态', 'zh-TW': '選單與狀態' },
  'interface.showInspect': { en: 'Show inspect menu', 'zh-CN': '显示检查菜单', 'zh-TW': '顯示檢查選單' },
  'interface.showResultBadge': {
    en: 'Show result profile on the toolbar badge',
    'zh-CN': '在工具栏徽章上显示结果情景模式',
    'zh-TW': '在工具列徽章上顯示結果情境模式',
  },
  'interface.showExternal': {
    en: 'Show profiles controlled by other extensions',
    'zh-CN': '显示由其他扩展控制的情景模式',
    'zh-TW': '顯示由其他擴充功能控制的情境模式',
  },
  'interface.exportLegacyRuleList': {
    en: 'Export legacy rule-list format when requested',
    'zh-CN': '按需导出旧版规则列表格式',
    'zh-TW': '依需求匯出舊版規則清單格式',
  },
'''
replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "  'history.nav':",
    catalog + "  'history.nav':",
)

app_path = Path('apps/extension/src/entrypoints/options/App.svelte')
app = app_path.read_text()

message_helper = r'''  function messageFrom(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

'''
if app.count(message_helper) != 1:
    raise SystemExit('Options message helper anchor missing')
app = app.replace(message_helper, '', 1)

raw_catch = "} catch (error) {\n      errorMessage = messageFrom(error);"
raw_catch_count = app.count(raw_catch)
if raw_catch_count < 10:
    raise SystemExit(f'expected at least 10 raw Options catches, found {raw_catch_count}')
app = app.replace(
    raw_catch,
    "} catch {\n      errorMessage = uiText('options.error.safeMessage', locale);",
)
if app.count('errorMessage = messageFrom(error);') != 0:
    raise SystemExit('unmigrated raw Options exception remains')

app = app.replace(
    'errorMessage = response.message;',
    "errorMessage = uiText('options.error.safeMessage', locale);",
)
app = app.replace(
    "errorMessage = 'Host permission is required before downloading this Rule List URL.';",
    "errorMessage = uiText('options.error.ruleListPermission', locale);",
)
app = app.replace(
    "errorMessage = 'Host permission is required before downloading this PAC URL.';",
    "errorMessage = uiText('options.error.pacPermission', locale);",
)
app = app.replace(
    "errorMessage = 'A replacement endpoint no longer exists.';",
    "errorMessage = uiText('options.error.replacementMissing', locale);",
)

old_diagnostics = r'''  async function grantDiagnosticsPermission(): Promise<void> {
    if (requestingDiagnosticsPermission) return;
    requestingDiagnosticsPermission = true;
    errorMessage = '';
    try {
      diagnosticsPermissionGranted = await requestRequestDiagnosticsPermission();
      if (!diagnosticsPermissionGranted) {
        errorMessage = 'Request monitoring permission was not granted.';
      }
    } catch {
      errorMessage = uiText('options.error.safeMessage', locale);
    } finally {
      requestingDiagnosticsPermission = false;
    }
  }
'''
new_diagnostics = r'''  async function grantDiagnosticsPermission(): Promise<void> {
    if (requestingDiagnosticsPermission) return;
    requestingDiagnosticsPermission = true;
    errorMessage = '';
    try {
      diagnosticsPermissionGranted = await requestRequestDiagnosticsPermission();
      if (!diagnosticsPermissionGranted) {
        errorMessage = uiText('general.diagnostics.permissionDenied', locale);
      }
    } catch {
      errorMessage = uiText('general.diagnostics.permissionFailed', locale);
    } finally {
      requestingDiagnosticsPermission = false;
    }
  }
'''
if app.count(old_diagnostics) != 1:
    raise SystemExit('Options diagnostics permission anchor missing')
app = app.replace(old_diagnostics, new_diagnostics, 1)

app = app.replace(
    "'Apply current changes before exporting the Options backup?'",
    "uiText('options.confirm.export', locale)",
)
app = app.replace(
    "'Apply current changes before replacing profile references?'",
    "uiText('options.confirm.replace', locale)",
)

old_apply_status = r'''  function applyStatus(): string {
    const record = state?.lastApply;
    if (!record) return 'No Apply attempt recorded.';
    if (record.status === 'succeeded') {
      return `Active snapshot ${record.snapshotId} from revision ${record.revisionId}.`;
    }
    return `Failed at ${record.stage}: ${record.message}`;
  }
'''
new_apply_status = r'''  function applyStatus(): string {
    const record = state?.lastApply;
    if (!record) return uiText('options.apply.noAttempt', locale);
    return uiText(
      record.status === 'succeeded' ? 'options.apply.succeeded' : 'options.apply.failed',
      locale,
    );
  }
'''
if app.count(old_apply_status) != 1:
    raise SystemExit('Options Apply status anchor missing')
app = app.replace(old_apply_status, new_apply_status, 1)

simple_replacements = {
    '<title>ZeroOmega Nex Options</title>': "<title>{uiText('options.documentTitle', locale)}</title>",
    '<div class="app-shell">': '<div class="app-shell" data-options-shell-locale={locale}>',
    '<nav class="side-navigation" aria-label="ZeroOmega options">': '<nav class="side-navigation" aria-label={uiText(\'options.navAria\', locale)}>',
    '<h2>Settings</h2>': "<h2>{uiText('options.nav.settings', locale)}</h2>",
    '<span aria-hidden="true">⌘</span><span>Interface</span>': "<span aria-hidden=\"true\">⌘</span><span>{uiText('options.nav.interface', locale)}</span>",
    '<span aria-hidden="true">⚙</span><span>General</span>': "<span aria-hidden=\"true\">⚙</span><span>{uiText('options.nav.general', locale)}</span>",
    '<span aria-hidden="true">⇅</span><span>Import / Export</span>': "<span aria-hidden=\"true\">⇅</span><span>{uiText('legacy.pageTitle', locale)}</span>",
    '<span aria-hidden="true">◐</span><span>Theme</span>': "<span aria-hidden=\"true\">◐</span><span>{uiText('options.nav.theme', locale)}</span>",
    '<h2>Profiles</h2>': "<h2>{uiText('options.nav.profiles', locale)}</h2>",
    '<span class="builtin-marker" aria-hidden="true">◎</span><span>Built-in Profiles</span>': "<span class=\"builtin-marker\" aria-hidden=\"true\">◎</span><span>{uiText('options.nav.builtIn', locale)}</span>",
    '<span aria-hidden="true">＋</span><span>New profile…</span>': "<span aria-hidden=\"true\">＋</span><span>{uiText('options.nav.newProfile', locale)}</span>",
    '<h2>Actions</h2>': "<h2>{uiText('options.nav.actions', locale)}</h2>",
    '<h2>Operation failed</h2>': "<h2>{uiText('options.error.title', locale)}</h2>",
    '<h1>Loading profiles</h1>': "<h1>{uiText('options.loading.title', locale)}</h1>",
    '<p>Reading the saved ZeroOmega configuration.</p>': "<p>{uiText('options.loading.help', locale)}</p>",
}
for old, new in simple_replacements.items():
    if app.count(old) != 1:
        raise SystemExit(f'Options literal anchor count {app.count(old)}: {old!r}')
    app = app.replace(old, new, 1)

old_actions = r'''      <section class="nav-group actions">
        <h2>{uiText('options.nav.actions', locale)}</h2>
        <button
          type="button"
          class="primary"
          disabled={!hasUnappliedChanges || view?.busy || saving}
          onclick={applyDraft}
        >
          <span aria-hidden="true">✓</span><span>{saving ? 'Working…' : 'Apply changes'}</span>
        </button>
        <button
          type="button"
          class="discard"
          disabled={!hasUnappliedChanges || view?.busy || saving}
          onclick={revertDraft}
        >
          <span aria-hidden="true">×</span><span>Discard changes</span>
        </button>
        <p class="draft-status" role="status">
          {view?.busy
            ? `Apply is in progress: ${state?.pendingApply?.phase ?? 'preparing'}.`
            : profileEditorDirty
              ? 'Switch source contains unapplied changes.'
              : view?.dirty
                ? 'Draft contains unapplied changes.'
                : 'Draft matches the currently applied revision.'}
        </p>
      </section>
'''
new_actions = r'''      <section class="nav-group actions" data-options-actions data-typed-locale={locale}>
        <h2>{uiText('options.nav.actions', locale)}</h2>
        <button
          type="button"
          class="primary"
          disabled={!hasUnappliedChanges || view?.busy || saving}
          onclick={applyDraft}
        >
          <span aria-hidden="true">✓</span><span
            >{uiText(saving ? 'options.actions.working' : 'options.actions.apply', locale)}</span
          >
        </button>
        <button
          type="button"
          class="discard"
          disabled={!hasUnappliedChanges || view?.busy || saving}
          onclick={revertDraft}
        >
          <span aria-hidden="true">×</span><span>{uiText('options.actions.discard', locale)}</span>
        </button>
        <p class="draft-status" role="status">
          {uiText(
            view?.busy
              ? 'options.draft.applying'
              : profileEditorDirty
                ? 'options.draft.sourceDirty'
                : view?.dirty
                  ? 'options.draft.dirty'
                  : 'options.draft.clean',
            locale,
          )}
        </p>
      </section>
'''
if app.count(old_actions) != 1:
    raise SystemExit('Options Actions block anchor missing')
app = app.replace(old_actions, new_actions, 1)

old_general = r'''    {:else if activeSection === 'general' && state}
      <header class="editor-heading">
        <div>
          <h1>General</h1>
          <p>Startup and quick-switch behavior.</p>
        </div>
      </header>
      <section class="settings-section">
        <h2>Startup profile</h2>
        <label>
          Profile used when the extension starts
          <select
            aria-label="Startup route"
            value={routeValue(state.draft.settings.startup.route)}
            disabled={saving || view?.busy}
            onchange={(event) => updateStartupRoute(valueFrom(event))}
          >
            <option value="">Keep current browser setting</option>
            <option value="direct">{uiText('route.direct', locale)}</option>
            <option value="system">{uiText('route.system', locale)}</option>
            {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}
                >{profile.name}</option
              >{/each}
          </select>
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.startup.revertProxyChanges}
            disabled={saving || view?.busy}
            onchange={(event) => updateStartupRevert(checkedFrom(event))}
          />
          Revert proxy changes when ZeroOmega releases control
        </label>
      </section>
      <section class="settings-section">
        <h2>Quick Switch</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.enabled}
            disabled={saving || view?.busy}
            onchange={(event) => updateQuickSwitchFlag('enabled', checkedFrom(event))}
          />
          Enable quick switching in the popup
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.refreshOnChange}
            disabled={saving || view?.busy}
            onchange={(event) => updateQuickSwitchFlag('refreshOnChange', checkedFrom(event))}
          />
          Refresh active tabs after switching
        </label>
        <ol class="route-order" aria-label="Quick-switch route order">
          {#each state.draft.settings.quickSwitch.routes as route, index (`${routeValue(route)}:${index}`)}
            <li>
              <span>{routeLabel(state.draft, route)}</span>
              <span class="row-actions">
                <button
                  type="button"
                  disabled={saving || view?.busy || index === 0}
                  onclick={() => moveQuickSwitchRoute(index, -1)}>Up</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    index === state.draft.settings.quickSwitch.routes.length - 1}
                  onclick={() => moveQuickSwitchRoute(index, 1)}>Down</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    route.kind === 'direct' ||
                    route.kind === 'system'}
                  onclick={() => removeQuickSwitchRoute(index)}>Remove</button
                >
              </span>
            </li>
          {/each}
        </ol>
        <select
          aria-label="Add quick-switch route"
          disabled={saving || view?.busy}
          onchange={(event) => addQuickSwitchRoute(valueFrom(event), event)}
        >
          <option value="">Add profile…</option>
          <option value="direct">{uiText('route.direct', locale)}</option>
          <option value="system">{uiText('route.system', locale)}</option>
          {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}
              >{profile.name}</option
            >{/each}
        </select>
      </section>
      <section class="settings-section option-list" data-request-diagnostics-settings>
        <h2>{translate('Request diagnostics')}</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.interface.monitorWebRequests ?? true}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('monitorWebRequests', checkedFrom(event))}
          />
          {translate('Allow bounded request diagnostics')}
        </label>
        <p>
          {translate(
            'Monitoring starts only from the diagnostics page for this browser session. Headers, bodies, cookies, credentials, query strings, and response content are never collected.',
          )}
        </p>
        <div class="settings-actions">
          {#if diagnosticsPermissionGranted}
            <span role="status">{translate('Browser permission granted.')}</span>
          {:else}
            <button
              type="button"
              data-request-diagnostics-permission
              disabled={requestingDiagnosticsPermission}
              onclick={() => void grantDiagnosticsPermission()}
            >
              {requestingDiagnosticsPermission
                ? translate('Requesting…')
                : translate('Grant monitoring permission')}
            </button>
          {/if}
          <button type="button" onclick={openRequestDiagnostics}>
            {translate('Open request diagnostics')}
          </button>
        </div>
      </section>
'''
new_general = r'''    {:else if activeSection === 'general' && state}
      <header
        class="editor-heading"
        data-general-settings
        data-typed-locale={locale}
      >
        <div>
          <h1>{uiText('general.title', locale)}</h1>
          <p>{uiText('general.help', locale)}</p>
        </div>
      </header>
      <section class="settings-section">
        <h2>{uiText('general.startup.title', locale)}</h2>
        <label>
          {uiText('general.startup.label', locale)}
          <select
            aria-label={uiText('general.startup.aria', locale)}
            value={routeValue(state.draft.settings.startup.route)}
            disabled={saving || view?.busy}
            onchange={(event) => updateStartupRoute(valueFrom(event))}
          >
            <option value="">{uiText('general.startup.keepCurrent', locale)}</option>
            <option value="direct">{uiText('route.direct', locale)}</option>
            <option value="system">{uiText('route.system', locale)}</option>
            {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}
                >{profile.name}</option
              >{/each}
          </select>
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.startup.revertProxyChanges}
            disabled={saving || view?.busy}
            onchange={(event) => updateStartupRevert(checkedFrom(event))}
          />
          {uiText('general.startup.revert', locale)}
        </label>
      </section>
      <section class="settings-section">
        <h2>{uiText('general.quickSwitch.title', locale)}</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.enabled}
            disabled={saving || view?.busy}
            onchange={(event) => updateQuickSwitchFlag('enabled', checkedFrom(event))}
          />
          {uiText('general.quickSwitch.enable', locale)}
        </label>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.quickSwitch.refreshOnChange}
            disabled={saving || view?.busy}
            onchange={(event) => updateQuickSwitchFlag('refreshOnChange', checkedFrom(event))}
          />
          {uiText('general.quickSwitch.refreshTabs', locale)}
        </label>
        <ol class="route-order" aria-label={uiText('general.quickSwitch.orderAria', locale)}>
          {#each state.draft.settings.quickSwitch.routes as route, index (`${routeValue(route)}:${index}`)}
            <li>
              <span>{routeLabel(state.draft, route)}</span>
              <span class="row-actions">
                <button
                  type="button"
                  disabled={saving || view?.busy || index === 0}
                  onclick={() => moveQuickSwitchRoute(index, -1)}>{uiText('general.quickSwitch.up', locale)}</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    index === state.draft.settings.quickSwitch.routes.length - 1}
                  onclick={() => moveQuickSwitchRoute(index, 1)}>{uiText('general.quickSwitch.down', locale)}</button
                >
                <button
                  type="button"
                  disabled={saving ||
                    view?.busy ||
                    route.kind === 'direct' ||
                    route.kind === 'system'}
                  onclick={() => removeQuickSwitchRoute(index)}>{uiText('general.quickSwitch.remove', locale)}</button
                >
              </span>
            </li>
          {/each}
        </ol>
        <select
          aria-label={uiText('general.quickSwitch.addAria', locale)}
          disabled={saving || view?.busy}
          onchange={(event) => addQuickSwitchRoute(valueFrom(event), event)}
        >
          <option value="">{uiText('general.quickSwitch.addProfile', locale)}</option>
          <option value="direct">{uiText('route.direct', locale)}</option>
          <option value="system">{uiText('route.system', locale)}</option>
          {#each profiles as profile (profile.id)}<option value={`profile:${profile.id}`}
              >{profile.name}</option
            >{/each}
        </select>
      </section>
      <section class="settings-section option-list" data-request-diagnostics-settings>
        <h2>{uiText('general.diagnostics.title', locale)}</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.interface.monitorWebRequests ?? true}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('monitorWebRequests', checkedFrom(event))}
          />
          {uiText('general.diagnostics.allow', locale)}
        </label>
        <p>{uiText('general.diagnostics.help', locale)}</p>
        <div class="settings-actions">
          {#if diagnosticsPermissionGranted}
            <span role="status">{uiText('general.diagnostics.permissionGranted', locale)}</span>
          {:else}
            <button
              type="button"
              data-request-diagnostics-permission
              disabled={requestingDiagnosticsPermission}
              onclick={() => void grantDiagnosticsPermission()}
            >
              {uiText(
                requestingDiagnosticsPermission
                  ? 'general.diagnostics.requesting'
                  : 'general.diagnostics.grant',
                locale,
              )}
            </button>
          {/if}
          <button type="button" onclick={openRequestDiagnostics}>
            {uiText('general.diagnostics.open', locale)}
          </button>
        </div>
      </section>
'''
if app.count(old_general) != 1:
    raise SystemExit('General settings block anchor missing')
app = app.replace(old_general, new_general, 1)

old_interface = r'''    {:else if activeSection === 'interface' && state}
      <header class="editor-heading">
        <div>
          <h1>Interface</h1>
          <p>Behavior matching the original ZeroOmega options page.</p>
        </div>
      </header>
      <section class="settings-section option-list">
        <h2>Confirmation and editing</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.confirmDeletion}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('confirmDeletion', checkedFrom(event))}
          />Confirm before deleting a profile</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.addConditionsToBottom}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('addConditionsToBottom', checkedFrom(event))}
          />Add new switching conditions to the bottom</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            data-show-advanced-conditions-setting
            checked={state.draft.settings.interface.showAdvancedConditions}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showAdvancedConditions', checkedFrom(event))}
          />Show advanced condition types</label
        >
      </section>
      <section class="settings-section option-list">
        <h2>Menus and status</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showInspectMenu}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showInspectMenu', checkedFrom(event))}
          />Show inspect menu</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showResultProfileOnActionBadgeText}
            disabled={saving || view?.busy}
            onchange={(event) =>
              updateInterfaceFlag('showResultProfileOnActionBadgeText', checkedFrom(event))}
          />Show result profile on the toolbar badge</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showExternalProfile}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showExternalProfile', checkedFrom(event))}
          />Show profiles controlled by other extensions</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            data-export-legacy-rule-list-setting
            checked={state.draft.settings.interface.exportLegacyRuleList}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('exportLegacyRuleList', checkedFrom(event))}
          />Export legacy rule-list format when requested</label
        >
      </section>
'''
new_interface = r'''    {:else if activeSection === 'interface' && state}
      <header
        class="editor-heading"
        data-interface-settings
        data-typed-locale={locale}
      >
        <div>
          <h1>{uiText('interface.title', locale)}</h1>
          <p>{uiText('interface.help', locale)}</p>
        </div>
      </header>
      <section class="settings-section option-list">
        <h2>{uiText('interface.confirmation.title', locale)}</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.confirmDeletion}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('confirmDeletion', checkedFrom(event))}
          />{uiText('interface.confirmDeletion', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.addConditionsToBottom}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('addConditionsToBottom', checkedFrom(event))}
          />{uiText('interface.addConditionsBottom', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            data-show-advanced-conditions-setting
            checked={state.draft.settings.interface.showAdvancedConditions}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showAdvancedConditions', checkedFrom(event))}
          />{uiText('interface.showAdvanced', locale)}</label
        >
      </section>
      <section class="settings-section option-list">
        <h2>{uiText('interface.menus.title', locale)}</h2>
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showInspectMenu}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showInspectMenu', checkedFrom(event))}
          />{uiText('interface.showInspect', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showResultProfileOnActionBadgeText}
            disabled={saving || view?.busy}
            onchange={(event) =>
              updateInterfaceFlag('showResultProfileOnActionBadgeText', checkedFrom(event))}
          />{uiText('interface.showResultBadge', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            checked={state.draft.settings.interface.showExternalProfile}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('showExternalProfile', checkedFrom(event))}
          />{uiText('interface.showExternal', locale)}</label
        >
        <label class="checkbox-row"
          ><input
            type="checkbox"
            data-export-legacy-rule-list-setting
            checked={state.draft.settings.interface.exportLegacyRuleList}
            disabled={saving || view?.busy}
            onchange={(event) => updateInterfaceFlag('exportLegacyRuleList', checkedFrom(event))}
          />{uiText('interface.exportLegacyRuleList', locale)}</label
        >
      </section>
'''
if app.count(old_interface) != 1:
    raise SystemExit('Interface settings block anchor missing')
app = app.replace(old_interface, new_interface, 1)

app_path.write_text(app)

# Add direct Chromium coverage before entering the Fixed editor workflow.
replace_once(
    'scripts/e2e-chromium.mjs',
    "  assert.equal(await profileName.inputValue(), 'Proxy');\n\n  const fixedTable = options.locator('[data-fixed-proxy-table]');",
    r'''  assert.equal(await profileName.inputValue(), 'Proxy');
  assert.equal(await options.locator('.app-shell').getAttribute('data-options-shell-locale'), 'zh-CN');
  await options.getByRole('button', { name: '应用选项', exact: true }).waitFor();
  await options.getByRole('button', { name: '撤销更改', exact: true }).waitFor();
  await options.getByText('当前设置已全部应用。', { exact: true }).waitFor();

  await options.getByRole('button', { name: '通用', exact: true }).click();
  const generalSettings = options.locator('[data-general-settings]');
  await generalSettings.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await generalSettings.getAttribute('data-typed-locale'), 'zh-CN');
  await generalSettings.getByRole('heading', { name: '通用', exact: true, level: 1 }).waitFor();
  await options.getByRole('heading', { name: '启动情景模式', exact: true }).waitFor();
  await options.getByLabel('启动路由', { exact: true }).waitFor();
  await options.getByRole('heading', { name: '快速切换', exact: true }).waitFor();
  await options.getByLabel('快速切换路由顺序', { exact: true }).waitFor();
  await options.getByRole('heading', { name: '请求诊断', exact: true }).waitFor();
  assert.doesNotMatch(
    await options.locator('main').innerText(),
    /Startup profile|Quick Switch|Request diagnostics|Grant monitoring permission/u,
    'Options General typed locale coverage regressed',
  );

  await options.getByRole('button', { name: '界面', exact: true }).click();
  const interfaceSettings = options.locator('[data-interface-settings]');
  await interfaceSettings.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(await interfaceSettings.getAttribute('data-typed-locale'), 'zh-CN');
  await interfaceSettings.getByRole('heading', { name: '界面', exact: true, level: 1 }).waitFor();
  await options.getByRole('heading', { name: '确认和编辑', exact: true }).waitFor();
  await options.getByText('删除情景模式前要求确认', { exact: true }).waitFor();
  await options.getByRole('heading', { name: '菜单和状态', exact: true }).waitFor();
  await options.getByText('显示检查菜单', { exact: true }).waitFor();
  assert.doesNotMatch(
    await options.locator('main').innerText(),
    /Confirmation and editing|Menus and status|Show inspect menu|Show result profile/u,
    'Options Interface typed locale coverage regressed',
  );

  await options.getByRole('button', { name: 'Proxy', exact: true }).click();
  await profileName.waitFor({ state: 'visible' });

  const fixedTable = options.locator('[data-fixed-proxy-table]');''',
)

# Permanent locale guards for the completed Options shell slice.
replace_once(
    'scripts/validate-localization.mjs',
    "requireText(\n  entries.app,\n  '<LegacyImportPanel\\n        {locale}',\n  'Options must pass locale to Legacy Import.',\n);",
    "requireText(\n  entries.app,\n  '<LegacyImportPanel\\n        {locale}',\n  'Options must pass locale to Legacy Import.',\n);\n"
    "requireText(\n  entries.app,\n  'data-options-shell-locale={locale}',\n  'Options shell must expose its typed locale.',\n);\n"
    "requireText(\n  entries.app,\n  'data-general-settings',\n  'General settings must expose typed browser evidence.',\n);\n"
    "requireText(\n  entries.app,\n  'data-interface-settings',\n  'Interface settings must expose typed browser evidence.',\n);",
)
replace_once(
    'scripts/validate-localization.mjs',
    "  [\n    entries.pac,\n    'Proxy authentication permission was not granted.',\n    'PAC auth error regressed to literal English.',\n  ],\n])",
    "  [\n    entries.pac,\n    'Proxy authentication permission was not granted.',\n    'PAC auth error regressed to literal English.',\n  ],\n"
    "  [entries.app, '<h1>General</h1>', 'General heading regressed to literal English.'],\n"
    "  [entries.app, '<h1>Interface</h1>', 'Interface heading regressed to literal English.'],\n"
    "  [entries.app, \"saving ? 'Working…' : 'Apply changes'\", 'Apply action regressed to literal English.'],\n"
    "  [entries.app, '<span>Discard changes</span>', 'Discard action regressed to literal English.'],\n"
    "  [entries.app, \"translate('Request diagnostics')\", 'General diagnostics regressed to the observer translation layer.'],\n"
    "  [entries.app, 'errorMessage = messageFrom(error)', 'Options must not render raw exception messages.'],\n"
    "  [entries.app, 'errorMessage = response.message', 'Options must not render raw backend response messages.'],\n"
    "])",
)
replace_once(
    'scripts/validate-localization.mjs',
    "requireText(\n  entries.chromiumE2e,\n  'Imported non-default startup route did not become the browser-confirmed active start route',",
    "requireText(\n  entries.chromiumE2e,\n  'Options General typed locale coverage regressed',\n  'Chromium General typed-locale coverage is missing.',\n);\n"
    "requireText(\n  entries.chromiumE2e,\n  'Options Interface typed locale coverage regressed',\n  'Chromium Interface typed-locale coverage is missing.',\n);\n"
    "requireText(\n  entries.chromiumE2e,\n  'Imported non-default startup route did not become the browser-confirmed active start route',",
)

old_navigation_guard = r'''  [
    ['Settings', 'Profiles', 'Actions', 'Built-in Profiles', 'New profile…'].every((label) =>
      optionsApp.includes(label),
    ),
    'Options must preserve the original ZeroOmega navigation groups and profile workflow.',
  ],
'''
new_navigation_guard = r'''  [
    optionsApp.includes("uiText('options.nav.settings', locale)") &&
      optionsApp.includes("uiText('options.nav.profiles', locale)") &&
      optionsApp.includes("uiText('options.nav.actions', locale)") &&
      optionsApp.includes("uiText('options.nav.builtIn', locale)") &&
      optionsApp.includes("uiText('options.nav.newProfile', locale)") &&
      optionsApp.includes('data-options-shell-locale={locale}') &&
      optionsApp.includes('data-general-settings') &&
      optionsApp.includes('data-interface-settings') &&
      optionsApp.includes("uiText('options.actions.apply', locale)") &&
      optionsApp.includes("uiText('options.actions.discard', locale)") &&
      !optionsApp.includes('errorMessage = messageFrom(error)') &&
      !optionsApp.includes('errorMessage = response.message') &&
      chromiumE2e.includes('Options General typed locale coverage regressed') &&
      chromiumE2e.includes('Options Interface typed locale coverage regressed'),
    'Options must preserve the original navigation and Draft actions while rendering the shell, General, Interface, statuses, and safe errors through the typed three-locale catalog.',
  ],
'''
replace_once('scripts/validate-ui-compatibility.mjs', old_navigation_guard, new_navigation_guard)

# Update the parity matrix by row identity.
audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
rows = {
    'A-01': '| A-01 | Options 三组导航 | `options.jade` | Settings / Profiles / Actions，Apply 与 Discard 固定在 Actions | MUST_MATCH | DONE | COMPLETE | 三组导航、General/Interface/Import/Theme/History/Built-in/New Profile 入口及 Apply/Discard/动态 Draft 状态均直接 typed 三语；Chromium zh-CN 逐页断言与永久守卫已覆盖 | 保持双浏览器回归 |',
    'H-02': '| H-02 | 简体中文 | `zh_CN` | 全 UI locale | MUST_MATCH | PARTIAL | PARTIAL | typed 已覆盖 Options shell、General、Interface、生命周期、Fixed、Switch/Rule List、PAC、History 与 Legacy Import；inventory 继续跟踪 Theme/Popup/Temporary Rules/Network | 继续辅助页 |',
    'H-03': '| H-03 | 正體中文 | `zh_TW/zh_Hant` | 全 UI locale | MUST_MATCH | PARTIAL | PARTIAL | typed 使用原版 `情境模式/代理認證/PAC 指令碼` 术语，并覆盖 Options shell、General、Interface、History 与 Legacy Import；Firefox 保持 Apply/PAC 回归 | 继续辅助页 |',
    'H-04': '| H-04 | 动态文本 | locale/controller | 状态变化后仍翻译 | MUST_MATCH | PARTIAL | PARTIAL | Apply/Discard/Draft/busy、诊断权限、生命周期、Switch parser、Rule List/PAC 更新、History 与 Legacy Import 统计均使用 typed 参数或稳定状态；Rule/PAC 下载底层错误码仍待统一 | 错误码化与剩余页面 |',
    'H-05': '| H-05 | select option | locale | 条件/协议/格式均翻译 | MUST_MATCH | PARTIAL | PARTIAL | General startup/Quick Switch、Fixed、Switch、Rule List、PAC fallback 选项已 typed；Theme/其他辅助组件仍需巡查 | 继续 inventory 批次 |',
    'H-06': '| H-06 | placeholder/title/aria | locale/template | 一同翻译 | MUST_MATCH | PARTIAL | PARTIAL | Options shell、General、Interface、生命周期、Fixed、Switch/Rule List、PAC、History、Legacy Import 已直接 typed；Chromium zh-CN 与 Firefox zh-TW 断言覆盖 | 扩展自动 DOM 巡查 |',
    'H-07': '| H-07 | 错误和确认框 | locale/controller | 全部本地化 | MUST_MATCH | PARTIAL | PARTIAL | Options shell 不再渲染 raw exception/backend message；导出/替换确认、诊断权限与既有生命周期/PAC/History/Import 错误已 typed；Rule/PAC 下载错误码及辅助页仍待迁移 | 继续统一错误码翻译 |',
}
seen = set()
for index, line in enumerate(lines):
    if not line.startswith('| '):
        continue
    parts = line.split('|')
    if len(parts) < 3:
        continue
    row_id = parts[1].strip()
    if row_id in rows:
        lines[index] = rows[row_id]
        seen.add(row_id)
missing = set(rows) - seen
if missing:
    raise SystemExit(f'Options shell audit rows not found: {sorted(missing)}')
audit_path.write_text('\n'.join(lines) + '\n')

kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg = kg_path.read_text()
anchor = '## 13. 本地化知识节点\n'
section = '''## 12.1 Nex Options shell、General 与 Interface typed 边界

- Options 左侧必须继续保持原版 Settings / Profiles / Actions 三组信息结构；Apply 与 Discard 固定在 Actions，不因本地化重排导航或改变 Draft/Applied 边界。
- shell、General 与 Interface 的导航、标题、帮助、startup/Quick Switch、诊断权限、确认/编辑、菜单/状态、select option、按钮、动态 Draft 状态和 ARIA 直接通过 typed 英文/简体中文/正體中文 catalog 渲染，不再依赖渲染后的全局英文替换。
- General 与 Interface 仍只修改 Draft；Apply 继续通过原有 verified transaction，Discard 继续恢复 Applied。typed 展示层不得直接写浏览器代理或绕过 `commitActiveProfileEditor`。
- App 级失败不得直接把后台 `response.message` 或异常 `error.message` 渲染到页面；界面显示非秘密的 typed 安全摘要，具体稳定 code/path 由对应功能状态区域承担。
- Chromium 必须真实进入 General 与 Interface，核验 resolved locale、关键标题/label/select/ARIA、Actions 状态并排除原英文模板。Firefox 继续验证正體中文 Apply 状态，防止 shell typed 化破坏跨浏览器工作流。

'''
if section.strip() not in kg:
    if kg.count(anchor) != 1:
        raise SystemExit('knowledge graph localization anchor missing')
    kg = kg.replace(anchor, section + anchor, 1)
kg_path.write_text(kg)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
next_old = '''Migrate General and Interface as the next typed vertical batch. Cover startup/quick-switch settings, Apply/Discard status, confirmation/editing controls, menu/status controls, request-diagnostics settings, buttons, titles, select options, dynamic status, and ARIA in all three locales while preserving Draft/Applied separation and the existing browser workflows.
'''
next_new = '''Migrate Theme and Popup as the next typed vertical batch. Cover appearance choices, popup route/result rows, current-site actions, temporary-rule entry points, ownership blockers, options action, request-diagnostics summary, buttons, titles, dynamic status, and ARIA in all three locales while preserving Applied-only switching and session-only temporary-rule boundaries.
'''
if status.count(next_old) != 1:
    raise SystemExit('status General/Interface next-action anchor missing')
status = status.replace(next_old, next_new, 1)
remaining_old = '- remaining General/Interface/Theme/Popup/Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,'
remaining_new = '- remaining Theme/Popup/Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,'
if status.count(remaining_old) != 1:
    raise SystemExit('status remaining locale anchor missing')
status = status.replace(remaining_old, remaining_new, 1)
marker = '### Delivery-plan reconciliation: Import review\n'
section_status = '''### Typed Options shell, General and Interface

- The Options sidebar retains the original Settings / Profiles / Actions information structure. Apply and Discard remain fixed in Actions and continue to operate only through the existing Draft/Applied workflow.
- Navigation, document title, Apply/Discard and dynamic Draft status, loading/failure state, General startup/Quick Switch/diagnostics settings, and Interface confirmation/menu controls now render directly in English, Simplified Chinese, and Traditional Chinese through the typed catalog.
- App-level command and exception failures no longer render raw backend text. The shell shows a non-secret typed summary while feature-specific panels retain stable status/code/path evidence.
- Chromium enters the real General and Interface pages, verifies zh-CN headings, labels, select/ARIA contracts and Actions state, and rejects legacy English template text. Existing Firefox zh-TW Apply and PAC paths remain mandatory.

'''
if section_status.strip() not in status:
    if status.count(marker) != 1:
        raise SystemExit('status Import review anchor missing')
    status = status.replace(marker, section_status + marker, 1)
status_path.write_text(status)
