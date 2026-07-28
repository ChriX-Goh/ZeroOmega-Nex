import re
from pathlib import Path


def replace_once(pathname: str, old: str, new: str) -> None:
    path = Path(pathname)
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{pathname}: expected one anchor, found {count}: {old[:120]!r}')
    path.write_text(text.replace(old, new, 1))


theme_panel = r'''<script lang="ts">
  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import { uiText, type UiTextKey } from '../../lib/ui-messages';
  import type { ThemeMode } from '../../lib/ui-theme';

  export let locale: AppLocale = currentAppLocale();
  export let mode: ThemeMode;
  export let onChange: (mode: ThemeMode) => void;

  const choices: readonly {
    value: ThemeMode;
    titleKey: UiTextKey;
    descriptionKey: UiTextKey;
  }[] = [
    {
      value: 'auto',
      titleKey: 'theme.auto.title',
      descriptionKey: 'theme.auto.description',
    },
    {
      value: 'light',
      titleKey: 'theme.light.title',
      descriptionKey: 'theme.light.description',
    },
    {
      value: 'dark',
      titleKey: 'theme.dark.title',
      descriptionKey: 'theme.dark.description',
    },
  ];
</script>

<section class="settings-section" data-theme-panel data-typed-locale={locale}>
  <h2>{uiText('theme.appearance', locale)}</h2>
  <div class="theme-choices" role="radiogroup" aria-label={uiText('theme.groupAria', locale)}>
    {#each choices as choice}
      <button
        type="button"
        class:active={mode === choice.value}
        role="radio"
        aria-checked={mode === choice.value}
        onclick={() => onChange(choice.value)}
      >
        <strong>{uiText(choice.titleKey, locale)}</strong>
        <span>{uiText(choice.descriptionKey, locale)}</span>
      </button>
    {/each}
  </div>
  <p class="section-help">{uiText('theme.defaultHelp', locale)}</p>
</section>
'''
Path('apps/extension/src/entrypoints/options/ThemePanel.svelte').write_text(theme_panel)

