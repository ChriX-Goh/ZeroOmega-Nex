import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


path = 'scripts/capture-original-nex-ui-evidence.mjs'
replace_once(
    path,
    """  const viewport = page.viewportSize();
  entries.push({""",
    """  const language = await page.evaluate(() => ({
    navigatorLanguage: navigator.language,
    navigatorLanguages: [...navigator.languages],
    documentLanguage: document.documentElement.lang,
    extensionUiLanguage:
      globalThis.chrome?.i18n?.getUILanguage?.() ??
      globalThis.browser?.i18n?.getUILanguage?.() ??
      null,
  }));
  const viewport = page.viewportSize();
  entries.push({""",
)
replace_once(
    path,
    """    links,
    bodyHtmlSha256: sha256(Buffer.from(html)),""",
    """    links,
    language,
    bodyHtmlSha256: sha256(Buffer.from(html)),""",
)
replace_once(
    path,
    """      browserVersion: context.browser()?.version() ?? 'unknown',
    };""",
    """      browserVersion: context.browser()?.version() ?? 'unknown',
      manifestDefaultLocale: manifest.default_locale ?? null,
    };""",
)
replace_once(
    path,
    """- Evidence: screenshots, rendered text, saved body DOM and normalized anchor targets\\n""",
    """- Evidence: screenshots, rendered text, saved body DOM, normalized anchor targets and page/extension language signals\\n""",
)

subprocess.run(['pnpm', 'exec', 'prettier', '--write', path], check=True)
