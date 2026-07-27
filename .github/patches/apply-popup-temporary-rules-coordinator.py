from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    target.write_text(text.replace(old, new))


Path('apps/extension/src/lib/popup-temporary-rule-client.ts').write_text(r'''import type { ProfileRouteTarget } from '@zeroomega-nex/profile-spec';
import type { PopupTemporaryRuleView } from '@zeroomega-nex/profile-workflow';
import { browser } from 'wxt/browser';

export const POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL =
  'zeroomega-nex/popup-temporary-rules/v1' as const;

export type PopupTemporaryRuleCommand =
  | {
      readonly channel: typeof POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL;
      readonly action: 'get';
    }
  | {
      readonly channel: typeof POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL;
      readonly action: 'toggle';
      readonly expectedAppliedRevisionId: string;
      readonly domain: string;
      readonly route: ProfileRouteTarget;
    }
  | {
      readonly channel: typeof POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL;
      readonly action: 'remove';
      readonly expectedAppliedRevisionId: string;
      readonly domain: string;
    }
  | {
      readonly channel: typeof POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL;
      readonly action: 'clear';
      readonly expectedAppliedRevisionId: string;
    };

export type PopupTemporaryRuleCommandResponse =
  | { readonly ok: true; readonly view: PopupTemporaryRuleView }
  | { readonly ok: false; readonly code: 'invalid' | 'conflict' | 'activation-failed' | 'storage-failure'; readonly message: string; readonly view?: PopupTemporaryRuleView };

export function isPopupTemporaryRuleCommand(value: unknown): value is PopupTemporaryRuleCommand {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.channel !== POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL) return false;
  if (record.action === 'get') return true;
  if (
    typeof record.expectedAppliedRevisionId !== 'string' ||
    record.expectedAppliedRevisionId.length === 0
  ) {
    return false;
  }
  if (record.action === 'clear') return true;
  if (typeof record.domain !== 'string' || record.domain.length === 0) return false;
  if (record.action === 'remove') return true;
  if (record.action !== 'toggle') return false;
  if (record.route === null || typeof record.route !== 'object' || Array.isArray(record.route)) {
    return false;
  }
  const route = record.route as Record<string, unknown>;
  return (
    route.kind === 'direct' ||
    route.kind === 'system' ||
    (route.kind === 'profile' && typeof route.profileId === 'string' && route.profileId.length > 0)
  );
}

export async function sendPopupTemporaryRuleCommand(
  command: Omit<PopupTemporaryRuleCommand, 'channel'>,
): Promise<PopupTemporaryRuleCommandResponse> {
  const response = await browser.runtime.sendMessage({
    channel: POPUP_TEMPORARY_RULE_MESSAGE_CHANNEL,
    ...command,
  });
  if (response === undefined) {
    return { ok: false, code: 'storage-failure', message: 'temporary rule runtime did not respond' };
  }
  return response as PopupTemporaryRuleCommandResponse;
}
''')