catalog = r'''  'theme.pageTitle': { en: 'Theme', 'zh-CN': '主题', 'zh-TW': '佈景主題' },
  'theme.pageHelp': {
    en: 'Default: follow the operating-system appearance.',
    'zh-CN': '默认跟随操作系统外观。',
    'zh-TW': '預設跟隨作業系統外觀。',
  },
  'theme.appearance': { en: 'Appearance', 'zh-CN': '外观', 'zh-TW': '外觀' },
  'theme.groupAria': { en: 'Theme', 'zh-CN': '主题', 'zh-TW': '佈景主題' },
  'theme.auto.title': { en: 'Automatic', 'zh-CN': '自动', 'zh-TW': '自動' },
  'theme.auto.description': {
    en: 'Follow the operating-system appearance.',
    'zh-CN': '跟随操作系统外观。',
    'zh-TW': '跟隨作業系統外觀。',
  },
  'theme.light.title': { en: 'Light', 'zh-CN': '浅色', 'zh-TW': '淺色' },
  'theme.light.description': {
    en: 'Use the light appearance everywhere.',
    'zh-CN': '始终使用浅色外观。',
    'zh-TW': '一律使用淺色外觀。',
  },
  'theme.dark.title': { en: 'Dark', 'zh-CN': '深色', 'zh-TW': '深色' },
  'theme.dark.description': {
    en: 'Use the dark appearance everywhere.',
    'zh-CN': '始终使用深色外观。',
    'zh-TW': '一律使用深色外觀。',
  },
  'theme.defaultHelp': {
    en: 'Automatic is the default and follows the current browser and operating-system preference.',
    'zh-CN': '“自动”为默认设置，会跟随当前浏览器和操作系统偏好。',
    'zh-TW': '「自動」為預設設定，會跟隨目前瀏覽器與作業系統偏好。',
  },
  'popup.switcherAria': {
    en: 'ZeroOmega Nex profile switcher',
    'zh-CN': 'ZeroOmega Nex 情景模式切换器',
    'zh-TW': 'ZeroOmega Nex 情境模式切換器',
  },
  'popup.profilesAria': { en: 'Profiles', 'zh-CN': '情景模式', 'zh-TW': '情境模式' },
  'popup.loading': {
    en: 'Loading applied profiles…',
    'zh-CN': '正在加载已应用的情景模式…',
    'zh-TW': '正在載入已套用的情境模式…',
  },
  'popup.error.safe': {
    en: 'The popup operation could not be completed. Reopen the popup and retry.',
    'zh-CN': '无法完成弹出菜单操作。请重新打开弹出菜单后重试。',
    'zh-TW': '無法完成彈出式選單操作。請重新開啟彈出式選單後重試。',
  },
  'popup.ownership.app': {
    en: 'Another application is controlling proxy settings. Disable or remove the conflicting application.',
    'zh-CN': '其他应用正在控制代理设置。请禁用或者卸载发生冲突的应用。',
    'zh-TW': '其他應用程式正在控制 Proxy 設定。請停用或移除發生衝突的應用程式。',
  },
  'popup.ownership.policy': {
    en: 'Proxy settings are enforced by local policy and cannot be changed. Contact your administrator.',
    'zh-CN': '代理设置被本地策略强制指定，无法修改。请联系系统管理员。',
    'zh-TW': 'Proxy 設定由本機原則強制指定，無法修改。請聯絡系統管理員。',
  },
  'popup.ownership.disabled': {
    en: 'ZeroOmega cannot control proxy settings because a required browser permission is disabled.',
    'zh-CN': '浏览器所需权限已关闭，ZeroOmega 无法控制代理设置。',
    'zh-TW': '瀏覽器所需權限已關閉，ZeroOmega 無法控制 Proxy 設定。',
  },
  'popup.ownership.unknown': {
    en: 'ZeroOmega cannot inspect or change the browser proxy settings.',
    'zh-CN': 'ZeroOmega 无法检查或修改浏览器代理设置。',
    'zh-TW': 'ZeroOmega 無法檢查或修改瀏覽器 Proxy 設定。',
  },
  'popup.ownership.details': {
    en: 'ZeroOmega cannot switch profiles until this problem is resolved.',
    'zh-CN': '如果不解决以上问题，则无法使用 ZeroOmega 切换代理。',
    'zh-TW': '若不解決以上問題，則無法使用 ZeroOmega 切換 Proxy。',
  },
  'popup.cancel': { en: 'Cancel', 'zh-CN': '取消', 'zh-TW': '取消' },
  'popup.manageExtensions': { en: 'Manage extensions', 'zh-CN': '管理扩展', 'zh-TW': '管理擴充功能' },
  'popup.quickDisabled': {
    en: 'Quick switching is disabled in Options.',
    'zh-CN': '快速切换已在选项中关闭。',
    'zh-TW': '快速切換已在選項中關閉。',
  },
  'popup.noRoutes': {
    en: 'No quick-switch routes are configured.',
    'zh-CN': '尚未配置快速切换路由。',
    'zh-TW': '尚未設定快速切換路由。',
  },
  'popup.currentProfile': { en: 'Current profile', 'zh-CN': '当前情景模式', 'zh-TW': '目前情境模式' },
  'popup.result': { en: 'Result', 'zh-CN': '结果', 'zh-TW': '結果' },
  'popup.externalProfile': { en: 'External Profile', 'zh-CN': '外部情景模式', 'zh-TW': '外部情境模式' },
  'popup.profileName': { en: 'Profile name', 'zh-CN': '情景模式名称', 'zh-TW': '情境模式名稱' },
  'popup.externalNameAria': {
    en: 'External profile name',
    'zh-CN': '外部情景模式名称',
    'zh-TW': '外部情境模式名稱',
  },
  'popup.saving': { en: 'Saving…', 'zh-CN': '正在保存…', 'zh-TW': '正在儲存…' },
  'popup.saveName': { en: 'Save name', 'zh-CN': '保存名称', 'zh-TW': '儲存名稱' },
  'popup.name.required': {
    en: 'Profile name is required.',
    'zh-CN': '必须输入情景模式名称。',
    'zh-TW': '必須輸入情境模式名稱。',
  },
  'popup.name.underscore': {
    en: 'Profile name cannot start with an underscore.',
    'zh-CN': '情景模式名称不能以下划线开头。',
    'zh-TW': '情境模式名稱不能以下劃線開頭。',
  },
  'popup.name.duplicate': {
    en: 'A profile with this name already exists.',
    'zh-CN': '已存在同名情景模式。',
    'zh-TW': '已存在同名情境模式。',
  },
  'popup.inspectingContext': {
    en: 'Inspecting context target',
    'zh-CN': '正在检查右键目标',
    'zh-TW': '正在檢查右鍵目標',
  },
  'popup.inspectRequests': { en: 'Inspect requests', 'zh-CN': '检查请求', 'zh-TW': '檢查請求' },
  'popup.temporaryRulesAria': {
    en: 'Temporary rules',
    'zh-CN': '临时规则',
    'zh-TW': '暫時規則',
  },
  'popup.noTemporaryRule': {
    en: 'No temporary rule',
    'zh-CN': '不使用临时规则',
    'zh-TW': '不使用暫時規則',
  },
  'popup.condition.hostWildcard': { en: 'Host wildcard', 'zh-CN': '主机通配符', 'zh-TW': '主機萬用字元' },
  'popup.condition.hostRegex': {
    en: 'Host regular expression',
    'zh-CN': '主机正则表达式',
    'zh-TW': '主機規則運算式',
  },
  'popup.condition.urlWildcard': { en: 'URL wildcard', 'zh-CN': '网址通配符', 'zh-TW': '網址萬用字元' },
  'popup.condition.urlRegex': {
    en: 'URL regular expression',
    'zh-CN': '网址正则表达式',
    'zh-TW': '網址規則運算式',
  },
  'popup.condition.keyword': { en: 'URL keyword', 'zh-CN': '网址关键词', 'zh-TW': '網址關鍵字' },
  'popup.conditionType': { en: 'Condition type', 'zh-CN': '条件类型', 'zh-TW': '條件類型' },
  'popup.conditionTypeAria': {
    en: 'Current site condition type',
    'zh-CN': '当前网站条件类型',
    'zh-TW': '目前網站條件類型',
  },
  'popup.pattern': { en: 'Pattern', 'zh-CN': '匹配内容', 'zh-TW': '比對內容' },
  'popup.patternAria': {
    en: 'Current site condition pattern',
    'zh-CN': '当前网站条件匹配内容',
    'zh-TW': '目前網站條件比對內容',
  },
  'popup.resultProfile': { en: 'Result profile', 'zh-CN': '结果情景模式', 'zh-TW': '結果情境模式' },
  'popup.resultProfileAria': {
    en: 'Current site result profile',
    'zh-CN': '当前网站结果情景模式',
    'zh-TW': '目前網站結果情境模式',
  },
  'popup.adding': { en: 'Adding…', 'zh-CN': '正在添加…', 'zh-TW': '正在加入…' },
  'popup.addCondition': { en: 'Add condition', 'zh-CN': '添加条件', 'zh-TW': '加入條件' },
  'popup.currentSiteActionsAria': {
    en: 'Current site actions',
    'zh-CN': '当前网站操作',
    'zh-TW': '目前網站操作',
  },
  'popup.optionsAria': {
    en: 'Open ZeroOmega Nex options',
    'zh-CN': '打开 ZeroOmega Nex 选项',
    'zh-TW': '開啟 ZeroOmega Nex 選項',
  },
  'popup.opening': { en: 'Opening…', 'zh-CN': '正在打开…', 'zh-TW': '正在開啟…' },
  'popup.options': { en: 'Options', 'zh-CN': '选项', 'zh-TW': '選項' },
  'popup.switching': { en: 'Switching…', 'zh-CN': '正在切换…', 'zh-TW': '正在切換…' },
'''
replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "  'history.nav':",
    catalog + "  'history.nav':",
)

replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "  readonly 'profile.delete.blockedDescription': { readonly profileName: string };",
    "  readonly 'popup.profileMissing': { readonly profileId: string };\n"
    "  readonly 'popup.profileDisabled': { readonly name: string };\n"
    "  readonly 'popup.profileActive': { readonly name: string };\n"
    "  readonly 'popup.activateProfile': { readonly name: string };\n"
    "  readonly 'popup.resultFor': { readonly name: string };\n"
    "  readonly 'popup.requestErrors': { readonly count: number };\n"
    "  readonly 'popup.temporaryFor': { readonly domain: string };\n"
    "  readonly 'popup.manageTemporary': { readonly count: number };\n"
    "  readonly 'popup.addConditionTitle': { readonly name: string };\n"
    "  readonly 'popup.currentSite': { readonly hostname: string };\n"
    "  readonly 'popup.scope': { readonly domain: string };\n"
    "  readonly 'popup.addFor': { readonly domain: string };\n"
    "  readonly 'profile.delete.blockedDescription': { readonly profileName: string };",
)

