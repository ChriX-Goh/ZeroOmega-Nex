from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


# Options permission and preference controls.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """  import {
    requestRuleSourceOriginPermission,
    sendProfileWorkflowCommand,
    subscribeProfileWorkflowStateChanges,
  } from '../../lib/profile-workflow-client';
""",
    """  import {
    requestRuleSourceOriginPermission,
    sendProfileWorkflowCommand,
    subscribeProfileWorkflowStateChanges,
  } from '../../lib/profile-workflow-client';
  import {
    hasRequestDiagnosticsPermission,
    requestRequestDiagnosticsPermission,
  } from '../../lib/request-diagnostics-client';
""",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """  let hasUnappliedChanges = false;
""",
    """  let hasUnappliedChanges = false;
  let diagnosticsPermissionGranted = false;
  let requestingDiagnosticsPermission = false;
""",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """  async function updateInterfaceFlag(field: InterfaceFlag, value: boolean): Promise<void> {
""",
    """  async function refreshDiagnosticsPermission(): Promise<void> {
    diagnosticsPermissionGranted = await hasRequestDiagnosticsPermission().catch(() => false);
  }

  async function grantDiagnosticsPermission(): Promise<void> {
    if (requestingDiagnosticsPermission) return;
    requestingDiagnosticsPermission = true;
    errorMessage = '';
    try {
      diagnosticsPermissionGranted = await requestRequestDiagnosticsPermission();
      if (!diagnosticsPermissionGranted) {
        errorMessage = 'Request monitoring permission was not granted.';
      }
    } catch (error) {
      errorMessage = messageFrom(error);
    } finally {
      requestingDiagnosticsPermission = false;
    }
  }

  function openRequestDiagnostics(): void {
    window.open('/network.html', '_blank', 'noopener,noreferrer');
  }

  async function updateInterfaceFlag(field: InterfaceFlag, value: boolean): Promise<void> {
""",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """    void loadWorkflow().then(() => {
      if (!disposed) void syncNavigationFromLocation();
    });
""",
    """    void Promise.all([loadWorkflow(), refreshDiagnosticsPermission()]).then(() => {
      if (!disposed) void syncNavigationFromLocation();
    });
""",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """      </section>
    {:else if activeSection === 'interface' && state}
""",
    """      </section>
      <section class="settings-section option-list" data-request-diagnostics-settings>
        <h2>Request diagnostics</h2>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={state.draft.settings.interface.monitorWebRequests ?? true}
            disabled={saving || view?.busy}
            on:change={(event) =>
              updateInterfaceFlag('monitorWebRequests', checkedFrom(event))}
          />
          Monitor failed and timed-out web requests
        </label>
        <p>
          Diagnostics are session-only and bounded. Request bodies, headers, cookies, credentials,
          and response content are never collected.
        </p>
        <div class="settings-actions">
          {#if diagnosticsPermissionGranted}
            <span role="status">Browser permission granted.</span>
          {:else}
            <button
              type="button"
              data-request-diagnostics-permission
              disabled={requestingDiagnosticsPermission}
              on:click={() => void grantDiagnosticsPermission()}
            >
              {requestingDiagnosticsPermission ? 'Requesting…' : 'Grant monitoring permission'}
            </button>
          {/if}
          <button type="button" on:click={openRequestDiagnostics}>Open request diagnostics</button>
        </div>
      </section>
    {:else if activeSection === 'interface' && state}
""",
)

# Popup summary and page entry.
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  import {
    sendPopupTemporaryRuleCommand,
    type PopupTemporaryRuleCommandResponse,
  } from '../../lib/popup-temporary-rule-client';
""",
    """  import {
    sendPopupTemporaryRuleCommand,
    type PopupTemporaryRuleCommandResponse,
  } from '../../lib/popup-temporary-rule-client';
  import {
    sendRequestDiagnosticsCommand,
    type RequestDiagnosticsCommandResponse,
  } from '../../lib/request-diagnostics-client';
  import type { RequestDiagnosticsView } from '../../lib/request-diagnostics-model';
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  let proxyOwnership: ProxyOwnershipView | undefined;
  let loading = true;
""",
    """  let proxyOwnership: ProxyOwnershipView | undefined;
  let requestDiagnostics: RequestDiagnosticsView | undefined;
  let loading = true;
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  let openingTemporaryRules = false;
  let openingExtensionManager = false;
""",
    """  let openingTemporaryRules = false;
  let openingRequestDiagnostics = false;
  let openingExtensionManager = false;
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  async function loadCurrentSite(): Promise<void> {
""",
    """  function acceptRequestDiagnosticsResponse(
    response: RequestDiagnosticsCommandResponse,
  ): boolean {
    if (response.ok) {
      requestDiagnostics = response.view;
      return true;
    }
    errorMessage = response.message;
    return false;
  }

  async function loadRequestDiagnostics(): Promise<void> {
    if (currentSite?.tabId === undefined) return;
    acceptRequestDiagnosticsResponse(
      await sendRequestDiagnosticsCommand({ action: 'get', tabId: currentSite.tabId }),
    );
  }

  async function openRequestDiagnostics(): Promise<void> {
    if (currentSite?.tabId === undefined || openingRequestDiagnostics) return;
    openingRequestDiagnostics = true;
    try {
      await browser.tabs.create({
        url: browser.runtime.getURL(`/network.html?tabId=${currentSite.tabId}`),
      });
      window.close();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      openingRequestDiagnostics = false;
    }
  }

  async function loadCurrentSite(): Promise<void> {
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """      await Promise.all([
        loadWorkflow(),
        loadCurrentSite(),
        loadTemporaryRules(),
        loadProxyOwnership(),
      ]);
""",
    """      await Promise.all([
        loadWorkflow(),
        loadCurrentSite(),
        loadTemporaryRules(),
        loadProxyOwnership(),
      ]);
      await loadRequestDiagnostics();
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  {#if !loading && !proxyOwnership?.blocked && currentSite && temporaryResultItems.length > 0}
""",
    """  {#if !loading &&
    !proxyOwnership?.blocked &&
    currentSite &&
    requestDiagnostics &&
    requestDiagnostics.errorCount + requestDiagnostics.timeoutCount > 0}
    <section class="request-diagnostics-summary" data-popup-request-diagnostics>
      <div>
        <strong>
          {requestDiagnostics.errorCount + requestDiagnostics.timeoutCount}
          {translate('request errors')}
        </strong>
        <span>
          {requestDiagnostics.domains
            .slice(0, 3)
            .map((entry) => `${entry.domain} (${entry.count})`)
            .join(', ')}
        </span>
      </div>
      <button
        type="button"
        data-popup-open-request-diagnostics
        disabled={openingRequestDiagnostics}
        onclick={() => void openRequestDiagnostics()}
      >
        {translate('Inspect requests')}
      </button>
    </section>
  {/if}

  {#if !loading && !proxyOwnership?.blocked && currentSite && temporaryResultItems.length > 0}
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.temporary-rule-action,
.current-site-action {
""",
    """.request-diagnostics-summary,
.temporary-rule-action,
.current-site-action {
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.temporary-rule-action button,
.current-site-action button,
""",
    """.request-diagnostics-summary button,
.temporary-rule-action button,
.current-site-action button,
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.temporary-rule-action {
""",
    """.request-diagnostics-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.request-diagnostics-summary div {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.request-diagnostics-summary span {
  overflow: hidden;
  color: var(--popup-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.request-diagnostics-summary button {
  min-height: 30px;
  padding: 4px 8px;
  border: 1px solid var(--popup-border);
  border-radius: 3px;
  background: var(--popup-bg);
  color: var(--popup-text);
  cursor: pointer;
}

.request-diagnostics-summary button:hover:not(:disabled) {
  background: var(--popup-hover);
}

.temporary-rule-action {
""",
)

# Localized visible diagnostics labels.
replace_once(
    'apps/extension/src/lib/i18n.ts',
    """  'A profile with this name already exists.': {
""",
    """  'request errors': { 'zh-CN': '个请求错误', 'zh-TW': '個請求錯誤' },
  'Inspect requests': { 'zh-CN': '检查请求', 'zh-TW': '檢查請求' },
  'Request diagnostics': { 'zh-CN': '请求诊断', 'zh-TW': '請求診斷' },
  'Failed and timed-out requests for this browser session.': {
    'zh-CN': '当前浏览器会话内失败和超时的请求。',
    'zh-TW': '目前瀏覽器工作階段內失敗和逾時的請求。',
  },
  'No request errors recorded.': { 'zh-CN': '没有记录到请求错误。', 'zh-TW': '沒有記錄到請求錯誤。' },
  'Clear diagnostics': { 'zh-CN': '清除诊断', 'zh-TW': '清除診斷' },
  'Refresh': { 'zh-CN': '刷新', 'zh-TW': '重新整理' },
  'Permission required': { 'zh-CN': '需要权限', 'zh-TW': '需要權限' },
  'Grant monitoring permission': { 'zh-CN': '授予监控权限', 'zh-TW': '授予監控權限' },
  'Monitoring is disabled in Options.': {
    'zh-CN': '请求监控已在选项中关闭。',
    'zh-TW': '請求監控已在選項中關閉。',
  },
  'Status': { 'zh-CN': '状态', 'zh-TW': '狀態' },
  'Time': { 'zh-CN': '时间', 'zh-TW': '時間' },
  'Type': { 'zh-CN': '类型', 'zh-TW': '類型' },
  'URL': { 'zh-CN': '网址', 'zh-TW': '網址' },
  'Error': { 'zh-CN': '错误', 'zh-TW': '錯誤' },
  'Timed out': { 'zh-CN': '超时', 'zh-TW': '逾時' },
  'Failed': { 'zh-CN': '失败', 'zh-TW': '失敗' },
  'A profile with this name already exists.': {
""",
)

# Dedicated network diagnostics page.
base = Path('apps/extension/src/entrypoints/network')
base.mkdir(parents=True, exist_ok=True)
(base / 'index.html').write_text(r'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>Request diagnostics — ZeroOmega Nex</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
''')
(base / 'main.ts').write_text(r'''import { mount } from 'svelte';

import { localizeDocument } from '../../lib/i18n';
import App from './App.svelte';
import './style.css';

const target = document.getElementById('app');
if (!target) throw new Error('Request diagnostics mount target was not found.');
mount(App, { target });
localizeDocument();
''')
(base / 'App.svelte').write_text(r'''<script lang="ts">
  import { onMount } from 'svelte';

  import { translate } from '../../lib/i18n';
  import {
    hasRequestDiagnosticsPermission,
    requestRequestDiagnosticsPermission,
    sendRequestDiagnosticsCommand,
  } from '../../lib/request-diagnostics-client';
  import type { RequestDiagnosticsView } from '../../lib/request-diagnostics-model';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';

  const parsedTabId = Number.parseInt(new URLSearchParams(location.search).get('tabId') ?? '', 10);
  const tabId = Number.isInteger(parsedTabId) && parsedTabId >= 0 ? parsedTabId : undefined;
  let view: RequestDiagnosticsView | undefined;
  let loading = true;
  let clearing = false;
  let requestingPermission = false;
  let errorMessage = '';

  async function load(): Promise<void> {
    try {
      const response = await sendRequestDiagnosticsCommand({ action: 'get', tabId });
      if (!response.ok) throw new Error(response.message);
      view = response.view;
      errorMessage = '';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      loading = false;
    }
  }

  async function clear(): Promise<void> {
    if (clearing) return;
    clearing = true;
    try {
      const response = await sendRequestDiagnosticsCommand({ action: 'clear', tabId });
      if (!response.ok) throw new Error(response.message);
      view = response.view;
      errorMessage = '';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      clearing = false;
    }
  }

  async function requestPermission(): Promise<void> {
    if (requestingPermission) return;
    requestingPermission = true;
    try {
      const granted = await requestRequestDiagnosticsPermission();
      if (!granted) throw new Error('Request monitoring permission was not granted.');
      await load();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      requestingPermission = false;
    }
  }

  function formatTime(value: number): string {
    return new Date(value).toLocaleTimeString();
  }

  onMount(() => {
    applyThemeMode(readThemeMode());
    let disposed = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    void Promise.all([hasRequestDiagnosticsPermission(), load()]).then(() => {
      if (disposed) return;
      timer = setInterval(() => {
        if (document.visibilityState === 'visible') void load();
      }, 1_000);
    });
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
    };
  });
</script>

<main class="network-shell" aria-busy={loading || clearing}>
  <header>
    <div>
      <h1>{translate('Request diagnostics')}</h1>
      <p>{translate('Failed and timed-out requests for this browser session.')}</p>
    </div>
    <div class="header-actions">
      <button type="button" disabled={loading} onclick={() => void load()}>{translate('Refresh')}</button>
      <button
        type="button"
        data-request-diagnostics-clear
        disabled={clearing || (view?.records.length ?? 0) === 0}
        onclick={() => void clear()}
      >
        {translate('Clear diagnostics')}
      </button>
    </div>
  </header>

  {#if errorMessage}<p class="message error" role="alert">{errorMessage}</p>{/if}
  {#if view && !view.enabled}
    <p class="message">{translate('Monitoring is disabled in Options.')}</p>
  {:else if view && !view.permissionGranted}
    <section class="message permission" data-request-diagnostics-permission-required>
      <strong>{translate('Permission required')}</strong>
      <button type="button" disabled={requestingPermission} onclick={() => void requestPermission()}>
        {translate('Grant monitoring permission')}
      </button>
    </section>
  {:else if loading}
    <p class="message" role="status">Loading…</p>
  {:else if !view || view.records.length === 0}
    <p class="message" role="status">{translate('No request errors recorded.')}</p>
  {:else}
    <p class="bounds" data-request-diagnostics-bounds>
      {view.records.length} records · max {view.perTabLimit} per tab · max {view.globalLimit} total ·
      retained {Math.round(view.retentionMs / 60_000)} minutes
    </p>
    <table data-request-diagnostics-table>
      <thead>
        <tr>
          <th>{translate('Time')}</th>
          <th>{translate('Status')}</th>
          <th>{translate('Type')}</th>
          <th>{translate('URL')}</th>
          <th>{translate('Error')}</th>
        </tr>
      </thead>
      <tbody>
        {#each view.records as record (`${record.tabId}:${record.requestId}`)}
          <tr data-request-diagnostic-status={record.status}>
            <td>{formatTime(record.failedAt)}</td>
            <td>{record.status === 'timeout' ? translate('Timed out') : translate('Failed')}</td>
            <td>{record.resourceType}</td>
            <td><a href={record.url} target="_blank" rel="noreferrer">{record.url}</a></td>
            <td>{record.error ?? 'ERR_TIMEOUT'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>
''')
(base / 'style.css').write_text(r''':root {
  font-family: 'Segoe UI', 'Microsoft YaHei UI', Arial, sans-serif;
  color-scheme: light dark;
  --bg: #fff;
  --text: #263238;
  --muted: #607d8b;
  --border: #dfe4e7;
  --surface: #f5f6f7;
  --danger: #b71c1c;
  --link: #1565c0;
}

:root[data-theme='dark'] {
  --bg: #262b30;
  --text: #e5e9ec;
  --muted: #a8b2b9;
  --border: #3c444a;
  --surface: #202428;
  --danger: #ffb3b8;
  --link: #90caf9;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --bg: #262b30;
    --text: #e5e9ec;
    --muted: #a8b2b9;
    --border: #3c444a;
    --surface: #202428;
    --danger: #ffb3b8;
    --link: #90caf9;
  }
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); }
button, input { font: inherit; }
.network-shell { max-width: 1180px; margin: 0 auto; padding: 24px; }
header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
h1, p { margin-top: 0; }
header p, .bounds { color: var(--muted); }
.header-actions { display: flex; gap: 8px; }
button { min-height: 32px; padding: 5px 10px; border: 1px solid var(--border); border-radius: 3px; background: var(--surface); color: var(--text); cursor: pointer; }
button:disabled { opacity: .6; cursor: wait; }
.message { padding: 12px; border: 1px solid var(--border); background: var(--surface); }
.message.error { color: var(--danger); }
.message.permission { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td { padding: 8px; border: 1px solid var(--border); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
th { background: var(--surface); }
th:nth-child(1), td:nth-child(1) { width: 90px; }
th:nth-child(2), td:nth-child(2) { width: 90px; }
th:nth-child(3), td:nth-child(3) { width: 110px; }
th:nth-child(5), td:nth-child(5) { width: 220px; }
a { color: var(--link); }
''')