Path('apps/extension/src/lib/popup-temporary-rule-runtime.ts').write_text(r'''import type {
  ProfileRouteTarget,
  ProfileSpec,
} from '@zeroomega-nex/profile-spec';
import {
  BrowserStorageProfileWorkflowRepository,
  buildPopupTemporaryRuleOverlay,
  clearPopupTemporaryRules,
  createPopupTemporaryRuleState,
  decodePopupTemporaryProfileId,
  decodePopupTemporarySnapshotId,
  inspectPopupTemporaryRuleView,
  isPopupTemporaryBaseRouteSupported,
  isPopupTemporarySnapshotId,
  listPopupTemporaryRuleResultRoutes,
  parsePopupTemporaryRuleState,
  removePopupTemporaryRule,
  sanitizePopupTemporaryRuleState,
  togglePopupTemporaryRule,
  type PopupTemporaryRuleState,
  type PopupTemporaryRuleView,
  type ProfileWorkflowActivationDriver,
  type ProfileWorkflowActivationResult,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';
import type {
  SnapshotActivationRepository,
  SnapshotActivationState,
} from '@zeroomega-nex/browser-adapters';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
import {
  isPopupTemporaryRuleCommand,
  type PopupTemporaryRuleCommandResponse,
} from './popup-temporary-rule-client';

export const POPUP_TEMPORARY_RULE_STORAGE_KEY =
  'zeroomega-nex/popup-temporary-rules/v1/state';

interface PopupTemporaryRuleStorageArea {
  get(keys: string | readonly string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | readonly string[]): Promise<void>;
}

interface PopupTemporaryRuleMessageEvent {
  addListener(
    listener: (message: unknown) => Promise<PopupTemporaryRuleCommandResponse | undefined>,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}

export interface PopupTemporaryRuleRuntimeApi {
  readonly runtime: { readonly onMessage: PopupTemporaryRuleMessageEvent };
  readonly storage: {
    readonly local: ProfileWorkflowStorageArea;
    readonly session?: PopupTemporaryRuleStorageArea;
  };
}

class BrowserSessionPopupTemporaryRuleRepository {
  readonly #area: PopupTemporaryRuleStorageArea;

  constructor(area: PopupTemporaryRuleStorageArea) {
    this.#area = area;
  }

  async read(): Promise<PopupTemporaryRuleState> {
    const values = await this.#area.get(POPUP_TEMPORARY_RULE_STORAGE_KEY);
    return parsePopupTemporaryRuleState(values[POPUP_TEMPORARY_RULE_STORAGE_KEY]);
  }

  async write(state: PopupTemporaryRuleState): Promise<void> {
    const normalized = parsePopupTemporaryRuleState(state);
    if (normalized.rules.length === 0) {
      await this.#area.remove(POPUP_TEMPORARY_RULE_STORAGE_KEY);
      return;
    }
    await this.#area.set({ [POPUP_TEMPORARY_RULE_STORAGE_KEY]: normalized });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function sameRoute(left: ProfileRouteTarget, right: ProfileRouteTarget): boolean {
  if (left.kind !== right.kind) return false;
  return left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId);
}

function baseRouteFromRuntime(runtime: ProfileWorkflowRuntimeView): ProfileRouteTarget | undefined {
  if (runtime.activeRoute?.kind === 'profile') {
    return decodePopupTemporaryProfileId(runtime.activeRoute.profileId) ?? runtime.activeRoute;
  }
  if (runtime.activeRoute) return runtime.activeRoute;
  return runtime.activeSnapshotId
    ? decodePopupTemporarySnapshotId(runtime.activeSnapshotId)
    : undefined;
}

export class PopupTemporaryRuleCoordinator implements ProfileWorkflowActivationDriver {
  readonly #base: ProfileWorkflowActivationDriver;
  readonly #repository: BrowserSessionPopupTemporaryRuleRepository;
  #tail: Promise<void> = Promise.resolve();

  constructor(base: ProfileWorkflowActivationDriver, session: PopupTemporaryRuleStorageArea) {
    this.#base = base;
    this.#repository = new BrowserSessionPopupTemporaryRuleRepository(session);
  }

  #serialize<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.#tail.then(operation, operation);
    this.#tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async #cleanupSnapshot(snapshotId: string | undefined): Promise<void> {
    if (!snapshotId || !isPopupTemporarySnapshotId(snapshotId)) return;
    const runtime = currentBrowserProxyRuntime();
    try {
      const removable = runtime.repository as typeof runtime.repository & {
        removeSnapshot?(id: string): Promise<void>;
      };
      await removable.removeSnapshot?.(snapshotId);
    } finally {
      runtime.dispose();
    }
  }

  async #activateNow(
    candidate: ProfileSpec,
    requestedRoute?: ProfileRouteTarget,
  ): Promise<ProfileWorkflowActivationResult> {
    const previousRuntime = await this.#base.inspectRuntime?.();
    const decodedRequested =
      requestedRoute?.kind === 'profile'
        ? decodePopupTemporaryProfileId(requestedRoute.profileId)
        : undefined;
    const baseRoute =
      decodedRequested ?? requestedRoute ?? candidate.settings.startup.route ?? { kind: 'direct' };
    let state = await this.#repository.read();
    if (state.rules.length > 0 && isPopupTemporaryBaseRouteSupported(candidate, baseRoute)) {
      const sanitized = sanitizePopupTemporaryRuleState(state, candidate, baseRoute);
      if (sanitized !== state) {
        state = sanitized;
        await this.#repository.write(state);
      }
      if (state.rules.length > 0) {
        const overlay = buildPopupTemporaryRuleOverlay(candidate, state, baseRoute);
        const activated = await this.#base.activate(overlay.spec, overlay.startRoute);
        if (previousRuntime?.activeSnapshotId !== activated.snapshotId) {
          await this.#cleanupSnapshot(previousRuntime?.activeSnapshotId);
        }
        return activated;
      }
    }
    const activated = await this.#base.activate(candidate, baseRoute);
    if (previousRuntime?.activeSnapshotId !== activated.snapshotId) {
      await this.#cleanupSnapshot(previousRuntime?.activeSnapshotId);
    }
    return activated;
  }

  activate(
    candidate: ProfileSpec,
    startRoute?: ProfileRouteTarget,
  ): Promise<ProfileWorkflowActivationResult> {
    return this.#serialize(() => this.#activateNow(candidate, startRoute));
  }

  rollback(previousApplied: ProfileSpec, startRoute?: ProfileRouteTarget): Promise<void> {
    return this.#serialize(async () => {
      const state = await this.#repository.read();
      await this.#activateNow(
        previousApplied,
        startRoute ?? state.baseRoute ?? previousApplied.settings.startup.route,
      );
    });
  }

  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    const runtime = (await this.#base.inspectRuntime?.()) ?? {};
    const baseRoute = baseRouteFromRuntime(runtime);
    return {
      ...runtime,
      ...(baseRoute === undefined ? {} : { activeRoute: baseRoute }),
    };
  }

  async view(applied: ProfileSpec): Promise<PopupTemporaryRuleView> {
    const state = await this.#repository.read();
    const runtime = (await this.#base.inspectRuntime?.()) ?? {};
    const baseRoute = baseRouteFromRuntime(runtime) ?? state.baseRoute;
    const active = runtime.activeSnapshotId
      ? isPopupTemporarySnapshotId(runtime.activeSnapshotId)
      : false;
    const sanitized =
      baseRoute && isPopupTemporaryBaseRouteSupported(applied, baseRoute)
        ? sanitizePopupTemporaryRuleState(state, applied, baseRoute)
        : state;
    if (sanitized !== state) await this.#repository.write(sanitized);
    return inspectPopupTemporaryRuleView(sanitized, baseRoute, active);
  }

  toggle(
    applied: ProfileSpec,
    domain: string,
    route: ProfileRouteTarget,
  ): Promise<PopupTemporaryRuleView> {
    return this.#serialize(async () => {
      const runtime = (await this.#base.inspectRuntime?.()) ?? {};
      const baseRoute = baseRouteFromRuntime(runtime);
      if (!baseRoute || !isPopupTemporaryBaseRouteSupported(applied, baseRoute)) {
        throw new TypeError('temporary rules are unavailable for the active route');
      }
      const allowed = listPopupTemporaryRuleResultRoutes(applied, baseRoute);
      if (!allowed.some((candidate) => sameRoute(candidate, route))) {
        throw new TypeError('temporary rule result is not available for the active route');
      }
      const previous = await this.#repository.read();
      const next = togglePopupTemporaryRule(previous, domain, route, baseRoute);
      await this.#repository.write(next);
      try {
        await this.#activateNow(applied, baseRoute);
      } catch (error) {
        await this.#repository.write(previous);
        try {
          await this.#activateNow(applied, baseRoute);
        } catch {
          // Preserve the original activation error; normal runtime recovery remains available.
        }
        throw error;
      }
      return this.view(applied);
    });
  }

  remove(applied: ProfileSpec, domain: string): Promise<PopupTemporaryRuleView> {
    return this.#serialize(async () => {
      const previous = await this.#repository.read();
      const next = removePopupTemporaryRule(previous, domain);
      if (next === previous) return this.view(applied);
      const runtime = (await this.#base.inspectRuntime?.()) ?? {};
      const baseRoute = baseRouteFromRuntime(runtime) ?? previous.baseRoute ?? { kind: 'direct' };
      await this.#repository.write(next);
      try {
        await this.#activateNow(applied, baseRoute);
      } catch (error) {
        await this.#repository.write(previous);
        try {
          await this.#activateNow(applied, baseRoute);
        } catch {
          // Preserve the original activation error.
        }
        throw error;
      }
      return this.view(applied);
    });
  }

  clear(applied: ProfileSpec): Promise<PopupTemporaryRuleView> {
    return this.#serialize(async () => {
      const previous = await this.#repository.read();
      const next = clearPopupTemporaryRules(previous);
      const runtime = (await this.#base.inspectRuntime?.()) ?? {};
      const baseRoute = baseRouteFromRuntime(runtime) ?? previous.baseRoute ?? { kind: 'direct' };
      await this.#repository.write(next);
      try {
        await this.#activateNow(applied, baseRoute);
      } catch (error) {
        await this.#repository.write(previous);
        try {
          await this.#activateNow(applied, baseRoute);
        } catch {
          // Preserve the original activation error.
        }
        throw error;
      }
      return this.view(applied);
    });
  }

  async repairMissingSessionPending(
    applied: ProfileSpec,
    repository: SnapshotActivationRepository,
  ): Promise<boolean> {
    const state = await repository.getState();
    const previousId = state.pending?.previousActiveSnapshotId;
    if (!previousId || !isPopupTemporarySnapshotId(previousId)) return false;
    if (await repository.getSnapshot(previousId)) return false;
    const baseRoute = decodePopupTemporarySnapshotId(previousId);
    if (!baseRoute) return false;
    await repository.setState({});
    await this.#base.activate(applied, baseRoute);
    return true;
  }

  async reconcileStartup(
    applied: ProfileSpec,
    repository: SnapshotActivationRepository,
  ): Promise<boolean> {
    const proxyState = await repository.getState();
    let baseRoute: ProfileRouteTarget | undefined;
    if (proxyState.activeSnapshotId) {
      baseRoute = decodePopupTemporarySnapshotId(proxyState.activeSnapshotId);
      if (!baseRoute) {
        const snapshot = await repository.getSnapshot(proxyState.activeSnapshotId);
        if (snapshot?.startRoute.kind === 'profile') {
          baseRoute =
            decodePopupTemporaryProfileId(snapshot.startRoute.profileId) ?? snapshot.startRoute;
        } else {
          baseRoute = snapshot?.startRoute;
        }
      }
    } else if (proxyState.activeBuiltInMode) {
      baseRoute = { kind: proxyState.activeBuiltInMode };
    }
    const state = await this.#repository.read();
    const hadTemporarySnapshot =
      proxyState.activeSnapshotId !== undefined &&
      isPopupTemporarySnapshotId(proxyState.activeSnapshotId);
    if (!hadTemporarySnapshot && state.rules.length === 0) return false;
    await this.#serialize(() => this.#activateNow(applied, baseRoute ?? state.baseRoute));
    return true;
  }
}

function response(view: PopupTemporaryRuleView): PopupTemporaryRuleCommandResponse {
  return { ok: true, view };
}

function failure(
  code: Extract<PopupTemporaryRuleCommandResponse, { ok: false }>['code'],
  message: string,
  view?: PopupTemporaryRuleView,
): PopupTemporaryRuleCommandResponse {
  return { ok: false, code, message, ...(view === undefined ? {} : { view }) };
}

export interface RegisteredPopupTemporaryRuleRuntime {
  dispose(): void;
}

export function registerPopupTemporaryRuleRuntime(
  api: PopupTemporaryRuleRuntimeApi,
  coordinator: PopupTemporaryRuleCoordinator,
): RegisteredPopupTemporaryRuleRuntime {
  const workflow = new BrowserStorageProfileWorkflowRepository(api.storage.local);
  const listener = async (message: unknown): Promise<PopupTemporaryRuleCommandResponse | undefined> => {
    if (!isPopupTemporaryRuleCommand(message)) return undefined;
    const state = await workflow.read();
    if (!state) return failure('storage-failure', 'profile workflow state is unavailable');
    if (message.action === 'get') {
      try {
        return response(await coordinator.view(state.applied));
      } catch (error) {
        return failure('storage-failure', errorMessage(error));
      }
    }
    if (state.applied.revision.id !== message.expectedAppliedRevisionId) {
      return failure(
        'conflict',
        `expected applied revision ${message.expectedAppliedRevisionId}, current revision is ${state.applied.revision.id}`,
        await coordinator.view(state.applied),
      );
    }
    try {
      if (message.action === 'toggle') {
        return response(await coordinator.toggle(state.applied, message.domain, message.route));
      }
      if (message.action === 'remove') {
        return response(await coordinator.remove(state.applied, message.domain));
      }
      return response(await coordinator.clear(state.applied));
    } catch (error) {
      return failure('activation-failed', errorMessage(error), await coordinator.view(state.applied));
    }
  };
  api.runtime.onMessage.addListener(listener);
  return { dispose: () => api.runtime.onMessage.removeListener(listener) };
}

export function createPopupTemporaryRuleCoordinator(
  api: PopupTemporaryRuleRuntimeApi,
  base: ProfileWorkflowActivationDriver,
): PopupTemporaryRuleCoordinator | undefined {
  return api.storage.session
    ? new PopupTemporaryRuleCoordinator(base, api.storage.session)
    : undefined;
}

export function currentPopupTemporaryRuleRuntimeApi(): PopupTemporaryRuleRuntimeApi {
  return browser as unknown as PopupTemporaryRuleRuntimeApi;
}
''')