dynamic_cases = r'''    case 'popup.profileMissing': {
      const { profileId } = params as UiMessageParameters['popup.profileMissing'];
      if (locale === 'zh-CN') return `已应用配置中缺少情景模式 ${profileId}。`;
      if (locale === 'zh-TW') return `已套用設定中缺少情境模式 ${profileId}。`;
      return `Profile ${profileId} is missing from the applied configuration.`;
    }
    case 'popup.profileDisabled': {
      const { name } = params as UiMessageParameters['popup.profileDisabled'];
      if (locale === 'zh-CN') return `${name} 已禁用。`;
      if (locale === 'zh-TW') return `${name} 已停用。`;
      return `${name} is disabled.`;
    }
    case 'popup.profileActive': {
      const { name } = params as UiMessageParameters['popup.profileActive'];
      if (locale === 'zh-CN') return `${name} 当前已启用`;
      if (locale === 'zh-TW') return `${name} 目前已啟用`;
      return `${name} is active`;
    }
    case 'popup.activateProfile': {
      const { name } = params as UiMessageParameters['popup.activateProfile'];
      if (locale === 'zh-CN') return `启用 ${name}`;
      if (locale === 'zh-TW') return `啟用 ${name}`;
      return `Activate ${name}`;
    }
    case 'popup.resultFor': {
      const { name } = params as UiMessageParameters['popup.resultFor'];
      if (locale === 'zh-CN') return `${name} 的结果情景模式`;
      if (locale === 'zh-TW') return `${name} 的結果情境模式`;
      return `Result profile for ${name}`;
    }
    case 'popup.requestErrors': {
      const { count } = params as UiMessageParameters['popup.requestErrors'];
      if (locale === 'zh-CN') return `${count} 个请求错误`;
      if (locale === 'zh-TW') return `${count} 個請求錯誤`;
      return `${count} request error${count === 1 ? '' : 's'}`;
    }
    case 'popup.temporaryFor': {
      const { domain } = params as UiMessageParameters['popup.temporaryFor'];
      if (locale === 'zh-CN') return `${domain} 的临时情景模式`;
      if (locale === 'zh-TW') return `${domain} 的暫時情境模式`;
      return `Temporary profile for ${domain}`;
    }
    case 'popup.manageTemporary': {
      const { count } = params as UiMessageParameters['popup.manageTemporary'];
      if (locale === 'zh-CN') return `管理临时规则（${count}）`;
      if (locale === 'zh-TW') return `管理暫時規則（${count}）`;
      return `Manage temporary rules (${count})`;
    }
    case 'popup.addConditionTitle': {
      const { name } = params as UiMessageParameters['popup.addConditionTitle'];
      if (locale === 'zh-CN') return `向 ${name} 添加条件`;
      if (locale === 'zh-TW') return `向 ${name} 加入條件`;
      return `Add condition to ${name}`;
    }
    case 'popup.currentSite': {
      const { hostname } = params as UiMessageParameters['popup.currentSite'];
      if (locale === 'zh-CN') return `当前网站：${hostname}`;
      if (locale === 'zh-TW') return `目前網站：${hostname}`;
      return `Current site: ${hostname}`;
    }
    case 'popup.scope': {
      const { domain } = params as UiMessageParameters['popup.scope'];
      if (locale === 'zh-CN') return `范围：${domain}`;
      if (locale === 'zh-TW') return `範圍：${domain}`;
      return `Scope: ${domain}`;
    }
    case 'popup.addFor': {
      const { domain } = params as UiMessageParameters['popup.addFor'];
      if (locale === 'zh-CN') return `为 ${domain} 添加条件`;
      if (locale === 'zh-TW') return `為 ${domain} 加入條件`;
      return `Add condition for ${domain}`;
    }
'''
replace_once(
    'apps/extension/src/lib/ui-messages.ts',
    "    case 'profile.delete.blockedDescription': {",
    dynamic_cases + "    case 'profile.delete.blockedDescription': {",
)

replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    r'''    {:else if activeSection === 'theme'}
      <header class="editor-heading">
        <div>
          <h1>Theme</h1>
          <p>Default: follow the operating-system appearance.</p>
        </div>
      </header>
      <ThemePanel mode={themeMode} onChange={updateThemeMode} />
''',
    r'''    {:else if activeSection === 'theme'}
      <header class="editor-heading" data-theme-settings data-typed-locale={locale}>
        <div>
          <h1>{uiText('theme.pageTitle', locale)}</h1>
          <p>{uiText('theme.pageHelp', locale)}</p>
        </div>
      </header>
      <ThemePanel {locale} mode={themeMode} onChange={updateThemeMode} />
''',
)

