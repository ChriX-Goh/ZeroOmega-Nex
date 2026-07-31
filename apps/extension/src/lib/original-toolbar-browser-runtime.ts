import {
  OriginalToolbarActionAdapter,
  type OriginalToolbarActionApi,
  type OriginalToolbarActionIconPaths,
} from './original-toolbar-action-adapter';
import { OriginalToolbarActionExecutor } from './original-toolbar-action-executor';
import {
  currentOriginalToolbarCanvasFactory,
  OriginalToolbarIconRenderer,
  type OriginalToolbarCanvasFactory,
} from './original-toolbar-icon-renderer';
import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import type {
  OriginalToolbarCoordinatorExecutor,
  OriginalToolbarTabsApi,
} from './original-toolbar-tab-coordinator';

export const ORIGINAL_TOOLBAR_BADGE_BACKGROUND_COLOR = '#d90000';
export const ORIGINAL_TOOLBAR_RUNTIME_POPUP = 'popup-iframe.html';

export const ORIGINAL_TOOLBAR_FALLBACK_ICON_PATHS: OriginalToolbarActionIconPaths = {
  16: 'icon/original-action-16.png',
  19: 'icon/original-action-19.png',
  24: 'icon/original-action-24.png',
  32: 'icon/original-action-32.png',
};

export interface OriginalToolbarBrowserRuntimeApi {
  readonly action: OriginalToolbarActionApi;
  readonly i18n: OriginalToolbarI18nApi;
  readonly tabs: OriginalToolbarTabsApi;
}

export interface OriginalToolbarBrowserRuntimeOptions {
  readonly canvasFactory?: OriginalToolbarCanvasFactory;
  readonly onIconError?: (error: unknown) => void;
}

export interface OriginalToolbarBrowserRuntime {
  readonly tabs: OriginalToolbarTabsApi;
  readonly executor: OriginalToolbarCoordinatorExecutor;
}

/**
 * Construct the real browser boundary for the already-isolated original
 * toolbar pipeline without selecting profiles or registering tab listeners.
 *
 * Keeping construction separate from background registration lets the
 * repository-backed resolver and lifecycle ownership be added in auditable
 * slices instead of creating another competing Action writer.
 */
export function createOriginalToolbarBrowserRuntime(
  api: OriginalToolbarBrowserRuntimeApi,
  options: OriginalToolbarBrowserRuntimeOptions = {},
): OriginalToolbarBrowserRuntime {
  const action = new OriginalToolbarActionAdapter(api.action);
  const renderer = new OriginalToolbarIconRenderer(
    options.canvasFactory ?? currentOriginalToolbarCanvasFactory(),
    options.onIconError === undefined ? {} : { onFirstError: options.onIconError },
  );
  const executor = new OriginalToolbarActionExecutor({
    action,
    renderer,
    i18n: api.i18n,
    badgeBackgroundColor: ORIGINAL_TOOLBAR_BADGE_BACKGROUND_COLOR,
    popup: ORIGINAL_TOOLBAR_RUNTIME_POPUP,
    fallbackIconPaths: ORIGINAL_TOOLBAR_FALLBACK_ICON_PATHS,
  });

  return { tabs: api.tabs, executor };
}

export function currentOriginalToolbarBrowserRuntimeApi(): OriginalToolbarBrowserRuntimeApi {
  return {
    action: browser.action as unknown as OriginalToolbarActionApi,
    i18n: browser.i18n as unknown as OriginalToolbarI18nApi,
    tabs: browser.tabs as unknown as OriginalToolbarTabsApi,
  };
}
