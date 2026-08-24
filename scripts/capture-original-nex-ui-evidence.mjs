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

async function pause(delay = 100) {
  await new Promise((resolvePause) => setTimeout(resolvePause, delay));
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
          brandText: 'header.side-nav > h1 > a',
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
          brandText: '.side-brand button > span',
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
        profileRow: '#js-direct, #js-system, #js-profile-1, #js-profile-2',
        profileAction: '#js-direct, #js-system, #js-profile-1, #js-profile-2',
        profileIcon:
          '#js-direct > .glyphicon:first-child, #js-system > .glyphicon:first-child, #js-profile-1 > .glyphicon:first-child, #js-profile-2 > .glyphicon:first-child',
        profileName:
          '#js-direct > .om-profile-name, #js-system > .om-profile-name, #js-profile-1 > .om-profile-name, #js-profile-2 > .om-profile-name',
        profileTrailingIcon:
          '#js-direct > .glyphicon:last-child, #js-system > .glyphicon:last-child',
        divider: '.om-divider',
        active: '.om-nav-item.om-active > a',
        options: '#js-option',
        optionsIcon: '#js-option > .glyphicon:first-child',
        resultControl: 'select',
      }
    : {
        shell: '.popup-shell',
        content: '.profile-list',
        profileRow: '.profile-row > button',
        profileAction: '.profile-row > button',
        profileIcon: '.profile-row [data-original-popup-icon-position="leading"]',
        profileName: '.profile-name',
        profileTrailingIcon:
          '[data-original-popup-icon="globe"][data-original-popup-icon-position="trailing"]',
        divider: '.profile-divider',
        active: '.profile-row > button.active',
        options: '.settings-button',
        optionsIcon:
          '[data-original-popup-icon="wrench"][data-original-popup-icon-position="options"]',
        resultControl: '.profile-result-select',
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
            outline: style.outline,
            outlineOffset: style.outlineOffset,
            verticalAlign: style.verticalAlign,
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

async function sendOriginalRuntimeMessage(page, method, args = []) {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return await page.evaluate(
        async ({ requestMethod, requestArgs }) =>
          new Promise((resolveMessage, rejectMessage) => {
            chrome.runtime.sendMessage({ method: requestMethod, args: requestArgs }, (response) => {
              if (chrome.runtime.lastError) {
                rejectMessage(new Error(chrome.runtime.lastError.message));
                return;
              }
              if (response?.error) {
                rejectMessage(new Error(String(response.error.message ?? response.error)));
                return;
              }
              resolveMessage(response?.result ?? null);
            });
          }),
        { requestMethod: method, requestArgs: args },
      );
    } catch (error) {
      lastError = error;
      await pause();
    }
  }
  throw lastError ?? new Error(`Original runtime message ${method} failed`);
}

async function activateOriginalEvidenceProfile(page, profileName) {
  await sendOriginalRuntimeMessage(page, 'applyProfile', [profileName]);
  let latest;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    latest = await sendOriginalRuntimeMessage(page, 'getState', [
      { currentProfileName: '', isSystemProfile: false, validResultProfiles: [] },
    ]);
    if (latest?.currentProfileName === profileName) return latest;
    await pause();
  }
  throw new Error(`Original profile did not become ${profileName}: ${JSON.stringify(latest)}`);
}

async function sendNexRuntimeMessage(page, message) {
  const response = await page.evaluate(
    async (request) => chrome.runtime.sendMessage(request),
    message,
  );
  assert.equal(response?.ok, true, `Nex runtime command failed: ${JSON.stringify(response)}`);
  return response;
}