Path('apps/extension/src/lib/popup-temporary-rule-runtime.test.ts').write_text(r'''import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  createPopupTemporaryRuleState,
  popupTemporaryProfileIdForBaseRoute,
  popupTemporarySnapshotId,
  togglePopupTemporaryRule,
  type ProfileWorkflowActivationDriver,
  type ProfileWorkflowRuntimeView,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import { PopupTemporaryRuleCoordinator } from './popup-temporary-rule-runtime';

class Area {
  readonly values = new Map<string, unknown>();
  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(selected.flatMap((key) => (this.values.has(key) ? [[key, this.values.get(key)]] : [])));
  }
  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) this.values.set(key, structuredClone(value));
  }
  async remove(keys: string | readonly string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) this.values.delete(key);
  }
}

class Driver implements ProfileWorkflowActivationDriver {
  readonly calls: { spec: ProfileSpec; route?: ProfileRouteTarget }[] = [];
  runtime: ProfileWorkflowRuntimeView = { activeRoute: { kind: 'profile', profileId: 'switch' } };
  async activate(spec: ProfileSpec, route?: ProfileRouteTarget) {
    this.calls.push({ spec: structuredClone(spec), ...(route === undefined ? {} : { route: structuredClone(route) }) });
    this.runtime = { activeSnapshotId: route?.kind === 'profile' && route.profileId.startsWith('__zeroomega') ? popupTemporarySnapshotId(route.profileId, 'runtime') : 'normal', ...(route === undefined ? {} : { activeRoute: structuredClone(route) }) };
    return { snapshotId: this.runtime.activeSnapshotId! };
  }
  async rollback(): Promise<void> {}
  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    return structuredClone(this.runtime);
  }
}

function spec(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'document',
    revision: { id: 'revision', createdAt: '2026-07-27T13:00:00.000Z' },
    profiles: [
      { id: 'fixed', name: 'Fixed', kind: 'fixed', proxyByScheme: {}, bypass: [] },
      { id: 'switch', name: 'Switch', kind: 'switch', rules: [], defaultRoute: { kind: 'direct' } },
    ],
    proxyEndpoints: [],
    ruleSources: [],
    settings: {
      startup: { route: { kind: 'profile', profileId: 'switch' }, revertProxyChanges: true },
      quickSwitch: { enabled: true, routes: [], refreshOnChange: false },
      interface: { confirmDeletion: true, showInspectMenu: true, addConditionsToBottom: false, showResultProfileOnActionBadgeText: false, showExternalProfile: true, showAdvancedConditions: false, exportLegacyRuleList: false },
      ruleSourceUpdateIntervalMinutes: 1440,
    },
  };
}

describe('Popup temporary rule coordinator', () => {
  it('activates a hidden overlay and reports the underlying base route', async () => {
    const area = new Area();
    const driver = new Driver();
    const coordinator = new PopupTemporaryRuleCoordinator(driver, area);
    const view = await coordinator.toggle(
      spec(),
      'example.com',
      { kind: 'profile', profileId: 'fixed' },
    );
    expect(view.active).toBe(true);
    expect(driver.calls.at(-1)?.route).toEqual({
      kind: 'profile',
      profileId: popupTemporaryProfileIdForBaseRoute({ kind: 'profile', profileId: 'switch' }),
    });
    expect((await coordinator.inspectRuntime()).activeRoute).toEqual({ kind: 'profile', profileId: 'switch' });
  });

  it('retains rules but does not wrap System Proxy', async () => {
    const area = new Area();
    const driver = new Driver();
    const coordinator = new PopupTemporaryRuleCoordinator(driver, area);
    await coordinator.toggle(spec(), 'example.com', { kind: 'profile', profileId: 'fixed' });
    driver.runtime = { activeRoute: { kind: 'system' } };
    await coordinator.activate(spec(), { kind: 'system' });
    expect(driver.calls.at(-1)?.route).toEqual({ kind: 'system' });
    expect((await coordinator.view(spec())).rules).toHaveLength(1);
  });
});
''')
