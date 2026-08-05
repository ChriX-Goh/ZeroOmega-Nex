import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative, resolve } from 'node:path';

import { chromium } from '@playwright/test';

const originalPath = resolve(
  process.env.ZEROOMEGA_ORIGINAL_CHROMIUM_PATH ?? 'original-release/chromium',
);
const nexPath = resolve(process.env.ZEROOMEGA_NEX_CHROMIUM_PATH ?? 'dist/chrome-mv3');
const outputRoot = resolve(
  process.env.ZEROOMEGA_POPUP_EXPANDED_SITE_ACTION_OUTPUT ??
    'artifacts/original-nex-popup-expanded-site-action-evidence',
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
  const response = await page.evaluate(
    async (request) => chrome.runtime.sendMessage(request),
    message,
  );
  assert.equal(response?.ok, true, `Nex runtime command failed: ${JSON.stringify(response)}`);
  return response;
}

async function activateAutoSwitch(page, implementation) {
  if (implementation === 'original-v3.5.0') {
    await sendOriginalRuntimeMessage(page, 'applyProfile', ['auto switch']);
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const latest = await sendOriginalRuntimeMessage(page, 'getState', [
        { currentProfileName: '', isSystemProfile: false },
      ]);
      if (latest?.currentProfileName === 'auto switch') return;
      await pause();
    }
    throw new Error('Original auto switch did not activate');
  }

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

async function stabilize(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.addStyleTag({
    content:
      '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
  });
  let previous = '';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = await page.locator('body').innerText();
    if (current === previous) return;
    previous = current;
    await page.waitForTimeout(150);
  }
}

function normalizedLines(text) {
  return text
    .split(/\r?\n/u)
    .map((line) => line.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
}

async function elementMetric(locator) {
  return locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id,
      className: element.getAttribute('class') ?? '',
      text: (element.textContent ?? '').replace(/\s+/gu, ' ').trim(),
      visible:
        Boolean(rect.width || rect.height) &&
        style.visibility !== 'hidden' &&
        style.display !== 'none',
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
        padding: style.padding,
        margin: style.margin,
        border: style.border,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
      },
    };
  });
}

