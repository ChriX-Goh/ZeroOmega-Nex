from pathlib import Path

Path('scripts/capture-visual-evidence.mjs').write_text(r'''import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';

import { chromium } from '@playwright/test';

const extensionPath = resolve('dist/chrome-mv3');
const outputRoot = resolve(process.env.ZEROOMEGA_VISUAL_OUTPUT ?? 'artifacts/m8-visual-evidence');
const sourceHead =
  process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const combinations = [
  { locale: 'zh-CN', theme: 'light' },
  { locale: 'zh-CN', theme: 'dark' },
  { locale: 'zh-TW', theme: 'light' },
  { locale: 'zh-TW', theme: 'dark' },
];
const surfaces = ['options-general', 'fixed-profile', 'import-export', 'popup', 'temporary-rules', 'network'];
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
      const typed = document.querySelector('[data-typed-locale], [data-popup-locale], [data-options-shell-locale]');
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
    await options.getByRole('heading', { name: expectedHeadings[locale].general, level: 1, exact: true }).waitFor();
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
    await temporaryRules.locator('[data-temp-rules-manager][aria-busy="false"]').waitFor({ timeout: 20_000 });
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
    await network.locator('[data-network-diagnostics][aria-busy="false"]').waitFor({ timeout: 20_000 });
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
          entry.locale === combination.locale && entry.theme === combination.theme && entry.surface === surface,
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
await writeFile(resolve(outputRoot, 'manifest.sha256'), `${sha256(Buffer.from(manifestText))}  manifest.json\n`);
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
''')

Path('.github/workflows/m8-visual-evidence.yml').write_text(r'''name: Milestone 8 Visual Evidence

on:
  pull_request:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read

jobs:
  capture:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24

      - name: Activate pnpm
        run: |
          corepack enable
          corepack prepare pnpm@11.4.0 --activate

      - name: Install locked dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright Chromium
        run: pnpm exec playwright install --with-deps chromium

      - name: Build Chromium extension
        run: pnpm build:chromium

      - name: Capture visual evidence
        shell: bash
        run: |
          set -o pipefail
          pnpm evidence:visual 2>&1 | tee m8-visual-evidence.log

      - name: Upload visual evidence
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: m8-visual-evidence-${{ github.sha }}
          path: |
            artifacts/m8-visual-evidence
            m8-visual-evidence.log
          if-no-files-found: error
          retention-days: 30
''')

package = Path('package.json')
text = package.read_text()
old = '    "test:e2e:firefox": "node scripts/e2e-firefox.mjs",\n'
new = old + '    "evidence:visual": "node scripts/capture-visual-evidence.mjs",\n'
if text.count(old) != 1:
    raise SystemExit(f'package script anchor mismatch: {text.count(old)}')
package.write_text(text.replace(old, new))

# Document the reproducible matrix and preserve owner acceptance as a distinct gate.
graph = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
text = graph.read_text() + '''\n### Consolidated visual evidence matrix\n\n- Visual acceptance is a reproducible artifact, not a collection of ad-hoc screenshots. One exact Chromium Head captures `zh-CN/light`, `zh-CN/dark`, `zh-TW/light`, and `zh-TW/dark` in isolated browser profiles.\n- Each combination covers six representative surfaces: Options General/shell, Fixed Profile editor, Import/Export, Popup, Temporary Rules, and Network diagnostics. The matrix therefore contains exactly 24 PNG files.\n- `scripts/capture-visual-evidence.mjs` requires the typed locale marker and explicit `data-theme` before capture, disables animation/caret noise, records image dimensions and SHA-256, and writes `manifest.json`, `manifest.sha256`, and a human-readable table.\n- `.github/workflows/m8-visual-evidence.yml` builds the exact Chromium extension and uploads the complete artifact. Automated capture proves reproducibility and coverage; repository-owner visual acceptance remains a separate release gate.\n'''
graph.write_text(text)

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
anchor = '## Automated acceptance state\n'
section = '''### Reproducible consolidated visual-evidence workflow\n\n- The permanent `Milestone 8 Visual Evidence` workflow builds the exact Chromium Head and captures isolated light/dark × zh-CN/zh-TW sessions.\n- Six surfaces per combination produce exactly 24 PNGs: Options General, Fixed Profile, Import/Export, Popup, Temporary Rules, and Network. Every capture requires the expected typed-locale marker and explicit theme before writing.\n- The artifact includes a machine-readable manifest with exact Head, Chromium version, locale, theme, surface, URL, dimensions, byte size, and per-image SHA-256, plus `manifest.sha256` and a readable index.\n- A green workflow establishes reproducible coverage only; repository-owner visual review remains required before a consolidated candidate can be accepted.\n\n'''
if text.count(anchor) != 1:
    raise SystemExit('M8 visual section anchor mismatch')
status.write_text(text.replace(anchor, section + anchor))

# Permanent parity guard for the workflow, script, matrix, and owner boundary.
validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
text = text.replace(
    "const manifestConfigPath = 'apps/extension/wxt.config.ts';",
    "const manifestConfigPath = 'apps/extension/wxt.config.ts';\nconst visualEvidenceScriptPath = 'scripts/capture-visual-evidence.mjs';\nconst visualEvidenceWorkflowPath = '.github/workflows/m8-visual-evidence.yml';",
)
text = text.replace(
    '  manifestConfig,\n] = await Promise.all([',
    '  manifestConfig,\n  visualEvidenceScript,\n  visualEvidenceWorkflow,\n] = await Promise.all([',
)
text = text.replace(
    "  readFile(manifestConfigPath, 'utf8'),\n]);",
    "  readFile(manifestConfigPath, 'utf8'),\n  readFile(visualEvidenceScriptPath, 'utf8'),\n  readFile(visualEvidenceWorkflowPath, 'utf8'),\n]);",
)
insert = "requireAll('file PAC decision', decisions, [\n"
extra = """requireAll('visual evidence script', visualEvidenceScript, [
  "{ locale: 'zh-CN', theme: 'light' }",
  "{ locale: 'zh-CN', theme: 'dark' }",
  "{ locale: 'zh-TW', theme: 'light' }",
  "{ locale: 'zh-TW', theme: 'dark' }",
  "'options-general'",
  "'fixed-profile'",
  "'import-export'",
  "'popup'",
  "'temporary-rules'",
  "'network'",
  "manifest.sha256",
  "entries.length, combinations.length * surfaces.length",
]);

requireAll('visual evidence workflow', visualEvidenceWorkflow, [
  'Milestone 8 Visual Evidence',
  'pnpm evidence:visual',
  'm8-visual-evidence-${{ github.sha }}',
  'retention-days: 30',
]);

"""
if text.count(insert) != 1:
    raise SystemExit('visual validator insertion anchor mismatch')
validator.write_text(text.replace(insert, extra + insert))
