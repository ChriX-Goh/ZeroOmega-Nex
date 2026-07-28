from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:120]!r}')
    path.write_text(text.replace(old, new, 1))


def insert_before(path: Path, anchor: str, addition: str) -> None:
    text = path.read_text()
    count = text.count(anchor)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {anchor[:120]!r}')
    path.write_text(text.replace(anchor, addition + anchor, 1))


messages_path = ROOT / 'apps/extension/src/lib/ui-messages.ts'
static_keys = """  'tempRules.pageAria': {
    en: 'Temporary rules manager',
    'zh-CN': '临时规则管理器',
    'zh-TW': '暫時規則管理器',
  },
  'tempRules.title': { en: 'Temporary Rules', 'zh-CN': '临时规则', 'zh-TW': '暫時規則' },
  'tempRules.help': {
    en: 'These rules last for the current browser session and are not written to Options.',
    'zh-CN': '这些规则仅在当前浏览器会话中有效，不会写入选项。',
    'zh-TW': '這些規則僅在目前瀏覽器工作階段中有效，不會寫入選項。',
  },
  'tempRules.clearAll': {
    en: 'Delete all temporary rules',
    'zh-CN': '删除所有临时规则',
    'zh-TW': '刪除所有暫時規則',
  },
  'tempRules.error.safe': {
    en: 'The temporary-rule operation could not be completed. Retry the operation.',
    'zh-CN': '无法完成临时规则操作。请重试。',
    'zh-TW': '無法完成暫時規則操作。請重試。',
  },
  'tempRules.loading': {
    en: 'Loading temporary rules…',
    'zh-CN': '正在加载临时规则…',
    'zh-TW': '正在載入暫時規則…',
  },
  'tempRules.empty': {
    en: 'No temporary rules are active.',
    'zh-CN': '当前没有生效的临时规则。',
    'zh-TW': '目前沒有作用中的暫時規則。',
  },
  'tempRules.tableAria': {
    en: 'Temporary rules',
    'zh-CN': '临时规则列表',
    'zh-TW': '暫時規則清單',
  },
  'tempRules.domain': { en: 'Domain', 'zh-CN': '域名', 'zh-TW': '網域' },
  'tempRules.resultProfile': {
    en: 'Result profile',
    'zh-CN': '结果情景模式',
    'zh-TW': '結果情境模式',
  },
  'tempRules.action': { en: 'Action', 'zh-CN': '操作', 'zh-TW': '操作' },
  'network.pageAria': {
    en: 'Request diagnostics',
    'zh-CN': '请求诊断',
    'zh-TW': '請求診斷',
  },
  'network.title': { en: 'Request diagnostics', 'zh-CN': '请求诊断', 'zh-TW': '請求診斷' },
  'network.help': {
    en: 'Failed and timed-out requests for this browser session.',
    'zh-CN': '当前浏览器会话中失败和超时的请求。',
    'zh-TW': '目前瀏覽器工作階段中失敗與逾時的請求。',
  },
  'network.start': { en: 'Start monitoring', 'zh-CN': '开始监控', 'zh-TW': '開始監控' },
  'network.stop': { en: 'Stop monitoring', 'zh-CN': '停止监控', 'zh-TW': '停止監控' },
  'network.refresh': { en: 'Refresh', 'zh-CN': '刷新', 'zh-TW': '重新整理' },
  'network.clear': { en: 'Clear diagnostics', 'zh-CN': '清除诊断', 'zh-TW': '清除診斷' },
  'network.error.safe': {
    en: 'Request diagnostics could not be updated. Retry the operation.',
    'zh-CN': '无法更新请求诊断。请重试。',
    'zh-TW': '無法更新請求診斷。請重試。',
  },
  'network.permissionDenied': {
    en: 'Request monitoring permission was not granted.',
    'zh-CN': '未授予请求监控权限。',
    'zh-TW': '未授予請求監控權限。',
  },
  'network.disabled': {
    en: 'Monitoring is disabled in Options.',
    'zh-CN': '请求监控已在选项中关闭。',
    'zh-TW': '請求監控已在選項中關閉。',
  },
  'network.stopped': {
    en: 'Monitoring is stopped for this browser session.',
    'zh-CN': '当前浏览器会话的监控已停止。',
    'zh-TW': '目前瀏覽器工作階段的監控已停止。',
  },
  'network.permissionPending': {
    en: 'Permission will be requested when monitoring starts.',
    'zh-CN': '开始监控时才会请求权限。',
    'zh-TW': '開始監控時才會要求權限。',
  },
  'network.loading': {
    en: 'Loading request diagnostics…',
    'zh-CN': '正在加载请求诊断…',
    'zh-TW': '正在載入請求診斷…',
  },
  'network.empty': {
    en: 'No request errors recorded.',
    'zh-CN': '没有记录到请求错误。',
    'zh-TW': '沒有記錄到請求錯誤。',
  },
  'network.tableAria': {
    en: 'Request diagnostics records',
    'zh-CN': '请求诊断记录',
    'zh-TW': '請求診斷記錄',
  },
  'network.time': { en: 'Time', 'zh-CN': '时间', 'zh-TW': '時間' },
  'network.status': { en: 'Status', 'zh-CN': '状态', 'zh-TW': '狀態' },
  'network.type': { en: 'Type', 'zh-CN': '类型', 'zh-TW': '類型' },
  'network.url': { en: 'URL', 'zh-CN': '网址', 'zh-TW': '網址' },
  'network.error': { en: 'Error', 'zh-CN': '错误', 'zh-TW': '錯誤' },
  'network.timedOut': { en: 'Timed out', 'zh-CN': '超时', 'zh-TW': '逾時' },
  'network.failed': { en: 'Failed', 'zh-CN': '失败', 'zh-TW': '失敗' },
"""
insert_before(messages_path, "  'history.nav':", static_keys)

