from pathlib import Path
import math
import struct
import zlib


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    return text.replace(old, new, 1)


def write_png(path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            x = ((px + 0.5) / size) * 2 - 1
            y = ((py + 0.5) / size) * 2 - 1
            radius = math.hypot(x, y)
            if radius > 0.94:
                rgba = (0, 0, 0, 0)
            else:
                rgba = (111, 159, 61, 255)
                omega_radius = math.hypot(x, y + 0.08)
                arc = 0.42 <= omega_radius <= 0.62 and y < 0.35
                feet = 0.28 <= y <= 0.53 and (0.20 <= abs(x) <= 0.58)
                base = 0.44 <= y <= 0.58 and abs(x) <= 0.60
                if arc or feet or base:
                    rgba = (255, 255, 255, 255)
            row.extend(rgba)
        rows.append(bytes(row))
    raw = b''.join(rows)

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xFFFFFFFF)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    path.write_bytes(png)


for icon_size in (16, 32, 48, 128):
    write_png(Path(f'apps/extension/public/icon/{icon_size}.png'), icon_size)

# Profile creation and duplication always append downward.
path = Path('packages/profile-workflow/src/profile-operations.ts')
text = path.read_text()
start = text.index('function insertQuickSwitchRouteAfter(')
end = text.index('\nfunction duplicateFixedProfileResources(', start)
text = text[:start] + text[end + 1:]
text = replace_once(
    text,
    "  draft.profiles.splice(sourceIndex + 1, 0, duplicate);\n  insertQuickSwitchRouteAfter(draft, sourceProfileId, profileId);",
    "  draft.profiles.push(duplicate);\n  appendQuickSwitchRoute(draft, profileId);",
    'duplicate append order',
)
path.write_text(text)

path = Path('packages/profile-workflow/src/profile-operations.test.ts')
text = path.read_text()
text = replace_once(
    text,
    "    expect(result.draft.settings.quickSwitch.routes.slice(0, 2)).toEqual([\n      { kind: 'profile', profileId: 'profile-primary' },\n      { kind: 'profile', profileId: result.profileId },\n    ]);",
    "    expect(result.draft.profiles.at(-1)?.id).toBe(result.profileId);\n    expect(result.draft.settings.quickSwitch.routes.at(-1)).toEqual({\n      kind: 'profile',\n      profileId: result.profileId,\n    });",
    'duplicate order test',
)
path.write_text(text)

# A fresh workflow activates real Direct mode on its first get command.
path = Path('packages/profile-workflow/src/commands.ts')
text = path.read_text()
text = replace_once(
    text,
    "async function ensureState(\n  repository: ProfileWorkflowRepository,\n  initializer: ProfileWorkflowInitializer,\n): Promise<ProfileWorkflowState> {\n  const current = await repository.read();\n  if (current) return current;\n  const initial = createProfileWorkflowState(initializer.createInitialProfileSpec());\n  if (await repository.compareAndSwap(undefined, initial)) return initial;\n  const raced = await repository.read();\n  if (!raced) throw new Error('profile workflow initialization lost without persisted state');\n  return raced;\n}",
    "interface EnsuredProfileWorkflowState {\n  readonly state: ProfileWorkflowState;\n  readonly created: boolean;\n}\n\nasync function ensureState(\n  repository: ProfileWorkflowRepository,\n  initializer: ProfileWorkflowInitializer,\n): Promise<EnsuredProfileWorkflowState> {\n  const current = await repository.read();\n  if (current) return { state: current, created: false };\n  const initial = createProfileWorkflowState(initializer.createInitialProfileSpec());\n  if (await repository.compareAndSwap(undefined, initial)) return { state: initial, created: true };\n  const raced = await repository.read();\n  if (!raced) throw new Error('profile workflow initialization lost without persisted state');\n  return { state: raced, created: false };\n}",
    'ensure state result',
)
text = replace_once(
    text,
    "  let state: ProfileWorkflowState;\n  try {\n    state = await ensureState(repository, initializer);\n  } catch (error) {",
    "  let state: ProfileWorkflowState;\n  let created = false;\n  try {\n    const ensured = await ensureState(repository, initializer);\n    state = ensured.state;\n    created = ensured.created;\n  } catch (error) {",
    'created state capture',
)
text = replace_once(
    text,
    "  if (command.action === 'get') {\n    return response(state, undefined, await runtimeView(applyService));\n  }",
    "  if (command.action === 'get') {\n    if (created && applyService) {\n      try {\n        const activated = await applyService.driver.activate(state.applied, { kind: 'direct' });\n        return response(state, activated.snapshotId, await runtimeView(applyService));\n      } catch (error) {\n        return failure('activation-failed', errorMessage(error), state);\n      }\n    }\n    return response(state, undefined, await runtimeView(applyService));\n  }",
    'fresh Direct activation',
)
path.write_text(text)

