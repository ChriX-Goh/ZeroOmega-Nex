import { describe, expect, it, vi } from 'vitest';

import type { OriginalToolbarActionApi } from './original-toolbar-action-adapter';
import { OriginalToolbarInspectOverlayManager } from './original-toolbar-inspect-overlay';
import type { OriginalToolbarTabState } from './original-toolbar-tab-state';
import type { OriginalToolbarCoordinatorExecutor } from './original-toolbar-tab-coordinator';

function tick(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function state(): OriginalToolbarTabState {
  return {
    icon: { mode: 'single-color', outerCircleColor: '#123456' },
    titleArguments: {
      currentProfileName: 'Proxy',
      resultProfileName: 'Proxy',
      details: 'PROXY 127.0.0.1:7890\n',
    },
  };
}

describe('original toolbar Inspect overlay manager', () => {
  it('captures Inspect fields without writing the browser Action directly', async () => {
    const action: OriginalToolbarActionApi = {
      setIcon: vi.fn(),
      setTitle: vi.fn(),
      setBadgeText: vi.fn(),
      setBadgeBackgroundColor: vi.fn(),
      setPopup: vi.fn(),
    };
    const base: OriginalToolbarCoordinatorExecutor = {
      apply: vi.fn(),
      applyDefault: vi.fn(),
      applyGlobal: vi.fn(),
      applyGlobalDefault: vi.fn(),
      clearIconCache: vi.fn(),
    };
    const manager = new OriginalToolbarInspectOverlayManager(action, base);
    const refresh = vi.fn();
    manager.setRefreshListener(refresh);

    manager.inspectAction.setBadgeText({ tabId: 7, text: '#' });
    manager.inspectAction.setBadgeBackgroundColor({ tabId: 7, color: '#aaaaaa' });
    manager.inspectAction.setTitle({ tabId: 7, title: '[Inspect] example.test' });

    expect(action.setBadgeText).not.toHaveBeenCalled();
    expect(action.setBadgeBackgroundColor).not.toHaveBeenCalled();
    expect(action.setTitle).not.toHaveBeenCalled();

    await tick();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith(7);
  });

  it('applies the base state first and then the complete Inspect overlay', async () => {
    const order: string[] = [];
    const action: OriginalToolbarActionApi = {
      setIcon: vi.fn(),
      setPopup: vi.fn(),
      setBadgeText: vi.fn(() => {
        order.push('overlay-badge');
      }),
      setBadgeBackgroundColor: vi.fn(() => {
        order.push('overlay-color');
      }),
      setTitle: vi.fn(() => {
        order.push('overlay-title');
      }),
    };
    const base: OriginalToolbarCoordinatorExecutor = {
      apply: vi.fn(async () => {
        order.push('base');
      }),
      applyDefault: vi.fn(),
      applyGlobal: vi.fn(),
      applyGlobalDefault: vi.fn(),
      clearIconCache: vi.fn(),
    };
    const manager = new OriginalToolbarInspectOverlayManager(action, base);

    manager.inspectAction.setBadgeText({ tabId: 9, text: '#' });
    manager.inspectAction.setBadgeBackgroundColor({ tabId: 9, color: '#64b5f6' });
    manager.inspectAction.setTitle({ tabId: 9, title: '[Inspect] /asset.js' });
    await manager.executor.apply(9, state());

    expect(base.apply).toHaveBeenCalledWith(9, state());
    expect(order[0]).toBe('base');
    expect(action.setBadgeText).toHaveBeenCalledWith({ tabId: 9, text: '#' });
    expect(action.setBadgeBackgroundColor).toHaveBeenCalledWith({
      tabId: 9,
      color: '#64b5f6',
    });
    expect(action.setTitle).toHaveBeenCalledWith({
      tabId: 9,
      title: '[Inspect] /asset.js',
    });
  });

  it('delegates global baselines without applying any per-tab Inspect overlay', async () => {
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

  it('reapplies an active overlay after a default toolbar refresh', async () => {
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

    manager.inspectAction.setBadgeText({ tabId: 11, text: '#' });
    manager.inspectAction.setTitle({ tabId: 11, title: '[Inspect] example.test' });
    await manager.executor.applyDefault(11);

    expect(base.applyDefault).toHaveBeenCalledWith(11);
    expect(action.setBadgeText).toHaveBeenCalledWith({ tabId: 11, text: '#' });
    expect(action.setTitle).toHaveBeenCalledWith({
      tabId: 11,
      title: '[Inspect] example.test',
    });
  });

  it('removes the overlay when Inspect clears its badge and delegates icon cache invalidation', async () => {
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
    const refresh = vi.fn();
    manager.setRefreshListener(refresh);

    manager.inspectAction.setBadgeText({ tabId: 13, text: '#' });
    manager.inspectAction.setTitle({ tabId: 13, title: '[Inspect] example.test' });
    await tick();
    refresh.mockClear();

    manager.inspectAction.setBadgeText({ tabId: 13, text: '' });
    manager.inspectAction.setTitle({ tabId: 13, title: 'ignored legacy clear title' });
    await tick();
    await manager.executor.applyDefault(13);
    manager.executor.clearIconCache();

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(action.setBadgeText).not.toHaveBeenCalled();
    expect(action.setTitle).not.toHaveBeenCalled();
    expect(base.clearIconCache).toHaveBeenCalledTimes(1);
  });
});
