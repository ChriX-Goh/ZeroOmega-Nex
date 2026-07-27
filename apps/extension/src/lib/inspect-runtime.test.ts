import { describe, expect, it } from 'vitest';

import {
  INSPECT_MENU_IDS,
  registerInspectRuntime,
  type InspectRuntimeApi,
} from './inspect-runtime';

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function fakeApi() {
  const session: Record<string, unknown> = {};
  const menus: { id: string; title: string; contexts: readonly string[] }[] = [];
  const badgeCalls: unknown[] = [];
  const titleCalls: unknown[] = [];
  let clickListener:
    | ((info: Record<string, unknown>, tab: Record<string, unknown>) => void)
    | undefined;
  let messageListener: ((message: unknown) => unknown) | undefined;
  let storageListener:
    | ((changes: Record<string, { readonly newValue?: unknown }>, areaName: string) => void)
    | undefined;
  let tabRemovedListener: ((tabId: number) => void) | undefined;

  const area = {
    async get(keys: string | readonly string[]) {
      const requested = typeof keys === 'string' ? [keys] : keys;
      return Object.fromEntries(requested.map((key) => [key, session[key]]));
    },
    async set(items: Record<string, unknown>) {
      Object.assign(session, items);
    },
  };

  const api = {
    contextMenus: {
      create(properties: {
        readonly id: string;
        readonly title: string;
        readonly contexts: readonly string[];
      }) {
        menus.push(properties);
        return properties.id;
      },
      remove(menuItemId: string) {
        const index = menus.findIndex((menu) => menu.id === menuItemId);
        if (index >= 0) menus.splice(index, 1);
      },
      onClicked: {
        addListener(listener: typeof clickListener) {
          clickListener = listener;
        },
        removeListener() {
          clickListener = undefined;
        },
      },
    },
    action: {
      setBadgeText(details: unknown) {
        badgeCalls.push(details);
      },
      setBadgeBackgroundColor() {},
      setTitle(details: unknown) {
        titleCalls.push(details);
      },
    },
    i18n: { getMessage: (name: string) => name },
    runtime: {
      onMessage: {
        addListener(listener: typeof messageListener) {
          messageListener = listener;
        },
        removeListener() {
          messageListener = undefined;
        },
      },
    },
    storage: {
      local: { get: async () => ({}), set: async () => undefined },
      session: area,
      onChanged: {
        addListener(listener: typeof storageListener) {
          storageListener = listener;
        },
        removeListener() {
          storageListener = undefined;
        },
      },
    },
    tabs: {
      onRemoved: {
        addListener(listener: typeof tabRemovedListener) {
          tabRemovedListener = listener;
        },
        removeListener() {
          tabRemovedListener = undefined;
        },
      },
    },
  } as unknown as InspectRuntimeApi;

  return {
    api,
    menus,
    badgeCalls,
    titleCalls,
    click: (info: Record<string, unknown>, tab: Record<string, unknown>) =>
      clickListener?.(info, tab),
    message: (message: unknown) => messageListener?.(message),
    storageChanged: () =>
      storageListener?.({ 'zeroomega-nex/profile-workflow/v1/state': {} }, 'local'),
    removeTab: (tabId: number) => tabRemovedListener?.(tabId),
  };
}

describe('inspect runtime', () => {
  it('reconciles the three source-backed context menus from Applied settings', async () => {
    const fake = fakeApi();
    let enabled = true;
    const runtime = registerInspectRuntime(fake.api, { readEnabled: async () => enabled });
    await runtime.ready;
    expect(fake.menus.map((menu) => menu.id)).toEqual([
      INSPECT_MENU_IDS.frame,
      INSPECT_MENU_IDS.link,
      INSPECT_MENU_IDS.element,
    ]);

    enabled = false;
    fake.storageChanged();
    await runtime.refresh();
    expect(fake.menus).toEqual([]);
    runtime.dispose();
  });

  it('stores inspected link targets per tab in session storage and exposes a bounded view', async () => {
    const fake = fakeApi();
    const now = Date.parse('2026-07-27T17:00:00.000Z');
    const runtime = registerInspectRuntime(fake.api, {
      readEnabled: async () => true,
      now: () => now,
    });
    await runtime.ready;
    fake.click(
      { menuItemId: INSPECT_MENU_IDS.link, linkUrl: 'https://cdn.example.test/file.js' },
      { id: 7, url: 'https://www.example.test/page' },
    );
    await tick();

    const response = await fake.message({
      channel: 'zeroomega-nex/inspect/v1',
      action: 'get',
      tabId: 7,
    });
    expect(response).toEqual({
      ok: true,
      view: {
        tabId: 7,
        url: 'https://cdn.example.test/file.js',
        inspectedAt: '2026-07-27T17:00:00.000Z',
      },
    });
    expect(fake.badgeCalls).toContainEqual({ tabId: 7, text: '#' });
    expect(fake.titleCalls).toContainEqual({ tabId: 7, title: 'Inspect cdn.example.test' });
    runtime.dispose();
  });

  it('clears the inspected target for the page URL and when the tab closes', async () => {
    const fake = fakeApi();
    const runtime = registerInspectRuntime(fake.api, { readEnabled: async () => true });
    await runtime.ready;
    fake.click(
      { menuItemId: INSPECT_MENU_IDS.frame, frameUrl: 'https://frame.example.test/' },
      { id: 9, url: 'https://page.example.test/' },
    );
    await tick();
    fake.click(
      { menuItemId: INSPECT_MENU_IDS.frame, frameUrl: 'https://page.example.test/' },
      { id: 9, url: 'https://page.example.test/' },
    );
    await tick();
    expect(
      await fake.message({ channel: 'zeroomega-nex/inspect/v1', action: 'get', tabId: 9 }),
    ).toEqual({
      ok: true,
      view: { tabId: 9 },
    });

    fake.click(
      { menuItemId: INSPECT_MENU_IDS.element, srcUrl: 'https://media.example.test/a.png' },
      { id: 10, url: 'https://page.example.test/' },
    );
    await tick();
    fake.removeTab(10);
    await tick();
    expect(
      await fake.message({ channel: 'zeroomega-nex/inspect/v1', action: 'get', tabId: 10 }),
    ).toEqual({
      ok: true,
      view: { tabId: 10 },
    });
    runtime.dispose();
  });
});
