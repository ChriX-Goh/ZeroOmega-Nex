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
    """export interface OriginalToolbarCoordinatorTabChangeInfo {
  readonly url?: string;
}""",
    """export interface OriginalToolbarCoordinatorTabChangeInfo {
  readonly url?: string;
  readonly status?: 'loading' | 'complete';
}""",
    "toolbar update status",
)
source = replace_once(
    source,
    """export type OriginalToolbarActivatedListener = (
  activeInfo: OriginalToolbarCoordinatorActiveInfo,
) => void;
""",
    """export type OriginalToolbarActivatedListener = (
  activeInfo: OriginalToolbarCoordinatorActiveInfo,
) => void;

export type OriginalToolbarCreatedListener = (tab: OriginalToolbarCoordinatorTab) => void;
""",
    "toolbar created listener type",
)
source = replace_once(
    source,
    """  readonly onUpdated: OriginalToolbarEvent<OriginalToolbarUpdatedListener>;
  readonly onActivated: OriginalToolbarEvent<OriginalToolbarActivatedListener>;
""",
    """  readonly onUpdated: OriginalToolbarEvent<OriginalToolbarUpdatedListener>;
  readonly onActivated: OriginalToolbarEvent<OriginalToolbarActivatedListener>;
  readonly onCreated: OriginalToolbarEvent<OriginalToolbarCreatedListener>;
""",
    "toolbar tabs created event",
)
source = replace_once(
    source,
    """  readonly #updatedListener: OriginalToolbarUpdatedListener = (tabId, changeInfo) => {
    if (changeInfo.url === undefined) return;
    void this.refreshTab(tabId, changeInfo.url);
  };

  readonly #activatedListener""",
    """  readonly #updatedListener: OriginalToolbarUpdatedListener = (tabId, changeInfo, tab) => {
    if (changeInfo.url === undefined && changeInfo.status !== 'complete') return;
    const url = changeInfo.url ?? tab.url;
    void (url === undefined ? this.refreshTab(tabId) : this.refreshTab(tabId, url));
  };

  readonly #createdListener: OriginalToolbarCreatedListener = (tab) => {
    if (tab.id === undefined) return;
    void (tab.url === undefined ? this.refreshTab(tab.id) : this.refreshTab(tab.id, tab.url));
  };

  readonly #activatedListener""",
    "toolbar updated and created behavior",
)
source = replace_once(
    source,
    """    this.#tabs.onUpdated.addListener(this.#updatedListener);
    this.#tabs.onActivated.addListener(this.#activatedListener);
""",
    """    this.#tabs.onUpdated.addListener(this.#updatedListener);
    this.#tabs.onActivated.addListener(this.#activatedListener);
    this.#tabs.onCreated.addListener(this.#createdListener);
""",
    "toolbar created registration",
)
source = replace_once(
    source,
    """    this.#tabs.onUpdated.removeListener(this.#updatedListener);
    this.#tabs.onActivated.removeListener(this.#activatedListener);
""",
    """    this.#tabs.onUpdated.removeListener(this.#updatedListener);
    this.#tabs.onActivated.removeListener(this.#activatedListener);
    this.#tabs.onCreated.removeListener(this.#createdListener);
""",
    "toolbar created removal",
)
source_path.write_text(source, encoding="utf-8")


