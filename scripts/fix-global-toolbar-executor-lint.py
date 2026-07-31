from pathlib import Path

path = Path("apps/extension/src/lib/original-toolbar-action-executor.ts")
text = path.read_text(encoding="utf-8")
old = """  async apply(tabId: number | undefined, state: OriginalToolbarTabState): Promise<void> {
    const imageData = this.#renderer.render(
      state.icon.outerCircleColor,
      state.icon.innerCircleColor,
    );"""
new = """  async apply(tabId: number, state: OriginalToolbarTabState): Promise<void> {
    await this.applyState(tabId, state);
  }

  async applyGlobal(state: OriginalToolbarTabState): Promise<void> {
    await this.applyState(undefined, state);
  }

  private async applyState(
    tabId: number | undefined,
    state: OriginalToolbarTabState,
  ): Promise<void> {
    const imageData = this.#renderer.render(
      state.icon.outerCircleColor,
      state.icon.innerCircleColor,
    );"""
if text.count(old) != 1:
    raise SystemExit(f"executor applyState insertion: expected one match, found {text.count(old)}")
text = text.replace(old, new, 1)
old_global = """  async applyGlobal(state: OriginalToolbarTabState): Promise<void> {
    await this.apply(undefined, state);
  }

"""
if text.count(old_global) != 1:
    raise SystemExit(f"executor duplicate global removal: expected one match, found {text.count(old_global)}")
text = text.replace(old_global, "", 1)
path.write_text(text, encoding="utf-8")
