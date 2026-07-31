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

export type OriginalToolbarNavigationCommittedListener = OriginalToolbarNavigationListener;
export type OriginalToolbarNavigationCompletedListener = OriginalToolbarNavigationListener;
""",
    "navigation listener types",
)
runtime = replace_once(
    runtime,
    """  readonly navigationCommitted?: OriginalToolbarEvent<OriginalToolbarNavigationCommittedListener>;
  readonly browserRuntime?: OriginalToolbarBrowserRuntimeOptions;""",
    """  readonly navigationCommitted?: OriginalToolbarEvent<OriginalToolbarNavigationCommittedListener>;
  readonly navigationCompleted?: OriginalToolbarEvent<OriginalToolbarNavigationCompletedListener>;
  readonly browserRuntime?: OriginalToolbarBrowserRuntimeOptions;""",
    "navigation completed option",
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
    """  options.tabRemoved?.addListener(tabRemovedListener);
  options.navigationCommitted?.addListener(navigationCommittedListener);""",
    """  options.tabRemoved?.addListener(tabRemovedListener);
  options.navigationCommitted?.addListener(navigationListener);
  options.navigationCompleted?.addListener(navigationListener);""",
    "navigation listener registration",
)
runtime = replace_once(
    runtime,
    """      options.tabRemoved?.removeListener(tabRemovedListener);
      options.navigationCommitted?.removeListener(navigationCommittedListener);""",
    """      options.tabRemoved?.removeListener(tabRemovedListener);
      options.navigationCommitted?.removeListener(navigationListener);
      options.navigationCompleted?.removeListener(navigationListener);""",
    "navigation listener removal",
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
  type OriginalToolbarNavigationCommittedListener,
  type OriginalToolbarNavigationCompletedListener,
  type OriginalToolbarTabRemovedListener,""",
    "background completed import",
)
background = replace_once(
    background,
    """    navigationCommitted: browser.webNavigation
      .onCommitted as unknown as OriginalToolbarEvent<OriginalToolbarNavigationCommittedListener>,
    onError:""",
    """    navigationCommitted: browser.webNavigation
      .onCommitted as unknown as OriginalToolbarEvent<OriginalToolbarNavigationCommittedListener>,
    navigationCompleted: browser.webNavigation
      .onCompleted as unknown as OriginalToolbarEvent<OriginalToolbarNavigationCompletedListener>,
    onError:""",
    "background completed boundary",
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
  type OriginalToolbarNavigationCommittedListener,
  type OriginalToolbarNavigationCompletedListener,
  type OriginalToolbarTabRemovedListener,""",
    "runtime test completed import",
)
test = replace_once(
    test,
    """  const navigation = new ListenerEvent<OriginalToolbarNavigationCommittedListener>();
  const tabs: OriginalToolbarTabsApi = {""",
    """  const navigationCommitted = new ListenerEvent<OriginalToolbarNavigationCommittedListener>();
  const navigationCompleted = new ListenerEvent<OriginalToolbarNavigationCompletedListener>();
  const tabs: OriginalToolbarTabsApi = {""",
    "runtime test navigation events",
)
test = replace_once(
    test,
    """    tabRemoved: removed,
    navigationCommitted: navigation,
    browserRuntime:""",
    """    tabRemoved: removed,
    navigationCommitted,
    navigationCompleted,
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
    navigationCommitted,
    navigationCompleted,
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
      navigationCommitted,
      navigationCompleted,
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
    expect(navigationCommitted.listeners.size).toBe(1);
    expect(navigationCompleted.listeners.size).toBe(1);

    for (const listener of navigationCommitted.listeners) {
      listener({ tabId: 11, frameId: 1, url: 'https://frame.test/' });
      listener({ tabId: 13, frameId: 0, url: 'https://committed.test/' });
    }
    for (const listener of navigationCompleted.listeners) {
      listener({ tabId: -1, frameId: 0, url: 'https://invalid-tab.test/' });
      listener({ tabId: 17, frameId: 0, url: 'https://completed.test/' });
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
    expect(navigationCommitted.listeners.size).toBe(0);
    expect(navigationCompleted.listeners.size).toBe(0);""",
    "runtime navigation removal assertions",
)
test_path.write_text(test, encoding="utf-8")