async function capture(page, outputDir, name, selectors) {
  await stabilize(page);
  const screenshotPath = resolve(outputDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
  const screenshot = await readFile(screenshotPath);
  const bodyHtml = await page.locator('body').evaluate((body) => body.outerHTML);
  const htmlPath = resolve(outputDir, `${name}.html`);
  await writeFile(htmlPath, `${bodyHtml}\n`);
  const text = await page.locator('body').innerText();
  const metrics = {};
  for (const [key, selector] of Object.entries(selectors)) {
    const locator = page.locator(selector);
    metrics[key] = [];
    for (let index = 0; index < (await locator.count()); index += 1) {
      metrics[key].push(await elementMetric(locator.nth(index)));
    }
  }
  return {
    name,
    screenshot: relative(outputRoot, screenshotPath).replaceAll('\\', '/'),
    screenshotSha256: sha256(screenshot),
    ...pngDimensions(screenshot),
    html: relative(outputRoot, htmlPath).replaceAll('\\', '/'),
    bodyHtmlSha256: sha256(Buffer.from(bodyHtml)),
    text,
    textLines: normalizedLines(text),
    metrics,
  };
}

async function captureImplementation(implementation, extensionPath) {
  const manifest = await readManifest(extensionPath);
  const { optionsPath, popupPath } = extensionPages(manifest);
  const outputDir = resolve(outputRoot, implementation);
  const userDataDir = await mkdtemp(resolve(tmpdir(), `zeroomega-${implementation}-expanded-`));
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
    const baseUrl = `chrome-extension://${extensionId}`;
    const ordinaryTab = await context.newPage();
    await ordinaryTab.goto(evidenceUrl, { waitUntil: 'domcontentloaded' });
    const controlPage = await context.newPage();
    await controlPage.goto(`${baseUrl}/${optionsPath.replace(/^\//u, '')}`);
    await activateAutoSwitch(controlPage, implementation);
    await ordinaryTab.bringToFront();
    const popupUrl = `${baseUrl}/${popupPath.replace(/^\//u, '')}`;

    const temporaryPopup = await openBackgroundPopup(context, ordinaryTab, popupUrl);
    await temporaryPopup.setViewportSize({ width: 440, height: 900 });
    if (implementation === 'original-v3.5.0') {
      await temporaryPopup.locator('#js-temprule').waitFor({ state: 'visible', timeout: 20_000 });
      await temporaryPopup.waitForFunction(
        () => document.querySelector('.om-page-domain')?.textContent?.trim() === 'example.com',
        undefined,
        { timeout: 20_000 },
      );
      await temporaryPopup.locator('#js-temprule').click();
      await temporaryPopup
        .locator('.om-nav-temprule.om-open .om-dropdown')
        .waitFor({ state: 'visible', timeout: 20_000 });
    } else {
      await temporaryPopup
        .locator('[data-popup-temporary-rule-toggle]')
        .waitFor({ state: 'visible', timeout: 20_000 });
      await temporaryPopup.locator('[data-popup-temporary-rule-toggle]').click();
      await temporaryPopup
        .locator('[data-popup-temporary-rule-menu]')
        .waitFor({ state: 'visible', timeout: 20_000 });
    }
    const temporary = await capture(
      temporaryPopup,
      outputDir,
      'popup-temporary-rule-menu',
      implementation === 'original-v3.5.0'
        ? {
            shell: '.om-nav',
            toggle: '#js-temprule',
            menu: '.om-nav-temprule.om-open .om-dropdown',
            options: '.om-nav-temprule.om-open .om-dropdown > li > a',
          }
        : {
            shell: '.popup-shell',
            toggle: '[data-popup-temporary-rule-toggle]',
            menu: '[data-popup-temporary-rule-menu]',
            options: '[data-popup-temporary-rule-menu] [data-popup-temporary-rule-option]',
            manage: '[data-popup-manage-temporary-rules]',
          },
    );
    await temporaryPopup.close();

    const conditionPopup = await openBackgroundPopup(context, ordinaryTab, popupUrl);
    await conditionPopup.setViewportSize({ width: 440, height: 900 });
    if (implementation === 'original-v3.5.0') {
      await conditionPopup.locator('#js-addrule').waitFor({ state: 'visible', timeout: 20_000 });
      await conditionPopup.waitForFunction(
        () => document.querySelector('.om-page-domain')?.textContent?.trim() === 'example.com',
        undefined,
        { timeout: 20_000 },
      );
      await conditionPopup.locator('#js-addrule').click();
      await conditionPopup
        .locator('form.condition-form')
        .waitFor({ state: 'visible', timeout: 20_000 });
    } else {
      await conditionPopup
        .locator('[data-popup-add-current-site]')
        .waitFor({ state: 'visible', timeout: 20_000 });
      await conditionPopup.locator('[data-popup-add-current-site]').click();
      await conditionPopup
        .locator('[data-popup-condition-form]')
        .waitFor({ state: 'visible', timeout: 20_000 });
    }

    const patternSelector =
      implementation === 'original-v3.5.0'
        ? 'form.condition-form input.condition-details'
        : '[data-popup-condition-form] input';
    const submitSelector =
      implementation === 'original-v3.5.0'
        ? 'form.condition-form button[type="submit"]'
        : '[data-popup-condition-form] button[type="submit"]';
    const initialPattern = await conditionPopup.locator(patternSelector).inputValue();
    await conditionPopup.locator(patternSelector).fill('');
    const emptyPatternDisabled = await conditionPopup.locator(submitSelector).isDisabled();
    await conditionPopup.locator(patternSelector).fill(initialPattern);

    const condition = await capture(
      conditionPopup,
      outputDir,
      'popup-add-condition-form',
      implementation === 'original-v3.5.0'
        ? {
            shell: 'body',
            menu: '.popup-menu-nav',
            form: 'form.condition-form',
            legend: 'form.condition-form legend',
            labels: 'form.condition-form label',
            selects: 'form.condition-form select',
            input: 'form.condition-form input.condition-details',
            actions: 'form.condition-form .condition-controls button',
          }
        : {
            shell: '.popup-shell',
            menu: '.profile-list',
            footer: '.popup-footer',
            form: '[data-popup-condition-form]',
            legend: '[data-popup-condition-form] h2',
            labels: '[data-popup-condition-form] label',
            selects: '[data-popup-condition-form] select',
            input: '[data-popup-condition-form] input',
            actions: '[data-popup-condition-form] .condition-actions button',
          },
    );
    condition.validation = { initialPattern, emptyPatternDisabled };
    await conditionPopup.close();
    await controlPage.close();
    await ordinaryTab.close();

    return {
      implementation,
      extensionVersion: manifest.version,
      manifestVersion: manifest.manifest_version,
      browserVersion: context.browser()?.version() ?? 'unknown',
      popupPath,
      evidenceUrl,
      states: { temporary, condition },
    };
  } finally {
    await context?.close();
    await rm(userDataDir, { recursive: true, force: true });
  }
}

