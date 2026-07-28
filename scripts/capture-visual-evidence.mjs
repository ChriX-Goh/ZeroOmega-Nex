import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const outputRoot = resolve(process.env.ZEROOMEGA_VISUAL_OUTPUT ?? 'artifacts/m8-visual-evidence');
const sourceHead =
  process.env.ZEROOMEGA_SOURCE_HEAD ??
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const combinations = [
  { locale: 'zh-CN', theme: 'light' },
  { locale: 'zh-CN', theme: 'dark' },
  { locale: 'zh-TW', theme: 'light' },
  { locale: 'zh-TW', theme: 'dark' },
];
const surfaces = [
  'options-general',
  'fixed-profile',
  'import-export',
  'popup',
  'temporary-rules',
  'network',
];
const expectedHeadings = {
  'zh-CN': { general: '通用' },
  'zh-TW': { general: '一般' },
};

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG', 'visual evidence must be PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function waitForStablePage(page, marker, locale, theme) {
  await page.locator(marker).waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForFunction(
    ({ expectedLocale, expectedTheme }) => {
      const root = document.documentElement;
      const typed = document.querySelector(
        '[data-typed-locale], [data-popup-locale], [data-options-shell-locale]',
      );
      const renderedLocale =
        typed?.getAttribute('data-typed-locale') ??
        typed?.getAttribute('data-popup-locale') ??
        typed?.getAttribute('data-options-shell-locale');
      return root.dataset.theme === expectedTheme && renderedLocale === expectedLocale;
    },
    { expectedLocale: locale, expectedTheme: theme },
    { timeout: 20_000 },
  );
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  });
  await page.evaluate(async () => {
    if ('fonts' in document) await document.fonts.ready;
  });
}

async function capture(page, path, metadata, entries) {
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  const bytes = await readFile(path);
  const dimensions = pngDimensions(bytes);
  entries.push({
    ...metadata,
    file: relative(outputRoot, path).replaceAll('\\', '/'),
    ...dimensions,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  });
}

const entries = [];
let browserVersion = '';