path = Path('packages/profile-workflow/src/commands.test.ts')
text = path.read_text()
text = replace_once(
    text,
    "import { cloneProfileSpec, type ProfileSpec } from '@zeroomega-nex/profile-spec';",
    "import {\n  cloneProfileSpec,\n  type ProfileRouteTarget,\n  type ProfileSpec,\n} from '@zeroomega-nex/profile-spec';",
    'command route test import',
)
text = replace_once(
    text,
    "  readonly rolledBack: ProfileSpec[] = [];\n  activateError?: Error;\n\n  async activate(candidate: ProfileSpec): Promise<{ snapshotId: string }> {\n    this.activated.push(cloneProfileSpec(candidate));",
    "  readonly rolledBack: ProfileSpec[] = [];\n  readonly routes: ProfileRouteTarget[] = [];\n  activateError?: Error;\n\n  async activate(\n    candidate: ProfileSpec,\n    route: ProfileRouteTarget,\n  ): Promise<{ snapshotId: string }> {\n    this.activated.push(cloneProfileSpec(candidate));\n    this.routes.push(structuredClone(route));",
    'command driver route capture',
)
anchor = "  it('persists a replacement draft with optimistic generation checking', async () => {"
addition = "  it('activates Direct when a fresh workflow is first opened', async () => {\n    const repository = new MemoryProfileWorkflowRepository();\n    const initializer = new Initializer();\n    const driver = new ApplyDriver();\n    const result = await executeProfileWorkflowCommand(\n      repository,\n      initializer,\n      { channel: PROFILE_WORKFLOW_MESSAGE_CHANNEL, action: 'get' },\n      applyService(driver),\n    );\n\n    expect(result.ok).toBe(true);\n    expect(driver.routes).toEqual([{ kind: 'direct' }]);\n    expect(driver.activated).toHaveLength(1);\n  });\n\n"
text = replace_once(text, anchor, addition + anchor, 'fresh Direct command test')
path.write_text(text)