const original = await captureImplementation('original-v3.5.0', originalPath);
const nex = await captureImplementation('nex', nexPath);

function visibleCount(metrics) {
  return metrics.filter((metric) => metric.visible).length;
}

assert.equal(
  visibleCount(nex.states.temporary.metrics.manage ?? []),
  0,
  'Nex must not expose a temporary-rule management row inside the original Popup dropdown',
);
assert.equal(
  visibleCount(nex.states.temporary.metrics.options),
  visibleCount(original.states.temporary.metrics.options),
  'Nex temporary-rule result count must match the original Popup dropdown',
);
assert.equal(
  nex.states.temporary.metrics.menu[0]?.style.position,
  original.states.temporary.metrics.menu[0]?.style.position,
  'Nex temporary-rule menu expansion mode must match the original',
);
assert.equal(
  nex.states.condition.metrics.menu[0]?.visible,
  false,
  'Nex profile menu must be hidden while the Add-condition form is open',
);
assert.equal(
  visibleCount(nex.states.condition.metrics.footer ?? []),
  0,
  'Nex Options footer must be hidden while the Add-condition form is open',
);
assert.equal(
  nex.states.condition.validation.emptyPatternDisabled,
  true,
  'Nex Add-condition submit action must be disabled for an empty required pattern',
);
assert.equal(
  original.states.condition.validation.emptyPatternDisabled,
  true,
  'Original Add-condition submit action evidence must preserve required-pattern validation',
);

const report = {
  schema: 1,
  sourceHead,
  locale,
  generatedAt: new Date().toISOString(),
  source: {
    originalRelease: 'ZeroOmega v3.5.0 official Chromium package',
    originalSha256: '4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce',
    nex: 'exact pull-request Head',
  },
  assertions: {
    temporaryRuleManagementRowVisibleInNex: false,
    temporaryRuleResultCountMatches: true,
    temporaryRuleExpansionModeMatches: true,
    conditionFormReplacesMenu: true,
    conditionFormHidesOptionsFooter: true,
    requiredPatternValidationMatches: true,
  },
  entries: [original, nex],
};
await writeFile(resolve(outputRoot, 'manifest.json'), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(
  resolve(outputRoot, 'README.md'),
  `# Original ↔ Nex expanded Popup site-action evidence\n\n- Source Head: \`${sourceHead}\`\n- Locale: \`${locale}\`\n- Evidence URL: \`${evidenceUrl}\`\n- Surfaces: temporary-rule dropdown and Add-condition form\n- Original package SHA-256: \`4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce\`\n\nThis artifact verifies the original menu replacement, result-only temporary dropdown, and required-pattern validation contracts. It does not authorize owner retest, merge, or release.\n`,
);

console.log(`Expanded Popup site-action evidence written to ${outputRoot}`);
