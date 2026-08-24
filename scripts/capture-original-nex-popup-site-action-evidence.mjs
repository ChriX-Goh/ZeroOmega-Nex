import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';

import { chromium } from '@playwright/test';

const originalPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_CHROMIUM_PATH ?? 'original-release/chromium',
);
const nexPath = resolve(process.env.ZEROOMEGA_NEX_CHROMIUM_PATH ?? 'dist/chrome-mv3');
const outputRoot = resolve(
  process.env.ZEROOMEGA_POPUP_SITE_ACTION_OUTPUT ??
    'artifacts/original-nex-popup-site-action-evidence',
);
const sourceHead = process.env.ZEROOMEGA_SOURCE_HEAD ?? 'unknown';
const locale = process.env.ZEROOMEGA_UI_EVIDENCE_LOCALE ?? 'zh-CN';
const evidenceUrl = 'https://example.com/';

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function readManifest(extensionPath) {
  return JSON.parse(await readFile(resolve(extensionPath, 'manifest.json'), 'utf8'));
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

async function pause(delay = 100) {
  await new Promise((resolvePause) => setTimeout(resolvePause, delay));
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

async function sendNexRuntimeMessage(page, message) {
  const response = await page.evaluate(async (request) => chrome.runtime.sendMessage(request), message);
  assert.equal(response?.ok, true, `Nex runtime command failed: ${JSON.stringify(response)}`);
  return response;
}

async function activateOriginalAutoSwitch(page) {
  await sendOriginalRuntimeMessage(page, 'applyProfile', ['auto switch']);
  let latest;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    latest = await sendOriginalRuntimeMessage(page, 'getState', [
      { currentProfileName: '', isSystemProfile: false, validResultProfiles: [] },
    ]);
    if (latest?.currentProfileName === 'auto switch') return latest;
    await pause();
  }
  throw new Error(`Original auto switch did not activate: ${JSON.stringify(latest)}`);
}

async function activateNexAutoSwitch(page) {
  const channel = 'zeroomega-nex/profile-workflow/v1';
  const current = await sendNexRuntimeMessage(page, { channel, action: 'get' });
  const profile = current.state.applied.profiles.find(
    (candidate) => candidate.name === 'auto switch',
  );
  assert.ok(profile, 'Nex auto switch profile was not found');
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
  throw new Error(`Nex auto switch did not activate: ${JSON.stringify(latest)}`);
}

async function activateAutoSwitch(page, implementation) {
  return implementation === 'original-v3.5.0'
    ? activateOriginalAutoSwitch(page)
    : activateNexAutoSwitch(page);
}

async function openBackgroundPopup(context, activeTab, popupUrl) {
  try {
    const cdp = await context.newCDPSession(activeTab);
    const pagePromise = context.waitForEvent('page');
    await cdp.send('Target.createTarget', { url: popupUrl, background: true });
    return await pagePromise;
  } catch {
    const popup = await context.newPage();
    await popup.goto(popupUrl, { waitUntil: 'commit' });
    await activeTab.bringToFront();
    return popup;
  }
}

async function stabilizePopup(page, implementation) {
  await page.waitForLoadState('domcontentloaded');
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  });
  if (implementation === 'original-v3.5.0') {
    await page.locator('#js-addrule').waitFor({ state: 'visible', timeout: 20_000 });
    await page.locator('#js-temprule').waitFor({ state: 'visible', timeout: 20_000 });
    await page.waitForFunction(
      () => document.querySelector('.om-page-domain')?.textContent?.trim() === 'example.com',
      undefined,
      { timeout: 20_000 },
    );
  } else {
    await page.locator('[data-popup-add-current-site]').waitFor({
      state: 'visible',
      timeout: 20_000,
    });
    await page.locator('[data-popup-temporary-rule]').waitFor({
      state: 'visible',
      timeout: 20_000,
    });
  }
  let previous = '';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = await page.locator('body').innerText();
    if (current === previous) return;
    previous = current;
    await page.waitForTimeout(150);
  }
}

