from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:160]!r}')
    path.write_text(text.replace(old, new, 1))


def insert_before(path: Path, anchor: str, addition: str) -> None:
    text = path.read_text()
    count = text.count(anchor)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {anchor[:160]!r}')
    path.write_text(text.replace(anchor, addition + anchor, 1))


messages = ROOT / 'apps/extension/src/lib/ui-messages.ts'
static = """  'options.builtin.help': {
    en: 'Direct and System Proxy are always available.',
    'zh-CN': '直接连接和系统代理始终可用。',
    'zh-TW': '直接連線與系統代理始終可用。',
  },
  'options.builtin.directHelp': {
    en: 'Connect without a proxy.',
    'zh-CN': '不使用代理，直接连接网络。',
    'zh-TW': '不使用代理，直接連線網路。',
  },
  'options.builtin.systemHelp': {
    en: 'Use the browser or operating-system proxy.',
    'zh-CN': '使用浏览器或操作系统的代理设置。',
    'zh-TW': '使用瀏覽器或作業系統的代理設定。',
  },
  'options.builtin.directColorAria': {
    en: 'Direct profile color',
    'zh-CN': '直接连接情景模式颜色',
    'zh-TW': '直接連線情境模式顏色',
  },
  'options.builtin.systemColorAria': {
    en: 'System Proxy profile color',
    'zh-CN': '系统代理情景模式颜色',
    'zh-TW': '系統代理情境模式顏色',
  },
  'options.newProfileShell.help': {
    en: 'Create a profile using the original ZeroOmega workflow.',
    'zh-CN': '按照原版 ZeroOmega 流程创建情景模式。',
    'zh-TW': '依照原版 ZeroOmega 流程建立情境模式。',
  },
  'options.about.compatibilityTitle': {
    en: 'Compatibility-first continuation',
    'zh-CN': '兼容性优先的延续版本',
    'zh-TW': '相容性優先的延續版本',
  },
  'options.about.compatibilityHelp': {
    en: 'This build preserves the original ZeroOmega navigation and migration workflow while replacing the proxy control plane with a verified cross-browser implementation.',
    'zh-CN': '此版本保留原版 ZeroOmega 的导航和迁移流程，同时以经过验证的跨浏览器实现替换代理控制平面。',
    'zh-TW': '此版本保留原版 ZeroOmega 的導覽與移轉流程，同時以經過驗證的跨瀏覽器實作取代代理控制平面。',
  },
  'options.empty.title': {
    en: 'No user profiles',
    'zh-CN': '没有用户情景模式',
    'zh-TW': '沒有使用者情境模式',
  },
  'options.empty.help': {
    en: 'Create a new profile from the left navigation or restore an original ZeroOmega backup.',
    'zh-CN': '请从左侧导航新建情景模式，或恢复原版 ZeroOmega 备份。',
    'zh-TW': '請從左側導覽建立情境模式，或還原原版 ZeroOmega 備份。',
  },
  'options.export.ruleList': {
    en: 'Publish rule list',
    'zh-CN': '发布规则列表',
    'zh-TW': '發佈規則清單',
  },
  'options.export.ruleListTitle': {
    en: 'Export this Switch Profile as a rule-list file.',
    'zh-CN': '将此自动切换情景模式导出为规则列表文件。',
    'zh-TW': '將此自動切換情境模式匯出為規則清單檔案。',
  },
  'options.export.pac': { en: 'Export PAC', 'zh-CN': '导出 PAC', 'zh-TW': '匯出 PAC' },
  'options.export.pacTitle': {
    en: 'Export the current profile as a PAC file for another browser.',
    'zh-CN': '将当前情景模式导出为可供其他浏览器使用的 PAC 文件。',
    'zh-TW': '將目前情境模式匯出為可供其他瀏覽器使用的 PAC 檔案。',
  },
  'virtual.target.title': {
    en: 'Target profile',
    'zh-CN': '目标情景模式',
    'zh-TW': '目標情境模式',
  },
  'virtual.target.help': {
    en: 'A virtual profile is a stable alias. Change this target later without editing every rule that refers to the virtual profile.',
    'zh-CN': '虚拟情景模式是稳定别名。以后可以在此更改目标，无需逐条修改引用该虚拟情景模式的规则。',
    'zh-TW': '虛擬情境模式是穩定別名。日後可在此變更目標，無需逐條修改引用該虛擬情境模式的規則。',
  },
  'virtual.target.aria': {
    en: 'Virtual Profile target',
    'zh-CN': '虚拟情景模式目标',
    'zh-TW': '虛擬情境模式目標',
  },
  'virtual.migrate.title': {
    en: 'Migrate to Virtual Profile',
    'zh-CN': '迁移到虚拟情景模式',
    'zh-TW': '移轉到虛擬情境模式',
  },
  'virtual.migrate.help': {
    en: 'Replace references to the selected target with this virtual profile. Future target changes can then be made here in one place.',
    'zh-CN': '将对所选目标的引用替换为此虚拟情景模式。以后只需在此处更改目标。',
    'zh-TW': '將對所選目標的引用取代為此虛擬情境模式。日後只需在此處變更目標。',
  },
  'virtual.migrate.action': {
    en: 'Replace target profile',
    'zh-CN': '替换目标情景模式',
    'zh-TW': '取代目標情境模式',
  },
"""
insert_before(messages, "  'newProfile.title':", static)
replace_once(
    messages,
    "  readonly 'tempRules.deleteAria': { readonly domain: string };",
    "  readonly 'options.exported': { readonly filename: string; readonly warnings: number };\n"
    "  readonly 'tempRules.deleteAria': { readonly domain: string };",
)
case = """    case 'options.exported': {
      const { filename, warnings } = params as UiMessageParameters['options.exported'];
      if (locale === 'zh-CN') {
        return warnings === 0 ? `已导出 ${filename}。` : `已导出 ${filename}，包含 ${warnings} 条警告。`;
      }
      if (locale === 'zh-TW') {
        return warnings === 0 ? `已匯出 ${filename}。` : `已匯出 ${filename}，包含 ${warnings} 條警告。`;
      }
      return warnings === 0
        ? `Exported ${filename}.`
        : `Exported ${filename} with ${warnings} warning(s).`;
    }
"""
insert_before(messages, "    case 'tempRules.deleteAria':", case)