popup_path = Path('apps/extension/src/entrypoints/popup/App.svelte')
popup = popup_path.read_text()
popup = popup.replace(
    "  import { translate } from '../../lib/i18n';",
    "  import { currentAppLocale, type AppLocale } from '../../lib/i18n';\n"
    "  import { uiMessage, uiText, type UiTextKey } from '../../lib/ui-messages';",
    1,
)
popup = popup.replace(
    "  interface QuickSwitchItem {",
    "  export let locale: AppLocale = currentAppLocale();\n\n  interface QuickSwitchItem {",
    1,
)
popup = popup.replace(
    "  const conditionKinds: readonly { value: PopupConditionKind; label: string }[] = [\n"
    "    { value: 'host-wildcard', label: 'Host wildcard' },\n"
    "    { value: 'host-regex', label: 'Host regular expression' },\n"
    "    { value: 'url-wildcard', label: 'URL wildcard' },\n"
    "    { value: 'url-regex', label: 'URL regular expression' },\n"
    "    { value: 'keyword', label: 'URL keyword' },\n"
    "  ];",
    "  const conditionKinds: readonly { value: PopupConditionKind; labelKey: UiTextKey }[] = [\n"
    "    { value: 'host-wildcard', labelKey: 'popup.condition.hostWildcard' },\n"
    "    { value: 'host-regex', labelKey: 'popup.condition.hostRegex' },\n"
    "    { value: 'url-wildcard', labelKey: 'popup.condition.urlWildcard' },\n"
    "    { value: 'url-regex', labelKey: 'popup.condition.urlRegex' },\n"
    "    { value: 'keyword', labelKey: 'popup.condition.keyword' },\n"
    "  ];",
    1,
)
popup = popup.replace("if (route.kind === 'direct') return translate('Direct');", "if (route.kind === 'direct') return uiText('route.direct', locale);")
popup = popup.replace("if (route.kind === 'system') return translate('System Proxy');", "if (route.kind === 'system') return uiText('route.system', locale);")
popup = popup.replace("translate('Missing profile')", "uiText('route.missing', locale)")
popup = popup.replace("name: translate('Direct'),", "name: uiText('route.direct', locale),")
popup = popup.replace("name: translate('System Proxy'),", "name: uiText('route.system', locale),")
popup = popup.replace(
    "reason: `Profile ${route.profileId} is missing from the applied configuration.`,",
    "reason: uiMessage('popup.profileMissing', { profileId: route.profileId }, locale),",
)
popup = popup.replace(
    "...(profile.enabled === false ? { reason: `${profile.name} is disabled.` } : {}),",
    "...(profile.enabled === false\n"
    "          ? { reason: uiMessage('popup.profileDisabled', { name: profile.name }, locale) }\n"
    "          : {}),",
)
popup = popup.replace('errorMessage = response.message;', "errorMessage = uiText('popup.error.safe', locale);")

old_ownership = r'''  function ownershipMessage(reason: ProxyOwnershipBlockReason | undefined): string {
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
'''
new_ownership = r'''  function ownershipMessage(reason: ProxyOwnershipBlockReason | undefined): string {
    if (reason === 'app') return uiText('popup.ownership.app', locale);
    if (reason === 'policy') return uiText('popup.ownership.policy', locale);
    if (reason === 'disabled') return uiText('popup.ownership.disabled', locale);
    return uiText('popup.ownership.unknown', locale);
  }
'''
if popup.count(old_ownership) != 1:
    raise SystemExit('Popup ownership message anchor missing')
popup = popup.replace(old_ownership, new_ownership, 1)
old_validation = r'''  function validateExternalProfileName(): string {
    const name = externalProfileName.trim();
    if (!name) return translate('Profile name is required.');
    if (name.startsWith('_')) return translate('Profile name cannot start with an underscore.');
    if (state?.applied.profiles.some((profile) => profile.name === name)) {
      return translate('A profile with this name already exists.');
    }
    return '';
  }
'''
new_validation = r'''  function validateExternalProfileName(): string {
    const name = externalProfileName.trim();
    if (!name) return uiText('popup.name.required', locale);
    if (name.startsWith('_')) return uiText('popup.name.underscore', locale);
    if (state?.applied.profiles.some((profile) => profile.name === name)) {
      return uiText('popup.name.duplicate', locale);
    }
    return '';
  }
'''
if popup.count(old_validation) != 1:
    raise SystemExit('Popup name validation anchor missing')
popup = popup.replace(old_validation, new_validation, 1)

raw_error = 'errorMessage = error instanceof Error ? error.message : String(error);'
raw_count = popup.count(raw_error)
if raw_count < 8:
    raise SystemExit(f'expected at least 8 raw Popup exception assignments, found {raw_count}')
popup = popup.replace(raw_error, "errorMessage = uiText('popup.error.safe', locale);")
popup = re.sub(
    r"} catch \(error\) \{\n(\s+)(errorMessage = uiText\('popup\.error\.safe', locale\);)",
    r"} catch {\n\1\2",
    popup,
)
popup = popup.replace(
    r'''    } catch (error) {
      console.error('Unable to open the ZeroOmega Nex options page.', error);
      errorMessage = 'Unable to open Options.';
      openingSettings = false;
    }
''',
    r'''    } catch {
      errorMessage = uiText('popup.error.safe', locale);
      openingSettings = false;
    }
''',
    1,
)