async function activateNexEvidenceProfile(page, profileName) {
  const channel = 'zeroomega-nex/profile-workflow/v1';
  const current = await sendNexRuntimeMessage(page, { channel, action: 'get' });
  const profile = current.state.applied.profiles.find(
    (candidate) => candidate.name === profileName,
  );
  assert.ok(profile, `Nex profile ${profileName} was not found`);
  await sendNexRuntimeMessage(page, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: current.state.applied.revision.id,
    route: { kind: 'profile', profileId: profile.id },
  });
  let latest;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    latest = await sendNexRuntimeMessage(page, { channel, action: 'get' });
    if (
      latest.runtime?.activeRoute?.kind === 'profile' &&
      latest.runtime.activeRoute.profileId === profile.id
    ) {
      return latest;
    }
    await pause();
  }
  throw new Error(`Nex profile did not become ${profileName}: ${JSON.stringify(latest)}`);
}

async function activateEvidenceProfile(page, implementation, profileName) {
  return implementation === 'original-v3.5.0'
    ? activateOriginalEvidenceProfile(page, profileName)
    : activateNexEvidenceProfile(page, profileName);
}

async function capturePopupState(
  context,
  baseUrl,
  popupPath,
  implementation,
  surface,
  outputDir,
  entries,
) {
  const popup = await context.newPage();
  try {
    await popup.setViewportSize({ width: 440, height: 760 });
    await popup.goto(`${baseUrl}/${popupPath.replace(/^\//u, '')}`);
    await captureSurface(popup, implementation, surface, popupPath, outputDir, entries);
  } finally {
    await popup.close();
  }
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

    await capturePopupState(
      context,
      baseUrl,
      popupPath,
      implementation,
      'popup-default',
      outputDir,
      entries,
    );

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

    for (const state of [
      { profileName: 'proxy', surface: 'popup-fixed-active' },
      { profileName: 'auto switch', surface: 'popup-switch-active' },
    ]) {
      await activateEvidenceProfile(options, implementation, state.profileName);
      await capturePopupState(
        context,
        baseUrl,
        popupPath,
        implementation,
        state.surface,
        outputDir,
        entries,
      );
    }

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

const pairedSurfaces = [
  'popup-default',
  'popup-fixed-active',
  'popup-switch-active',
  'options-default',
];
assert.equal(entries.length, 8, 'paired UI evidence count');
for (const implementation of ['original-v3.5.0', 'nex']) {
  for (const surface of pairedSurfaces) {
    assert.equal(
      entries.filter(
        (entry) => entry.implementation === implementation && entry.surface === surface,
      ).length,
      1,
      `missing ${implementation}/${surface} evidence`,
    );
  }
}
const originalSwitchEntry = entries.find(
  (entry) => entry.implementation === 'original-v3.5.0' && entry.surface === 'popup-switch-active',
);
const nexSwitchEntry = entries.find(
  (entry) => entry.implementation === 'nex' && entry.surface === 'popup-switch-active',
);
assert.equal(
  originalSwitchEntry.layoutMetrics.resultControl.length,
  0,
  'Original active Switch result control',
);
assert.equal(
  nexSwitchEntry.layoutMetrics.resultControl.length,
  0,
  'Nex active Switch result control',
);
assert.deepEqual(
  nexSwitchEntry.textLines,
  originalSwitchEntry.textLines,
  'Active Switch Popup text must match Original exactly',
);

const bySurface = Object.fromEntries(
  pairedSurfaces.map((surface) => {
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
  schemaVersion: 3,
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
  `# Original ↔ Nex UI evidence\n\n- Exact Nex Head: \`${sourceHead}\`\n- Original: official ZeroOmega v3.5.0 Chromium package\n- Locale: \`${locale}\`\n- Surfaces: default Popup, active Fixed Popup, active Switch Popup and default Options page\n- Evidence: screenshots, rendered text, saved body DOM, normalized anchor targets, computed semantic layout/style metrics, page/extension language signals, packaged locale directories and an en-US/zh-CN/zh-TW default-text matrix\n\nThis artifact is the product-facing comparison authority for removing Nex-only UI, extra descriptions and altered information hierarchy. Green Nex-only screenshots do not establish parity.\n`,
);

console.log(`Original ↔ Nex UI evidence captured for exact Head ${sourceHead}.`);