test_path = Path("apps/extension/src/lib/original-toolbar-tab-coordinator.test.ts")
test = test_path.read_text(encoding="utf-8")
test = replace_once(
    test,
    """  type OriginalToolbarCoordinatorExecutor,
  type OriginalToolbarCoordinatorTab,
""",
    """  type OriginalToolbarCoordinatorExecutor,
  type OriginalToolbarCoordinatorTab,
  type OriginalToolbarCreatedListener,
""",
    "toolbar test created import",
)
test = replace_once(
    test,
    """  readonly onUpdated = new RecordingEvent<OriginalToolbarUpdatedListener>();
  readonly onActivated = new RecordingEvent<OriginalToolbarActivatedListener>();
""",
    """  readonly onUpdated = new RecordingEvent<OriginalToolbarUpdatedListener>();
  readonly onActivated = new RecordingEvent<OriginalToolbarActivatedListener>();
  readonly onCreated = new RecordingEvent<OriginalToolbarCreatedListener>();
""",
    "toolbar test created event",
)
test = replace_once(
    test,
    """  it('registers one URL-update and activation listener and removes both on stop', async () => {
    const { tabs, resolver, executor, coordinator } = createHarness();
    resolver.implementation = ({ url }) => state(url);
    tabs.tabs.set(7, { id: 7, url: 'https://activated.test/' });

    coordinator.start();
    coordinator.start();
    expect(tabs.onUpdated.listeners.size).toBe(1);
    expect(tabs.onActivated.listeners.size).toBe(1);

    tabs.onUpdated.emit((listener) =>
      listener(5, { url: 'https://updated.test/' }, { id: 5, url: 'https://updated.test/' }),
    );
    tabs.onUpdated.emit((listener) => listener(5, {}, { id: 5, url: 'https://ignored.test/' }));
    tabs.onActivated.emit((listener) => listener({ tabId: 7 }));
    await flushEvents();

    expect(resolver.calls).toEqual([
      { tabId: 5, url: 'https://updated.test/' },
      { tabId: 7, url: 'https://activated.test/' },
    ]);
    expect(executor.calls).toEqual([
      { type: 'apply', tabId: 5, state: state('https://updated.test/') },
      { type: 'apply', tabId: 7, state: state('https://activated.test/') },
    ]);

    coordinator.stop();
    coordinator.stop();
    expect(tabs.onUpdated.listeners.size).toBe(0);
    expect(tabs.onActivated.listeners.size).toBe(0);
  });""",
    """  it('registers creation, URL-update and activation listeners and removes all on stop', async () => {
    const { tabs, resolver, executor, coordinator } = createHarness();
    resolver.implementation = ({ url }) => state(url);
    tabs.tabs.set(7, { id: 7, url: 'https://activated.test/' });

    coordinator.start();
    coordinator.start();
    expect(tabs.onCreated.listeners.size).toBe(1);
    expect(tabs.onUpdated.listeners.size).toBe(1);
    expect(tabs.onActivated.listeners.size).toBe(1);

    tabs.onCreated.emit((listener) => listener({ id: 3, url: 'https://created.test/' }));
    tabs.onCreated.emit((listener) => listener({ url: 'https://without-id.test/' }));
    tabs.onUpdated.emit((listener) =>
      listener(5, { url: 'https://updated.test/' }, { id: 5, url: 'https://updated.test/' }),
    );
    tabs.onUpdated.emit((listener) =>
      listener(6, { status: 'complete' }, { id: 6, url: 'https://completed.test/' }),
    );
    tabs.onUpdated.emit((listener) => listener(5, {}, { id: 5, url: 'https://ignored.test/' }));
    tabs.onActivated.emit((listener) => listener({ tabId: 7 }));
    await flushEvents();

    expect(resolver.calls).toEqual([
      { tabId: 3, url: 'https://created.test/' },
      { tabId: 5, url: 'https://updated.test/' },
      { tabId: 6, url: 'https://completed.test/' },
      { tabId: 7, url: 'https://activated.test/' },
    ]);
    expect(executor.calls).toEqual([
      { type: 'apply', tabId: 3, state: state('https://created.test/') },
      { type: 'apply', tabId: 5, state: state('https://updated.test/') },
      { type: 'apply', tabId: 6, state: state('https://completed.test/') },
      { type: 'apply', tabId: 7, state: state('https://activated.test/') },
    ]);

    coordinator.stop();
    coordinator.stop();
    expect(tabs.onCreated.listeners.size).toBe(0);
    expect(tabs.onUpdated.listeners.size).toBe(0);
    expect(tabs.onActivated.listeners.size).toBe(0);
  });""",
    "toolbar listener test",
)
test_path.write_text(test, encoding="utf-8")