replacements = {
    '  aria-label="ZeroOmega Nex profile switcher"': "  data-popup-locale={locale}\n  aria-label={uiText('popup.switcherAria', locale)}",
    '  <section aria-label="Profiles" class="profile-list">': "  <section aria-label={uiText('popup.profilesAria', locale)} class=\"profile-list\">",
    '      <p class="settings-error" role="status">Loading applied profiles…</p>': "      <p class=\"settings-error\" role=\"status\">{uiText('popup.loading', locale)}</p>",
    "          {translate('ZeroOmega cannot switch profiles until this problem is resolved.')}": "          {uiText('popup.ownership.details', locale)}",
    "<button type=\"button\" onclick={closePopup}>{translate('Cancel')}</button>": "<button type=\"button\" onclick={closePopup}>{uiText('popup.cancel', locale)}</button>",
    "            {translate('Manage extensions')}": "            {uiText('popup.manageExtensions', locale)}",
    '      <p class="settings-error" role="status">Quick switching is disabled in Options.</p>': "      <p class=\"settings-error\" role=\"status\">{uiText('popup.quickDisabled', locale)}</p>",
    '      <p class="settings-error" role="status">No quick-switch routes are configured.</p>': "      <p class=\"settings-error\" role=\"status\">{uiText('popup.noRoutes', locale)}</p>",
    "                ? `${item.name} is active`\n                : `Activate ${item.name}`)": "                ? uiMessage('popup.profileActive', { name: item.name }, locale)\n                : uiMessage('popup.activateProfile', { name: item.name }, locale))",
    '<svg class="current-mark" viewBox="0 0 16 16" aria-label="Current profile">': "<svg\n                class=\"current-mark\"\n                viewBox=\"0 0 16 16\"\n                aria-label={uiText('popup.currentProfile', locale)}\n              >",
    '              <span>Result</span>': "              <span>{uiText('popup.result', locale)}</span>",
    '                aria-label={`Result profile for ${item.name}`}': "                aria-label={uiMessage('popup.resultFor', { name: item.name }, locale)}",
    "                {translate('Profile name')}": "                {uiText('popup.profileName', locale)}",
    '                  aria-label="External profile name"': "                  aria-label={uiText('popup.externalNameAria', locale)}",
    "                  placeholder={translate('External Profile')}": "                  placeholder={uiText('popup.externalProfile', locale)}",
    "                  {translate('Cancel')}": "                  {uiText('popup.cancel', locale)}",
    "                  {importingExternalProfile ? translate('Saving…') : translate('Save name')}": "                  {uiText(importingExternalProfile ? 'popup.saving' : 'popup.saveName', locale)}",
    "              <span>{translate('External Profile')}</span>": "              <span>{uiText('popup.externalProfile', locale)}</span>",
    '      <strong>Inspecting context target</strong>': "      <strong>{uiText('popup.inspectingContext', locale)}</strong>",
    "          {requestDiagnostics.errorCount + requestDiagnostics.timeoutCount}\n          {translate('request errors')}": "          {uiMessage(\n            'popup.requestErrors',\n            { count: requestDiagnostics.errorCount + requestDiagnostics.timeoutCount },\n            locale,\n          )}",
    "        {translate('Inspect requests')}": "        {uiText('popup.inspectRequests', locale)}",
    '    <section class="temporary-rule-action" data-popup-temporary-rule aria-label="Temporary rules">': "    <section\n      class=\"temporary-rule-action\"\n      data-popup-temporary-rule\n      aria-label={uiText('popup.temporaryRulesAria', locale)}\n    >",
    '        Temporary profile for {currentSite.domain}': "        {uiMessage('popup.temporaryFor', { domain: currentSite.domain }, locale)}",
    '          aria-label={`Temporary profile for ${currentSite.domain}`}': "          aria-label={uiMessage('popup.temporaryFor', { domain: currentSite.domain }, locale)}",
    '          <option value="">No temporary rule</option>': "          <option value=\"\">{uiText('popup.noTemporaryRule', locale)}</option>",
    '          Manage temporary rules ({temporaryRuleView?.rules.length ?? 0})': "          {uiMessage(\n            'popup.manageTemporary',\n            { count: temporaryRuleView?.rules.length ?? 0 },\n            locale,\n          )}",
    '        <h2>Add condition to {activeSwitch.name}</h2>': "        <h2>{uiMessage('popup.addConditionTitle', { name: activeSwitch.name }, locale)}</h2>",
    '        <p class="condition-domain">Current site: {currentSite.hostname}</p>': "        <p class=\"condition-domain\">\n          {uiMessage('popup.currentSite', { hostname: currentSite.hostname }, locale)}\n        </p>",
    '            Scope: {currentSiteDomainForLevel(currentSite, subdomainLevel)}': "            {uiMessage(\n              'popup.scope',\n              { domain: currentSiteDomainForLevel(currentSite, subdomainLevel) },\n              locale,\n            )}",
    '          Condition type': "          {uiText('popup.conditionType', locale)}",
    '            aria-label="Current site condition type"': "            aria-label={uiText('popup.conditionTypeAria', locale)}",
    '              <option value={kind.value}>{kind.label}</option>': "              <option value={kind.value}>{uiText(kind.labelKey, locale)}</option>",
    '          Pattern': "          {uiText('popup.pattern', locale)}",
    '<input aria-label="Current site condition pattern" bind:value={conditionPattern} />': "<input aria-label={uiText('popup.patternAria', locale)} bind:value={conditionPattern} />",
    '          Result profile': "          {uiText('popup.resultProfile', locale)}",
    '<select aria-label="Current site result profile" bind:value={conditionRouteKey}>': "<select aria-label={uiText('popup.resultProfileAria', locale)} bind:value={conditionRouteKey}>",
    '            onclick={() => (conditionFormOpen = false)}\n            disabled={addingCondition}>Cancel</button': "            onclick={() => (conditionFormOpen = false)}\n            disabled={addingCondition}>{uiText('popup.cancel', locale)}</button",
    "            {addingCondition ? 'Adding…' : 'Add condition'}": "            {uiText(addingCondition ? 'popup.adding' : 'popup.addCondition', locale)}",
    '      <section class="current-site-action" aria-label="Current site actions">': "      <section\n        class=\"current-site-action\"\n        aria-label={uiText('popup.currentSiteActionsAria', locale)}\n      >",
    '          Add condition for {currentSite.domain}': "          {uiMessage('popup.addFor', { domain: currentSite.domain }, locale)}",
    '      aria-label="Open ZeroOmega Nex options"': "      aria-label={uiText('popup.optionsAria', locale)}",
    "      <span>{openingSettings ? 'Opening…' : 'Options'}</span>": "      <span>{uiText(openingSettings ? 'popup.opening' : 'popup.options', locale)}</span>",
    "        ? 'Switching…'": "        ? uiText('popup.switching', locale)",
}
for old, new in replacements.items():
    count = popup.count(old)
    if count != 1:
        raise SystemExit(f'Popup template anchor count {count}: {old[:100]!r}')
    popup = popup.replace(old, new, 1)

if 'translate(' in popup:
    raise SystemExit('Popup observer translation calls remain')
if 'error instanceof Error ? error.message' in popup or 'errorMessage = response.message' in popup:
    raise SystemExit('Popup raw backend or exception text remains')
popup_path.write_text(popup)

# Component rendering coverage.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    r'''  it('renders Automatic, Light, and Dark theme choices', () => {
    const { body } = render(ThemePanel, {
      props: { mode: 'auto', onChange: () => undefined },
    });

    expect(body).toContain('Automatic');
    expect(body).toContain('Light');
    expect(body).toContain('Dark');
    expect(body).toContain('aria-checked="true"');
  });
