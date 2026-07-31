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
    """export type OriginalToolbarNavigationCommittedListener = (
  details: OriginalToolbarNavigationDetails,
) => void;
""",
    """export type OriginalToolbarNavigationListener = (
  details: OriginalToolbarNavigationDetails,
) => void;

export type OriginalToolbarNavigationBeforeListener = OriginalToolbarNavigationListener;
export type OriginalToolbarNavigationCommittedListener = OriginalToolbarNavigationListener;
""",
    "navigation listener aliases",
)
runtime = replace_once(
    runtime,
    """  readonly tabRemoved?: OriginalToolbarEvent<OriginalToolbarTabRemovedListener>;
  readonly navigationCommitted?: OriginalToolbarEvent<OriginalToolbarNavigationCommittedListener>;
  readonly browserRuntime?: OriginalToolbarBrowserRuntimeOptions;""",
    """  readonly tabRemoved?: OriginalToolbarEvent<OriginalToolbarTabRemovedListener>;
  readonly navigationBefore?: OriginalToolbarEvent<OriginalToolbarNavigationBeforeListener>;
  readonly navigationCommitted?: OriginalToolbarEvent<OriginalToolbarNavigationCommittedListener>;
  readonly browserRuntime?: OriginalToolbarBrowserRuntimeOptions;""",
    "navigation before option",
)
runtime = replace_once(
    runtime,
    """  const navigationCommittedListener: OriginalToolbarNavigationCommittedListener = (details) => {
    if (details.frameId !== 0 || details.tabId < 0 || details.url.length === 0) return;
    void coordinator.refreshTab(details.tabId, details.url);
  };""",
    """  const navigationListener: OriginalToolbarNavigationListener = (details) => {
    if (details.frameId !== 0 || details.tabId < 0 || details.url.length === 0) return;
    void coordinator.refreshTab(details.tabId, details.url);
  };""",
    "shared navigation listener",
)
runtime = replace_once(
    runtime,
    """  coordinator.start();
  options.tabRemoved?.addListener(tabRemovedListener);
  options.navigationCommitted?.addListener(navigationCommittedListener);""",
    """  coordinator.start();
  options.tabRemoved?.addListener(tabRemovedListener);
  options.navigationBefore?.addListener(navigationListener);
  options.navigationCommitted?.addListener(navigationListener);""",
    "navigation registration",
)
runtime = replace_once(
    runtime,
    """      options.tabRemoved?.removeListener(tabRemovedListener);
      options.navigationCommitted?.removeListener(navigationCommittedListener);""",
    """      options.tabRemoved?.removeListener(tabRemovedListener);
      options.navigationBefore?.removeListener(navigationListener);
      options.navigationCommitted?.removeListener(navigationListener);""",
    "navigation removal",
)
runtime_path.write_text(runtime, encoding="utf-8")


background_path = Path("apps/extension/src/entrypoints/background.ts")
background = background_path.read_text(encoding="utf-8")
background = replace_once(
    background,
    """  registerOriginalToolbarRuntime,
  type OriginalToolbarNavigationCommittedListener,
  type OriginalToolbarTabRemovedListener,""",
    """  registerOriginalToolbarRuntime,
  type OriginalToolbarNavigationBeforeListener,
  type OriginalToolbarNavigationCommittedListener,
  type OriginalToolbarTabRemovedListener,""",
    "background before import",
)
background = replace_once(
    background,
    """    tabRemoved: browser.tabs
      .onRemoved as unknown as OriginalToolbarEvent<OriginalToolbarTabRemovedListener>,
    navigationCommitted:""",
    """    tabRemoved: browser.tabs
      .onRemoved as unknown as OriginalToolbarEvent<OriginalToolbarTabRemovedListener>,
    navigationBefore: browser.webNavigation
      .onBeforeNavigate as unknown as OriginalToolbarEvent<OriginalToolbarNavigationBeforeListener>,
    navigationCommitted:""",
    "background before boundary",
)
background_path.write_text(background, encoding="utf-8")


