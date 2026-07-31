from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


runtime_path = Path("apps/extension/src/lib/original-toolbar-runtime.ts")
runtime = runtime_path.read_text(encoding="utf-8")
runtime = replace_once(
    runtime,
    """export type OriginalToolbarTabRemovedListener = (tabId: number) => void;

export interface OriginalToolbarRuntimeOptions {""",
    """export type OriginalToolbarTabRemovedListener = (tabId: number) => void;

export interface OriginalToolbarNavigationDetails {
  readonly tabId: number;
  readonly frameId: number;
  readonly url: string;
}

export type OriginalToolbarNavigationCommittedListener = (
  details: OriginalToolbarNavigationDetails,
) => void;

export interface OriginalToolbarRuntimeOptions {""",
    "navigation type",
)
runtime = replace_once(
    runtime,
    """  readonly tabRemoved?: OriginalToolbarEvent<OriginalToolbarTabRemovedListener>;
  readonly browserRuntime?: OriginalToolbarBrowserRuntimeOptions;""",
    """  readonly tabRemoved?: OriginalToolbarEvent<OriginalToolbarTabRemovedListener>;
  readonly navigationCommitted?: OriginalToolbarEvent<OriginalToolbarNavigationCommittedListener>;
  readonly browserRuntime?: OriginalToolbarBrowserRuntimeOptions;""",
    "navigation option",
)
runtime = replace_once(
    runtime,
    """  const tabRemovedListener: OriginalToolbarTabRemovedListener = (tabId) => overlay.discard(tabId);
  let disposed = false;""",
    """  const tabRemovedListener: OriginalToolbarTabRemovedListener = (tabId) => overlay.discard(tabId);
  const navigationCommittedListener: OriginalToolbarNavigationCommittedListener = (details) => {
    if (details.frameId !== 0 || details.tabId < 0 || details.url.length === 0) return;
    void coordinator.refreshTab(details.tabId, details.url);
  };
  let disposed = false;""",
    "navigation listener",
)
runtime = replace_once(
    runtime,
    """  coordinator.start();
  options.tabRemoved?.addListener(tabRemovedListener);""",
    """  coordinator.start();
  options.tabRemoved?.addListener(tabRemovedListener);
  options.navigationCommitted?.addListener(navigationCommittedListener);""",
    "navigation registration",
)
runtime = replace_once(
    runtime,
    """      options.tabRemoved?.removeListener(tabRemovedListener);
      overlay.setRefreshListener(undefined);""",
    """      options.tabRemoved?.removeListener(tabRemovedListener);
      options.navigationCommitted?.removeListener(navigationCommittedListener);
      overlay.setRefreshListener(undefined);""",
    "navigation removal",
)
runtime_path.write_text(runtime, encoding="utf-8")


background_path = Path("apps/extension/src/entrypoints/background.ts")
background = background_path.read_text(encoding="utf-8")
background = replace_once(
    background,
    """  registerOriginalToolbarRuntime,
  type OriginalToolbarTabRemovedListener,
  type RegisteredOriginalToolbarRuntime,""",
    """  registerOriginalToolbarRuntime,
  type OriginalToolbarNavigationCommittedListener,
  type OriginalToolbarTabRemovedListener,
  type RegisteredOriginalToolbarRuntime,""",
    "background navigation import",
)
background = replace_once(
    background,
    """    tabRemoved: browser.tabs
      .onRemoved as unknown as OriginalToolbarEvent<OriginalToolbarTabRemovedListener>,
    onError:""",
    """    tabRemoved: browser.tabs
      .onRemoved as unknown as OriginalToolbarEvent<OriginalToolbarTabRemovedListener>,
    navigationCommitted: browser.webNavigation
      .onCommitted as unknown as OriginalToolbarEvent<OriginalToolbarNavigationCommittedListener>,
    onError:""",
    "background navigation boundary",
)
background_path.write_text(background, encoding="utf-8")


