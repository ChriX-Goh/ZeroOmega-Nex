import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readFile as readTextFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';

import { chromium } from '@playwright/test';

const originalPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_CHROMIUM_PATH ?? 'original-release/chromium',
);
const nexPath = resolve(process.env.ZEROOMEGA_NEX_CHROMIUM_PATH ?? 'dist/chrome-mv3');
const outputRoot = resolve(
  process.env.ZEROOMEGA_UI_COMPARISON_OUTPUT ?? 'artifacts/original-nex-ui-evidence',
);
const sourceHead = process.env.ZEROOMEGA_SOURCE_HEAD ?? 'unknown';
const locale = process.env.ZEROOMEGA_UI_EVIDENCE_LOCALE ?? 'zh-CN';

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG', 'evidence image must be PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function readManifest(extensionPath) {
  const source = await readTextFile(resolve(extensionPath, 'manifest.json'), 'utf8');
  return JSON.parse(source);
}

function extensionPages(manifest) {
  const optionsPath = manifest.options_ui?.page ?? manifest.options_page;
  const popupPath = manifest.action?.default_popup ?? manifest.browser_action?.default_popup;
  assert.equal(typeof optionsPath, 'string', 'extension options page was not declared');
  assert.equal(typeof popupPath, 'string', 'extension popup page was not declared');
  return { optionsPath, popupPath };
}

async function resolveExtensionId(context) {
  let [worker] = context.serviceWorkers();
  if (!worker) {
    try {
      worker = await context.waitForEvent('serviceworker', { timeout: 20_000 });
    } catch {
      const [backgroundPage] = context.backgroundPages();
      if (backgroundPage) return new URL(backgroundPage.url()).host;
      throw new Error('extension runtime page was not resolved');
    }
  }
  return new URL(worker.url()).host;
}

async function stabilize(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  });
  await page.waitForFunction(() => document.body?.innerText.trim().length > 0, undefined, {
    timeout: 20_000,
  });
  let previous = '';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = await page.locator('body').innerText();
    if (current === previous) return;
    previous = current;
    await page.waitForTimeout(150);
  }
}

async function captureSurface(page, implementation, surface, url, outputDir, entries) {
  await stabilize(page);
  const screenshotPath = resolve(outputDir, `${surface}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
  const bytes = await readFile(screenshotPath);
  const text = await page.locator('body').innerText();
  const html = await page.locator('body').evaluate((body) => body.outerHTML);
  const htmlPath = resolve(outputDir, `${surface}.html`);
  await writeFile(
    htmlPath,
    `${html}
`,
  );
  const links = await page.locator('a').evaluateAll((anchors) =>
    anchors.map((anchor) => ({
      text: anchor.textContent?.trim() ?? '',
      href: anchor.href,
      target: anchor.target,
      rel: anchor.rel,
    })),
  );
  const viewport = page.viewportSize();
  entries.push({
    implementation,
    surface,
    url,
    screenshot: relative(outputRoot, screenshotPath).replaceAll('\\', '/'),
    screenshotSha256: sha256(bytes),
    ...pngDimensions(bytes),
    viewport,
    text,
    textLines: text
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean),
    html: relative(outputRoot, htmlPath).replaceAll('\\', '/'),
    bodyHtmlSha256: sha256(Buffer.from(html)),
    links,
  });
}

async function captureImplementation(implementation, extensionPath, entries) {
  const manifest = await readManifest(extensionPath);
  const { optionsPath, popupPath } = extensionPages(manifest);
  const userDataDir = await mkdtemp(resolve(tmpdir(), `zeroomega-${implementation}-ui-`));
  const outputDir = resolve(outputRoot, implementation);
  await mkdir(outputDir, { recursive: true });
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      headless: true,
      locale,
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
    assert.match(extensionId, /^[a-p]{32}$/u, `${implementation} extension ID was not resolved`);
    const baseUrl = `chrome-extension://${extensionId}`;

    const ordinaryTab = await context.newPage();
    await ordinaryTab.goto('https://example.com/', { waitUntil: 'domcontentloaded' });

    const popup = await context.newPage();
    await popup.setViewportSize({ width: 440, height: 760 });
    await popup.goto(`${baseUrl}/${popupPath.replace(/^\//u, '')}`);
    await captureSurface(popup, implementation, 'popup-default', popupPath, outputDir, entries);
    await popup.close();

    const options = await context.newPage();
    await options.setViewportSize({ width: 1440, height: 1000 });
    await options.goto(`${baseUrl}/${optionsPath.replace(/^\//u, '')}`);
    await captureSurface(
      options,
      implementation,
      'options-default',
      optionsPath,
      outputDir,
      entries,
    );
    await options.close();
    await ordinaryTab.close();

    return {
      manifestVersion: manifest.manifest_version,
      extensionVersion: manifest.version,
      optionsPath,
      popupPath,
      browserVersion: context.browser()?.version() ?? 'unknown',
    };
  } finally {
    await context?.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

const entries = [];
const original = await captureImplementation('original-v3.5.0', originalPath, entries);
const nex = await captureImplementation('nex', nexPath, entries);

assert.equal(entries.length, 4, 'paired UI evidence count');
for (const implementation of ['original-v3.5.0', 'nex']) {
  for (const surface of ['popup-default', 'options-default']) {
    assert.equal(
      entries.filter(
        (entry) => entry.implementation === implementation && entry.surface === surface,
      ).length,
      1,
      `missing ${implementation}/${surface} evidence`,
    );
  }
}

const bySurface = Object.fromEntries(
  ['popup-default', 'options-default'].map((surface) => {
    const originalEntry = entries.find(
      (entry) => entry.implementation === 'original-v3.5.0' && entry.surface === surface,
    );
    const nexEntry = entries.find(
      (entry) => entry.implementation === 'nex' && entry.surface === surface,
    );
    return [
      surface,
      {
        originalTextLines: originalEntry.textLines,
        nexTextLines: nexEntry.textLines,
        extraInNex: nexEntry.textLines.filter((line) => !originalEntry.textLines.includes(line)),
        missingInNex: originalEntry.textLines.filter((line) => !nexEntry.textLines.includes(line)),
      },
    ];
  }),
);

entries.sort((left, right) =>
  `${left.surface}/${left.implementation}`.localeCompare(
    `${right.surface}/${right.implementation}`,
  ),
);
const manifest = {
  schemaVersion: 1,
  sourceHead,
  locale,
  original,
  nex,
  entries,
  comparison: bySurface,
};
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(resolve(outputRoot, 'manifest.json'), manifestText);
await writeFile(
  resolve(outputRoot, 'manifest.sha256'),
  `${sha256(Buffer.from(manifestText))}  manifest.json\n`,
);
await writeFile(
  resolve(outputRoot, 'README.md'),
  `# Original ↔ Nex UI evidence\n\n- Exact Nex Head: \`${sourceHead}\`\n- Original: official ZeroOmega v3.5.0 Chromium package\n- Locale: \`${locale}\`\n- Surfaces: default Popup and default Options page\n- Evidence: screenshots, rendered text, saved body DOM and normalized anchor targets\n\nThis artifact is the product-facing comparison authority for removing Nex-only UI, extra descriptions and altered information hierarchy. Green Nex-only screenshots do not establish parity.\n`,
);

console.log(`Original ↔ Nex UI evidence captured for exact Head ${sourceHead}.`);