function selectorsFor(implementation) {
  if (implementation === 'original-v3.5.0') {
    return {
      shell: '.om-nav',
      profileRows: '#js-direct, #js-system, #js-profile-1, #js-profile-2',
      activeProfile: '.om-nav-item.om-active > a',
      switchDropdownToggle: '#js-profile-2 .om-edit-toggle',
      addRule: '#js-addrule',
      addRuleIcon: '#js-addrule > .glyphicon',
      addRuleLabel: '#js-addrule-label',
      temporaryRule: '#js-temprule',
      temporaryRuleIcon: '#js-temprule > .glyphicon',
      temporaryRuleDomain: '#js-temprule .om-page-domain',
      temporaryRuleCaret: '#js-temprule .om-caret',
      temporaryRuleSelect: '#js-temprule select',
      dividers: '.om-divider',
      options: '#js-option',
    };
  }
  return {
    shell: '.popup-shell',
    profileRows: '.profile-row > button',
    activeProfile: '.profile-row > button.active',
    switchDropdownToggle: '.profile-row > button.active .om-edit-toggle',
    addRule: '[data-popup-add-current-site]',
    addRuleIcon: '[data-popup-add-current-site] [data-original-popup-icon]',
    addRuleLabel: '[data-popup-add-current-site]',
    temporaryRule: '[data-popup-temporary-rule]',
    temporaryRuleIcon: '[data-popup-temporary-rule] [data-original-popup-icon]',
    temporaryRuleDomain: '[data-popup-temporary-rule] label',
    temporaryRuleCaret: '[data-popup-temporary-rule] .om-caret',
    temporaryRuleSelect: '[data-popup-temporary-rule] select',
    dividers: '.profile-divider',
    options: '.settings-button',
  };
}

async function captureMetrics(page, implementation) {
  const metrics = {};
  for (const [role, selector] of Object.entries(selectorsFor(implementation))) {
    metrics[role] = await page.locator(selector).evaluateAll((elements) =>
      elements.slice(0, 16).map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id,
          className: element.getAttribute('class') ?? '',
          text: (element.textContent ?? '').replace(/\s+/gu, ' ').trim().slice(0, 200),
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
            color: style.color,
            backgroundColor: style.backgroundColor,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
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
            gap: style.gap,
            alignItems: style.alignItems,
          },
        };
      }),
    );
  }
  assert.equal(metrics.shell.length, 1, `${implementation} shell metric`);
  assert.equal(metrics.addRule.length, 1, `${implementation} Add condition surface`);
  assert.equal(metrics.temporaryRule.length, 1, `${implementation} temporary-rule surface`);
  return metrics;
}