# Options uses shared theme behavior and colored type icons.
path = Path('apps/extension/src/entrypoints/options/App.svelte')
text = path.read_text()
text = replace_once(
    text,
    "  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';",
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n  import { sendProfileWorkflowCommand } from '../../lib/profile-workflow-client';\n  import {\n    applyThemeMode,\n    readThemeMode,\n    storeThemeMode,\n    type ThemeMode,\n  } from '../../lib/ui-theme';",
    'Options shared imports',
)
text = text.replace("  type ThemeMode = 'auto' | 'light' | 'dark';\n", '')
text = text.replace("  const THEME_STORAGE_KEY = 'zeroomega-nex/theme-mode';\n", '')
text = replace_once(
    text,
    "  async function updateProfileName(name: string): Promise<void> {\n    if (!selectedProfile) return;\n    const profileId = selectedProfile.id;\n    await mutateDraft((draft) => {\n      const profile = draft.profiles.find((candidate) => candidate.id === profileId);\n      if (profile) profile.name = name.trim();\n    });\n  }",
    "  async function updateProfileName(name: string): Promise<void> {\n    if (!selectedProfile) return;\n    const profileId = selectedProfile.id;\n    await mutateDraft((draft) => {\n      const profile = draft.profiles.find((candidate) => candidate.id === profileId);\n      if (profile) profile.name = name.trim();\n    });\n  }\n\n  async function updateProfileColor(color: string): Promise<void> {\n    if (!selectedProfile) return;\n    const profileId = selectedProfile.id;\n    await mutateDraft((draft) => {\n      const profile = draft.profiles.find((candidate) => candidate.id === profileId);\n      if (profile) profile.color = color;\n    });\n  }",
    'profile color updater',
)
start = text.index('  function readThemeMode(): ThemeMode {')
end = text.index('\n  async function revertDraft()', start)
text = text[:start] + "  function updateThemeMode(mode: ThemeMode): void {\n    themeMode = mode;\n    storeThemeMode(mode);\n  }\n" + text[end:]
text = replace_once(
    text,
    "            <span class=\"profile-marker\" style={`--profile-color: ${profile.color ?? '#90a4ae'}`}\n            ></span>",
    "            <ProfileIcon kind={profile.kind} color={profile.color ?? '#90a4ae'} size={22} />",
    'Options sidebar profile icon',
)
text = replace_once(
    text,
    "          <span\n            class=\"large-profile-marker\"\n            style={`background: ${selectedProfile.color ?? '#90a4ae'}`}\n          ></span>",
    "          <ProfileIcon kind={selectedProfile.kind} color={selectedProfile.color ?? '#90a4ae'} size={30} />",
    'Options heading profile icon',
)
text = replace_once(
    text,
    "      <section class=\"settings-section\">\n        <h2>Profile name</h2>\n        <input\n          aria-label=\"Profile name\"\n          value={selectedProfile.name}\n          disabled={saving || view?.busy}\n          on:change={(event) => updateProfileName(valueFrom(event))}\n        />\n      </section>",
    "      <section class=\"settings-section profile-identity-editor\">\n        <label>\n          <span>Profile name</span>\n          <input\n            aria-label=\"Profile name\"\n            value={selectedProfile.name}\n            disabled={saving || view?.busy}\n            on:change={(event) => updateProfileName(valueFrom(event))}\n          />\n        </label>\n        <label class=\"profile-color-field\">\n          <span>Profile color</span>\n          <input\n            aria-label=\"Profile color\"\n            type=\"color\"\n            value={selectedProfile.color ?? '#90a4ae'}\n            disabled={saving || view?.busy}\n            on:change={(event) => updateProfileColor(valueFrom(event))}\n          />\n        </label>\n      </section>",
    'profile identity and color editor',
)
# Built-in and new-profile cards receive visible type icons.
text = text.replace('<strong>Direct</strong><span>Connect without a proxy.</span>', '<ProfileIcon kind="direct" color={state.draft.settings.interface.builtInProfiles?.direct?.color ?? \'#99ccee\'} size={28} /><strong>Direct</strong><span>Connect without a proxy.</span>')
text = text.replace('<strong>System Proxy</strong><span>Use the browser or operating-system proxy.</span', '<ProfileIcon kind="system" color={state.draft.settings.interface.builtInProfiles?.system?.color ?? \'#ddbb88\'} size={28} /><strong>System Proxy</strong><span>Use the browser or operating-system proxy.</span')
text = text.replace('><strong>Proxy Profile</strong><span', '><ProfileIcon kind="fixed" color="#64b5f6" size={30} /><strong>Proxy Profile</strong><span')
text = text.replace('><strong>Switch Profile</strong><span', '><ProfileIcon kind="switch" color="#8bc34a" size={30} /><strong>Switch Profile</strong><span')
text = text.replace('><strong>Rule List Profile</strong><span', '><ProfileIcon kind="rule-list" color="#4db6ac" size={30} /><strong>Rule List Profile</strong><span')
text = text.replace('><strong>PAC Profile</strong><span', '><ProfileIcon kind="pac" color="#ffb74d" size={30} /><strong>PAC Profile</strong><span')
text = text.replace('><strong>Auto Detect Profile</strong><span', '><ProfileIcon kind="auto-detect" color="#90a4ae" size={30} /><strong>Auto Detect Profile</strong><span')
# Direct/System remain available and cannot be removed, though users may reorder them.
text = replace_once(
    text,
    "                  disabled={saving || view?.busy}\n                  on:click={() => removeQuickSwitchRoute(index)}>Remove</button",
    "                  disabled={saving || view?.busy || route.kind === 'direct' || route.kind === 'system'}\n                  on:click={() => removeQuickSwitchRoute(index)}>Remove</button",
    'protect built-in quick routes',
)
path.write_text(text)