''',
    r'''  it('renders Automatic, Light, and Dark theme choices', () => {
    const { body } = render(ThemePanel, {
      props: { mode: 'auto', onChange: () => undefined },
    });

    expect(body).toContain('Automatic');
    expect(body).toContain('Light');
    expect(body).toContain('Dark');
    expect(body).toContain('aria-checked="true"');
  });

  it('renders typed Theme and Popup loading shells in both Chinese locales', () => {
    const simplifiedTheme = render(ThemePanel, {
      props: { locale: 'zh-CN', mode: 'dark', onChange: () => undefined },
    }).body;
    expect(simplifiedTheme).toContain('data-typed-locale="zh-CN"');
    expect(simplifiedTheme).toContain('外观');
    expect(simplifiedTheme).toContain('自动');
    expect(simplifiedTheme).toContain('浅色');
    expect(simplifiedTheme).toContain('深色');
    expect(simplifiedTheme).not.toContain('Automatic');

    const traditionalPopup = render(PopupApp, {
      props: { locale: 'zh-TW' },
    }).body;
    expect(traditionalPopup).toContain('data-popup-locale="zh-TW"');
    expect(traditionalPopup).toContain('正在載入已套用的情境模式…');
    expect(traditionalPopup).toContain('aria-label="開啟 ZeroOmega Nex 選項"');
    expect(traditionalPopup).toContain('選項');
    expect(traditionalPopup).not.toContain('Loading applied profiles');
    expect(traditionalPopup).not.toContain('Open ZeroOmega Nex options');
  });
''',
)

# Chromium typed selectors and locale evidence.
e2e_path = Path('scripts/e2e-chromium.mjs')
e2e = e2e_path.read_text()
e2e = e2e.replace(
    "  await options.getByRole('heading', { name: '主题', exact: true, level: 1 }).waitFor();\n"
    "  const automaticTheme = options.getByRole('radio', { name: /^自动/u });",
    "  await options.getByRole('heading', { name: '主题', exact: true, level: 1 }).waitFor();\n"
    "  const themePanel = options.locator('[data-theme-panel]');\n"
    "  assert.equal(await themePanel.getAttribute('data-typed-locale'), 'zh-CN');\n"
    "  await themePanel.getByRole('heading', { name: '外观', exact: true }).waitFor();\n"
    "  assert.doesNotMatch(await themePanel.innerText(), /Appearance|Automatic|Light|Dark/u);\n"
    "  const automaticTheme = options.getByRole('radio', { name: /^自动/u });",
    1,
)
e2e = e2e.replace(
    "  await initialPopup.goto(`chrome-extension://${extensionId}/popup.html`);\n"
    "  await initialPopup.getByRole('button', { name: /直接连接/u }).waitFor();",
    "  await initialPopup.goto(`chrome-extension://${extensionId}/popup.html`);\n"
    "  assert.equal(await initialPopup.locator('.popup-shell').getAttribute('data-popup-locale'), 'zh-CN');\n"
    "  await initialPopup.getByRole('button', { name: '打开 ZeroOmega Nex 选项', exact: true }).waitFor();\n"
    "  await initialPopup.getByRole('button', { name: /直接连接/u }).waitFor();",
    1,
)
selector_replacements = {
    "getByLabel('External profile name')": "getByLabel('外部情景模式名称')",
    "getByLabel('Result profile for switch')": "getByLabel('switch 的结果情景模式')",
    "getByLabel('Temporary profile for example.co.uk')": "getByLabel('example.co.uk 的临时情景模式')",
    "getByLabel('Current site condition pattern')": "getByLabel('当前网站条件匹配内容')",
    "getByLabel('Current site result profile')": "getByLabel('当前网站结果情景模式')",
    "getByRole('button', { name: 'Add condition', exact: true })": "getByRole('button', { name: '添加条件', exact: true })",
}
for old, new in selector_replacements.items():
    count = e2e.count(old)
    if count == 0:
        raise SystemExit(f'Chromium Popup selector missing: {old}')
    e2e = e2e.replace(old, new)
e2e = e2e.replace(
    "  const resultPopup = await context.newPage();\n  await resultPopup.goto(`chrome-extension://${extensionId}/popup.html`);",
    "  const resultPopup = await context.newPage();\n"
    "  await resultPopup.goto(`chrome-extension://${extensionId}/popup.html`);\n"
    "  assert.equal(await resultPopup.locator('.popup-shell').getAttribute('data-popup-locale'), 'zh-CN');\n"
    "  assert.doesNotMatch(\n"
    "    await resultPopup.locator('main').innerText(),\n"
    "    /Loading applied profiles|Quick switching is disabled|No quick-switch routes|Result profile/u,\n"
    "    'Popup typed locale coverage regressed',\n"
    "  );",
    1,
)
e2e = e2e.replace(
    "  assert.match(await ownershipBlocker.innerText(), /其他应用正在控制代理设置/u);",
    "  assert.equal(await blockedPopup.locator('.popup-shell').getAttribute('data-popup-locale'), 'zh-CN');\n"
    "  assert.match(await ownershipBlocker.innerText(), /其他应用正在控制代理设置/u);\n"
    "  assert.doesNotMatch(await ownershipBlocker.innerText(), /Another application|Manage extensions/u);",
    1,
)
e2e_path.write_text(e2e)

# Inventory and permanent typed locale guards.
replace_once(
    'scripts/generate-locale-inventory.mjs',
    "  'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',\n];",
    "  'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',\n"
    "  'apps/extension/src/entrypoints/options/ThemePanel.svelte',\n"
    "  'apps/extension/src/entrypoints/popup/App.svelte',\n];",
)

validate_path = Path('scripts/validate-localization.mjs')
validate = validate_path.read_text()
validate = validate.replace(
    "  legacyImport: 'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',\n  chromiumE2e:",
    "  legacyImport: 'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',\n"
    "  theme: 'apps/extension/src/entrypoints/options/ThemePanel.svelte',\n"
    "  popup: 'apps/extension/src/entrypoints/popup/App.svelte',\n"
    "  chromiumE2e:",
    1,
)
validate = validate.replace(
    "  ['Legacy Import', entries.legacyImport],\n]) {",
    "  ['Legacy Import', entries.legacyImport],\n"
    "  ['Theme', entries.theme],\n"
    "  ['Popup', entries.popup],\n]) {",
    1,
)
validate = validate.replace(
    "  [entries.app, '<h1>General</h1>', 'General heading regressed to literal English.'],",
    "  [entries.theme, '<strong>Automatic</strong>', 'Theme choice regressed to literal English.'],\n"
    "  [entries.theme, 'aria-label=\"Theme\"', 'Theme ARIA regressed to literal English.'],\n"
    "  [entries.popup, 'Loading applied profiles…', 'Popup loading state regressed to literal English.'],\n"
    "  [entries.popup, 'Temporary profile for {currentSite.domain}', 'Popup temporary rule regressed to literal English.'],\n"
    "  [entries.popup, 'Add condition for {currentSite.domain}', 'Popup current-site action regressed to literal English.'],\n"
    "  [entries.popup, 'translate(', 'Popup regressed to the observer translation layer.'],\n"
    "  [entries.popup, 'errorMessage = response.message', 'Popup must not render raw backend response messages.'],\n"
    "  [entries.popup, 'error instanceof Error ? error.message', 'Popup must not render raw exception messages.'],\n"
    "  [entries.app, '<h1>General</h1>', 'General heading regressed to literal English.'],",
    1,
)
validate = validate.replace(
    "requireText(\n  entries.app,\n  'data-interface-settings',\n  'Interface settings must expose typed browser evidence.',\n);",
    "requireText(\n  entries.app,\n  'data-interface-settings',\n  'Interface settings must expose typed browser evidence.',\n);\n"
    "requireText(\n  entries.app,\n  '<ThemePanel {locale}',\n  'Options must pass locale to Theme.',\n);\n"
    "requireText(\n  entries.theme,\n  'data-theme-panel',\n  'Theme must expose typed browser evidence.',\n);\n"
    "requireText(\n  entries.popup,\n  'data-popup-locale={locale}',\n  'Popup must expose its typed locale.',\n);",
    1,
)
validate = validate.replace(
    "requireText(\n  entries.chromiumE2e,\n  'Options General typed locale coverage regressed',",
    "requireText(\n  entries.chromiumE2e,\n  'Popup typed locale coverage regressed',\n  'Chromium Popup typed-locale coverage is missing.',\n);\n"
    "requireText(\n  entries.chromiumE2e,\n  \"locator('[data-theme-panel]')\",\n  'Chromium Theme typed-locale coverage is missing.',\n);\n"
    "requireText(\n  entries.chromiumE2e,\n  'Options General typed locale coverage regressed',",
    1,
)
validate_path.write_text(validate)

# UI compatibility guards.
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    r'''  [
    ['Automatic', 'Light', 'Dark'].every((label) => themePanel.includes(label)),
    'Options must provide Automatic, Light, and Dark appearance modes.',
  ],
