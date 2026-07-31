import type { InspectRuntimeApi } from './inspect-runtime';
import {
  createOriginalToolbarBrowserRuntime,
  type OriginalToolbarBrowserRuntimeApi,
  type OriginalToolbarBrowserRuntimeOptions,
} from './original-toolbar-browser-runtime';
import { OriginalToolbarInspectOverlayManager } from './original-toolbar-inspect-overlay';
import {
  OriginalToolbarProfileResolver,
  type OriginalToolbarProfileStateRepository,
  type OriginalToolbarRuntimeInspector,
} from './original-toolbar-profile-resolver';
import {
  OriginalToolbarTabCoordinator,
  type OriginalToolbarCoordinatorErrorContext,
  type OriginalToolbarEvent,
  type OriginalToolbarRefreshAllOptions,
} from './original-toolbar-tab-coordinator';

export type OriginalToolbarTabRemovedListener = (tabId: number) => void;

export interface OriginalToolbarRuntimeOptions {
  readonly api: OriginalToolbarBrowserRuntimeApi;
  readonly repository: OriginalToolbarProfileStateRepository;
  readonly runtime: OriginalToolbarRuntimeInspector;
  readonly tabRemoved?: OriginalToolbarEvent<OriginalToolbarTabRemovedListener>;
  readonly browserRuntime?: OriginalToolbarBrowserRuntimeOptions;
  readonly onError?: (error: unknown, context: OriginalToolbarCoordinatorErrorContext) => void;
}

export interface RegisteredOriginalToolbarRuntime {
  readonly inspectAction: InspectRuntimeApi['action'];
  refreshAll(options?: OriginalToolbarRefreshAllOptions): Promise<void>;
  dispose(): void;
}

/**
 * Register the single owner of all real browser Action writes.
 *
 * Base URL/profile state flows through the coordinator and executor. Inspect
 * receives an intercepted Action API whose title/Badge requests are stored as
 * overlays and reapplied by that same executor. No second runtime writes the
 * real Action directly.
 */
export function registerOriginalToolbarRuntime(
  options: OriginalToolbarRuntimeOptions,
): RegisteredOriginalToolbarRuntime {
  const browserRuntime = createOriginalToolbarBrowserRuntime(options.api, options.browserRuntime);
  const resolver = new OriginalToolbarProfileResolver({
    repository: options.repository,
    runtime: options.runtime,
    i18n: options.api.i18n,
  });
  const overlay = new OriginalToolbarInspectOverlayManager(
    options.api.action,
    browserRuntime.executor,
  );
  const coordinator = new OriginalToolbarTabCoordinator({
    tabs: browserRuntime.tabs,
    resolver,
    executor: overlay.executor,
    ...(options.onError === undefined ? {} : { onError: options.onError }),
  });
  const tabRemovedListener: OriginalToolbarTabRemovedListener = (tabId) => overlay.discard(tabId);
  let disposed = false;

  overlay.setRefreshListener((tabId) => {
    void coordinator.refreshTab(tabId);
  });
  coordinator.start();
  options.tabRemoved?.addListener(tabRemovedListener);

  return {
    inspectAction: overlay.inspectAction,
    refreshAll: (refreshOptions = {}) =>
      disposed ? Promise.resolve() : coordinator.refreshAll(refreshOptions),
    dispose() {
      if (disposed) return;
      disposed = true;
      options.tabRemoved?.removeListener(tabRemovedListener);
      overlay.setRefreshListener(undefined);
      coordinator.stop();
      overlay.dispose();
    },
  };
}
