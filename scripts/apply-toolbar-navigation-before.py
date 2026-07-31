from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


adapter_path = Path("apps/extension/src/lib/original-toolbar-action-adapter.ts")
adapter = adapter_path.read_text(encoding="utf-8")
adapter = replace_once(
    adapter,
    """interface OriginalToolbarActionIconDetails {
  readonly tabId: number;
  readonly imageData?: OriginalToolbarActionImageDataSet;
  readonly path?: OriginalToolbarActionIconPaths;
}""",
    """interface OriginalToolbarActionIconDetails {
  readonly tabId?: number;
  readonly imageData?: OriginalToolbarActionImageDataSet;
  readonly path?: OriginalToolbarActionIconPaths;
}""",
    "optional Action icon tab",
)
adapter = replace_once(
    adapter,
    """  setTitle(details: { readonly tabId: number; readonly title: string }): Promise<void> | void;
  setBadgeText(details: { readonly tabId: number; readonly text: string }): Promise<void> | void;
  setBadgeBackgroundColor(details: {
    readonly tabId: number;
    readonly color: string;
  }): Promise<void> | void;
  setPopup(details: { readonly tabId: number; readonly popup: string }): Promise<void> | void;
}""",
    """  setTitle(details: { readonly tabId?: number; readonly title: string }): Promise<void> | void;
  setBadgeText(details: { readonly tabId?: number; readonly text: string }): Promise<void> | void;
  setBadgeBackgroundColor(details: {
    readonly tabId?: number;
    readonly color: string;
  }): Promise<void> | void;
  setPopup(details: { readonly tabId?: number; readonly popup: string }): Promise<void> | void;
}""",
    "optional Action field tabs",
)
adapter = replace_once(
    adapter,
    """export interface OriginalToolbarActionPresentation {
  readonly tabId: number;""",
    """export interface OriginalToolbarActionPresentation {
  readonly tabId?: number;""",
    "optional presentation tab",
)
adapter = replace_once(
    adapter,
    """  async apply(presentation: OriginalToolbarActionPresentation): Promise<void> {
    await this.applyIcon(presentation);

    await Promise.all([
      Promise.resolve(
        this.action.setTitle({ tabId: presentation.tabId, title: presentation.title }),
      ),
      Promise.resolve(
        this.action.setBadgeBackgroundColor({
          tabId: presentation.tabId,
          color: presentation.badgeBackgroundColor,
        }),
      ),
      Promise.resolve(
        this.action.setBadgeText({
          tabId: presentation.tabId,
          text: presentation.badgeText ?? '',
        }),
      ),
      Promise.resolve(
        this.action.setPopup({ tabId: presentation.tabId, popup: presentation.popup }),
      ),
    ]);
  }""",
    """  async apply(presentation: OriginalToolbarActionPresentation): Promise<void> {
    const target = presentation.tabId === undefined ? {} : { tabId: presentation.tabId };
    await this.applyIcon(presentation, target);

    await Promise.all([
      Promise.resolve(this.action.setTitle({ ...target, title: presentation.title })),
      Promise.resolve(
        this.action.setBadgeBackgroundColor({
          ...target,
          color: presentation.badgeBackgroundColor,
        }),
      ),
      Promise.resolve(
        this.action.setBadgeText({
          ...target,
          text: presentation.badgeText ?? '',
        }),
      ),
      Promise.resolve(this.action.setPopup({ ...target, popup: presentation.popup })),
    ]);
  }""",
    "Action target omission",
)
adapter = replace_once(
    adapter,
    """  private async applyIcon(presentation: OriginalToolbarActionPresentation): Promise<void> {
    if (presentation.imageData === undefined) {
      await Promise.resolve(
        this.action.setIcon({
          tabId: presentation.tabId,
          path: presentation.fallbackIconPaths,
        }),
      );""",
    """  private async applyIcon(
    presentation: OriginalToolbarActionPresentation,
    target: Readonly<{ tabId?: number }>,
  ): Promise<void> {
    if (presentation.imageData === undefined) {
      await Promise.resolve(
        this.action.setIcon({
          ...target,
          path: presentation.fallbackIconPaths,
        }),
      );""",
    "Action icon target",
)
adapter = replace_once(
    adapter,
    """        this.action.setIcon({
          tabId: presentation.tabId,
          imageData: presentation.imageData,
        }),""",
    """        this.action.setIcon({
          ...target,
          imageData: presentation.imageData,
        }),""",
    "dynamic icon target",
)
adapter = replace_once(
    adapter,
    """        this.action.setIcon({
          tabId: presentation.tabId,
          path: presentation.fallbackIconPaths,
        }),""",
    """        this.action.setIcon({
          ...target,
          path: presentation.fallbackIconPaths,
        }),""",
    "fallback icon target",
)
adapter_path.write_text(adapter, encoding="utf-8")


