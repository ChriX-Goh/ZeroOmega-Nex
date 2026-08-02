import type {
  OriginalToolbarActionApi,
  OriginalToolbarActionIconPaths,
  OriginalToolbarActionImageDataSet,
} from './original-toolbar-action-adapter';
import type { OriginalToolbarBrowserRuntimeApi } from './original-toolbar-browser-runtime';
import type {
  OriginalToolbarCanvas,
  OriginalToolbarCanvasContext,
  OriginalToolbarCanvasFactory,
} from './original-toolbar-icon-renderer';
import type { OriginalToolbarRefreshAllOptions } from './original-toolbar-tab-coordinator';

export const ORIGINAL_TOOLBAR_RENDERER_E2E_CHANNEL =
  'zeroomega-nex/original-toolbar-renderer-e2e/v1';

export type OriginalToolbarRendererE2eMode = 'normal' | 'opaque';

export interface OriginalToolbarRendererE2eIconWrite {
  readonly tabId?: number;
  readonly kind: 'imageData' | 'path' | 'empty';
  readonly sizes: readonly string[];
}

export interface OriginalToolbarRendererE2eState {
  readonly mode: OriginalToolbarRendererE2eMode;
  readonly imageReads: number;
  readonly iconWrites: readonly OriginalToolbarRendererE2eIconWrite[];
}

interface OriginalToolbarRendererE2eMessageEvent {
  addListener(
    listener: (
      message: unknown,
    ) =>
      | OriginalToolbarRendererE2eResponse
      | Promise<OriginalToolbarRendererE2eResponse>
      | undefined,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}

export interface OriginalToolbarRendererE2eRuntimeApi {
  readonly onMessage: OriginalToolbarRendererE2eMessageEvent;
}

export type OriginalToolbarRendererE2eResponse =
  | { readonly ok: true; readonly state: OriginalToolbarRendererE2eState }
  | { readonly ok: false; readonly error: string };

export interface OriginalToolbarRendererE2eProbe {
  readonly api: OriginalToolbarBrowserRuntimeApi;
  readonly canvasFactory: OriginalToolbarCanvasFactory;
  register(
    runtime: OriginalToolbarRendererE2eRuntimeApi,
    refreshAll: (options?: OriginalToolbarRefreshAllOptions) => Promise<void>,
  ): { dispose(): void };
}

interface MutableProbeState {
  mode: OriginalToolbarRendererE2eMode;
  imageReads: number;
  iconWrites: OriginalToolbarRendererE2eIconWrite[];
}

function snapshot(state: MutableProbeState): OriginalToolbarRendererE2eState {
  return {
    mode: state.mode,
    imageReads: state.imageReads,
    iconWrites: state.iconWrites.map((write) => ({ ...write, sizes: [...write.sizes] })),
  };
}

function iconWrite(details: {
  readonly tabId?: number;
  readonly imageData?: OriginalToolbarActionImageDataSet;
  readonly path?: OriginalToolbarActionIconPaths;
}): OriginalToolbarRendererE2eIconWrite {
  const source = details.imageData ?? details.path;
  return {
    ...(details.tabId === undefined ? {} : { tabId: details.tabId }),
    kind: details.imageData !== undefined ? 'imageData' : details.path !== undefined ? 'path' : 'empty',
    sizes: source === undefined ? [] : Object.keys(source).sort((left, right) => Number(left) - Number(right)),
  };
}

function wrapAction(
  action: OriginalToolbarActionApi,
  state: MutableProbeState,
): OriginalToolbarActionApi {
  return {
    setIcon(details) {
      state.iconWrites.push(iconWrite(details));
      return action.setIcon(details);
    },
    setTitle: (details) => action.setTitle(details),
    setBadgeText: (details) => action.setBadgeText(details),
    setBadgeBackgroundColor: (details) => action.setBadgeBackgroundColor(details),
    setPopup: (details) => action.setPopup(details),
  };
}

function wrapContext(
  context: OriginalToolbarCanvasContext,
  state: MutableProbeState,
): OriginalToolbarCanvasContext {
  return new Proxy(context, {
    get(target, property) {
      if (property === 'getImageData') {
        return (x: number, y: number, width: number, height: number) => {
          state.imageReads += 1;
          const image = target.getImageData(x, y, width, height);
          if (state.mode === 'opaque' && image.data.length >= 4) image.data[3] = 255;
          return image;
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, property, value) {
      return Reflect.set(target, property, value, target);
    },
  });
}

function wrapCanvasFactory(
  factory: OriginalToolbarCanvasFactory,
  state: MutableProbeState,
): OriginalToolbarCanvasFactory {
  const contexts = new WeakMap<OriginalToolbarCanvasContext, OriginalToolbarCanvasContext>();
  return (width, height): OriginalToolbarCanvas => {
    const canvas = factory(width, height);
    return {
      getContext(contextId, options) {
        const context = canvas.getContext(contextId, options);
        if (context === null) return null;
        const existing = contexts.get(context);
        if (existing !== undefined) return existing;
        const wrapped = wrapContext(context, state);
        contexts.set(context, wrapped);
        return wrapped;
      },
    };
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createOriginalToolbarRendererE2eProbe(
  api: OriginalToolbarBrowserRuntimeApi,
  canvasFactory: OriginalToolbarCanvasFactory,
  enabled = import.meta.env.WXT_ICON_RENDERER_E2E === '1',
): OriginalToolbarRendererE2eProbe | undefined {
  if (!enabled) return undefined;

  const state: MutableProbeState = {
    mode: 'normal',
    imageReads: 0,
    iconWrites: [],
  };

  return {
    api: { ...api, action: wrapAction(api.action, state) },
    canvasFactory: wrapCanvasFactory(canvasFactory, state),
    register(runtime, refreshAll) {
      const listener = async (message: unknown): Promise<OriginalToolbarRendererE2eResponse> => {
        if (
          !message ||
          typeof message !== 'object' ||
          (message as { channel?: unknown }).channel !== ORIGINAL_TOOLBAR_RENDERER_E2E_CHANNEL
        ) {
          return { ok: false, error: 'unsupported renderer E2E message' };
        }
        const command = message as {
          readonly action?: unknown;
          readonly mode?: unknown;
          readonly reset?: unknown;
          readonly clearIconCache?: unknown;
        };
        try {
          if (command.action === 'configure') {
            if (command.mode !== 'normal' && command.mode !== 'opaque') {
              return { ok: false, error: 'renderer E2E mode must be normal or opaque' };
            }
            state.mode = command.mode;
            if (command.reset === true) {
              state.imageReads = 0;
              state.iconWrites = [];
            }
          } else if (command.action === 'refresh') {
            await refreshAll(command.clearIconCache === true ? { clearIconCache: true } : {});
          } else if (command.action !== 'inspect') {
            return { ok: false, error: 'unsupported renderer E2E action' };
          }
          return { ok: true, state: snapshot(state) };
        } catch (error) {
          return { ok: false, error: errorMessage(error) };
        }
      };
      const routedListener = (message: unknown) => {
        if (
          !message ||
          typeof message !== 'object' ||
          (message as { channel?: unknown }).channel !== ORIGINAL_TOOLBAR_RENDERER_E2E_CHANNEL
        ) {
          return undefined;
        }
        return listener(message);
      };
      runtime.onMessage.addListener(routedListener);
      return {
        dispose() {
          runtime.onMessage.removeListener(routedListener);
        },
      };
    },
  };
}
