import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  BrowserStorageProfileWorkflowRepository,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';
import { evaluateProfileGraph, type GraphDecision } from '@zeroomega-nex/reference-interpreter';
import { browser } from 'wxt/browser';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';

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
  readonly i18n?: {
    getMessage(name: string, substitutions?: string | readonly string[]): string;
  };
  readonly runtime: { readonly onMessage: InspectMessageEvent };
  readonly storage: {
    readonly local: ProfileWorkflowStorageArea;
    readonly session: InspectStorageArea;
    readonly onChanged: InspectStorageChangeEvent;
  };
  readonly tabs: { readonly onRemoved: InspectTabRemovedEvent };
}

export interface InspectRoutePresentation {
  readonly kind: 'direct' | 'system' | 'profile';
  readonly name: string;
}

export interface InspectResultPresentation {
  readonly current: InspectRoutePresentation;
  readonly result: InspectRoutePresentation;
  readonly color: string;
}

export interface InspectRuntimeOptions {
  readonly readEnabled?: () => Promise<boolean>;
  readonly readActiveRoute?: () => Promise<ProfileRouteTarget | undefined>;
  readonly evaluatePresentation?: (
    url: string,
    tabUrl: string | undefined,
  ) => Promise<InspectResultPresentation | undefined>;
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

function builtInColor(spec: ProfileSpec, kind: 'direct' | 'system'): string {
  return (
    spec.settings.interface.builtInProfiles?.[kind]?.color ??
    (kind === 'direct' ? '#bdbdbd' : '#616161')
  );
}

function routePresentation(
  spec: ProfileSpec,
  route: ProfileRouteTarget,
): InspectRoutePresentation & { readonly color: string } {
  if (route.kind === 'direct') {
    return { kind: 'direct', name: 'Direct', color: builtInColor(spec, 'direct') };
  }
  if (route.kind === 'system') {
    return { kind: 'system', name: 'System Proxy', color: builtInColor(spec, 'system') };
  }
  const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
  return {
    kind: 'profile',
    name: profile?.name ?? route.profileId,
    color: profile?.color ?? '#90a4ae',
  };
}

function currentRoutePresentation(
  spec: ProfileSpec,
  route: ProfileRouteTarget,
): InspectRoutePresentation & { readonly color: string } {
  const current = routePresentation(spec, route);
  if (route.kind !== 'profile') return current;
  const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
  if (profile?.kind !== 'virtual') return current;
  const target = routePresentation(spec, profile.targetRoute);
  return { ...current, name: `${current.name} [${target.name}]`, color: target.color };
}

function lastEnteredProfilePresentation(
  spec: ProfileSpec,
  decision: GraphDecision,
): (InspectRoutePresentation & { readonly color: string }) | undefined {
  for (let index = decision.trace.length - 1; index >= 0; index -= 1) {
    const entry = decision.trace[index];
    if (entry?.action !== 'enter-profile' || !entry.profileId) continue;
    return routePresentation(spec, { kind: 'profile', profileId: entry.profileId });
  }
  return undefined;
}

export function evaluateInspectResultPresentation(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  urlValue: string,
  now = Date.now(),
): InspectResultPresentation {
  const url = new URL(urlValue);
  const local = new Date(now);
  const request = {
    url: url.href,
    host: url.hostname,
    scheme: url.protocol.slice(0, -1),
    ...(url.port ? { port: Number(url.port) } : {}),
    localWeekday: local.getDay(),
    localHour: local.getHours(),
  };
  const decision = evaluateProfileGraph(spec, startRoute, request);
  const current = currentRoutePresentation(spec, startRoute);
  let result: InspectRoutePresentation & { readonly color: string } =
    lastEnteredProfilePresentation(spec, decision) ?? current;
  if (decision.status === 'resolved') {
    if (decision.route.kind === 'direct') result = routePresentation(spec, { kind: 'direct' });
    else if (decision.route.kind === 'system') result = routePresentation(spec, { kind: 'system' });
  }
  return {
    current: { kind: current.kind, name: current.name },
    result: { kind: result.kind, name: result.name },
    color: result.color,
  };
}

async function readActiveRouteFromBrowser(): Promise<ProfileRouteTarget | undefined> {
  const runtime = currentBrowserProxyRuntime();
  try {
    const state = await runtime.repository.getState();
    if (state.activeBuiltInMode) return { kind: state.activeBuiltInMode };
    if (!state.activeSnapshotId) return undefined;
    return (await runtime.repository.getSnapshot(state.activeSnapshotId))?.startRoute;
  } finally {
    runtime.dispose();
  }
}

function localizedRouteName(api: InspectRuntimeApi, route: InspectRoutePresentation): string {
  const key =
    route.kind === 'direct' ? 'routeDirect' : route.kind === 'system' ? 'routeSystem' : '';
  if (!key) return route.name;
  const localized = api.i18n?.getMessage(key);
  return localized && localized !== key ? localized : route.name;
}

function routeSummary(api: InspectRuntimeApi, presentation: InspectResultPresentation): string {
  const current = localizedRouteName(api, presentation.current);
  const result = localizedRouteName(api, presentation.result);
  const localizedExtensionName = api.i18n?.getMessage('extensionName');
  const extensionName =
    localizedExtensionName && localizedExtensionName !== 'extensionName'
      ? localizedExtensionName
      : 'ZeroOmega Nex';
  return `${extensionName} — ${current === result ? current : `${current} → ${result}`}`;
}

function urlForMenu(info: InspectContextMenuInfo): string | undefined {
  const id = String(info.menuItemId);
  if (id === INSPECT_MENU_IDS.frame) return info.frameUrl;
  if (id === INSPECT_MENU_IDS.link) return info.linkUrl;
  if (id === INSPECT_MENU_IDS.element) return info.srcUrl;
  return undefined;
}

function inspectTitle(
  api: InspectRuntimeApi,
  url: string,
  tabUrl: string | undefined,
  presentation: InspectResultPresentation | undefined,
): string {
  const target = new URL(url);
  let display = target.hostname;
  try {
    const page = tabUrl ? new URL(tabUrl) : undefined;
    if (page?.hostname === target.hostname) display = `${target.pathname}${target.search}` || '/';
  } catch {
    // The target itself was already validated. A malformed tab URL only affects display shortening.
  }
  const key = 'browserActionTitleInspect';
  const localized = api.i18n?.getMessage(key, display);
  const heading = localized && localized !== key ? localized : `[Inspect] ${display}`;
  return presentation ? `${heading}\n${routeSummary(api, presentation)}` : heading;
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
  presentation: InspectResultPresentation | undefined,
): Promise<void> {
  const state = await readState(api.storage.session);
  const inspectedAt = new Date(now()).toISOString();
  await writeEntries(api.storage.session, {
    ...state.entries,
    [String(tabId)]: { url, inspectedAt },
  });
  await Promise.all([
    Promise.resolve(api.action.setBadgeText({ tabId, text: '#' })),
    Promise.resolve(
      api.action.setBadgeBackgroundColor({ tabId, color: presentation?.color ?? '#607d8b' }),
    ),
    Promise.resolve(
      api.action.setTitle({ tabId, title: inspectTitle(api, url, tabUrl, presentation) }),
    ),
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
  const readActiveRoute = options.readActiveRoute ?? readActiveRouteFromBrowser;
  const evaluatePresentation =
    options.evaluatePresentation ??
    (async (url: string) => {
      const workflow = await repository.read();
      if (!workflow) return undefined;
      const activeRoute = await readActiveRoute();
      if (!activeRoute) return undefined;
      return evaluateInspectResultPresentation(workflow.applied, activeRoute, url, now());
    });
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
    void (async () => {
      if (url === tab.url) {
        await removeEntry(api, tab.id!);
        return;
      }
      let presentation: InspectResultPresentation | undefined;
      try {
        presentation = await evaluatePresentation(url, tab.url);
      } catch (error) {
        console.warn('Unable to evaluate inspected URL result route.', error);
      }
      await storeEntry(api, tab.id!, url, tab.url, now, presentation);
    })().catch((error: unknown) => console.error('Unable to store inspected URL.', error));
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
