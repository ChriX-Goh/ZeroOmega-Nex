import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
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

async function availableLocales(extensionPath) {
  const entries = await readdir(resolve(extensionPath, '_locales'), { withFileTypes: true }).catch(
    () => [],
  );
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function extensionPages(manifest) {
  const optionsPath = manifest.options_ui?.page ?? manifest.options_page;
  const popupPath = manifest.action?.default_popup ?? manifest.browser_action?.default_popup;
  assert.equal(typeof optionsPath, 'string', 'extension options page was not declared');
  assert.equal(typeof popupPath, 'string', 'extension popup page was not declared');
  return { optionsPath, popupPath };
}

function layoutMetricSelectors(implementation, surface) {
  const original = implementation === 'original-v3.5.0';
  if (surface === 'options-default') {
    return original
      ? {
          shell: '.container-fluid',
          sidebar: 'header.side-nav',
          brand: 'header.side-nav > h1',
          navHeading: 'header.side-nav .nav-header',
          navItem: 'header.side-nav nav > li > a',
          navDivider: 'header.side-nav .divider',
          content: 'main',
          title: '.page-header h2',
          product: '.media',
          productIcon: '.media-left img',
          action: 'main section .btn',
          notice: 'main p.text-warning, main p.text-success, main p.text-info',
          license: 'main section:last-of-type',
        }
      : {
          shell: '.app-shell',
          sidebar: '.sidebar',
          brand: '.side-brand button',
          navHeading: '.nav-group h2',
          navItem: '.nav-group > button',
          navDivider: '.nav-group',
          content: '.editor',
          title: '.editor-heading h1',
          product: '.about-product',
          productIcon: '.about-mark',
          action: '.about-actions > *',
          notice: '.about-notices p',
          license: '.about-license',
        };
  }
  return original
    ? {
        shell: '.om-nav',
        content: '.om-nav',
        profileRow: '.om-nav-item',
        profileAction: '.om-nav-item > a',
        profileIcon: '.om-nav-item > a > .glyphicon:first-child',
        profileName: '.om-profile-name',
        divider: '.om-divider',
        active: '.om-nav-item.om-active',
        options: '#js-option',
      }
    : {
        shell: '.popup-shell',
        content: '.profile-list',
        profileRow: '.profile-row',
        profileAction: '.profile-row > button',
        profileIcon: '.profile-row .profile-type-icon',
        profileName: '.profile-name',
        divider: '.profile-divider',
        active: '.profile-row > button.active',
        options: '.settings-button',
      };
}

async function captureLayoutMetrics(page, implementation, surface) {
  const metrics = {};
  for (const [role, selector] of Object.entries(layoutMetricSelectors(implementation, surface))) {
    metrics[role] = await page.locator(selector).evaluateAll((elements) =>
      elements.slice(0, 16).map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: element.getAttribute('class') ?? '',
          text: (element.textContent ?? '').replace(/\s+/gu, ' ').trim().slice(0, 160),
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
          },
          style: {
            display: style.display,
            position: style.position,
            boxSizing: style.boxSizing,
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            textTransform: style.textTransform,
            opacity: style.opacity,
            paddingTop: style.paddingTop,
            paddingRight: style.paddingRight,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            marginTop: style.marginTop,
            marginRight: style.marginRight,
            marginBottom: style.marginBottom,
            marginLeft: style.marginLeft,
            borderTop: style.borderTop,
            borderRight: style.borderRight,
            borderBottom: style.borderBottom,
            borderLeft: style.borderLeft,
            borderRadius: style.borderRadius,
            boxShadow: style.boxShadow,
            gap: style.gap,
            rowGap: style.rowGap,
            columnGap: style.columnGap,
            alignItems: style.alignItems,
            justifyContent: style.justifyContent,
            flex: style.flex,
            gridTemplateColumns: style.gridTemplateColumns,
            overflowX: style.overflowX,
            overflowY: style.overflowY,
          },
        };
      }),
    );
  }
  assert.equal(metrics.shell.length, 1, `${implementation}/${surface} shell metric`);
  assert.equal(metrics.content.length >= 1, true, `${implementation}/${surface} content metric`);
  return metrics;
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
  const language = await page.evaluate(() => ({
    navigatorLanguage: navigator.language,
    navigatorLanguages: [...navigator.languages],
    documentLanguage: document.documentElement.lang,
    extensionUiLanguage:
      globalThis.chrome?.i18n?.getUILanguage?.() ??
      globalThis.browser?.i18n?.getUILanguage?.() ??
      null,
  }));
  const layoutMetrics = await captureLayoutMetrics(page, implementation, surface);
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
    language,
    layoutMetrics,
  });
}

async function captureImplementation(implementation, extensionPath, entries) {
  const manifest = await readManifest(extensionPath);
  const locales = await availableLocales(extensionPath);
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
      manifestDefaultLocale: manifest.default_locale ?? null,
      availableLocales: locales,
    };
  } finally {
    await context?.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

async function captureLocaleProbe(implementation, extensionPath, requestedLocale) {
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
        await page.goto(`${baseUrl}/${surfacePath.replace(/^\//u, '')}`);
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
            .split(/\r?\n/u)
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
  schemaVersion: 2,
  sourceHead,
  locale,
  original,
  nex,
  entries,
  localeMatrix,
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
  `# Original ↔ Nex UI evidence\n\n- Exact Nex Head: \`${sourceHead}\`\n- Original: official ZeroOmega v3.5.0 Chromium package\n- Locale: \`${locale}\`\n- Surfaces: default Popup and default Options page\n- Evidence: screenshots, rendered text, saved body DOM, normalized anchor targets, computed semantic layout/style metrics, page/extension language signals, packaged locale directories and an en-US/zh-CN/zh-TW default-text matrix\n\nThis artifact is the product-facing comparison authority for removing Nex-only UI, extra descriptions and altered information hierarchy. Green Nex-only screenshots do not establish parity.\n`,
);

console.log(`Original ↔ Nex UI evidence captured for exact Head ${sourceHead}.`);