test_path = Path("apps/extension/src/lib/original-toolbar-runtime.test.ts")
test = test_path.read_text(encoding="utf-8")
test = replace_once(
    test,
    """  registerOriginalToolbarRuntime,
  type OriginalToolbarNavigationCommittedListener,
  type OriginalToolbarTabRemovedListener,""",
    """  registerOriginalToolbarRuntime,
  type OriginalToolbarNavigationBeforeListener,
  type OriginalToolbarNavigationCommittedListener,
  type OriginalToolbarTabRemovedListener,""",
    "runtime test before import",
)
test = replace_once(
    test,
    """  const removed = new ListenerEvent<OriginalToolbarTabRemovedListener>();
  const navigation = new ListenerEvent<OriginalToolbarNavigationCommittedListener>();""",
    """  const removed = new ListenerEvent<OriginalToolbarTabRemovedListener>();
  const navigationBefore = new ListenerEvent<OriginalToolbarNavigationBeforeListener>();
  const navigationCommitted = new ListenerEvent<OriginalToolbarNavigationCommittedListener>();""",
    "runtime test navigation events",
)
test = replace_once(
    test,
    """    tabRemoved: removed,
    navigationCommitted: navigation,
    browserRuntime:""",
    """    tabRemoved: removed,
    navigationBefore,
    navigationCommitted,
    browserRuntime:""",
    "runtime test navigation options",
)
test = replace_once(
    test,
    """  return { action, updated, activated, created, removed, navigation, runtime };""",
    """  return {
    action,
    updated,
    activated,
    created,
    removed,
    navigationBefore,
    navigationCommitted,
    runtime,
  };""",
    "runtime test navigation return",
)
test = replace_once(
    test,
    """    const { action, updated, activated, created, removed, navigation, runtime } = harness();""",
    """    const {
      action,
      updated,
      activated,
      created,
      removed,
      navigationBefore,
      navigationCommitted,
      runtime,
    } = harness();""",
    "runtime test navigation destructure",
)
test = replace_once(
    test,
    """    expect(removed.listeners.size).toBe(1);
    expect(navigation.listeners.size).toBe(1);

    for (const listener of navigation.listeners) {
      listener({ tabId: 11, frameId: 1, url: 'https://frame.test/' });
      listener({ tabId: 13, frameId: 0, url: 'https://navigation.test/' });
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(action.titles.at(-1)).toEqual({
      tabId: 13,
      title: 'ZeroOmega:: [Direct]\\nDIRECT',
    });""",
    """    expect(removed.listeners.size).toBe(1);
    expect(navigationBefore.listeners.size).toBe(1);
    expect(navigationCommitted.listeners.size).toBe(1);

    for (const listener of navigationBefore.listeners) {
      listener({ tabId: 11, frameId: 1, url: 'https://frame.test/' });
      listener({ tabId: 13, frameId: 0, url: 'https://before.test/' });
    }
    for (const listener of navigationCommitted.listeners) {
      listener({ tabId: -1, frameId: 0, url: 'https://invalid.test/' });
      listener({ tabId: 17, frameId: 0, url: 'https://committed.test/' });
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(action.titles.slice(-2)).toEqual([
      { tabId: 13, title: 'ZeroOmega:: [Direct]\\nDIRECT' },
      { tabId: 17, title: 'ZeroOmega:: [Direct]\\nDIRECT' },
    ]);""",
    "runtime navigation assertions",
)
test = replace_once(
    test,
    """    expect(removed.listeners.size).toBe(0);
    expect(navigation.listeners.size).toBe(0);""",
    """    expect(removed.listeners.size).toBe(0);
    expect(navigationBefore.listeners.size).toBe(0);
    expect(navigationCommitted.listeners.size).toBe(0);""",
    "runtime navigation removal",
)
test_path.write_text(test, encoding="utf-8")
