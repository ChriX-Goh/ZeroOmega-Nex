import type { OriginalToolbarTabState } from './original-toolbar-tab-state';

export interface OriginalToolbarCoordinatorTab {
  readonly id?: number;
  readonly url?: string;
}

export interface OriginalToolbarCoordinatorTabChangeInfo {
  readonly url?: string;
  readonly status?: 'loading' | 'complete';
}

export interface OriginalToolbarCoordinatorActiveInfo {
  readonly tabId: number;
}

export type OriginalToolbarUpdatedListener = (
  tabId: number,
  changeInfo: OriginalToolbarCoordinatorTabChangeInfo,
  tab: OriginalToolbarCoordinatorTab,
) => void;

export type OriginalToolbarActivatedListener = (
  activeInfo: OriginalToolbarCoordinatorActiveInfo,
) => void;

export type OriginalToolbarCreatedListener = (tab: OriginalToolbarCoordinatorTab) => void;

export interface OriginalToolbarEvent<Listener> {
  addListener(listener: Listener): void;
  removeListener(listener: Listener): void;
}

export interface OriginalToolbarTabsApi {
  readonly onUpdated: OriginalToolbarEvent<OriginalToolbarUpdatedListener>;
  readonly onActivated: OriginalToolbarEvent<OriginalToolbarActivatedListener>;
  readonly onCreated: OriginalToolbarEvent<OriginalToolbarCreatedListener>;
  get(tabId: number): Promise<OriginalToolbarCoordinatorTab>;
  query(queryInfo: Record<string, never>): Promise<readonly OriginalToolbarCoordinatorTab[]>;
}

export interface OriginalToolbarTabStateResolver {
  resolve(input: {
    readonly tabId: number;
    readonly url: string;
  }): Promise<OriginalToolbarTabState | undefined> | OriginalToolbarTabState | undefined;
}

export interface OriginalToolbarCoordinatorExecutor {
  apply(tabId: number, state: OriginalToolbarTabState): Promise<void>;
  applyDefault(tabId: number): Promise<void>;
  applyGlobal(state: OriginalToolbarTabState): Promise<void>;
  applyGlobalDefault(): Promise<void>;
  clearIconCache(): void;
}

export type OriginalToolbarCoordinatorErrorPhase =
  | 'get-tab'
  | 'query-tabs'
  | 'resolve-state'
  | 'apply-state'
  | 'apply-default'
  | 'resolve-global'
  | 'apply-global'
  | 'apply-global-default';

export interface OriginalToolbarCoordinatorErrorContext {
  readonly phase: OriginalToolbarCoordinatorErrorPhase;
  readonly tabId?: number;
  readonly url?: string;
}

export interface OriginalToolbarTabCoordinatorOptions {
  readonly tabs: OriginalToolbarTabsApi;
  readonly resolver: OriginalToolbarTabStateResolver;
  readonly executor: OriginalToolbarCoordinatorExecutor;
  readonly onError?: (error: unknown, context: OriginalToolbarCoordinatorErrorContext) => void;
}

export interface OriginalToolbarRefreshAllOptions {
  readonly clearIconCache?: boolean;
}

/**
 * Coordinate already-derived original toolbar state independently per tab.
 *
 * Every refresh receives a per-tab sequence and lifecycle epoch. Resolution is
 * serialized per tab, stale work is discarded before Action mutation, and a
 * newer refresh always runs after an older in-flight write. The final visible
 * state therefore follows the newest URL/profile refresh rather than whichever
 * asynchronous resolver happened to finish last.
 */
export class OriginalToolbarTabCoordinator {
  readonly #tabs: OriginalToolbarTabsApi;
  readonly #resolver: OriginalToolbarTabStateResolver;
  readonly #executor: OriginalToolbarCoordinatorExecutor;
  readonly #onError: (error: unknown, context: OriginalToolbarCoordinatorErrorContext) => void;
  readonly #sequences = new Map<number, number>();
  readonly #queues = new Map<number, Promise<void>>();
  #lifecycleEpoch = 0;
  #started = false;

