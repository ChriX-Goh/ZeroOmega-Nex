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


options_path = 'apps/extension/src/entrypoints/options/App.svelte'
options_compat_path = 'apps/extension/src/entrypoints/options/original-compat.css'
visual_path = 'scripts/capture-visual-evidence.mjs'
guard_path = 'scripts/validate-ui-compatibility.mjs'
evidence_path = 'docs/AUDIT_EVIDENCE_02H_LOCALE_BEHAVIOR_MATRIX.md'

replace_once(
    options_path,
    """        <section class=\"about-product\">
          <h2>ZeroOmega</h2>
          <p>{originalCopy.tagline}</p>
        </section>""",
    """        <section class=\"about-product\">
          <img src=\"/icon/original-action-32.png\" alt=\"\" class=\"about-mark\" />
          <div>
            <h2>ZeroOmega</h2>
            <p>{originalCopy.tagline}</p>
          </div>
        </section>""",
)

replace_once(
    options_compat_path,
    """.about-product {
  display: block;
  margin: 22px 0;
}""",
    """.about-product {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 22px 0;
}

.about-mark {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
}""",
)

replace_once(
    visual_path,
    """const expectedHeadings = {
  'zh-CN': { general: '通用' },
  'zh-TW': { general: '一般' },
};""",
    """const renderedLocale = 'en';
const expectedGeneralHeading = 'General';""",
)
replace_exact_count(
    visual_path,
    "await waitForStablePage(options, '[data-general-settings]', locale, theme);",
    "await waitForStablePage(options, '[data-general-settings]', renderedLocale, theme);",
    1,
)
replace_once(
    visual_path,
    """    await options
      .getByRole('heading', { name: expectedHeadings[locale].general, level: 1, exact: true })
      .waitFor();""",
    """    await options
      .getByRole('heading', { name: expectedGeneralHeading, level: 1, exact: true })
      .waitFor();""",
)
replace_exact_count(
    visual_path,
    "await waitForStablePage(options, '[data-fixed-proxy-table]', locale, theme);",
    "await waitForStablePage(options, '[data-fixed-proxy-table]', renderedLocale, theme);",
    1,
)
replace_exact_count(
    visual_path,
    "await waitForStablePage(options, '[data-legacy-import-panel]', locale, theme);",
    "await waitForStablePage(options, '[data-legacy-import-panel]', renderedLocale, theme);",
    1,
)
replace_exact_count(
    visual_path,
    "await waitForStablePage(popup, '.popup-shell', locale, theme);",
    "await waitForStablePage(popup, '.popup-shell', renderedLocale, theme);",
    1,
)
replace_exact_count(
    visual_path,
    "await waitForStablePage(temporaryRules, '[data-temp-rules-manager]', locale, theme);",
    "await waitForStablePage(temporaryRules, '[data-temp-rules-manager]', renderedLocale, theme);",
    1,
)
replace_exact_count(
    visual_path,
    "await waitForStablePage(network, '[data-network-diagnostics]', locale, theme);",
    "await waitForStablePage(network, '[data-network-diagnostics]', renderedLocale, theme);",
    1,
)
replace_exact_count(
    visual_path,
    "{ locale, theme, surface:",
    "{ locale, renderedLocale, theme, surface:",
    6,
)
replace_once(
    visual_path,
    "- Matrix: light/dark × zh-CN/zh-TW × six representative surfaces",
    "- Matrix: light/dark × requested browser locale zh-CN/zh-TW × original-compatible rendered locale en × six representative surfaces",
)
replace_once(
    visual_path,
    "| Locale | Theme | Surface | Dimensions | SHA-256 | File |",
    "| Requested locale | Theme | Surface | Dimensions | SHA-256 | File |",
)

replace_once(
    guard_path,
    """      optionsApp.includes('<span>Zero Omega</span>') &&
      !optionsApp.includes('class=\"about-mark\"'),""",
    """      optionsApp.includes('<span>Zero Omega</span>') &&
      optionsApp.includes(
        '<img src=\"/icon/original-action-32.png\" alt=\"\" class=\"about-mark\" />',
      ),""",
)
replace_once(
    guard_path,
    "'Production Popup and Options must default to original English while the existing Browser E2E build marker preserves Simplified and Traditional Chinese localization coverage.',",
    "'Production Popup and Options must default to original English, retain the original 32px About product icon, and preserve explicit Simplified and Traditional Chinese Browser E2E coverage.',",
)

replace_once(
    evidence_path,
    '- original About has no added Omega emblem before the product text.',
    '- original About uses the packaged 32×32 blue Omega action icon before the product text.',
)
replace_once(
    evidence_path,
    '- removes the Nex-only Omega emblem from the About product block;',
    '- restores the packaged 32×32 blue Omega action icon in the About product block;',
)
replace_once(
    evidence_path,
    'absence of the About emblem.',
    'presence of the original About product icon.',
)
replace_once(
    evidence_path,
    "The UI compatibility guard requires the English production default, explicit E2E localization boundary, bracketed built-ins, original sidebar spelling and presence of the original About product icon.",
    "The UI compatibility guard requires the English production default, explicit E2E localization boundary, bracketed built-ins, original sidebar spelling and the packaged 32×32 About product icon.",
)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        options_path,
        options_compat_path,
        visual_path,
        guard_path,
        evidence_path,
    ],
    check=True,
)