path = Path('apps/extension/src/entrypoints/options/style.css')
text = path.read_text()
text = text.replace('grid-template-columns: 20px minmax(0, 1fr);', 'grid-template-columns: 24px minmax(0, 1fr);')
text = text.replace('min-height: 35px;', 'min-height: 39px;', 1)
text = text.replace('font-size: 18px;', 'font-size: 22px;', 1)
text += """

.nav-group > button > span[aria-hidden='true'] {
  font-size: 20px;
  line-height: 1;
  text-align: center;
}

.profile-identity-editor {
  display: grid;
  grid-template-columns: minmax(240px, 560px) 120px;
  gap: 18px;
  align-items: end;
}

.profile-identity-editor label {
  display: grid;
  gap: 7px;
}

.profile-color-field input[type='color'] {
  width: 70px;
  min-height: 38px;
  padding: 3px;
}

.builtin-card,
.new-profile-grid button {
  grid-template-columns: 34px minmax(0, 1fr);
}

.builtin-card > span:not(.profile-type-icon),
.new-profile-grid button > span:not(.profile-type-icon) {
  grid-column: 2;
}

@media (max-width: 760px) {
  .profile-identity-editor {
    grid-template-columns: minmax(0, 1fr);
  }
}
"""
path.write_text(text)

# Component rendering includes type icons.
path = Path('apps/extension/src/component-rendering.component.spec.ts')
text = path.read_text()
text = replace_once(
    text,
    "import PopupApp from './entrypoints/popup/App.svelte';",
    "import ProfileIcon from './components/ProfileIcon.svelte';\nimport PopupApp from './entrypoints/popup/App.svelte';",
    'ProfileIcon component import',
)
anchor = "  it('renders the Popup loading state and familiar settings footer', () => {"
addition = "  it('renders distinct colored profile type icons', () => {\n    for (const kind of ['direct', 'system', 'fixed', 'switch', 'rule-list', 'pac', 'auto-detect'] as const) {\n      const { body } = render(ProfileIcon, { props: { kind, color: '#123456', size: 24 } });\n      expect(body).toContain(`data-profile-kind=\"${kind}\"`);\n      expect(body).toContain('--profile-icon-color: #123456');\n    }\n  });\n\n"
text = replace_once(text, anchor, addition + anchor, 'ProfileIcon component test')
path.write_text(text)

