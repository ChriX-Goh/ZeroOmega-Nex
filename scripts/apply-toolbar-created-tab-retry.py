from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


source_path = Path("apps/extension/src/lib/original-toolbar-tab-coordinator.ts")
source = source_path.read_text(encoding="utf-8")
source = replace_once(
    source,
    """export interface OriginalToolbarTabCoordinatorOptions {
  readonly tabs: OriginalToolbarTabsApi;
  readonly resolver: OriginalToolbarTabStateResolver;
  readonly executor: OriginalToolbarCoordinatorExecutor;
  readonly onError?: (error: unknown, context: OriginalToolbarCoordinatorErrorContext) => void;
}""",
    """export interface OriginalToolbarTabCoordinatorOptions {
  readonly tabs: OriginalToolbarTabsApi;
  readonly resolver: OriginalToolbarTabStateResolver;
  readonly executor: OriginalToolbarCoordinatorExecutor;
  readonly onError?: (error: unknown, context: OriginalToolbarCoordinatorErrorContext) => void;
  readonly wait?: (milliseconds: number) => Promise<void>;
  readonly createdTabRetryDelays?: readonly number[];
}""",
    "coordinator retry options",
)
source = replace_once(
    source,
    """export interface OriginalToolbarRefreshAllOptions {
  readonly clearIconCache?: boolean;
}""",
    """export interface OriginalToolbarRefreshAllOptions {
  readonly clearIconCache?: boolean;
}

const DEFAULT_CREATED_TAB_RETRY_DELAYS = [0, 25, 100, 250, 500, 1_000, 2_000] as const;

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isTransientCreatedTabUrl(url: string | undefined): boolean {
  return url === undefined || url.length === 0 || url.startsWith('about:');
}""",
    "coordinator retry helpers",
)
source = replace_once(
    source,
    """  readonly #onError: (error: unknown, context: OriginalToolbarCoordinatorErrorContext) => void;
  readonly #sequences = new Map<number, number>();
  readonly #queues = new Map<number, Promise<void>>();
""",
    """  readonly #onError: (error: unknown, context: OriginalToolbarCoordinatorErrorContext) => void;
  readonly #wait: (milliseconds: number) => Promise<void>;
  readonly #createdTabRetryDelays: readonly number[];
  readonly #sequences = new Map<number, number>();
  readonly #queues = new Map<number, Promise<void>>();
  readonly #createdTabRetries = new Map<number, symbol>();
""",
    "coordinator retry fields",
)
source = replace_once(
    source,
    """  readonly #updatedListener: OriginalToolbarUpdatedListener = (tabId, changeInfo, tab) => {
    if (changeInfo.url === undefined && changeInfo.status !== 'complete') return;
    const url = changeInfo.url ?? tab.url;
    void (url === undefined ? this.refreshTab(tabId) : this.refreshTab(tabId, url));
  };

  readonly #createdListener: OriginalToolbarCreatedListener = (tab) => {
    if (tab.id === undefined) return;
    void (tab.url === undefined ? this.refreshTab(tab.id) : this.refreshTab(tab.id, tab.url));
  };""",
    """  readonly #updatedListener: OriginalToolbarUpdatedListener = (tabId, changeInfo, tab) => {
    if (changeInfo.url === undefined && changeInfo.status !== 'complete') return;
    const url = changeInfo.url ?? tab.url;
    if (!isTransientCreatedTabUrl(url)) this.#createdTabRetries.delete(tabId);
    void (url === undefined ? this.refreshTab(tabId) : this.refreshTab(tabId, url));
  };

  readonly #createdListener: OriginalToolbarCreatedListener = (tab) => {
    if (tab.id === undefined) return;
    const token = Symbol();
    this.#createdTabRetries.set(tab.id, token);
    void this.refreshCreatedTab(tab.id, tab.url, this.#lifecycleEpoch, token);
  };""",
    "coordinator created-tab listeners",
)
source = replace_once(
    source,
    """    this.#resolver = options.resolver;
    this.#executor = options.executor;
    this.#onError = options.onError ?? (() => undefined);
""",
    """    this.#resolver = options.resolver;
    this.#executor = options.executor;
    this.#onError = options.onError ?? (() => undefined);
    this.#wait = options.wait ?? waitFor;
    this.#createdTabRetryDelays =
      options.createdTabRetryDelays ?? DEFAULT_CREATED_TAB_RETRY_DELAYS;
""",
    "coordinator retry constructor",
)
source = replace_once(
    source,
    """    this.#lifecycleEpoch += 1;
    this.#sequences.clear();
    this.#queues.clear();
""",
    """    this.#lifecycleEpoch += 1;
    this.#sequences.clear();
    this.#queues.clear();
    this.#createdTabRetries.clear();
""",
    "coordinator retry stop",
)
source = replace_once(
    source,
    """  async refreshAll(options: OriginalToolbarRefreshAllOptions = {}): Promise<void> {""",
    """  private async refreshCreatedTab(
    tabId: number,
    initialUrl: string | undefined,
    epoch: number,
    token: symbol,
  ): Promise<void> {
    await (initialUrl === undefined ? this.refreshTab(tabId) : this.refreshTab(tabId, initialUrl));
    if (!this.isCreatedRetryCurrent(tabId, epoch, token)) return;
    if (!isTransientCreatedTabUrl(initialUrl)) {
      this.#createdTabRetries.delete(tabId);
      return;
    }

    for (const delay of this.#createdTabRetryDelays) {
      await this.#wait(delay);
      if (!this.isCreatedRetryCurrent(tabId, epoch, token)) return;

      let tab: OriginalToolbarCoordinatorTab;
      try {
        tab = await this.#tabs.get(tabId);
      } catch (error) {
        this.#createdTabRetries.delete(tabId);
        this.report(error, { phase: 'get-tab', tabId });
        return;
      }

      if (!this.isCreatedRetryCurrent(tabId, epoch, token)) return;
      if (isTransientCreatedTabUrl(tab.url)) continue;

      this.#createdTabRetries.delete(tabId);
      await this.refreshTab(tabId, tab.url);
      return;
    }

    if (this.isCreatedRetryCurrent(tabId, epoch, token)) {
      this.#createdTabRetries.delete(tabId);
    }
  }

  async refreshAll(options: OriginalToolbarRefreshAllOptions = {}): Promise<void> {""",
    "coordinator created-tab retry method",
)
source = replace_once(
    source,
    """  private isCurrent(tabId: number, sequence: number, epoch: number): boolean {
    return this.#lifecycleEpoch === epoch && this.#sequences.get(tabId) === sequence;
  }

  private report""",
    """  private isCurrent(tabId: number, sequence: number, epoch: number): boolean {
    return this.#lifecycleEpoch === epoch && this.#sequences.get(tabId) === sequence;
  }

  private isCreatedRetryCurrent(tabId: number, epoch: number, token: symbol): boolean {
    return (
      this.#started &&
      this.#lifecycleEpoch === epoch &&
      this.#createdTabRetries.get(tabId) === token
    );
  }

  private report""",
    "coordinator retry currency",
)
source_path.write_text(source, encoding="utf-8")


