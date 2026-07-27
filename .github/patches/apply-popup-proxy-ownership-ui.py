from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  import { productIdentity } from '@zeroomega-nex/core-contracts';
""",
    """  import type {
    ProxyOwnershipBlockReason,
    ProxyOwnershipView,
  } from '@zeroomega-nex/browser-adapters';
  import { productIdentity } from '@zeroomega-nex/core-contracts';
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
""",
    """  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';
  import { sendProxyOwnershipCommand } from '../../lib/proxy-ownership-client';
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  let temporaryRuleView: PopupTemporaryRuleView | undefined;
  let loading = true;
""",
    """  let temporaryRuleView: PopupTemporaryRuleView | undefined;
  let proxyOwnership: ProxyOwnershipView | undefined;
  let loading = true;
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  let openingTemporaryRules = false;
  let conditionFormOpen = false;
""",
    """  let openingTemporaryRules = false;
  let openingExtensionManager = false;
  let conditionFormOpen = false;
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  async function loadCurrentSite(): Promise<void> {
""",
    """  async function loadProxyOwnership(): Promise<void> {
    const response = await sendProxyOwnershipCommand();
    if (response.ok) {
      proxyOwnership = response.view;
      return;
    }
    proxyOwnership = {
      family: 'chromium',
      controlLevel: 'not-controllable',
      blocked: true,
      reason: 'unknown',
    };
    errorMessage = response.message;
  }

  function ownershipMessage(reason: ProxyOwnershipBlockReason | undefined): string {
    if (reason === 'app') {
      return translate(
        'Another application is controlling proxy settings. Disable or remove the conflicting application.',
      );
    }
    if (reason === 'policy') {
      return translate(
        'Proxy settings are enforced by local policy and cannot be changed. Contact your administrator.',
      );
    }
    if (reason === 'disabled') {
      return translate(
        'ZeroOmega cannot control proxy settings because a required browser permission is disabled.',
      );
    }
    return translate('ZeroOmega cannot inspect or change the browser proxy settings.');
  }

  async function openExtensionManager(): Promise<void> {
    if (!proxyOwnership || openingExtensionManager) return;
    openingExtensionManager = true;
    errorMessage = '';
    try {
      const url = proxyOwnership.family === 'firefox' ? 'about:addons' : 'chrome://extensions/';
      await browser.tabs.create({ url });
      window.close();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      openingExtensionManager = false;
    }
  }

  function closePopup(): void {
    window.close();
  }

  async function loadCurrentSite(): Promise<void> {
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """      await Promise.all([loadWorkflow(), loadCurrentSite(), loadTemporaryRules()]);
""",
    """      await Promise.all([
        loadWorkflow(),
        loadCurrentSite(),
        loadTemporaryRules(),
        loadProxyOwnership(),
      ]);
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """    {:else if !state?.applied.settings.quickSwitch.enabled}
""",
    """    {:else if proxyOwnership?.blocked}
      <section
        class="proxy-not-controllable"
        data-popup-proxy-not-controllable
        data-reason={proxyOwnership.reason ?? 'unknown'}
        aria-live="assertive"
      >
        <p class="proxy-control-message">{ownershipMessage(proxyOwnership.reason)}</p>
        <p class="proxy-control-details">
          {translate('ZeroOmega cannot switch profiles until this problem is resolved.')}
        </p>
        <div class="proxy-control-actions">
          <button type="button" onclick={closePopup}>{translate('Cancel')}</button>
          <button
            type="button"
            class="primary"
            data-popup-manage-extensions
            disabled={openingExtensionManager}
            onclick={() => void openExtensionManager()}
          >
            {translate('Manage extensions')}
          </button>
        </div>
      </section>
    {:else if !state?.applied.settings.quickSwitch.enabled}
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  {#if !loading && currentSite && temporaryResultItems.length > 0}
""",
    """  {#if !loading && !proxyOwnership?.blocked && currentSite && temporaryResultItems.length > 0}
""",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """  {#if !loading && currentSite && activeSwitch && resultItems.length > 0}
""",
    """  {#if !loading && !proxyOwnership?.blocked && currentSite && activeSwitch && resultItems.length > 0}
""",
)

replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    """.profile-divider {
""",
    """.proxy-not-controllable {
  display: grid;
  gap: 9px;
  padding: 14px 12px;
}

.proxy-not-controllable p {
  margin: 0;
}

.proxy-control-message {
  color: var(--popup-error-text);
  font-weight: 600;
}

.proxy-control-details {
  color: var(--popup-muted);
  font-size: 12px;
}

.proxy-control-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.proxy-control-actions button {
  min-height: 30px;
  padding: 4px 10px;
  border: 1px solid var(--popup-border);
  border-radius: 3px;
  background: var(--popup-footer);
  color: var(--popup-text);
  cursor: pointer;
}

.proxy-control-actions button.primary {
  border-color: var(--popup-accent);
}

.proxy-control-actions button:hover:not(:disabled) {
  background: var(--popup-hover);
}

.proxy-control-actions button:focus-visible {
  outline: 3px solid var(--popup-focus);
  outline-offset: 1px;
}

.profile-divider {
""",
)

replace_once(
    'apps/extension/src/lib/i18n.ts',
    """  'System Proxy': { 'zh-CN': '系统代理', 'zh-TW': '系統代理' },
""",
    """  'System Proxy': { 'zh-CN': '系统代理', 'zh-TW': '系統代理' },
  'Another application is controlling proxy settings. Disable or remove the conflicting application.':
    {
      'zh-CN': '其他应用正在控制代理设置。请禁用或者卸载发生冲突的应用。',
      'zh-TW': '其他應用程式正在控制 Proxy 設定。請停用或移除發生衝突的應用程式。',
    },
  'Proxy settings are enforced by local policy and cannot be changed. Contact your administrator.':
    {
      'zh-CN': '代理设置被本地策略强制指定，无法修改。请联系系统管理员。',
      'zh-TW': 'Proxy 設定由本機原則強制指定，無法修改。請聯絡系統管理員。',
    },
  'ZeroOmega cannot control proxy settings because a required browser permission is disabled.': {
    'zh-CN': '浏览器所需权限已关闭，ZeroOmega 无法控制代理设置。',
    'zh-TW': '瀏覽器所需權限已關閉，ZeroOmega 無法控制 Proxy 設定。',
  },
  'ZeroOmega cannot inspect or change the browser proxy settings.': {
    'zh-CN': 'ZeroOmega 无法检查或修改浏览器代理设置。',
    'zh-TW': 'ZeroOmega 無法檢查或修改瀏覽器 Proxy 設定。',
  },
  'ZeroOmega cannot switch profiles until this problem is resolved.': {
    'zh-CN': '如果不解决以上问题，则无法使用 ZeroOmega 切换代理。',
    'zh-TW': '若不解決以上問題，則無法使用 ZeroOmega 切換 Proxy。',
  },
  'Manage extensions': { 'zh-CN': '管理扩展', 'zh-TW': '管理擴充功能' },
""",
)