replace_once(
    messages_path,
    "  readonly 'profile.delete.blockedDescription': { readonly profileName: string };",
    "  readonly 'tempRules.deleteAria': { readonly domain: string };\n"
    "  readonly 'network.bounds': {\n"
    "    readonly records: number;\n"
    "    readonly perTabLimit: number;\n"
    "    readonly globalLimit: number;\n"
    "    readonly minutes: number;\n"
    "  };\n"
    "  readonly 'profile.delete.blockedDescription': { readonly profileName: string };",
)

message_cases = """    case 'tempRules.deleteAria': {
      const { domain } = params as UiMessageParameters['tempRules.deleteAria'];
      if (locale === 'zh-CN') return `删除 ${domain} 的临时规则`;
      if (locale === 'zh-TW') return `刪除 ${domain} 的暫時規則`;
      return `Delete temporary rule for ${domain}`;
    }
    case 'network.bounds': {
      const { records, perTabLimit, globalLimit, minutes } =
        params as UiMessageParameters['network.bounds'];
      if (locale === 'zh-CN') {
        return `共 ${records} 条记录 · 每个标签页最多 ${perTabLimit} 条 · 总计最多 ${globalLimit} 条 · 保留 ${minutes} 分钟`;
      }
      if (locale === 'zh-TW') {
        return `共 ${records} 筆記錄 · 每個分頁最多 ${perTabLimit} 筆 · 總計最多 ${globalLimit} 筆 · 保留 ${minutes} 分鐘`;
      }
      return `${records} record${records === 1 ? '' : 's'} · max ${perTabLimit} per tab · max ${globalLimit} total · retained ${minutes} minutes`;
    }
"""
insert_before(messages_path, "    case 'profile.delete.blockedDescription':", message_cases)

