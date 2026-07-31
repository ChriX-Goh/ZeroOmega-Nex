from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


browser_test_path = Path("apps/extension/src/lib/original-toolbar-browser-runtime.test.ts")
browser_test = browser_test_path.read_text(encoding="utf-8")
browser_test = replace_once(
    browser_test,
    """    onActivated: {
      addListener(): void {},
      removeListener(): void {},
    },
    async get(tabId) {""",
    """    onActivated: {
      addListener(): void {},
      removeListener(): void {},
    },
    onCreated: {
      addListener(): void {},
      removeListener(): void {},
    },
    async get(tabId) {""",
    "browser runtime created-event mock",
)
browser_test_path.write_text(browser_test, encoding="utf-8")


runtime_test_path = Path("apps/extension/src/lib/original-toolbar-runtime.test.ts")
runtime_test = runtime_test_path.read_text(encoding="utf-8")
runtime_test = replace_once(
    runtime_test,
    """  OriginalToolbarActivatedListener,
  OriginalToolbarEvent,
""",
    """  OriginalToolbarActivatedListener,
  OriginalToolbarCreatedListener,
  OriginalToolbarEvent,
""",
    "runtime test created-listener import",
)
runtime_test = replace_once(
    runtime_test,
    """  const updated = new ListenerEvent<OriginalToolbarUpdatedListener>();
  const activated = new ListenerEvent<OriginalToolbarActivatedListener>();
  const removed = new ListenerEvent<OriginalToolbarTabRemovedListener>();
""",
    """  const updated = new ListenerEvent<OriginalToolbarUpdatedListener>();
  const activated = new ListenerEvent<OriginalToolbarActivatedListener>();
  const created = new ListenerEvent<OriginalToolbarCreatedListener>();
  const removed = new ListenerEvent<OriginalToolbarTabRemovedListener>();
""",
    "runtime test created event",
)
runtime_test = replace_once(
    runtime_test,
    """    onUpdated: updated,
    onActivated: activated,
    async get(tabId) {""",
    """    onUpdated: updated,
    onActivated: activated,
    onCreated: created,
    async get(tabId) {""",
    "runtime test tabs created event",
)
runtime_test = replace_once(
    runtime_test,
    """  return { action, updated, activated, removed, runtime };""",
    """  return { action, updated, activated, created, removed, runtime };""",
    "runtime test created return",
)
runtime_test = replace_once(
    runtime_test,
    """    const { action, updated, activated, removed, runtime } = harness();

    expect(updated.listeners.size).toBe(1);
    expect(activated.listeners.size).toBe(1);
    expect(removed.listeners.size).toBe(1);""",
    """    const { action, updated, activated, created, removed, runtime } = harness();

    expect(updated.listeners.size).toBe(1);
    expect(activated.listeners.size).toBe(1);
    expect(created.listeners.size).toBe(1);
    expect(removed.listeners.size).toBe(1);""",
    "runtime test created registration",
)
runtime_test = replace_once(
    runtime_test,
    """    expect(updated.listeners.size).toBe(0);
    expect(activated.listeners.size).toBe(0);
    expect(removed.listeners.size).toBe(0);""",
    """    expect(updated.listeners.size).toBe(0);
    expect(activated.listeners.size).toBe(0);
    expect(created.listeners.size).toBe(0);
    expect(removed.listeners.size).toBe(0);""",
    "runtime test created removal",
)
runtime_test_path.write_text(runtime_test, encoding="utf-8")