# Permanent UI guard checks i18n, icons, popup theme/order, and fresh defaults.
path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
text = replace_once(
    text,
    "const optionsHtmlPath = 'apps/extension/src/entrypoints/options/index.html';",
    "const optionsHtmlPath = 'apps/extension/src/entrypoints/options/index.html';\nconst i18nPath = 'apps/extension/src/lib/i18n.ts';\nconst profileIconPath = 'apps/extension/src/components/ProfileIcon.svelte';\nconst manifestPath = 'apps/extension/wxt.config.ts';\nconst defaultsPath = 'packages/profile-workflow/src/defaults.ts';",
    'UI guard extra paths',
)
text = replace_once(
    text,
    "  optionsHtml,\n] = await Promise.all([",
    "  optionsHtml,\n  i18n,\n  profileIcon,\n  manifest,\n  defaults,\n] = await Promise.all([",
    'UI guard extra variables',
)
text = replace_once(
    text,
    "  readFile(optionsHtmlPath, 'utf8'),\n]);",
    "  readFile(optionsHtmlPath, 'utf8'),\n  readFile(i18nPath, 'utf8'),\n  readFile(profileIconPath, 'utf8'),\n  readFile(manifestPath, 'utf8'),\n  readFile(defaultsPath, 'utf8'),\n]);",
    'UI guard extra reads',
)
insert_before = "  [optionsApp.includes('class=\"sidebar\"'), 'Options must retain familiar left profile navigation.'],"
checks = """  [
    ['zh-CN', 'zh-TW', "return 'en'"].every((entry) => i18n.includes(entry)),
    'Options and Popup must auto-select Simplified Chinese, Traditional Chinese, or English fallback.',
  ],
  [
    manifest.includes("default_locale: 'en'") &&
      manifest.includes("default_icon: icons") &&
      ['16.png', '32.png', '48.png', '128.png'].every((entry) => manifest.includes(entry)),
    'The browser manifest must expose localized metadata and toolbar icons at all standard sizes.',
  ],
  [
    popupApp.includes("import ProfileIcon") &&
      popupApp.includes('normalizedRoutes') &&
      popupApp.includes('applyThemeMode(readThemeMode())'),
    'Popup must show type icons, retain built-in ordering, and share the selected theme.',
  ],
  [
    profileIcon.includes("kind === 'fixed'") && profileIcon.includes("kind === 'switch'"),
    'Profile rows must use distinct type icons instead of plain color blocks.',
  ],
  [
    defaults.includes("route: { kind: 'direct' }") &&
      defaults.indexOf("{ kind: 'direct' }") < defaults.indexOf("{ kind: 'system' }"),
    'Fresh installations must start in Direct and list Direct before System Proxy.',
  ],
"""
text = replace_once(text, insert_before, checks + insert_before, 'UI guard new requirements')
text = text.replace("popupStyle.includes('width: 300px')", "popupStyle.includes('width: 320px')")
text = text.replace('Popup width must remain deterministic across browsers.', 'Popup width must remain deterministic and provide room for larger icons.')
path.write_text(text)

# Chromium exercises Simplified Chinese, dark Popup, icon/order, and fresh Direct.
path = Path('scripts/e2e-chromium.mjs')
text = path.read_text()
text = replace_once(
    text,
    "    headless: true,\n    args:",
    "    headless: true,\n    locale: 'zh-CN',\n    args:",
    'Chromium Chinese locale',
)
text = text.replace("options.getByLabel('Profile name')", "options.getByLabel('情景模式名称')")
text = text.replace("name: 'Theme'", "name: '主题'")
text = text.replace("name: /^Automatic/u", "name: /^自动/u")
text = text.replace("name: /^Dark/u", "name: /^深色/u")
text = text.replace("name: 'Apply changes'", "name: '应用选项'")
text = text.replace("'Draft matches the currently applied revision.'", "'当前设置已全部应用。'")
text = text.replace("name: 'Snapshot History'", "name: '配置历史'")
text = text.replace("name: 'Configuration History'", "name: '配置历史'")
text = text.replace("name: 'Verified PAC snapshots'", "name: '已验证的 PAC 快照'")
text = text.replace("name: /Direct/u", "name: /直接连接/u")
text = text.replace("name: 'Import / Export'", "name: '导入 / 导出'")
text = text.replace("options.getByLabel('Legacy backup file')", "options.getByLabel('原版备份文件')")
text = text.replace("name: 'Compatibility check'", "name: '兼容性检查'")
text = text.replace("name: 'Import and use now'", "name: '导入并立即使用'")
text = text.replace("'Import completed. The original configuration is now active.'", "'导入完成，原版配置现已启用。'")
# Add popup dark/theme/order assertions immediately after dark selection.
dark_anchor = "  assert.equal(\n    await options.evaluate(() => localStorage.getItem('zeroomega-nex/theme-mode')),\n    'dark',\n  );"
dark_addition = dark_anchor + "\n  const initialPopup = await context.newPage();\n  await initialPopup.goto(`chrome-extension://${extensionId}/popup.html`);\n  await initialPopup.getByRole('button', { name: /直接连接/u }).waitFor();\n  const initialButtons = initialPopup.locator('.profile-list button');\n  assert.match(await initialButtons.nth(0).innerText(), /直接连接/u);\n  assert.match(await initialButtons.nth(1).innerText(), /系统代理/u);\n  assert.equal(await initialButtons.nth(0).isDisabled(), true);\n  assert.equal(await initialPopup.locator('html').getAttribute('data-theme'), 'dark');\n  assert.equal(await initialPopup.locator('[data-profile-kind]').count() >= 3, true);\n  await initialPopup.close();"
text = replace_once(text, dark_anchor, dark_addition, 'Chromium popup theme/order assertions')
path.write_text(text)