spec_path = ROOT / 'apps/extension/src/component-rendering.component.spec.ts'
replace_once(
    spec_path,
    "import PopupApp from './entrypoints/popup/App.svelte';",
    "import PopupApp from './entrypoints/popup/App.svelte';\n"
    "import NetworkApp from './entrypoints/network/App.svelte';\n"
    "import TemporaryRulesApp from './entrypoints/temp-rules/App.svelte';",
)
component_tests = """

  it('renders typed Temporary Rules and Network loading shells in both Chinese locales', () => {
    const temporaryRules = render(TemporaryRulesApp, {
      props: { locale: 'zh-CN' },
    }).body;
    expect(temporaryRules).toContain('data-temp-rules-manager');
    expect(temporaryRules).toContain('data-typed-locale=\"zh-CN\"');
    expect(temporaryRules).toContain('临时规则');
    expect(temporaryRules).toContain('正在加载临时规则…');
    expect(temporaryRules).not.toContain('Temporary Rules');
    expect(temporaryRules).not.toContain('Loading temporary rules');

    const network = render(NetworkApp, {
      props: { locale: 'zh-TW' },
    }).body;
    expect(network).toContain('data-network-diagnostics');
    expect(network).toContain('data-typed-locale=\"zh-TW\"');
    expect(network).toContain('請求診斷');
    expect(network).toContain('開始監控');
    expect(network).toContain('正在載入請求診斷…');
    expect(network).not.toContain('Request diagnostics');
    expect(network).not.toContain('Start monitoring');
  });
"""
text = spec_path.read_text()
end = text.rfind('\n});\n')
if end < 0:
    raise SystemExit(f'{spec_path}: final describe closure not found')
spec_path.write_text(text[:end] + component_tests + text[end:])

inventory_path = ROOT / 'scripts/generate-locale-inventory.mjs'
replace_once(
    inventory_path,
    "  'apps/extension/src/entrypoints/popup/App.svelte',\n];",
    "  'apps/extension/src/entrypoints/popup/App.svelte',\n"
    "  'apps/extension/src/entrypoints/temp-rules/App.svelte',\n"
    "  'apps/extension/src/entrypoints/network/App.svelte',\n];",
)

locale_guard_path = ROOT / 'scripts/validate-localization.mjs'
replace_once(
    locale_guard_path,
    "  popup: 'apps/extension/src/entrypoints/popup/App.svelte',",
    "  popup: 'apps/extension/src/entrypoints/popup/App.svelte',\n"
    "  temporaryRules: 'apps/extension/src/entrypoints/temp-rules/App.svelte',\n"
    "  network: 'apps/extension/src/entrypoints/network/App.svelte',",
)
replace_once(
    locale_guard_path,
    "  ['Popup', entries.popup],\n]) {",
    "  ['Popup', entries.popup],\n"
    "  ['Temporary Rules', entries.temporaryRules],\n"
    "  ['Network', entries.network],\n]) {",
)
locale_forbids = """  [
    entries.temporaryRules,
    '<h1>Temporary Rules</h1>',
    'Temporary Rules title regressed to literal English.',
  ],
  [
    entries.temporaryRules,
    'Delete all temporary rules',
    'Temporary Rules clear action regressed to literal English.',
  ],
  [
    entries.temporaryRules,
    'errorMessage = response.message',
    'Temporary Rules must not render raw backend response messages.',
  ],
  [
    entries.network,
    "translate('Request diagnostics')",
    'Network diagnostics regressed to the observer translation layer.',
  ],
  [
    entries.network,
    'error instanceof Error ? error.message',
    'Network diagnostics must not render raw exception messages.',
  ],
"""
insert_before(locale_guard_path, "  [entries.app, '<h1>General</h1>'", locale_forbids)
locale_requirements = """
requireText(
  entries.temporaryRules,
  "uiMessage('tempRules.deleteAria'",
  'Temporary Rules dynamic delete ARIA must be typed.',
);
requireText(
  entries.network,
  "uiMessage(\n        'network.bounds'",
  'Network diagnostics bounds must be a typed dynamic message.',
);
requireText(
  entries.chromiumE2e,
  'Temporary Rules typed locale coverage regressed',
  'Chromium Temporary Rules typed-locale coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'Network typed locale coverage regressed',
  'Chromium Network typed-locale coverage is missing.',
);
requireText(
  entries.firefoxE2e,
  '[data-temp-rules-manager][data-typed-locale=\"zh-TW\"]',
  'Firefox Temporary Rules typed-locale coverage is missing.',
);
requireText(
  entries.firefoxE2e,
  '[data-network-diagnostics][data-typed-locale=\"zh-TW\"]',
  'Firefox Network typed-locale coverage is missing.',
);
"""
insert_before(locale_guard_path, "requireText(\n  entries.catalog,\n  \"readonly 'switch.sourceError'\"", locale_requirements)

print('Patched typed locale catalog, components, inventory, and locale guard.')
