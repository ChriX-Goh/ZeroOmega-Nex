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
    """const entries = [];
const original = await captureImplementation('original-v3.5.0', originalPath, entries);
const nex = await captureImplementation('nex', nexPath, entries);
""",
    """async function captureLocaleProbe(implementation, extensionPath, requestedLocale) {
  const manifest = await readManifest(extensionPath);
  const { optionsPath, popupPath } = extensionPages(manifest);
  const userDataDir = await mkdtemp(
    resolve(tmpdir(), `zeroomega-${implementation}-${requestedLocale}-locale-`),
  );
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      locale: requestedLocale,
      colorScheme: 'light',
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
        '--no-default-browser-check',
      ],
    });
    const extensionId = await resolveExtensionId(context);
    const baseUrl = `chrome-extension://${extensionId}`;
    const ordinaryTab = await context.newPage();
    await ordinaryTab.goto('https://example.com/', { waitUntil: 'domcontentloaded' });

    const probeSurface = async (surfacePath, viewport) => {
      const page = await context.newPage();
      try {
        await page.setViewportSize(viewport);
        await page.goto(`${baseUrl}/${surfacePath.replace(/^\\//u, '')}`);
        await stabilize(page);
        const text = await page.locator('body').innerText();
        const language = await page.evaluate(() => ({
          navigatorLanguage: navigator.language,
          navigatorLanguages: [...navigator.languages],
          documentLanguage: document.documentElement.lang,
          extensionUiLanguage:
            globalThis.chrome?.i18n?.getUILanguage?.() ??
            globalThis.browser?.i18n?.getUILanguage?.() ??
            null,
        }));
        return {
          text,
          textLines: text
            .split(/\\r?\\n/u)
            .map((line) => line.trim())
            .filter(Boolean),
          language,
        };
      } finally {
        await page.close();
      }
    };

    const popup = await probeSurface(popupPath, { width: 440, height: 760 });
    const options = await probeSurface(optionsPath, { width: 1440, height: 1000 });
    await ordinaryTab.close();
    return {
      implementation,
      requestedLocale,
      manifestDefaultLocale: manifest.default_locale ?? null,
      popup,
      options,
    };
  } finally {
    await context?.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

const entries = [];
const original = await captureImplementation('original-v3.5.0', originalPath, entries);
const nex = await captureImplementation('nex', nexPath, entries);
const localeMatrix = [];
for (const requestedLocale of ['en-US', 'zh-CN', 'zh-TW']) {
  localeMatrix.push(await captureLocaleProbe('original-v3.5.0', originalPath, requestedLocale));
  localeMatrix.push(await captureLocaleProbe('nex', nexPath, requestedLocale));
}
assert.equal(localeMatrix.length, 6, 'paired locale matrix count');
""",
)

replace_once(
    path,
    """  nex,
  entries,
  comparison: bySurface,""",
    """  nex,
  entries,
  localeMatrix,
  comparison: bySurface,""",
)
replace_once(
    path,
    """- Evidence: screenshots, rendered text, saved body DOM, normalized anchor targets, page/extension language signals and packaged locale directories\\n""",
    """- Evidence: screenshots, rendered text, saved body DOM, normalized anchor targets, page/extension language signals, packaged locale directories and an en-US/zh-CN/zh-TW default-text matrix\\n""",
)

subprocess.run(['pnpm', 'exec', 'prettier', '--write', path], check=True)
