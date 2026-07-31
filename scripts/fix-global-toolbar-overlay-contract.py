from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


executor_path = Path("apps/extension/src/lib/original-toolbar-action-executor.ts")
executor = executor_path.read_text(encoding="utf-8")
executor = replace_once(
    executor,
    """    const presentation = this.presentation({
      tabId,
      title: localizeOriginalToolbarResultTitle(this.#i18n, state.titleArguments),""",
    """    const presentation = this.presentation({
      ...(tabId === undefined ? {} : { tabId }),
      title: localizeOriginalToolbarResultTitle(this.#i18n, state.titleArguments),""",
    "executor exact optional tab",
)
executor_path.write_text(executor, encoding="utf-8")


overlay_path = Path("apps/extension/src/lib/original-toolbar-inspect-overlay.ts")
overlay = overlay_path.read_text(encoding="utf-8")
overlay = replace_once(
    overlay,
    """    applyDefault: async (tabId) => {
      await this.#baseExecutor.applyDefault(tabId);
      await this.applyOverlay(tabId);
    },
    clearIconCache: () => this.#baseExecutor.clearIconCache(),""",
    """    applyDefault: async (tabId) => {
      await this.#baseExecutor.applyDefault(tabId);
      await this.applyOverlay(tabId);
    },
    applyGlobal: (state) => this.#baseExecutor.applyGlobal(state),
    applyGlobalDefault: () => this.#baseExecutor.applyGlobalDefault(),
    clearIconCache: () => this.#baseExecutor.clearIconCache(),""",
    "Inspect global delegation",
)
overlay_path.write_text(overlay, encoding="utf-8")


test_path = Path("apps/extension/src/lib/original-toolbar-inspect-overlay.test.ts")
test = test_path.read_text(encoding="utf-8")
old_mock = """      applyDefault: vi.fn(),
      clearIconCache: vi.fn(),"""
new_mock = """      applyDefault: vi.fn(),
      applyGlobal: vi.fn(),
      applyGlobalDefault: vi.fn(),
      clearIconCache: vi.fn(),"""
count = test.count(old_mock)
if count != 4:
    raise SystemExit(f"Inspect executor mocks: expected four matches, found {count}")
test = test.replace(old_mock, new_mock)
test = replace_once(
    test,
    """  it('reapplies an active overlay after a default toolbar refresh', async () => {""",
    """  it('delegates global baselines without applying any per-tab Inspect overlay', async () => {
    const action: OriginalToolbarActionApi = {
      setIcon: vi.fn(),
      setPopup: vi.fn(),
      setBadgeText: vi.fn(),
      setBadgeBackgroundColor: vi.fn(),
      setTitle: vi.fn(),
    };
    const base: OriginalToolbarCoordinatorExecutor = {
      apply: vi.fn(),
      applyDefault: vi.fn(),
      applyGlobal: vi.fn(),
      applyGlobalDefault: vi.fn(),
      clearIconCache: vi.fn(),
    };
    const manager = new OriginalToolbarInspectOverlayManager(action, base);

    await manager.executor.applyGlobal(state());
    await manager.executor.applyGlobalDefault();

    expect(base.applyGlobal).toHaveBeenCalledWith(state());
    expect(base.applyGlobalDefault).toHaveBeenCalledTimes(1);
    expect(action.setBadgeText).not.toHaveBeenCalled();
    expect(action.setTitle).not.toHaveBeenCalled();
  });

  it('reapplies an active overlay after a default toolbar refresh', async () => {""",
    "Inspect global delegation test",
)
test_path.write_text(test, encoding="utf-8")