test_path = Path("apps/extension/src/lib/original-toolbar-tab-coordinator.test.ts")
test = test_path.read_text(encoding="utf-8")
test = replace_once(
    test,
    """function createHarness() {
  const tabs = new RecordingTabsApi();
  const resolver = new RecordingResolver();
  const executor = new RecordingExecutor();
  const onError = vi.fn();
  const coordinator = new OriginalToolbarTabCoordinator({
    tabs,
    resolver,
    executor,
    onError,
  });
  return { tabs, resolver, executor, onError, coordinator };
}""",
    """function createHarness(
  options: {
    readonly wait?: (milliseconds: number) => Promise<void>;
    readonly createdTabRetryDelays?: readonly number[];
  } = {},
) {
  const tabs = new RecordingTabsApi();
  const resolver = new RecordingResolver();
  const executor = new RecordingExecutor();
  const onError = vi.fn();
  const coordinator = new OriginalToolbarTabCoordinator({
    tabs,
    resolver,
    executor,
    onError,
    ...options,
  });
  return { tabs, resolver, executor, onError, coordinator };
}""",
    "coordinator test harness options",
)
test = replace_once(
    test,
    """  it('discards an older in-flight result before the newer URL writes Action state', async () => {""",
    """  it('re-reads a transient created-tab URL until Firefox exposes the navigated URL', async () => {
    const waits: Array<ReturnType<typeof deferred<void>>> = [];
    const { tabs, resolver, executor, coordinator } = createHarness({
      wait: () => {
        const pending = deferred<void>();
        waits.push(pending);
        return pending.promise;
      },
      createdTabRetryDelays: [10, 20],
    });
    resolver.implementation = ({ url }) =>
      url.startsWith('about:') ? undefined : state(url);
    tabs.tabs.set(41, { id: 41, url: 'about:blank' });
    coordinator.start();

    tabs.onCreated.emit((listener) => listener({ id: 41, url: 'about:blank' }));
    await flushEvents();
    expect(executor.calls).toEqual([{ type: 'default', tabId: 41 }]);
    expect(waits).toHaveLength(1);

    tabs.tabs.set(41, { id: 41, url: 'https://navigated.test/' });
    waits[0]!.resolve();
    await flushEvents();
    await flushEvents();

    expect(tabs.getCalls).toEqual([41]);
    expect(resolver.calls).toEqual([
      { tabId: 41, url: 'about:blank' },
      { tabId: 41, url: 'https://navigated.test/' },
    ]);
    expect(executor.calls).toEqual([
      { type: 'default', tabId: 41 },
      { type: 'apply', tabId: 41, state: state('https://navigated.test/') },
    ]);
  });

  it('cancels a created-tab retry when a real URL update arrives first', async () => {
    const pendingWait = deferred<void>();
    const { tabs, resolver, executor, coordinator } = createHarness({
      wait: () => pendingWait.promise,
      createdTabRetryDelays: [10],
    });
    resolver.implementation = ({ url }) =>
      url.startsWith('about:') ? undefined : state(url);
    tabs.tabs.set(43, { id: 43, url: 'about:blank' });
    coordinator.start();

    tabs.onCreated.emit((listener) => listener({ id: 43, url: 'about:blank' }));
    await flushEvents();
    tabs.onUpdated.emit((listener) =>
      listener(43, { url: 'https://updated-first.test/' }, { id: 43, url: 'https://updated-first.test/' }),
    );
    await flushEvents();
    pendingWait.resolve();
    await flushEvents();

    expect(tabs.getCalls).toEqual([]);
    expect(executor.calls).toEqual([
      { type: 'default', tabId: 43 },
      { type: 'apply', tabId: 43, state: state('https://updated-first.test/') },
    ]);
  });

  it('invalidates a pending created-tab retry when stopped', async () => {
    const pendingWait = deferred<void>();
    const { tabs, resolver, executor, coordinator } = createHarness({
      wait: () => pendingWait.promise,
      createdTabRetryDelays: [10],
    });
    resolver.implementation = () => undefined;
    tabs.tabs.set(47, { id: 47, url: 'about:blank' });
    coordinator.start();

    tabs.onCreated.emit((listener) => listener({ id: 47, url: 'about:blank' }));
    await flushEvents();
    coordinator.stop();
    pendingWait.resolve();
    await flushEvents();

    expect(tabs.getCalls).toEqual([]);
    expect(executor.calls).toEqual([{ type: 'default', tabId: 47 }]);
  });

  it('discards an older in-flight result before the newer URL writes Action state', async () => {""",
    "coordinator created-tab retry tests",
)
test_path.write_text(test, encoding="utf-8")
