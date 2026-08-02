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
    """function extensionPages(manifest) {
  const optionsPath = manifest.options_ui?.page ?? manifest.options_page;
  const popupPath = manifest.action?.default_popup ?? manifest.browser_action?.default_popup;
  assert.equal(typeof optionsPath, 'string', 'extension options page was not declared');
  assert.equal(typeof popupPath, 'string', 'extension popup page was not declared');
  return { optionsPath, popupPath };
}
""",
    """function extensionPages(manifest) {
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
          text: (element.textContent ?? '').replace(/\\s+/gu, ' ').trim().slice(0, 160),
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
""",
)

replace_once(
    path,
    """  const language = await page.evaluate(() => ({
    navigatorLanguage: navigator.language,
    navigatorLanguages: [...navigator.languages],
    documentLanguage: document.documentElement.lang,
    extensionUiLanguage:
      globalThis.chrome?.i18n?.getUILanguage?.() ??
      globalThis.browser?.i18n?.getUILanguage?.() ??
      null,
  }));
  const viewport = page.viewportSize();""",
    """  const language = await page.evaluate(() => ({
    navigatorLanguage: navigator.language,
    navigatorLanguages: [...navigator.languages],
    documentLanguage: document.documentElement.lang,
    extensionUiLanguage:
      globalThis.chrome?.i18n?.getUILanguage?.() ??
      globalThis.browser?.i18n?.getUILanguage?.() ??
      null,
  }));
  const layoutMetrics = await captureLayoutMetrics(page, implementation, surface);
  const viewport = page.viewportSize();""",
)
replace_once(
    path,
    """    links,
    language,
  });""",
    """    links,
    language,
    layoutMetrics,
  });""",
)
replace_once(path, 'schemaVersion: 1,', 'schemaVersion: 2,')
replace_once(
    path,
    """- Evidence: screenshots, rendered text, saved body DOM, normalized anchor targets, page/extension language signals, packaged locale directories and an en-US/zh-CN/zh-TW default-text matrix""",
    """- Evidence: screenshots, rendered text, saved body DOM, normalized anchor targets, computed semantic layout/style metrics, page/extension language signals, packaged locale directories and an en-US/zh-CN/zh-TW default-text matrix""",
)

subprocess.run(['pnpm', 'exec', 'prettier', '--write', path], check=True)