''',
    r'''  [
    themePanel.includes('data-theme-panel') &&
      themePanel.includes('data-typed-locale={locale}') &&
      themePanel.includes("uiText('theme.appearance', locale)") &&
      themePanel.includes("titleKey: 'theme.auto.title'") &&
      themePanel.includes("titleKey: 'theme.light.title'") &&
      themePanel.includes("titleKey: 'theme.dark.title'") &&
      optionsApp.includes('<ThemePanel {locale}') &&
      chromiumE2e.includes("locator('[data-theme-panel]')"),
    'Options must provide typed Automatic, Light, and Dark appearance modes while sharing the selected theme with Popup.',
  ],
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    r'''  [
    popupStyle.includes("font-family: 'Segoe UI'"),
    'Popup must use explicit Windows typography for browser parity.',
  ],
''',
    r'''  [
    popupApp.includes('data-popup-locale={locale}') &&
      popupApp.includes("uiMessage('popup.resultFor'") &&
      popupApp.includes("uiMessage('popup.temporaryFor'") &&
      popupApp.includes("uiMessage('popup.addFor'") &&
      popupApp.includes("uiText('popup.ownership.details', locale)") &&
      popupApp.includes("uiText('popup.optionsAria', locale)") &&
      !popupApp.includes('translate(') &&
      !popupApp.includes('errorMessage = response.message') &&
      !popupApp.includes('error instanceof Error ? error.message') &&
      chromiumE2e.includes('Popup typed locale coverage regressed') &&
      chromiumE2e.includes("getByLabel('example.co.uk 的临时情景模式')") &&
      chromiumE2e.includes("getByRole('button', { name: '添加条件', exact: true })"),
    'Popup must render route/result, current-site, temporary-rule, ownership, diagnostics, external-profile, options, status, safe errors, and ARIA directly through the typed three-locale catalog without changing Applied-only or session-only boundaries.',
  ],
  [
    popupStyle.includes("font-family: 'Segoe UI'"),
    'Popup must use explicit Windows typography for browser parity.',
  ],
''',
)

