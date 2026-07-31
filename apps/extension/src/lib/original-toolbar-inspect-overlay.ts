import type { InspectRuntimeApi } from './inspect-runtime';
import type { OriginalToolbarActionApi } from './original-toolbar-action-adapter';
import type { OriginalToolbarCoordinatorExecutor } from './original-toolbar-tab-coordinator';

interface OriginalToolbarInspectOverlay {
  readonly badgeText: string;
  readonly badgeBackgroundColor?: string;
  readonly title?: string;
}

export type OriginalToolbarInspectRefreshListener = (tabId: number) => void;

/**
 * Convert Inspect's legacy field-by-field Action writes into an overlay that is
 * applied by the toolbar executor after the base per-tab state.
 *
 * The Inspect runtime receives `inspectAction` and therefore never mutates the
 * real browser Action directly. The wrapped executor remains the sole browser
 * writer and reapplies the active Inspect title/Badge after every base refresh.
 */
export class OriginalToolbarInspectOverlayManager {
  readonly #action: OriginalToolbarActionApi;
  readonly #baseExecutor: OriginalToolbarCoordinatorExecutor;
  readonly #overlays = new Map<number, OriginalToolbarInspectOverlay>();
  readonly #pendingRefreshes = new Set<number>();
  #refreshListener: OriginalToolbarInspectRefreshListener | undefined;
  #disposed = false;

  readonly inspectAction: InspectRuntimeApi['action'] = {
    setBadgeText: ({ tabId, text }) => {
      if (this.#disposed) return;
      if (text.length === 0) {
        this.#overlays.delete(tabId);
      } else {
        const current = this.#overlays.get(tabId);
        this.#overlays.set(tabId, { ...current, badgeText: text });
      }
      this.scheduleRefresh(tabId);
    },
    setBadgeBackgroundColor: ({ tabId, color }) => {
      if (this.#disposed) return;
      const current = this.#overlays.get(tabId);
      if (current === undefined) return;
      this.#overlays.set(tabId, { ...current, badgeBackgroundColor: color });
      this.scheduleRefresh(tabId);
    },
    setTitle: ({ tabId, title }) => {
      if (this.#disposed) return;
      const current = this.#overlays.get(tabId);
      if (current === undefined) return;
      this.#overlays.set(tabId, { ...current, title });
      this.scheduleRefresh(tabId);
    },
  };

  readonly executor: OriginalToolbarCoordinatorExecutor = {
    apply: async (tabId, state) => {
      await this.#baseExecutor.apply(tabId, state);
      await this.applyOverlay(tabId);
    },
    applyDefault: async (tabId) => {
      await this.#baseExecutor.applyDefault(tabId);
      await this.applyOverlay(tabId);
    },
    clearIconCache: () => this.#baseExecutor.clearIconCache(),
  };

  constructor(action: OriginalToolbarActionApi, baseExecutor: OriginalToolbarCoordinatorExecutor) {
    this.#action = action;
    this.#baseExecutor = baseExecutor;
  }

  setRefreshListener(listener: OriginalToolbarInspectRefreshListener | undefined): void {
    this.#refreshListener = listener;
  }

  clear(tabId: number): void {
    if (this.#disposed || !this.#overlays.delete(tabId)) return;
    this.scheduleRefresh(tabId);
  }

  dispose(): void {
    this.#disposed = true;
    this.#refreshListener = undefined;
    this.#overlays.clear();
    this.#pendingRefreshes.clear();
  }

  private scheduleRefresh(tabId: number): void {
    if (this.#pendingRefreshes.has(tabId)) return;
    this.#pendingRefreshes.add(tabId);
    queueMicrotask(() => {
      this.#pendingRefreshes.delete(tabId);
      if (!this.#disposed) this.#refreshListener?.(tabId);
    });
  }

  private async applyOverlay(tabId: number): Promise<void> {
    const overlay = this.#overlays.get(tabId);
    if (overlay === undefined) return;

    await Promise.all([
      Promise.resolve(this.#action.setBadgeText({ tabId, text: overlay.badgeText })),
      overlay.badgeBackgroundColor === undefined
        ? Promise.resolve()
        : Promise.resolve(
            this.#action.setBadgeBackgroundColor({
              tabId,
              color: overlay.badgeBackgroundColor,
            }),
          ),
      overlay.title === undefined
        ? Promise.resolve()
        : Promise.resolve(this.#action.setTitle({ tabId, title: overlay.title })),
    ]);
  }
}