for (const combination of combinations) {
  const { locale, theme } = combination;
  const userDataDir = await mkdtemp(resolve(tmpdir(), `zeroomega-nex-visual-${locale}-${theme}-`));
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      locale,
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    browserVersion ||= context.browser()?.version() ?? 'unknown';
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker', { timeout: 20_000 });
    const extensionId = new URL(worker.url()).host;
    assert.match(extensionId, /^[a-p]{32}$/u, 'Chromium extension ID was not resolved');
    const baseUrl = `chrome-extension://${extensionId}`;
    const combinationDir = resolve(outputRoot, `${locale}-${theme}`);
    await mkdir(combinationDir, { recursive: true });

    const options = await context.newPage();
    await options.goto(`${baseUrl}/options.html#/general`);
    await options.waitForLoadState('domcontentloaded');
    await options.evaluate((selectedTheme) => {
      localStorage.setItem('zeroomega-nex/theme-mode', selectedTheme);
    }, theme);
    await options.reload();
    await waitForStablePage(options, '[data-general-settings]', locale, theme);
    await options
      .getByRole('heading', { name: expectedHeadings[locale].general, level: 1, exact: true })
      .waitFor();
    await capture(
      options,
      resolve(combinationDir, 'options-general.png'),
      { locale, theme, surface: 'options-general', url: 'options.html#/general' },
      entries,
    );

    await options.goto(`${baseUrl}/options.html`);
    await options.waitForLoadState('domcontentloaded');
    await options.getByRole('button', { name: 'Proxy', exact: true }).click();
    await waitForStablePage(options, '[data-fixed-proxy-table]', locale, theme);
    await capture(
      options,
      resolve(combinationDir, 'fixed-profile.png'),
      { locale, theme, surface: 'fixed-profile', url: 'options.html' },
      entries,
    );

    await options.goto(`${baseUrl}/options.html#/import`);
    await options.waitForLoadState('domcontentloaded');
    await waitForStablePage(options, '[data-legacy-import-panel]', locale, theme);
    await capture(
      options,
      resolve(combinationDir, 'import-export.png'),
      { locale, theme, surface: 'import-export', url: 'options.html#/import' },
      entries,
    );

    const popup = await context.newPage();
    await popup.setViewportSize({ width: 440, height: 760 });
    await popup.goto(`${baseUrl}/popup.html`);
    await popup.waitForLoadState('domcontentloaded');
    await waitForStablePage(popup, '.popup-shell', locale, theme);
    await capture(
      popup,
      resolve(combinationDir, 'popup.png'),
      { locale, theme, surface: 'popup', url: 'popup.html' },
      entries,
    );
    await popup.close();

    const temporaryRules = await context.newPage();
    await temporaryRules.setViewportSize({ width: 1100, height: 760 });
    await temporaryRules.goto(`${baseUrl}/temp-rules.html`);
    await temporaryRules.waitForLoadState('domcontentloaded');
    await waitForStablePage(temporaryRules, '[data-temp-rules-manager]', locale, theme);
    await temporaryRules
      .locator('[data-temp-rules-manager][aria-busy="false"]')
      .waitFor({ timeout: 20_000 });
    await capture(
      temporaryRules,
      resolve(combinationDir, 'temporary-rules.png'),
      { locale, theme, surface: 'temporary-rules', url: 'temp-rules.html' },
      entries,
    );
    await temporaryRules.close();

    const network = await context.newPage();
    await network.setViewportSize({ width: 1100, height: 760 });
    await network.goto(`${baseUrl}/network.html`);
    await network.waitForLoadState('domcontentloaded');
    await waitForStablePage(network, '[data-network-diagnostics]', locale, theme);
    await network
      .locator('[data-network-diagnostics][aria-busy="false"]')
      .waitFor({ timeout: 20_000 });
    await capture(
      network,
      resolve(combinationDir, 'network.png'),
      { locale, theme, surface: 'network', url: 'network.html' },
      entries,
    );
    await network.close();
    await options.close();
  } finally {
    await context?.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

assert.equal(entries.length, combinations.length * surfaces.length, 'visual evidence image count');
for (const combination of combinations) {
  for (const surface of surfaces) {
    assert.equal(
      entries.filter(
        (entry) =>
          entry.locale === combination.locale &&
          entry.theme === combination.theme &&
          entry.surface === surface,
      ).length,
      1,
      `missing visual evidence for ${combination.locale}/${combination.theme}/${surface}`,
    );
  }
}

entries.sort((left, right) => left.file.localeCompare(right.file));
const manifest = {
  schemaVersion: 1,
  sourceHead,
  browser: { engine: 'Chromium', version: browserVersion },
  matrix: combinations,
  surfaces,
  imageCount: entries.length,
  entries,
};
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(resolve(outputRoot, 'manifest.json'), manifestText);
await writeFile(
  resolve(outputRoot, 'manifest.sha256'),
  `${sha256(Buffer.from(manifestText))}  manifest.json\n`,
);
const rows = entries
  .map(
    (entry) =>
      `| ${entry.locale} | ${entry.theme} | ${entry.surface} | ${entry.width}×${entry.height} | \`${entry.sha256}\` | \`${entry.file}\` |`,
  )
  .join('\n');
await writeFile(
  resolve(outputRoot, 'README.md'),
  `# Milestone 8 visual evidence\n\n- Exact Head: \`${sourceHead}\`\n- Chromium: \`${browserVersion}\`\n- Images: ${entries.length}\n- Matrix: light/dark × zh-CN/zh-TW × six representative surfaces\n\n| Locale | Theme | Surface | Dimensions | SHA-256 | File |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n`,
);
console.log(`Visual evidence passed: ${entries.length} PNG files for exact Head ${sourceHead}.`);