executor_path = Path("apps/extension/src/lib/original-toolbar-action-executor.ts")
executor = executor_path.read_text(encoding="utf-8")
executor = replace_once(
    executor,
    """  async apply(tabId: number, state: OriginalToolbarTabState): Promise<void> {""",
    """  async apply(tabId: number | undefined, state: OriginalToolbarTabState): Promise<void> {""",
    "executor optional tab",
)
executor = replace_once(
    executor,
    """  async applyDefault(tabId: number): Promise<void> {
    await this.#action.apply(
      this.presentation({
        tabId,
        title: localizeOriginalToolbarDefaultTitle(this.#i18n),
      }),
    );
  }

  clearIconCache(): void {""",
    """  async applyGlobal(state: OriginalToolbarTabState): Promise<void> {
    await this.apply(undefined, state);
  }

  async applyDefault(tabId?: number): Promise<void> {
    await this.#action.apply(
      this.presentation({
        ...(tabId === undefined ? {} : { tabId }),
        title: localizeOriginalToolbarDefaultTitle(this.#i18n),
      }),
    );
  }

  async applyGlobalDefault(): Promise<void> {
    await this.applyDefault();
  }

  clearIconCache(): void {""",
    "executor global methods",
)
executor = replace_once(
    executor,
    """  private presentation(input: {
    readonly tabId: number;""",
    """  private presentation(input: {
    readonly tabId?: number;""",
    "executor optional presentation input",
)
executor = replace_once(
    executor,
    """    return {
      tabId: input.tabId,
      title: input.title,""",
    """    return {
      ...(input.tabId === undefined ? {} : { tabId: input.tabId }),
      title: input.title,""",
    "executor omit global tab",
)
executor_path.write_text(executor, encoding="utf-8")


coordinator_path = Path("apps/extension/src/lib/original-toolbar-tab-coordinator.ts")
coordinator = coordinator_path.read_text(encoding="utf-8")
coordinator = replace_once(
    coordinator,
    """export interface OriginalToolbarCoordinatorExecutor {
  apply(tabId: number, state: OriginalToolbarTabState): Promise<void>;
  applyDefault(tabId: number): Promise<void>;
  clearIconCache(): void;
}""",
    """export interface OriginalToolbarCoordinatorExecutor {
  apply(tabId: number, state: OriginalToolbarTabState): Promise<void>;
  applyDefault(tabId: number): Promise<void>;
  applyGlobal(state: OriginalToolbarTabState): Promise<void>;
  applyGlobalDefault(): Promise<void>;
  clearIconCache(): void;
}""",
    "coordinator global executor",
)
coordinator = replace_once(
    coordinator,
    """  | 'apply-state'
  | 'apply-default';""",
    """  | 'apply-state'
  | 'apply-default'
  | 'resolve-global'
  | 'apply-global'
  | 'apply-global-default';""",
    "coordinator global phases",
)
coordinator = replace_once(
    coordinator,
    """  async refreshAll(options: OriginalToolbarRefreshAllOptions = {}): Promise<void> {
    if (options.clearIconCache === true) this.#executor.clearIconCache();

    let tabs:""",
    """  async refreshAll(options: OriginalToolbarRefreshAllOptions = {}): Promise<void> {
    if (options.clearIconCache === true) this.#executor.clearIconCache();
    await this.refreshGlobal();

    let tabs:""",
    "refresh global before tabs",
)
coordinator = replace_once(
    coordinator,
    """  private async applyDefault(
    tabId: number,""",
    """  private async refreshGlobal(): Promise<void> {
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
    tabId: number,""",
    "coordinator global refresh",
)
coordinator_path.write_text(coordinator, encoding="utf-8")


