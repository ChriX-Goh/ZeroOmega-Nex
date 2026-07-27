import {
  BrowserStorageProfileWorkflowRepository,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';
import { browser } from 'wxt/browser';

import {
  isInspectCommand,
  type InspectCommandResponse,
  type InspectTargetView,
} from './inspect-client';

const PROFILE_WORKFLOW_STATE_KEY = 'zeroomega-nex/profile-workflow/v1/state';
const INSPECT_STATE_KEY = 'zeroomega-nex/inspect/v1/state';
const INSPECT_STATE_VERSION = 1;
const INSPECT_TTL_MS = 10 * 60 * 1000;
const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:', 'ftp:']);

export const INSPECT_MENU_IDS = {
  frame: 'zeroomega-nex/inspect-frame',
  link: 'zeroomega-nex/inspect-link',
  element: 'zeroomega-nex/inspect-element',
} as const;

type InspectMenuId = (typeof INSPECT_MENU_IDS)[keyof typeof INSPECT_MENU_IDS];

interface StoredInspectEntry {
  readonly url: string;
  readonly inspectedAt: string;
}

interface StoredInspectState {
  readonly version: typeof INSPECT_STATE_VERSION;
  readonly entries: Readonly<Record<string, StoredInspectEntry>>;
}

interface InspectStorageArea {
  get(keys: string | readonly string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

interface InspectContextMenuInfo {
  readonly menuItemId: string | number;
  readonly frameUrl?: string;
  readonly linkUrl?: string;
  readonly srcUrl?: string;
}

interface InspectTab {
  readonly id?: number;
  readonly url?: string;
}

interface InspectContextMenuEvent {
  addListener(listener: (info: InspectContextMenuInfo, tab: InspectTab) => void): void;
  removeListener(listener: (info: InspectContextMenuInfo, tab: InspectTab) => void): void;
}

interface InspectMessageEvent {
  addListener(
    listener: (
      message: unknown,
    ) => InspectCommandResponse | Promise<InspectCommandResponse> | undefined,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}

interface InspectStorageChangeEvent {
  addListener(
    listener: (changes: Record<string, { readonly newValue?: unknown }>, areaName: string) => void,
  ): void;
  removeListener(
    listener: (changes: Record<string, { readonly newValue?: unknown }>, areaName: string) => void,
  ): void;
}

interface InspectTabRemovedEvent {
  addListener(listener: (tabId: number) => void): void;
  removeListener(listener: (tabId: number) => void): void;
}

export interface InspectRuntimeApi {
  readonly contextMenus?: {
    create(properties: {
      readonly id: InspectMenuId;
      readonly title: string;
      readonly contexts: readonly string[];
      readonly documentUrlPatterns?: readonly string[];
      readonly targetUrlPatterns?: readonly string[];
    }): string | number;
    remove(menuItemId: InspectMenuId): Promise<void> | void;
    readonly onClicked: InspectContextMenuEvent;
  };
  readonly action: {
    setBadgeText(details: { readonly tabId: number; readonly text: string }): Promise<void> | void;
    setBadgeBackgroundColor(details: {
      readonly tabId: number;
      readonly color: string;
    }): Promise<void> | void;
    setTitle(details: { readonly tabId: number; readonly title: string }): Promise<void> | void;
  };
  readonly i18n?: { getMessage(name: string): string };
  readonly runtime: { readonly onMessage: InspectMessageEvent };
  readonly storage: {
    readonly local: ProfileWorkflowStorageArea;
    readonly session: InspectStorageArea;
    readonly onChanged: InspectStorageChangeEvent;
  };
  readonly tabs: { readonly onRemoved: InspectTabRemovedEvent };
}

export interface InspectRuntimeOptions {
  readonly readEnabled?: () => Promise<boolean>;
  readonly now?: () => number;
}

export interface RegisteredInspectRuntime {
  readonly ready: Promise<void>;
  refresh(): Promise<void>;
  dispose(): void;
}

function emptyState(): StoredInspectState {
  return { version: INSPECT_STATE_VERSION, entries: {} };
}

function parseState(value: unknown): StoredInspectState {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return emptyState();
  const record = value as Record<string, unknown>;
  if (
    record.version !== INSPECT_STATE_VERSION ||
    record.entries === null ||
    typeof record.entries !== 'object'
  ) {
    return emptyState();
  }
  const entries: Record<string, StoredInspectEntry> = {};
  for (const [tabId, raw] of Object.entries(record.entries as Record<string, unknown>)) {
    if (!/^\d+$/u.test(tabId) || raw === null || typeof raw !== 'object' || Array.isArray(raw))
      continue;
    const entry = raw as Record<string, unknown>;
    if (typeof entry.url !== 'string' || typeof entry.inspectedAt !== 'string') continue;
    if (!supportedUrl(entry.url)) continue;
    entries[tabId] = { url: entry.url, inspectedAt: entry.inspectedAt };
  }
  return { version: INSPECT_STATE_VERSION, entries };
}

async function readState(area: InspectStorageArea): Promise<StoredInspectState> {
  const values = await area.get(INSPECT_STATE_KEY);
  return parseState(values[INSPECT_STATE_KEY]);
}

async function writeEntries(
  area: InspectStorageArea,
  entries: Readonly<Record<string, StoredInspectEntry>>,
): Promise<void> {
  await area.set({ [INSPECT_STATE_KEY]: { version: INSPECT_STATE_VERSION, entries } });
}

function supportedUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return SUPPORTED_PROTOCOLS.has(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function urlForMenu(info: InspectContextMenuInfo): string | undefined {
  const id = String(info.menuItemId);
  if (id === INSPECT_MENU_IDS.frame) return info.frameUrl;
  if (id === INSPECT_MENU_IDS.link) return info.linkUrl;
  if (id === INSPECT_MENU_IDS.element) return info.srcUrl;
  return undefined;
}

function inspectTitle(url: string, tabUrl: string | undefined): string {
  const target = new URL(url);
  let display = target.hostname;
  try {
    const page = tabUrl ? new URL(tabUrl) : undefined;
    if (page?.hostname === target.hostname) display = `${target.pathname}${target.search}` || '/';
  } catch {
    // The target itself was already validated. A malformed tab URL only affects display shortening.
  }
  return `Inspect ${display}`;
}

async function clearBadge(api: InspectRuntimeApi, tabId: number): Promise<void> {
  await Promise.all([
    Promise.resolve(api.action.setBadgeText({ tabId, text: '' })),
    Promise.resolve(
      api.action.setTitle({
        tabId,
        title: api.i18n?.getMessage('actionTitle') || 'ZeroOmega Nex — switch profile',
      }),
    ),
  ]);
}

async function removeEntry(api: InspectRuntimeApi, tabId: number, clear = true): Promise<void> {
  const state = await readState(api.storage.session);
  if (state.entries[String(tabId)] === undefined) {
    if (clear) await clearBadge(api, tabId);
    return;
  }
  const entries = { ...state.entries };
  delete entries[String(tabId)];
  await writeEntries(api.storage.session, entries);
  if (clear) await clearBadge(api, tabId);
}

async function storeEntry(
  api: InspectRuntimeApi,
  tabId: number,
  url: string,
  tabUrl: string | undefined,
  now: () => number,
): Promise<void> {
  const state = await readState(api.storage.session);
  const inspectedAt = new Date(now()).toISOString();
  await writeEntries(api.storage.session, {
    ...state.entries,
    [String(tabId)]: { url, inspectedAt },
  });
  await Promise.all([
    Promise.resolve(api.action.setBadgeText({ tabId, text: '#' })),
    Promise.resolve(api.action.setBadgeBackgroundColor({ tabId, color: '#607d8b' })),
    Promise.resolve(api.action.setTitle({ tabId, title: inspectTitle(url, tabUrl) })),
  ]);
}

async function readView(
  api: InspectRuntimeApi,
  tabId: number,
  now: () => number,
): Promise<InspectTargetView> {
  const state = await readState(api.storage.session);
  const entry = state.entries[String(tabId)];
  if (!entry) return { tabId };
  const timestamp = Date.parse(entry.inspectedAt);
  if (!Number.isFinite(timestamp) || now() - timestamp > INSPECT_TTL_MS) {
    await removeEntry(api, tabId);
    return { tabId };
  }
  return { tabId, url: entry.url, inspectedAt: entry.inspectedAt };
}

function menuTitle(api: InspectRuntimeApi, key: string, fallback: string): string {
  return api.i18n?.getMessage(key) || fallback;
}

async function removeMenus(api: InspectRuntimeApi): Promise<void> {
  if (!api.contextMenus) return;
  await Promise.all(
    Object.values(INSPECT_MENU_IDS).map((id) =>
      Promise.resolve(api.contextMenus!.remove(id)).catch(() => undefined),
    ),
  );
}

async function createMenus(api: InspectRuntimeApi): Promise<void> {
  if (!api.contextMenus) return;
  const webResources = ['http://*/*', 'https://*/*', 'ftp://*/*'];
  api.contextMenus.create({
    id: INSPECT_MENU_IDS.frame,
    title: menuTitle(api, 'contextMenuInspectFrame', 'Inspect frame'),
    contexts: ['frame'],
    documentUrlPatterns: webResources,
  });
  api.contextMenus.create({
    id: INSPECT_MENU_IDS.link,
    title: menuTitle(api, 'contextMenuInspectLink', 'Inspect link'),
    contexts: ['link'],
    targetUrlPatterns: webResources,
  });
  api.contextMenus.create({
    id: INSPECT_MENU_IDS.element,
    title: menuTitle(api, 'contextMenuInspectElement', 'Inspect element'),
    contexts: ['image', 'video', 'audio'],
    targetUrlPatterns: webResources,
  });
}

export function registerInspectRuntime(
  api: InspectRuntimeApi,
  options: InspectRuntimeOptions = {},
): RegisteredInspectRuntime {
  const now = options.now ?? Date.now;
  const repository = new BrowserStorageProfileWorkflowRepository(api.storage.local);
  const readEnabled =
    options.readEnabled ??
    (async () => (await repository.read())?.applied.settings.interface.showInspectMenu === true);
  let disposed = false;
  let enabled = false;
  let reconciliation = Promise.resolve();

  const refresh = (): Promise<void> => {
    reconciliation = reconciliation.then(async () => {
      if (disposed) return;
      const nextEnabled = await readEnabled();
      if (nextEnabled === enabled && (enabled || !api.contextMenus)) return;
      await removeMenus(api);
      enabled = nextEnabled;
      if (enabled) await createMenus(api);
    });
    return reconciliation;
  };

  const clickListener = (info: InspectContextMenuInfo, tab: InspectTab): void => {
    if (!enabled || tab.id === undefined) return;
    const url = urlForMenu(info);
    if (!url || !supportedUrl(url)) return;
    void (
      url === tab.url ? removeEntry(api, tab.id) : storeEntry(api, tab.id, url, tab.url, now)
    ).catch((error: unknown) => console.error('Unable to store inspected URL.', error));
  };

  const messageListener = (message: unknown): Promise<InspectCommandResponse> | undefined => {
    if (!isInspectCommand(message)) return undefined;
    return readView(api, message.tabId, now).then(
      (view) => ({ ok: true, view }),
      (error: unknown) => ({
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  };

  const storageListener = (
    changes: Record<string, { readonly newValue?: unknown }>,
    areaName: string,
  ): void => {
    if (areaName === 'local' && changes[PROFILE_WORKFLOW_STATE_KEY] !== undefined) {
      void refresh().catch((error: unknown) =>
        console.error('Unable to refresh inspect menus.', error),
      );
    }
  };

  const tabRemovedListener = (tabId: number): void => {
    void removeEntry(api, tabId, false).catch(() => undefined);
  };

  api.contextMenus?.onClicked.addListener(clickListener);
  api.runtime.onMessage.addListener(messageListener);
  api.storage.onChanged.addListener(storageListener);
  api.tabs.onRemoved.addListener(tabRemovedListener);
  const ready = refresh();

  return {
    ready,
    refresh,
    dispose: () => {
      disposed = true;
      api.contextMenus?.onClicked.removeListener(clickListener);
      api.runtime.onMessage.removeListener(messageListener);
      api.storage.onChanged.removeListener(storageListener);
      api.tabs.onRemoved.removeListener(tabRemovedListener);
      void removeMenus(api);
    },
  };
}

export function currentInspectRuntimeApi(): InspectRuntimeApi {
  return browser as unknown as InspectRuntimeApi;
}