# Update UI audit matrix.
audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
rows = {
    'H-02': '| H-02 | 简体中文 | `zh_CN` | 全 UI locale | MUST_MATCH | PARTIAL | PARTIAL | typed 已覆盖 Options shell、General、Interface、Theme、Popup、生命周期、Fixed、Switch/Rule List、PAC、History 与 Legacy Import；inventory 继续跟踪 Temporary Rules/Network | 继续辅助页 |',
    'H-03': '| H-03 | 正體中文 | `zh_TW/zh_Hant` | 全 UI locale | MUST_MATCH | PARTIAL | PARTIAL | typed 使用原版术语并覆盖 Options shell、General、Interface、Theme、Popup、History 与 Legacy Import；Firefox 保持 Apply/PAC 回归 | 继续辅助页 |',
    'H-04': '| H-04 | 动态文本 | locale/controller | 状态变化后仍翻译 | MUST_MATCH | PARTIAL | PARTIAL | Apply/Discard/Draft、Theme、Popup route/result/temporary/current-site/ownership/diagnostics、生命周期、更新与导入统计均使用 typed 参数或稳定状态；Rule/PAC 下载底层错误码仍待统一 | 错误码化与辅助页 |',
    'H-05': '| H-05 | select option | locale | 条件/协议/格式均翻译 | MUST_MATCH | PARTIAL | PARTIAL | General、Theme、Popup 条件/结果/临时路由、Fixed、Switch、Rule List、PAC 选项已 typed；Network/Temporary Rules 仍需巡查 | 继续 inventory 批次 |',
    'H-06': '| H-06 | placeholder/title/aria | locale/template | 一同翻译 | MUST_MATCH | PARTIAL | PARTIAL | Options、Theme、Popup、生命周期、编辑器、History、Import 已直接 typed；Chromium zh-CN 与 Firefox zh-TW 断言覆盖 | 扩展辅助页 DOM 巡查 |',
    'H-07': '| H-07 | 错误和确认框 | locale/controller | 全部本地化 | MUST_MATCH | PARTIAL | PARTIAL | Options 与 Popup 不再渲染 raw exception/backend message；ownership、外部配置、诊断及既有生命周期/PAC/History/Import 错误已 typed；Rule/PAC 下载错误码与辅助页仍待迁移 | 继续统一错误码翻译 |',
    'I-04': '| I-04 | 结果情景模式 | popup controller | Switch/Virtual 结果显示/选择 | MUST_MATCH | DONE | COMPLETE | Popup 行、动态 title/select ARIA 与结果标签直接 typed 三语；合法结果通过后台 verified Apply 写入并保持活动路由；Chromium E2E 覆盖 | 保持回归 |',
    'I-05': '| I-05 | 当前网站添加条件 | popup | 对当前 tab 快速加规则 | MUST_MATCH | DONE | COMPLETE | current-site 标题、域名、scope、条件类型、pattern、结果、动作与 ARIA typed 三语；activeTab + PSL + 后台 Apply 与 Chromium E2E 保持 | 多级子域巡查 |',
    'I-06': '| I-06 | 临时规则 | `popup/temp_rules` | 非持久临时覆盖 | MUST_MATCH | DONE | COMPLETE | Popup 临时路由 label/select/无规则/管理入口 typed 三语；session-only 状态与 PAC snapshot、worker 重启/浏览器重启边界及 Chromium E2E 保持 | Firefox 交互与管理页 locale |',
    'I-07': '| I-07 | 外部扩展控制状态 | popup/target | 阻断页 + external profile 导入 | MUST_MATCH | DONE | COMPLETE | ownership 四类阻断、详情、管理入口、外部名称/校验/保存及 ARIA typed 三语；后台原子导入与控制权 fail-closed Chromium E2E 保持 | 保持守卫 |',
    'I-08': '| I-08 | 请求错误列表 | popup/network | 有界错误/请求查看 | MUST_MATCH | DONE | COMPLETE | Popup 错误计数与检查入口 typed 三语；会话启动、权限、storage.session、限额、URL 清洗及独立明细页边界不变 | Network 页面 locale 与 Firefox 错误 |',
    'I-10': '| I-10 | Popup 主题 | 原版+Nex 决策 | 允许 Nex 现代主题 | REFERENCE | DONE | COMPLETE | Theme 三种 appearance 直接 typed 三语；Options 与 Popup 共享 auto/light/dark 状态，Chromium 真实切换与 Popup 继承验证 | 保持 |',
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
    raise SystemExit(f'Theme/Popup audit rows not found: {sorted(missing)}')
for index, line in enumerate(lines):
    if line.startswith('- **明确 BROKEN**：'):
        lines[index] = '- **明确 BROKEN**：Temporary Rules 与 Network 等辅助页面翻译仍不完整；Options shell、Theme、Popup 与核心编辑/导入/History 路径已恢复。'
audit_path.write_text('\n'.join(lines) + '\n')

# Knowledge graph and milestone status.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg = kg_path.read_text()
anchor = '## 13. 本地化知识节点\n'
section = '''## 12.2 Nex Theme 与 Popup typed 边界

- Theme 继续只有 `auto` / `light` / `dark` 三种状态，Options 与 Popup 读取同一持久化选择；typed 文案不得增加第四种主题或改变自动模式的系统跟随语义。
- Popup 路由列表和结果选择只读取并修改 Applied；typed 展示层不得把 Draft 直接暴露为可切换状态，也不得绕过 `expectedAppliedRevisionId`。
- 临时规则继续只进入 `storage.session` 和 session snapshot，Popup 本地化不得把临时规则写入普通 ProfileSpec、持久快照或导出。
- ownership blocker 继续 fail closed；在 app/policy/disabled/unknown 任一不可控制状态下，情景模式、临时规则和当前网站操作都不得显示。
- Popup 的 route/result、外部配置、诊断摘要、临时规则、当前网站条件、底部 Options/状态及动态 ARIA 直接通过 typed 英文/简体中文/正體中文 catalog 渲染；不再依赖全局 observer 翻译。
- Popup 不直接渲染后台 `response.message` 或异常文字，只显示非秘密 typed 安全摘要；稳定技术证据仍由对应 Options/Network 页面承担。

'''
if section.strip() not in kg:
    if kg.count(anchor) != 1:
        raise SystemExit('knowledge graph localization anchor missing')
    kg = kg.replace(anchor, section + anchor, 1)
kg_path.write_text(kg)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
next_old = '''Migrate Theme and Popup as the next typed vertical batch. Cover appearance choices, popup route/result rows, current-site actions, temporary-rule entry points, ownership blockers, options action, request-diagnostics summary, buttons, titles, dynamic status, and ARIA in all three locales while preserving Applied-only switching and session-only temporary-rule boundaries.
'''
next_new = '''Migrate Temporary Rules and Network as the next typed vertical batch. Cover manager tables, delete/clear actions, diagnostics permission/start/stop/refresh/clear states, request columns/status, empty/error states, buttons, titles, dynamic counts, safe errors, and ARIA in all three locales while preserving session-only storage, bounded monitoring, sanitized URLs, and non-navigating request records.
'''
if status.count(next_old) != 1:
    raise SystemExit('status Theme/Popup next-action anchor missing')
status = status.replace(next_old, next_new, 1)
remaining_old = '- remaining Theme/Popup/Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,'
remaining_new = '- remaining Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,'
if status.count(remaining_old) != 1:
    raise SystemExit('status remaining Theme/Popup anchor missing')
status = status.replace(remaining_old, remaining_new, 1)
marker = '### Typed Options shell, General and Interface\n'
section_status = '''### Typed Theme and Popup

- Theme keeps the existing Automatic, Light, and Dark behavior while directly rendering all appearance choices, descriptions, help, and ARIA in English, Simplified Chinese, and Traditional Chinese.
- Popup route/result rows, ownership blockers, external-profile naming, request-diagnostics summary, temporary-rule controls, current-site condition workflow, footer actions, dynamic status/title, safe errors, and ARIA now render directly through the typed catalog.
- Popup switching remains Applied-only; temporary rules remain session-only; ownership blockers remain fail closed. This slice changes the presentation contract, not those state machines.
- Chromium verifies resolved zh-CN Theme and Popup locale, shared dark/automatic theme behavior, result selection, temporary-rule session storage, current-site Apply, external import, and ownership blocking through the complete interaction chain.

'''
if section_status.strip() not in status:
    if status.count(marker) != 1:
        raise SystemExit('status Options shell anchor missing')
    status = status.replace(marker, section_status + marker, 1)
status_path.write_text(status)