adapter_test_path = Path("apps/extension/src/lib/original-toolbar-action-adapter.test.ts")
adapter_test = adapter_test_path.read_text(encoding="utf-8")
adapter_test = replace_once(
    adapter_test,
    """  it('clears stale Badge text when the derived state has no Badge', async () => {""",
    """  it('omits tabId when writing the global Action baseline', async () => {
    const action = new RecordingActionApi();
    const adapter = new OriginalToolbarActionAdapter(action);

    await adapter.apply({
      title: 'ZeroOmega:: [System Proxy]',
      badgeBackgroundColor: '#d90000',
      popup: 'popup-iframe.html',
      fallbackIconPaths,
    });

    expect(action.calls).toEqual([
      { method: 'setIcon', details: { path: fallbackIconPaths } },
      { method: 'setTitle', details: { title: 'ZeroOmega:: [System Proxy]' } },
      { method: 'setBadgeBackgroundColor', details: { color: '#d90000' } },
      { method: 'setBadgeText', details: { text: '' } },
      { method: 'setPopup', details: { popup: 'popup-iframe.html' } },
    ]);
  });

  it('clears stale Badge text when the derived state has no Badge', async () => {""",
    "adapter global test",
)
adapter_test_path.write_text(adapter_test, encoding="utf-8")


executor_test_path = Path("apps/extension/src/lib/original-toolbar-action-executor.test.ts")
executor_test = executor_test_path.read_text(encoding="utf-8")
executor_test = replace_once(
    executor_test,
    """  it('applies the localized default state without invoking the dynamic renderer', async () => {""",
    """  it('writes a global derived state without a tabId', async () => {
    const { action, renderer, executor } = createHarness();
    renderer.result = renderedIcon;

    await executor.applyGlobal(tabState());

    expect(action.presentations).toEqual([
      {
        title: 'ZeroOmega:: [Auto Switch]\\n(default)',
        badgeText: 'DIR',
        badgeBackgroundColor: '#d90000',
        popup: 'popup-iframe.html',
        imageData: renderedIcon,
        fallbackIconPaths,
      },
    ]);
  });

  it('applies the localized default state without invoking the dynamic renderer', async () => {""",
    "executor global state test",
)
executor_test = replace_once(
    executor_test,
    """  it('forwards explicit icon cache invalidation to the original renderer', () => {""",
    """  it('applies the global default without a tabId', async () => {
    const { action, executor } = createHarness();

    await executor.applyGlobalDefault();

    expect(action.presentations).toEqual([
      {
        title: '正在加载……',
        badgeBackgroundColor: '#d90000',
        popup: 'popup-iframe.html',
        fallbackIconPaths,
      },
    ]);
  });

  it('forwards explicit icon cache invalidation to the original renderer', () => {""",
    "executor global default test",
)
executor_test_path.write_text(executor_test, encoding="utf-8")


