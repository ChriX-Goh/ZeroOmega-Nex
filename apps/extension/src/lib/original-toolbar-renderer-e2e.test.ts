import { describe, expect, it, vi } from 'vitest';

import type {
  OriginalToolbarActionApi,
  OriginalToolbarActionImageDataSet,
} from './original-toolbar-action-adapter';
import type { OriginalToolbarBrowserRuntimeApi } from './original-toolbar-browser-runtime';
import type {
  OriginalToolbarCanvas,
  OriginalToolbarCanvasContext,
} from './original-toolbar-icon-renderer';
import {
  createOriginalToolbarRendererE2eProbe,
  ORIGINAL_TOOLBAR_RENDERER_E2E_CHANNEL,
  type OriginalToolbarRendererE2eResponse,
  type OriginalToolbarRendererE2eRuntimeApi,
} from './original-toolbar-renderer-e2e';
import type { OriginalToolbarTabsApi } from './original-toolbar-tab-coordinator';

class RecordingAction implements OriginalToolbarActionApi {
  readonly iconWrites: unknown[] = [];

  setIcon(details: unknown): void {
    this.iconWrites.push(details);
  }

  setTitle(): void {}
  setBadgeText(): void {}
  setBadgeBackgroundColor(): void {}
  setPopup(): void {}
}

class TransparentContext implements OriginalToolbarCanvasContext {
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
  readonly context = new TransparentContext();

  getContext(): OriginalToolbarCanvasContext {
    return this.context;
  }
}

class MessageRuntime implements OriginalToolbarRendererE2eRuntimeApi {
  listener:
    | ((message: unknown) => OriginalToolbarRendererE2eResponse | Promise<OriginalToolbarRendererE2eResponse> | undefined)
    | undefined;

  readonly onMessage = {
    addListener: (
      listener: (
        message: unknown,
      ) => OriginalToolbarRendererE2eResponse | Promise<OriginalToolbarRendererE2eResponse> | undefined,
    ) => {
      this.listener = listener;
    },
    removeListener: (listener: (message: unknown) => unknown) => {
      if (this.listener === listener) this.listener = undefined;
    },
  };

  async send(message: unknown): Promise<OriginalToolbarRendererE2eResponse | undefined> {
    return this.listener?.(message);
  }
}

function tabs(): OriginalToolbarTabsApi {
  return {
    onUpdated: { addListener(): void {}, removeListener(): void {} },
    onActivated: { addListener(): void {}, removeListener(): void {} },
    onCreated: { addListener(): void {}, removeListener(): void {} },
    async get(tabId) {
      return { id: tabId, url: 'https://example.test/' };
    },
    async query() {
      return [];
    },
  };
}

function api(action: RecordingAction): OriginalToolbarBrowserRuntimeApi {
  return {
    action,
    tabs: tabs(),
    i18n: { getMessage: () => '' },
  };
}

describe('original toolbar renderer E2E probe', () => {
  it('is absent from normal builds unless explicitly enabled', () => {
    const action = new RecordingAction();
    expect(
      createOriginalToolbarRendererE2eProbe(api(action), () => new TransparentCanvas(), false),
    ).toBeUndefined();
  });

  it('records forced opaque reads and Action writes only through the test channel', async () => {
    const action = new RecordingAction();
    const probe = createOriginalToolbarRendererE2eProbe(
      api(action),
      () => new TransparentCanvas(),
      true,
    );
    expect(probe).toBeDefined();
    if (!probe) throw new Error('renderer E2E probe was not created');

    const runtime = new MessageRuntime();
    const refreshAll = vi.fn(async () => undefined);
    const registration = probe.register(runtime, refreshAll);

    expect(await runtime.send({ channel: 'other', action: 'inspect' })).toBeUndefined();
    expect(
      await runtime.send({
        channel: ORIGINAL_TOOLBAR_RENDERER_E2E_CHANNEL,
        action: 'configure',
        mode: 'opaque',
        reset: true,
      }),
    ).toEqual({
      ok: true,
      state: { mode: 'opaque', imageReads: 0, iconWrites: [] },
    });

    const context = probe.canvasFactory(300, 300).getContext('2d', {
      willReadFrequently: true,
    });
    expect(context).not.toBeNull();
    const image = context?.getImageData(0, 0, 16, 16);
    expect(image?.data[3]).toBe(255);

    const imageData: OriginalToolbarActionImageDataSet = {
      16: { width: 16, height: 16, data: new Uint8ClampedArray(16 * 16 * 4) },
      38: { width: 38, height: 38, data: new Uint8ClampedArray(38 * 38 * 4) },
    };
    await probe.api.action.setIcon({ tabId: 9, imageData });
    expect(action.iconWrites).toHaveLength(1);

    const inspected = await runtime.send({
      channel: ORIGINAL_TOOLBAR_RENDERER_E2E_CHANNEL,
      action: 'inspect',
    });
    expect(inspected).toEqual({
      ok: true,
      state: {
        mode: 'opaque',
        imageReads: 1,
        iconWrites: [{ tabId: 9, kind: 'imageData', sizes: ['16', '38'] }],
      },
    });

    expect(
      await runtime.send({
        channel: ORIGINAL_TOOLBAR_RENDERER_E2E_CHANNEL,
        action: 'refresh',
        clearIconCache: true,
      }),
    ).toMatchObject({ ok: true });
    expect(refreshAll).toHaveBeenCalledWith({ clearIconCache: true });

    registration.dispose();
    expect(runtime.listener).toBeUndefined();
  });
});