app = ROOT / 'apps/extension/src/entrypoints/options/App.svelte'
replace_once(
    app,
    "  import { currentAppLocale, translate } from '../../lib/i18n';\n  import { profileKindText, uiText } from '../../lib/ui-messages';",
    "  import { currentAppLocale } from '../../lib/i18n';\n"
    "  import { profileKindText, uiMessage, uiText } from '../../lib/ui-messages';",
)
replace_once(
    app,
    "      profileExportMessage =\n        result.exported.warnings.length === 0\n          ? `Exported ${result.exported.filename}.`\n          : `Exported ${result.exported.filename} with ${result.exported.warnings.length} warning(s).`;",
    "      profileExportMessage = uiMessage(\n"
    "        'options.exported',\n"
    "        { filename: result.exported.filename, warnings: result.exported.warnings.length },\n"
    "        locale,\n"
    "      );",
)
# The same source block occurs twice; replace the second independently.
replace_once(
    app,
    "      profileExportMessage =\n        result.exported.warnings.length === 0\n          ? `Exported ${result.exported.filename}.`\n          : `Exported ${result.exported.filename} with ${result.exported.warnings.length} warning(s).`;",
    "      profileExportMessage = uiMessage(\n"
    "        'options.exported',\n"
    "        { filename: result.exported.filename, warnings: result.exported.warnings.length },\n"
    "        locale,\n"
    "      );",
)
replace_once(app, '<span>Zero Omega</span>', '<span>{productIdentity.name}</span>')
old_builtin = """    {:else if activeSection === 'builtin' && state}
      <header class="editor-heading">
        <div>
          <h1>Built-in Profiles</h1>
          <p>Direct and System Proxy are always available.</p>
        </div>
      </header>
      <section class="settings-section builtin-grid">
        <label class="builtin-card"
          ><ProfileIcon
            kind="direct"
            color={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'}
            size={28}
          /><strong>Direct</strong><span>Connect without a proxy.</span><input
            aria-label="Direct profile color"
            type="color"
            value={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'}
            disabled={saving || view?.busy}
            onchange={(event) => updateBuiltInColor('direct', valueFrom(event))}
          /></label
        >
        <label class="builtin-card"
          ><ProfileIcon
            kind="system"
            color={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'}
            size={28}
          /><strong>System Proxy</strong><span>Use the browser or operating-system proxy.</span
          ><input
            aria-label="System profile color"
            type="color"
            value={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'}
            disabled={saving || view?.busy}
            onchange={(event) => updateBuiltInColor('system', valueFrom(event))}
          /></label
        >
      </section>
"""
new_builtin = """    {:else if activeSection === 'builtin' && state}
      <header class="editor-heading" data-builtin-settings data-typed-locale={locale}>
        <div>
          <h1>{uiText('options.nav.builtIn', locale)}</h1>
          <p>{uiText('options.builtin.help', locale)}</p>
        </div>
      </header>
      <section class="settings-section builtin-grid">
        <label class="builtin-card"
          ><ProfileIcon
            kind="direct"
            color={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'}
            size={28}
          /><strong>{uiText('route.direct', locale)}</strong
          ><span>{uiText('options.builtin.directHelp', locale)}</span><input
            aria-label={uiText('options.builtin.directColorAria', locale)}
            type="color"
            value={state.draft.settings.interface.builtInProfiles?.direct?.color ?? '#99ccee'}
            disabled={saving || view?.busy}
            onchange={(event) => updateBuiltInColor('direct', valueFrom(event))}
          /></label
        >
        <label class="builtin-card"
          ><ProfileIcon
            kind="system"
            color={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'}
            size={28}
          /><strong>{uiText('route.system', locale)}</strong
          ><span>{uiText('options.builtin.systemHelp', locale)}</span><input
            aria-label={uiText('options.builtin.systemColorAria', locale)}
            type="color"
            value={state.draft.settings.interface.builtInProfiles?.system?.color ?? '#ddbb88'}
            disabled={saving || view?.busy}
            onchange={(event) => updateBuiltInColor('system', valueFrom(event))}
          /></label
        >
      </section>
"""
replace_once(app, old_builtin, new_builtin)
replace_once(
    app,
    """    {:else if activeSection === 'new-profile'}
      <section class="settings-section shell-status" aria-hidden="true">
        <h1>Profiles</h1>
        <p>Create a profile using the original ZeroOmega workflow.</p>
      </section>
""",
    """    {:else if activeSection === 'new-profile'}
      <section
        class="settings-section shell-status"
        data-new-profile-shell
        data-typed-locale={locale}
        aria-hidden="true"
      >
        <h1>{uiText('options.nav.profiles', locale)}</h1>
        <p>{uiText('options.newProfileShell.help', locale)}</p>
      </section>
""",
)
replace_once(
    app,
    """    {:else if activeSection === 'about'}
      <header class="editor-heading">
        <div>
          <h1>ZeroOmega Nex</h1>
          <p>{productIdentity.milestone}</p>
        </div>
      </header>
      <section class="settings-section">
        <h2>Compatibility-first continuation</h2>
        <p>
          This build preserves the original ZeroOmega navigation and migration workflow while
          replacing the proxy control plane with a verified cross-browser implementation.
        </p>
      </section>
""",
    """    {:else if activeSection === 'about'}
      <div data-about-settings data-typed-locale={locale}>
        <header class="editor-heading">
          <div>
            <h1>{productIdentity.name}</h1>
            <p>{productIdentity.milestone}</p>
          </div>
        </header>
        <section class="settings-section">
          <h2>{uiText('options.about.compatibilityTitle', locale)}</h2>
          <p>{uiText('options.about.compatibilityHelp', locale)}</p>
        </section>
      </div>
""",
)
replace_once(
    app,
    "title={ruleListExportWarning || 'Export this Switch Profile as a rule-list file.'}",
    "title={ruleListExportWarning || uiText('options.export.ruleListTitle', locale)}",
)
replace_once(app, "{translate('Publish rule list')}", "{uiText('options.export.ruleList', locale)}")
replace_once(
    app,
    'title="Export the current profile as a PAC file for another browser."',
    "title={uiText('options.export.pacTitle', locale)}",
)
replace_once(app, "{translate('Export PAC')}", "{uiText('options.export.pac', locale)}")
replace_once(
    app,
    """        <VirtualProfileEditor
          spec={state.draft}
""",
    """        <VirtualProfileEditor
          {locale}
          spec={state.draft}
""",
)
replace_once(
    app,
    """    {:else}
      <section class="settings-section shell-status">
        <h1>No user profiles</h1>
        <p>
          Create a new profile from the left navigation or restore an original ZeroOmega backup.
        </p>
      </section>
""",
    """    {:else}
      <section
        class="settings-section shell-status"
        data-empty-profiles
        data-typed-locale={locale}
      >
        <h1>{uiText('options.empty.title', locale)}</h1>
        <p>{uiText('options.empty.help', locale)}</p>
      </section>
""",
)

print('Patched typed normal Options surfaces and export status.')