# Firefox uses Traditional Chinese and stable translated selectors.
path = Path('scripts/e2e-firefox.mjs')
text = path.read_text()
text = replace_once(
    text,
    "  .addArguments('-headless')\n  .enableBidi()",
    "  .addArguments('-headless')\n  .setPreference('intl.accept_languages', 'zh-TW')\n  .enableBidi()",
    'Firefox Traditional Chinese locale',
)
text = text.replace("input[aria-label=\"Profile name\"]", "input[aria-label=\"情景模式名稱\"]")
text = text.replace("'Draft matches the currently applied revision.'", "'目前設定已全部套用。'")
text = text.replace("//button[normalize-space(.)='Snapshot History']", "//button[normalize-space(.)='設定歷史']")
text = text.replace("//h1[normalize-space(.)='Configuration History']", "//h1[normalize-space(.)='設定歷史']")
text = text.replace("//button[contains(., 'Direct')]", "//button[contains(., '直接連線')]")
path.write_text(text)

# Systematic parity matrix: completed items and remaining real gaps.
Path('docs/ORIGINAL_PARITY_MATRIX.md').write_text("""# Original ZeroOmega parity matrix

This matrix is checked against the original `zero-peak/ZeroOmega` Options and Popup source. A feature is not called compatible merely because a similar control exists.

| Original user surface | ZeroOmega Nex status | Acceptance evidence / remaining work |
| --- | --- | --- |
| Browser toolbar icon and localized title | Implemented in this slice | Native `_locales` plus 16/32/48/128 PNG manifest icons |
| English default with automatic Simplified/Traditional Chinese | Implemented in this slice | `en`, `zh_CN`, `zh_TW`; all other system languages fall back to English |
| Direct and System Proxy at top of Popup | Implemented in this slice | Fresh default order is Direct, System, then user profiles; explicit user reorder remains authoritative |
| Fresh installation starts in Direct | Implemented in this slice | Initial workflow creation performs a real Direct activation transaction |
| Colored profile-type icons | Implemented in this slice | Direct, System, Fixed, Switch, Rule List, PAC, Auto Detect, and external icons |
| Popup follows Automatic/Light/Dark theme | Implemented in this slice | Shared extension-origin theme preference and system media query |
| New and duplicated profiles append downward | Implemented in this slice | Profile and Quick Switch order tests |
| Persistent Settings / Profiles / Actions Options layout | Implemented | Independent full-tab pages and profile editors |
| Original backup file import and immediate verified activation | Implemented | Schema-v2 file/text import plus normal Apply transaction |
| Built-in profile color controls | Implemented | Direct/System color inputs and colored type icons |
| Profile name and color controls | Implemented in this slice | Per-profile color input updates icon color throughout UI |
| Popup Options entry | Implemented | Bottom action opens the full Options tab |
| Built-in and custom-profile divider | Implemented in this slice | Divider appears after Direct/System |
| Result-profile dropdown for Switch/Virtual profiles | Missing | Requires a persisted default-result command and Popup dropdown behavior |
| Add condition for current website from Popup | Missing | Requires active-tab URL access and a typed rule mutation/apply transaction |
| Temporary current-site rule menu | Missing | Requires an explicit non-persistent runtime override model and cleanup semantics |
| External profile controlled by another extension | Missing | Requires browser proxy ownership inspection and a named external-state model |
| Request-error list and bounded diagnostics | Missing | Must be implemented without restoring a permanent global routing listener |
| Inspect/network traffic menu | Missing | Requires opt-in, bounded diagnostics and permission UX |
| Full original Options feature inventory | In progress | Every original menu/editor row must be marked implemented, intentionally changed, or missing before PR Ready |

## Closure rule

PR #11 remains Draft while any user-visible original feature is unclassified. Missing rows may be implemented in later slices, but cannot be described as already compatible.
""")

print('M8 localization, icon, Popup, defaults, and parity slice prepared.')