config_path = Path("apps/extension/wxt.config.ts")
config = config_path.read_text(encoding="utf-8")
config = replace_once(
    config,
    """      'contextMenus',
      'tabs',""",
    """      'contextMenus',
      'tabs',
      'webNavigation',""",
    "manifest navigation permission",
)
config_path.write_text(config, encoding="utf-8")


inspect_path = Path("scripts/inspect-manifests.mjs")
inspect = inspect_path.read_text(encoding="utf-8")
inspect = replace_once(
    inspect,
    """    ['proxy', 'storage', 'alarms', 'activeTab', 'contextMenus', 'tabs'],""",
    """    ['proxy', 'storage', 'alarms', 'activeTab', 'contextMenus', 'tabs', 'webNavigation'],""",
    "manifest guard permission",
)
inspect = replace_once(
    inspect,
    """`${relative(repositoryRoot.pathname, file)} passed: MV${manifest.manifest_version}, proxy/storage/alarms/activeTab/contextMenus/tabs required, auth optional, no global host access.`,""",
    """`${relative(repositoryRoot.pathname, file)} passed: MV${manifest.manifest_version}, proxy/storage/alarms/activeTab/contextMenus/tabs/webNavigation required, auth optional, no global host access.`,""",
    "manifest guard message",
)
inspect_path.write_text(inspect, encoding="utf-8")


test_path = Path("apps/extension/src/lib/original-toolbar-runtime.test.ts")
test = test_path.read_text(encoding="utf-8")
test = replace_once(
    test,
    """  registerOriginalToolbarRuntime,
  type OriginalToolbarTabRemovedListener,""",
    """  registerOriginalToolbarRuntime,
  type OriginalToolbarNavigationCommittedListener,
  type OriginalToolbarTabRemovedListener,""",
    "runtime test navigation import",
)
test = replace_once(
    test,
    """  const created = new ListenerEvent<OriginalToolbarCreatedListener>();
  const removed = new ListenerEvent<OriginalToolbarTabRemovedListener>();""",
    """  const created = new ListenerEvent<OriginalToolbarCreatedListener>();
  const removed = new ListenerEvent<OriginalToolbarTabRemovedListener>();
  const navigation = new ListenerEvent<OriginalToolbarNavigationCommittedListener>();""",
    "runtime test navigation event",
)
test = replace_once(
    test,
    """    tabRemoved: removed,
    browserRuntime: { canvasFactory: () => canvas },""",
    """    tabRemoved: removed,
    navigationCommitted: navigation,
    browserRuntime: { canvasFactory: () => canvas },""",
    "runtime test navigation option",
)
test = replace_once(
    test,
    """  return { action, updated, activated, created, removed, runtime };""",
    """  return { action, updated, activated, created, removed, navigation, runtime };""",
    "runtime test navigation return",
)
test = replace_once(
    test,
    """    const { action, updated, activated, created, removed, runtime } = harness();""",
    """    const { action, updated, activated, created, removed, navigation, runtime } = harness();""",
    "runtime test navigation destructure",
)
test = replace_once(
    test,
    """    expect(created.listeners.size).toBe(1);
    expect(removed.listeners.size).toBe(1);

    await runtime.refreshAll({ clearIconCache: true });""",
    """    expect(created.listeners.size).toBe(1);
    expect(removed.listeners.size).toBe(1);
    expect(navigation.listeners.size).toBe(1);

    for (const listener of navigation.listeners) {
      listener({ tabId: 11, frameId: 1, url: 'https://frame.test/' });
      listener({ tabId: 13, frameId: 0, url: 'https://navigation.test/' });
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(action.titles.at(-1)).toEqual({
      tabId: 13,
      title: 'ZeroOmega:: [Direct]\\nDIRECT',
    });

    await runtime.refreshAll({ clearIconCache: true });""",
    "runtime navigation assertion",
)
test = replace_once(
    test,
    """    expect(created.listeners.size).toBe(0);
    expect(removed.listeners.size).toBe(0);""",
    """    expect(created.listeners.size).toBe(0);
    expect(removed.listeners.size).toBe(0);
    expect(navigation.listeners.size).toBe(0);""",
    "runtime navigation disposal",
)
test_path.write_text(test, encoding="utf-8")
