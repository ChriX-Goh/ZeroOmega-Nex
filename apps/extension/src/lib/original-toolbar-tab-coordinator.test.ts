import { describe, expect, it, vi } from 'vitest';

import type { OriginalToolbarTabState } from './original-toolbar-tab-state';
import {
  OriginalToolbarTabCoordinator,
  type OriginalToolbarActivatedListener,
  type OriginalToolbarCoordinatorExecutor,
  type OriginalToolbarCoordinatorTab,
  type OriginalToolbarEvent,
  type OriginalToolbarTabStateResolver,
  type OriginalToolbarTabsApi,
  type OriginalToolbarUpdatedListener,
} from './original-toolbar-tab-coordinator';

class RecordingEvent<Listener> implements OriginalToolbarEvent<Listener> {
  readonly listeners = new Set<Listener>();

  addListener(listener: Listener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: Listener): void {
    this.listeners.delete(listener);
  }

  emit(invoke: (listener: Listener) => void): void {
    for (const listener of this.listeners) invoke(listener);
  }
}

class RecordingTabsApi implements OriginalToolbarTabsApi {
  readonly onUpdated = new RecordingEvent<OriginalToolbarUpdatedListener>();
  readonly onActivated = new RecordingEvent<OriginalToolbarActivatedListener>();
  readonly getCalls: number[] = [];
  readonly queryCalls: Array<Record<string, never>> = [];
  readonly tabs = new Map<number, OriginalToolbarCoordinatorTab>();
  queryResult: readonly OriginalToolbarCoordinatorTab[] = [];

  async get(tabId: number): Promise<OriginalToolbarCoordinatorTab> {
    this.getCalls.push(tabId);
    const tab = this.tabs.get(tabId);
    if (tab === undefined) throw new Error(`missing tab ${tabId}`);
    return tab;
  }

  async query(queryInfo: Record<string, never>): Promise<readonly OriginalToolbarCoordinatorTab[]> {
    this.queryCalls.push(queryInfo);
    return this.queryResult;
  }
}

class RecordingExecutor implements OriginalToolbarCoordinatorExecutor {
  readonly calls: Array<
    | { readonly type: 'apply'; readonly tabId: number; readonly state: OriginalToolbarTabState }
    | { readonly type: 'default'; readonly tabId: number }
    | { readonly type: 'clear-cache' }
  > = [];
  applyError: unknown;

  async apply(tabId: number, state: OriginalToolbarTabState): Promise<void> {
    this.calls.push({ type: 'apply', tabId, state });
    if (this.applyError !== undefined) throw this.applyError;
  }

  async applyDefault(tabId: number): Promise<void> {
    this.calls.push({ type: 'default', tabId });
  }

  clearIconCache(): void {
    this.calls.push({ type: 'clear-cache' });
  }
}

class RecordingResolver implements OriginalToolbarTabStateResolver {
  readonly calls: Array<{ readonly tabId: number; readonly url: string }> = [];
  implementation: (
    input: { readonly tabId: number; readonly url: string },
  ) => Promise<OriginalToolbarTabState | undefined> | OriginalToolbarTabState | undefined = () =>
    undefined;

  resolve(input: {
    readonly tabId: number;
    readonly url: string;
  }): Promise<OriginalToolbarTabState | undefined> | OriginalToolbarTabState | undefined {
    this.calls.push(input);
    return this.implementation(input);
  }
}

function state(name: string): OriginalToolbarTabState {
  return {
    icon: {
      mode: 'single-color',
      outerCircleColor: name,
    },
    titleArguments: {
      currentProfileName: name,
      resultProfileName: name,
      details: `details:${name}`,
    },
  };
}

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function flushEvents(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function createHarness() {
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
}

describe('original toolbar tab coordinator', () => {
  it('registers one URL-update and activation listener and removes both on stop', async () => {
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
  });

  it('discards an older in-flight result before the newer URL writes Action state', async () => {
    const { resolver, executor, coordinator } = createHarness();
    const oldStarted = deferred<void>();
    const oldResult = deferred<OriginalToolbarTabState | undefined>();
    resolver.implementation = ({ url }) => {
      if (url === 'https://old.test/') {
        oldStarted.resolve();
        return oldResult.promise;
      }
      return state('new');
    };

    const oldRefresh = coordinator.refreshTab(11, 'https://old.test/');
    await oldStarted.promise;
    const newRefresh = coordinator.refreshTab(11, 'https://new.test/');
    oldResult.resolve(state('old'));
    await Promise.all([oldRefresh, newRefresh]);

    expect(executor.calls).toEqual([{ type: 'apply', tabId: 11, state: state('new') }]);
  });

  it('uses the default state for missing URLs and unresolved internal pages', async () => {
    const { tabs, resolver, executor, coordinator } = createHarness();
    tabs.tabs.set(13, { id: 13 });
    resolver.implementation = () => undefined;

    await coordinator.refreshTab(13);
    await coordinator.refreshTab(17, 'about:support');

    expect(resolver.calls).toEqual([{ tabId: 17, url: 'about:support' }]);
    expect(executor.calls).toEqual([
      { type: 'default', tabId: 13 },
      { type: 'default', tabId: 17 },
    ]);
  });

  it('refreshes all identified tabs and clears the icon cache only when requested', async () => {
    const { tabs, resolver, executor, coordinator } = createHarness();
    tabs.queryResult = [
      { id: 19, url: 'https://first.test/' },
      { id: 23, url: 'https://second.test/' },
      { url: 'https://without-id.test/' },
    ];
    resolver.implementation = ({ url }) => state(url);

    await coordinator.refreshAll({ clearIconCache: true });

    expect(tabs.queryCalls).toEqual([{}]);
    expect(executor.calls).toEqual([
      { type: 'clear-cache' },
      { type: 'apply', tabId: 19, state: state('https://first.test/') },
      { type: 'apply', tabId: 23, state: state('https://second.test/') },
    ]);
  });

  it('falls back to default and reports resolver or Action failures with tab context', async () => {
    const { resolver, executor, onError, coordinator } = createHarness();
    const resolveError = new Error('resolve failed');
    resolver.implementation = () => Promise.reject(resolveError);

    await coordinator.refreshTab(29, 'https://resolve-failure.test/');

    expect(onError).toHaveBeenCalledWith(resolveError, {
      phase: 'resolve-state',
      tabId: 29,
      url: 'https://resolve-failure.test/',
    });
    expect(executor.calls).toEqual([{ type: 'default', tabId: 29 }]);

    const applyError = new Error('apply failed');
    resolver.implementation = () => state('apply-failure');
    executor.applyError = applyError;
    await coordinator.refreshTab(31, 'https://apply-failure.test/');

    expect(onError).toHaveBeenCalledWith(applyError, {
      phase: 'apply-state',
      tabId: 31,
      url: 'https://apply-failure.test/',
    });
    expect(executor.calls.slice(-2)).toEqual([
      { type: 'apply', tabId: 31, state: state('apply-failure') },
      { type: 'default', tabId: 31 },
    ]);
  });

  it('invalidates in-flight work when stopped', async () => {
    const { resolver, executor, coordinator } = createHarness();
    const started = deferred<void>();
    const result = deferred<OriginalToolbarTabState | undefined>();
    resolver.implementation = () => {
      started.resolve();
      return result.promise;
    };
    coordinator.start();

    const refresh = coordinator.refreshTab(37, 'https://stopped.test/');
    await started.promise;
    coordinator.stop();
    result.resolve(state('stale'));
    await refresh;

    expect(executor.calls).toEqual([]);
  });
});
