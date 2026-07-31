import { describe, expect, it } from 'vitest';

import type {
  OriginalToolbarActionIconPaths,
  OriginalToolbarActionImageDataSet,
  OriginalToolbarActionPresentation,
} from './original-toolbar-action-adapter';
import {
  OriginalToolbarActionExecutor,
  type OriginalToolbarActionWriter,
  type OriginalToolbarIconRendererApi,
} from './original-toolbar-action-executor';
import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import type { OriginalToolbarTabState } from './original-toolbar-tab-state';

class RecordingActionWriter implements OriginalToolbarActionWriter {
  readonly presentations: OriginalToolbarActionPresentation[] = [];

  async apply(presentation: OriginalToolbarActionPresentation): Promise<void> {
    this.presentations.push(presentation);
  }
}

class RecordingRenderer implements OriginalToolbarIconRendererApi {
  readonly calls: Array<readonly [string, string | undefined]> = [];
  clearCacheCalls = 0;
  result: OriginalToolbarActionImageDataSet | undefined;

  render(
    outerCircleColor: string,
    innerCircleColor?: string,
  ): OriginalToolbarActionImageDataSet | undefined {
    this.calls.push([outerCircleColor, innerCircleColor]);
    return this.result;
  }

  clearCache(): void {
    this.clearCacheCalls += 1;
  }
}

class TemplateI18n implements OriginalToolbarI18nApi {
  readonly calls: Array<{
    readonly messageName: string;
    readonly substitutions?: string | readonly string[];
  }> = [];

  getMessage(messageName: string, substitutions?: string | readonly string[]): string {
    this.calls.push(substitutions === undefined ? { messageName } : { messageName, substitutions });
    if (messageName === 'manifest_icon_default_title') return '正在加载……';
    if (messageName === 'browserAction_titleWithResult') {
      const values = Array.isArray(substitutions) ? substitutions : [];
      return `ZeroOmega:: ${values[0] ?? ''}\n${values[2] ?? ''}`;
    }
    return '';
  }
}

const fallbackIconPaths: OriginalToolbarActionIconPaths = {
  16: 'icon/original-action-16.png',
  19: 'icon/original-action-19.png',
  24: 'icon/original-action-24.png',
  32: 'icon/original-action-32.png',
};

const renderedIcon: OriginalToolbarActionImageDataSet = {
  16: { width: 16, height: 16, data: new Uint8ClampedArray(16 * 16 * 4) },
};

function createHarness() {
  const action = new RecordingActionWriter();
  const renderer = new RecordingRenderer();
  const i18n = new TemplateI18n();
  const executor = new OriginalToolbarActionExecutor({
    action,
    renderer,
    i18n,
    badgeBackgroundColor: '#d90000',
    popup: 'popup-iframe.html',
    fallbackIconPaths,
  });
  return { action, renderer, i18n, executor };
}

function tabState(overrides: Partial<OriginalToolbarTabState> = {}): OriginalToolbarTabState {
  return {
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
    ...overrides,
  };
}

describe('original toolbar Action executor', () => {
  it('localizes, renders, and writes a two-color per-tab state', async () => {
    const { action, renderer, i18n, executor } = createHarness();
    renderer.result = renderedIcon;

    await executor.apply(17, tabState());

    expect(renderer.calls).toEqual([['#32a8e6', '#f15b40']]);
    expect(i18n.calls).toEqual([
      {
        messageName: 'browserAction_titleWithResult',
        substitutions: ['[Auto Switch]', '[Direct]', '(default)'],
      },
    ]);
    expect(action.presentations).toEqual([
      {
        tabId: 17,
        title: 'ZeroOmega:: [Auto Switch]\n(default)',
        badgeText: 'DIR',
        badgeBackgroundColor: '#d90000',
        popup: 'popup-iframe.html',
        imageData: renderedIcon,
        fallbackIconPaths,
      },
    ]);
  });

  it('passes a one-color state without inventing an inner color', async () => {
    const { action, renderer, executor } = createHarness();
    renderer.result = renderedIcon;
    const state: OriginalToolbarTabState = {
      icon: {
        mode: 'single-color',
        outerCircleColor: '#32a8e6',
      },
      titleArguments: {
        currentProfileName: '[Direct]',
        resultProfileName: '[Direct]',
        details: '(not using any proxy)',
      },
    };

    await executor.apply(23, state);

    expect(renderer.calls).toEqual([['#32a8e6', undefined]]);
    expect(action.presentations[0]).not.toHaveProperty('badgeText');
    expect(action.presentations[0]).toMatchObject({
      tabId: 23,
      imageData: renderedIcon,
      fallbackIconPaths,
    });
  });

  it('omits ImageData when rendering signals original static fallback', async () => {
    const { action, executor } = createHarness();

    await executor.apply(29, tabState());

    expect(action.presentations[0]).not.toHaveProperty('imageData');
    expect(action.presentations[0]).toMatchObject({
      tabId: 29,
      fallbackIconPaths,
    });
  });

  it('writes a global derived state without a tabId', async () => {
    const { action, renderer, executor } = createHarness();
    renderer.result = renderedIcon;

    await executor.applyGlobal(tabState());

    expect(action.presentations).toEqual([
      {
        title: 'ZeroOmega:: [Auto Switch]\n(default)',
        badgeText: 'DIR',
        badgeBackgroundColor: '#d90000',
        popup: 'popup-iframe.html',
        imageData: renderedIcon,
        fallbackIconPaths,
      },
    ]);
  });

  it('applies the localized default state without invoking the dynamic renderer', async () => {
    const { action, renderer, i18n, executor } = createHarness();

    await executor.applyDefault(31);

    expect(renderer.calls).toEqual([]);
    expect(i18n.calls).toEqual([{ messageName: 'manifest_icon_default_title' }]);
    expect(action.presentations).toEqual([
      {
        tabId: 31,
        title: '正在加载……',
        badgeBackgroundColor: '#d90000',
        popup: 'popup-iframe.html',
        fallbackIconPaths,
      },
    ]);
  });

  it('applies the global default without a tabId', async () => {
    const { action, executor } = createHarness();

    await executor.applyGlobalDefault();

    expect(action.presentations).toEqual([
      {
        title: '正在加载……',
        badgeBackgroundColor: '#d90000',
        popup: 'popup-iframe.html',
        fallbackIconPaths,
      },
    ]);
  });

  it('forwards explicit icon cache invalidation to the original renderer', () => {
    const { renderer, executor } = createHarness();

    executor.clearIconCache();

    expect(renderer.clearCacheCalls).toBe(1);
  });
});