async function captureImplementation(implementation, extensionPath) {
  const manifest = await readManifest(extensionPath);
  const { optionsPath, popupPath } = extensionPages(manifest);
  const locales = await availableLocales(extensionPath);
  const outputDir = resolve(outputRoot, implementation);
  const userDataDir = await mkdtemp(resolve(tmpdir(), `zeroomega-${implementation}-site-action-`));
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
    await ordinaryTab.goto(evidenceUrl, { waitUntil: 'domcontentloaded' });
    const controlPage = await context.newPage();
    await controlPage.goto(`${baseUrl}/${optionsPath.replace(/^\//u, '')}`);
    await activateAutoSwitch(controlPage, implementation);
    await ordinaryTab.bringToFront();

    const popupUrl = `${baseUrl}/${popupPath.replace(/^\//u, '')}`;
    const popup = await openBackgroundPopup(context, ordinaryTab, popupUrl);
    try {
      await popup.setViewportSize({ width: 440, height: 760 });
      await stabilizePopup(popup, implementation);
      const screenshotPath = resolve(outputDir, 'popup-switch-site-actions.png');
      await popup.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
      const screenshot = await readFile(screenshotPath);
      const text = await popup.locator('body').innerText();
      const bodyHtml = await popup.locator('body').evaluate((body) => body.outerHTML);
      const htmlPath = resolve(outputDir, 'popup-switch-site-actions.html');
      await writeFile(htmlPath, `${bodyHtml}\n`);
      const layoutMetrics = await captureMetrics(popup, implementation);
      const textLines = text
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter(Boolean);
      assert.equal(
        textLines.some((line) => line.includes('example.com')),
        true,
        `${implementation} current-site domain evidence`,
      );
      return {
        implementation,
        surface: 'popup-switch-site-actions',
        url: popupPath,
        evidenceUrl,
        extensionVersion: manifest.version,
        manifestVersion: manifest.manifest_version,
        manifestDefaultLocale: manifest.default_locale ?? null,
        availableLocales: locales,
        browserVersion: context.browser()?.version() ?? 'unknown',
        screenshot: relative(outputRoot, screenshotPath).replaceAll('\\', '/'),
        screenshotSha256: sha256(screenshot),
        ...pngDimensions(screenshot),
        text,
        textLines,
        html: relative(outputRoot, htmlPath).replaceAll('\\', '/'),
        bodyHtmlSha256: sha256(Buffer.from(bodyHtml)),
        layoutMetrics,
      };
    } finally {
      await popup.close();
      await controlPage.close();
      await ordinaryTab.close();
    }
  } finally {
    await context?.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

const original = await captureImplementation('original-v3.5.0', originalPath);
const nex = await captureImplementation('nex', nexPath);
const comparison = {
  originalTextLines: original.textLines,
  nexTextLines: nex.textLines,
  extraInNex: nex.textLines.filter((line) => !original.textLines.includes(line)),
  missingInNex: original.textLines.filter((line) => !nex.textLines.includes(line)),
  originalStructure: {
    switchDropdownToggles: original.layoutMetrics.switchDropdownToggle.length,
    addRuleIcons: original.layoutMetrics.addRuleIcon.length,
    temporaryRuleIcons: original.layoutMetrics.temporaryRuleIcon.length,
    temporaryRuleCarets: original.layoutMetrics.temporaryRuleCaret.length,
    temporaryRuleSelects: original.layoutMetrics.temporaryRuleSelect.length,
  },
  nexStructure: {
    switchDropdownToggles: nex.layoutMetrics.switchDropdownToggle.length,
    addRuleIcons: nex.layoutMetrics.addRuleIcon.length,
    temporaryRuleIcons: nex.layoutMetrics.temporaryRuleIcon.length,
    temporaryRuleCarets: nex.layoutMetrics.temporaryRuleCaret.length,
    temporaryRuleSelects: nex.layoutMetrics.temporaryRuleSelect.length,
  },
};

const manifest = {
  schemaVersion: 1,
  sourceHead,
  locale,
  evidenceUrl,
  originalSourceAnchors: [
    'zero-peak/ZeroOmega@05cbb30:omega-web/src/popup/index.html',
    'zero-peak/ZeroOmega@05cbb30:omega-web/src/popup/js/loader.js',
    'zero-peak/ZeroOmega@05cbb30:omega-web/src/popup/js/profiles.js',
    'zero-peak/ZeroOmega@05cbb30:omega-web/src/popup/js/i18n.js',
  ],
  entries: [original, nex],
  comparison,
};
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(resolve(outputRoot, 'manifest.json'), manifestText);
await writeFile(
  resolve(outputRoot, 'manifest.sha256'),
  `${sha256(Buffer.from(manifestText))}  manifest.json\n`,
);
await writeFile(
  resolve(outputRoot, 'README.md'),
  `# Original ↔ Nex Popup site-action evidence\n\n- Exact Nex Head: \`${sourceHead}\`\n- Original: official ZeroOmega v3.5.0 Chromium package\n- Active profile: \`auto switch\`\n- Active page: \`${evidenceUrl}\`\n- Locale: \`${locale}\`\n- Scope: compact Popup current-site Add condition and temporary-rule surfaces\n- Product correction: none; this artifact is diagnostic only\n`,
);

console.log(`Original ↔ Nex Popup site-action evidence written to ${outputRoot}`);
