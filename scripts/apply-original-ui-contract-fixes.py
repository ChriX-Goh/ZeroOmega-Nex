import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


def replace_exact_count(path: str, old: str, new: str, expected: int) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    target.write_text(source.replace(old, new))


i18n_path = 'apps/extension/src/lib/i18n.ts'
i18n_test_path = 'apps/extension/src/lib/i18n.test.ts'
popup_path = 'apps/extension/src/entrypoints/popup/App.svelte'
options_path = 'apps/extension/src/entrypoints/options/App.svelte'
options_compat_path = 'apps/extension/src/entrypoints/options/original-compat.css'
ui_messages_path = 'apps/extension/src/lib/ui-messages.ts'
chromium_e2e_path = 'scripts/e2e-chromium.mjs'
ui_guard_path = 'scripts/validate-ui-compatibility.mjs'

replace_once(
    i18n_path,
    """export function currentAppLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'en';
  const languages = [
    ...(navigator.languages ?? []),
    navigator.language,
    typeof Intl === 'undefined' ? '' : Intl.DateTimeFormat().resolvedOptions().locale,
  ].filter(Boolean);
  return resolveAppLocale(languages);
}""",
    """export function currentAppLocale(): AppLocale {
  if (import.meta.env.WXT_ICON_RENDERER_E2E === '1') {
    if (typeof navigator !== 'undefined' && /Firefox/u.test(navigator.userAgent)) return 'zh-TW';
    return 'zh-CN';
  }
  return 'en';
}""",
)
replace_once(
    i18n_test_path,
    "import { resolveAppLocale, translate } from './i18n';",
    "import { currentAppLocale, resolveAppLocale, translate } from './i18n';",
)
replace_once(
    i18n_test_path,
    """  it('falls back to English for untranslated or unsupported content', () => {
    expect(translate('Untranslated diagnostic', 'zh-CN')).toBe('Untranslated diagnostic');
    expect(translate('Options', 'en')).toBe('Options');
  });""",
    """  it('uses the original English default outside an explicit browser E2E build', () => {
    expect(currentAppLocale()).toBe('en');
  });

  it('falls back to English for untranslated or unsupported content', () => {
    expect(translate('Untranslated diagnostic', 'zh-CN')).toBe('Untranslated diagnostic');
    expect(translate('Options', 'en')).toBe('Options');
  });""",
)

replace_once(
    popup_path,
    "name: uiText('route.direct', locale),",
    "name: `[${uiText('route.direct', locale)}]`,",
)
replace_once(
    popup_path,
    "name: uiText('route.system', locale),",
    "name: `[${uiText('route.system', locale)}]`,",
)

replace_once(
    options_path,
    '<span>ZeroOmega</span>',
    '<span>Zero Omega</span>',
)
replace_once(
    options_path,
    """        <section class="about-product">
          <div class="about-mark" aria-hidden="true">Ω</div>
          <div>
            <h2>ZeroOmega</h2>
            <p>{originalCopy.tagline}</p>
          </div>
        </section>""",
    """        <section class="about-product">
          <h2>ZeroOmega</h2>
          <p>{originalCopy.tagline}</p>
        </section>""",
)

replace_once(
    options_compat_path,
    """.about-product {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 22px 0;
}

.about-mark {
  color: #29abe2;
  font-size: 50px;
  line-height: 1;
}""",
    """.about-product {
  display: block;
  margin: 22px 0;
}""",
)

replace_once(
    ui_messages_path,
    "'options.nav.builtIn': {\n    en: 'Built-in Profiles',",
    "'options.nav.builtIn': {\n    en: 'Builtin',",
)
replace_once(
    ui_messages_path,
    "'legacy.pageTitle': { en: 'Import / Export',",
    "'legacy.pageTitle': { en: 'Import/Export',",
)

replace_exact_count(
    chromium_e2e_path,
    "getByRole('button', { name: '直接连接', exact: true })",
    "getByRole('button', { name: '[直接连接]', exact: true })",
    2,
)

replace_once(
    ui_guard_path,
    "const onlineBackupDownloaderPath = 'apps/extension/src/lib/online-backup-downloader.ts';",
    "const onlineBackupDownloaderPath = 'apps/extension/src/lib/online-backup-downloader.ts';\nconst i18nTestPath = 'apps/extension/src/lib/i18n.test.ts';",
)
replace_once(
    ui_guard_path,
    "const onlineBackupDownloader = await readFile(onlineBackupDownloaderPath, 'utf8');",
    "const onlineBackupDownloader = await readFile(onlineBackupDownloaderPath, 'utf8');\nconst i18nTest = await readFile(i18nTestPath, 'utf8');",
)
replace_once(
    ui_guard_path,
    """  [
    optionsApp.includes('<OriginalAboutIcon kind="comment" />') &&""",
    """  [
    i18n.includes("import.meta.env.WXT_ICON_RENDERER_E2E === '1'") &&
      i18n.includes("/Firefox/u.test(navigator.userAgent)") &&
      i18n.includes("return 'en';") &&
      browserE2eWorkflow.includes(
        'WXT_ICON_RENDERER_E2E=1 ZEROOMEGA_RULE_SOURCE_E2E=1 pnpm build:chromium',
      ) &&
      browserE2eWorkflow.includes("WXT_ICON_RENDERER_E2E: '1'") &&
      i18nTest.includes("expect(currentAppLocale()).toBe('en')") &&
      chromiumE2e.includes("name: '[直接连接]', exact: true") &&
      popupApp.includes("name: `[${uiText('route.direct', locale)}]`") &&
      popupApp.includes("name: `[${uiText('route.system', locale)}]`") &&
      optionsApp.includes('<span>Zero Omega</span>') &&
      !optionsApp.includes('class="about-mark"'),
    'Production Popup and Options must default to original English while the existing Browser E2E build marker preserves Simplified and Traditional Chinese localization coverage.',
  ],
  [
    optionsApp.includes('<OriginalAboutIcon kind="comment" />') &&""",
)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        i18n_path,
        i18n_test_path,
        popup_path,
        options_path,
        options_compat_path,
        ui_messages_path,
        chromium_e2e_path,
        ui_guard_path,
    ],
    check=True,
)
subprocess.run(['pnpm', 'locale:inventory'], check=True)