coordinator_test_path = Path("apps/extension/src/lib/original-toolbar-tab-coordinator.test.ts")
coordinator_test = coordinator_test_path.read_text(encoding="utf-8")
coordinator_test = replace_once(
    coordinator_test,
    """    | { readonly type: 'default'; readonly tabId: number }
    | { readonly type: 'clear-cache' }""",
    """    | { readonly type: 'default'; readonly tabId: number }
    | { readonly type: 'global'; readonly state: OriginalToolbarTabState }
    | { readonly type: 'global-default' }
    | { readonly type: 'clear-cache' }""",
    "coordinator test global call types",
)
coordinator_test = replace_once(
    coordinator_test,
    """  async applyDefault(tabId: number): Promise<void> {
    this.calls.push({ type: 'default', tabId });
  }

  clearIconCache(): void {""",
    """  async applyDefault(tabId: number): Promise<void> {
    this.calls.push({ type: 'default', tabId });
  }

  async applyGlobal(state: OriginalToolbarTabState): Promise<void> {
    this.calls.push({ type: 'global', state });
    if (this.applyError !== undefined) throw this.applyError;
  }

  async applyGlobalDefault(): Promise<void> {
    this.calls.push({ type: 'global-default' });
  }

  clearIconCache(): void {""",
    "coordinator test global methods",
)
coordinator_test = replace_once(
    coordinator_test,
    """    expect(executor.calls).toEqual([
      { type: 'clear-cache' },
      { type: 'apply', tabId: 19, state: state('https://first.test/') },""",
    """    expect(executor.calls).toEqual([
      { type: 'clear-cache' },
      { type: 'global', state: state('about:blank') },
      { type: 'apply', tabId: 19, state: state('https://first.test/') },""",
    "coordinator refresh-all global assertion",
)
coordinator_test = replace_once(
    coordinator_test,
    """  it('falls back to default and reports resolver or Action failures with tab context', async () => {""",
    """  it('uses a global loading fallback when the active route has no source-certain baseline', async () => {
    const { tabs, resolver, executor, coordinator } = createHarness();
    tabs.queryResult = [];
    resolver.implementation = () => undefined;

    await coordinator.refreshAll();

    expect(resolver.calls).toEqual([{ tabId: -1, url: 'about:blank' }]);
    expect(executor.calls).toEqual([{ type: 'global-default' }]);
  });

  it('falls back to default and reports resolver or Action failures with tab context', async () => {""",
    "coordinator global fallback test",
)
coordinator_test_path.write_text(coordinator_test, encoding="utf-8")


firefox_path = Path("scripts/e2e-firefox.mjs")
firefox_e2e = firefox_path.read_text(encoding="utf-8")
firefox_e2e = replace_once(
    firefox_e2e,
    """const driver = await new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(options).build();
""",
    """const driver = await new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(options).build();
const toolbarOnly = process.env.ZEROOMEGA_FIREFOX_TOOLBAR_ONLY === '1';
const toolbarOnlyComplete = Symbol('firefox-toolbar-only-complete');
""",
    "Firefox toolbar-only mode",
)
firefox_e2e = replace_once(
    firefox_e2e,
    """  await waitForFirefoxActionState(
    toolbarBypassTabId,
    fixedBypassAction,
    'Firefox Fixed bypass Action state failed',
  );

  await driver.get(authProxy.targetUrl);""",
    """  await waitForFirefoxActionState(
    toolbarBypassTabId,
    fixedBypassAction,
    'Firefox Fixed bypass Action state failed',
  );

  if (toolbarOnly) {
    console.log(`Firefox toolbar Action E2E passed for ${installedId}.`);
    throw toolbarOnlyComplete;
  }

  await driver.get(authProxy.targetUrl);""",
    "Firefox toolbar-only completion",
)
firefox_e2e = replace_once(
    firefox_e2e,
    """  console.log(`Firefox extension E2E passed for ${installedId}.`);
} finally {""",
    """  console.log(`Firefox extension E2E passed for ${installedId}.`);
} catch (error) {
  if (error !== toolbarOnlyComplete) throw error;
} finally {""",
    "Firefox toolbar-only cleanup",
)
firefox_path.write_text(firefox_e2e, encoding="utf-8")


package_path = Path("package.json")
package = package_path.read_text(encoding="utf-8")
package = replace_once(
    package,
    '    "test:e2e:firefox": "node scripts/e2e-firefox.mjs",',
    '    "test:e2e:firefox": "node scripts/e2e-firefox.mjs",\n'
    '    "test:e2e:firefox-toolbar": "ZEROOMEGA_FIREFOX_TOOLBAR_ONLY=1 node scripts/e2e-firefox.mjs",',
    "Firefox toolbar package script",
)
package_path.write_text(package, encoding="utf-8")
