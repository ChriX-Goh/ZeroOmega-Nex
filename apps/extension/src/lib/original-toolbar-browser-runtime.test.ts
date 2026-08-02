import { describe, expect, it } from 'vitest';

import type {
  OriginalToolbarActionApi,
  OriginalToolbarActionIconPaths,
  OriginalToolbarActionImageDataSet,
} from './original-toolbar-action-adapter';
import {
  createOriginalToolbarBrowserRuntime,
  ORIGINAL_TOOLBAR_BADGE_BACKGROUND_COLOR,
  ORIGINAL_TOOLBAR_RUNTIME_POPUP,
} from './original-toolbar-browser-runtime';
import type {
  OriginalToolbarCanvas,
  OriginalToolbarCanvasContext,
} from './original-toolbar-icon-renderer';
import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import type { OriginalToolbarTabsApi } from './original-toolbar-tab-coordinator';

class RecordingAction implements OriginalToolbarActionApi {
  readonly icons: Array<{
    readonly tabId: number;
    readonly imageData?: OriginalToolbarActionImageDataSet;
    readonly path?: OriginalToolbarActionIconPaths;
  }> = [];
  readonly titles: Array<{ readonly tabId: number; readonly title: string }> = [];
  readonly badges: Array<{ readonly tabId: number; readonly text: string }> = [];
  readonly badgeColors: Array<{ readonly tabId: number; readonly color: string }> = [];
  readonly popups: Array<{ readonly tabId: number; readonly popup: string }> = [];

  setIcon(details: {
    readonly tabId: number;
    readonly imageData?: OriginalToolbarActionImageDataSet;
    readonly path?: OriginalToolbarActionIconPaths;
  }): void {
    this.icons.push(details);
  }

  setTitle(details: { readonly tabId: number; readonly title: string }): void {
    this.titles.push(details);
  }

  setBadgeText(details: { readonly tabId: number; readonly text: string }): void {
    this.badges.push(details);
  }

  setBadgeBackgroundColor(details: { readonly tabId: number; readonly color: string }): void {
    this.badgeColors.push(details);
  }

  setPopup(details: { readonly tabId: number; readonly popup: string }): void {
    this.popups.push(details);
  }
}

class TransparentCanvasContext implements OriginalToolbarCanvasContext {
  globalCompositeOperation = 'source-over';
  strokeStyle = '';
  fillStyle = '';
  lineWidth = 0;

  beginPath(): void {}
  arc(): void {}
  closePath(): void {}
  stroke(): void {}
  fill(): void {}
  scale(): void {}
  clearRect(): void {}
  setTransform(): void {}

  getImageData(_x: number, _y: number, width: number, height: number) {
    return { width, height, data: new Uint8ClampedArray(width * height * 4) };
  }
}

class TransparentCanvas implements OriginalToolbarCanvas {
  readonly context = new TransparentCanvasContext();

  getContext(): OriginalToolbarCanvasContext {
    return this.context;
  }
}

class TemplateI18n implements OriginalToolbarI18nApi {
  getMessage(messageName: string, substitutions?: string | readonly string[]): string {
    if (messageName === 'manifest_icon_default_title') return '正在加载……';
    if (messageName === 'browserAction_titleWithResult') {
      const values = Array.isArray(substitutions) ? substitutions : [];
      return `ZeroOmega:: ${values[0] ?? ''}\n${values[2] ?? ''}`;
    }
    return '';
  }
}

function createTabs(): OriginalToolbarTabsApi {
  return {
    onUpdated: {
      addListener(): void {},
      removeListener(): void {},
    },
    onActivated: {
      addListener(): void {},
      removeListener(): void {},
    },
    onCreated: {
      addListener(): void {},
      removeListener(): void {},
    },
    async get(tabId) {
      return { id: tabId, url: 'https://example.test/' };
    },
    async query() {
      return [];
    },
  };
}

function createHarness() {
  const action = new RecordingAction();
  const tabs = createTabs();
  const canvas = new TransparentCanvas();
  const runtime = createOriginalToolbarBrowserRuntime(
    { action, i18n: new TemplateI18n(), tabs },
    { canvasFactory: () => canvas },
  );
  return { action, tabs, runtime };
}

describe('original toolbar browser runtime', () => {
  it('exposes the supplied tab boundary and writes the original default Action state', async () => {
    const { action, tabs, runtime } = createHarness();

    expect(runtime.tabs).toBe(tabs);
    await runtime.executor.applyDefault(7);

    expect(action.icons).toEqual([]);
    expect(action.titles).toEqual([{ tabId: 7, title: '正在加载……' }]);
    expect(action.badges).toEqual([{ tabId: 7, text: '' }]);
    expect(action.badgeColors).toEqual([
      { tabId: 7, color: ORIGINAL_TOOLBAR_BADGE_BACKGROUND_COLOR },
    ]);
    expect(action.popups).toEqual([{ tabId: 7, popup: ORIGINAL_TOOLBAR_RUNTIME_POPUP }]);
  });

  it('renders and writes an original two-color per-tab state through the browser boundary', async () => {
    const { action, runtime } = createHarness();

    await runtime.executor.apply(11, {
      icon: {
        mode: 'two-color',
        outerCircleColor: '#32a8e6',
        innerCircleColor: '#f15b40',
      },
      titleArguments: {
        currentProfileName: '[Auto Switch]',
        resultProfileName: '[Direct]',
        details: '(default)',
      },
      badgeText: 'DIR',
    });

    expect(action.icons).toHaveLength(1);
    expect(action.icons[0]?.tabId).toBe(11);
    expect(action.icons[0]?.imageData).toMatchObject({
      16: { width: 16, height: 16 },
      19: { width: 19, height: 19 },
      24: { width: 24, height: 24 },
      32: { width: 32, height: 32 },
      38: { width: 38, height: 38 },
    });
    expect(action.titles).toEqual([{ tabId: 11, title: 'ZeroOmega:: [Auto Switch]\n(default)' }]);
    expect(action.badges).toEqual([{ tabId: 11, text: 'DIR' }]);
    expect(action.popups).toEqual([{ tabId: 11, popup: 'popup-iframe.html' }]);
  });
});
