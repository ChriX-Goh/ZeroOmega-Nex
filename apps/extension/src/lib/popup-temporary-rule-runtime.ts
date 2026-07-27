import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  BrowserStorageProfileWorkflowRepository,
  buildPopupTemporaryRuleOverlay,
  clearPopupTemporaryRules,
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
import type { SnapshotActivationRepository } from '@zeroomega-nex/browser-adapters';
import { browser } from 'wxt/browser';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
import {
  isPopupTemporaryRuleCommand,
  type PopupTemporaryRuleCommand,
  type PopupTemporaryRuleCommandResponse,
} from './popup-temporary-rule-client';

export const POPUP_TEMPORARY_RULE_STORAGE_KEY = 'zeroomega-nex/popup-temporary-rules/v1/state';

interface PopupTemporaryRuleStorageArea {
  get(keys: string | readonly string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | readonly string[]): Promise<void>;
}

interface PopupTemporaryRuleMessageEvent {
  addListener(
    listener: (
      message: unknown,
    ) => PopupTemporaryRuleCommandResponse | Promise<PopupTemporaryRuleCommandResponse> | undefined,
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
  return (
    left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId)
  );
}

function baseRouteFromRuntime(runtime: ProfileWorkflowRuntimeView): ProfileRouteTarget | undefined {
  const temporaryBase = runtime.activeSnapshotId
    ? decodePopupTemporarySnapshotId(runtime.activeSnapshotId)
    : undefined;
  return temporaryBase ?? runtime.activeRoute;
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
    const baseRoute = requestedRoute ?? candidate.settings.startup.route ?? { kind: 'direct' };
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
        baseRoute = snapshot?.startRoute;
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
  const handleMessage = async (
    message: PopupTemporaryRuleCommand,
  ): Promise<PopupTemporaryRuleCommandResponse> => {
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
      return failure(
        'activation-failed',
        errorMessage(error),
        await coordinator.view(state.applied),
      );
    }
  };
  const listener = (message: unknown): Promise<PopupTemporaryRuleCommandResponse> | undefined => {
    if (!isPopupTemporaryRuleCommand(message)) return undefined;
    return handleMessage(message);
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