  readonly #updatedListener: OriginalToolbarUpdatedListener = (tabId, changeInfo, tab) => {
    if (changeInfo.url === undefined && changeInfo.status !== 'complete') return;
    const url = changeInfo.url ?? tab.url;
    void (url === undefined ? this.refreshTab(tabId) : this.refreshTab(tabId, url));
  };

  readonly #createdListener: OriginalToolbarCreatedListener = (tab) => {
    if (tab.id === undefined) return;
    void (tab.url === undefined ? this.refreshTab(tab.id) : this.refreshTab(tab.id, tab.url));
  };

  readonly #activatedListener: OriginalToolbarActivatedListener = ({ tabId }) => {
    void this.refreshTab(tabId);
  };

  constructor(options: OriginalToolbarTabCoordinatorOptions) {
    this.#tabs = options.tabs;
    this.#resolver = options.resolver;
    this.#executor = options.executor;
    this.#onError = options.onError ?? (() => undefined);
  }

  start(): void {
    if (this.#started) return;
    this.#started = true;
    this.#tabs.onUpdated.addListener(this.#updatedListener);
    this.#tabs.onActivated.addListener(this.#activatedListener);
    this.#tabs.onCreated.addListener(this.#createdListener);
  }

  stop(): void {
    if (!this.#started) return;
    this.#started = false;
    this.#tabs.onUpdated.removeListener(this.#updatedListener);
    this.#tabs.onActivated.removeListener(this.#activatedListener);
    this.#tabs.onCreated.removeListener(this.#createdListener);
    this.#lifecycleEpoch += 1;
    this.#sequences.clear();
    this.#queues.clear();
  }

  refreshTab(tabId: number, knownUrl?: string): Promise<void> {
    const sequence = (this.#sequences.get(tabId) ?? 0) + 1;
    const epoch = this.#lifecycleEpoch;
    this.#sequences.set(tabId, sequence);

    return this.enqueue(tabId, async () => {
      if (!this.isCurrent(tabId, sequence, epoch)) return;

      let url = knownUrl;
      if (url === undefined) {
        try {
          url = (await this.#tabs.get(tabId)).url;
        } catch (error) {
          this.report(error, { phase: 'get-tab', tabId });
          return;
        }
      }

      if (!this.isCurrent(tabId, sequence, epoch)) return;
      if (url === undefined || url.length === 0) {
        await this.applyDefault(tabId, sequence, epoch);
        return;
      }

      let state: OriginalToolbarTabState | undefined;
      try {
        state = await this.#resolver.resolve({ tabId, url });
      } catch (error) {
        this.report(error, { phase: 'resolve-state', tabId, url });
        await this.applyDefault(tabId, sequence, epoch);
        return;
      }

      if (!this.isCurrent(tabId, sequence, epoch)) return;
      if (state === undefined) {
        await this.applyDefault(tabId, sequence, epoch, url);
        return;
      }

      try {
        await this.#executor.apply(tabId, state);
      } catch (error) {
        this.report(error, { phase: 'apply-state', tabId, url });
        await this.applyDefault(tabId, sequence, epoch, url);
      }
    });
  }

  async refreshAll(options: OriginalToolbarRefreshAllOptions = {}): Promise<void> {
    if (options.clearIconCache === true) this.#executor.clearIconCache();
    await this.refreshGlobal();

    let tabs: readonly OriginalToolbarCoordinatorTab[];
    try {
      tabs = await this.#tabs.query({});
    } catch (error) {
      this.report(error, { phase: 'query-tabs' });
      throw error;
    }

    await Promise.all(
      tabs.flatMap((tab) =>
        tab.id === undefined
          ? []
          : [tab.url === undefined ? this.refreshTab(tab.id) : this.refreshTab(tab.id, tab.url)],
      ),
    );
  }

  private async refreshGlobal(): Promise<void> {
    let state: OriginalToolbarTabState | undefined;
    try {
      state = await this.#resolver.resolve({ tabId: -1, url: 'about:blank' });
    } catch (error) {
      this.report(error, { phase: 'resolve-global', url: 'about:blank' });
      await this.applyGlobalDefault();
      return;
    }

    if (state === undefined) {
      await this.applyGlobalDefault();
      return;
    }

    try {
      await this.#executor.applyGlobal(state);
    } catch (error) {
      this.report(error, { phase: 'apply-global', url: 'about:blank' });
      await this.applyGlobalDefault();
    }
  }

  private async applyGlobalDefault(): Promise<void> {
    try {
      await this.#executor.applyGlobalDefault();
    } catch (error) {
      this.report(error, { phase: 'apply-global-default' });
    }
  }

  private async applyDefault(
    tabId: number,
    sequence: number,
    epoch: number,
    url?: string,
  ): Promise<void> {
    if (!this.isCurrent(tabId, sequence, epoch)) return;
    try {
      await this.#executor.applyDefault(tabId);
    } catch (error) {
      this.report(error, {
        phase: 'apply-default',
        tabId,
        ...(url === undefined ? {} : { url }),
      });
    }
  }

  private enqueue(tabId: number, work: () => Promise<void>): Promise<void> {
    const previous = this.#queues.get(tabId) ?? Promise.resolve();
    const task = previous.catch(() => undefined).then(work);
    const tracked = task.finally(() => {
      if (this.#queues.get(tabId) === tracked) this.#queues.delete(tabId);
    });
    this.#queues.set(tabId, tracked);
    return tracked;
  }

  private isCurrent(tabId: number, sequence: number, epoch: number): boolean {
    return this.#lifecycleEpoch === epoch && this.#sequences.get(tabId) === sequence;
  }

  private report(error: unknown, context: OriginalToolbarCoordinatorErrorContext): void {
    this.#onError(error, context);
  }
}
