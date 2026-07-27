import { BrowserStorageProfileWorkflowRepository } from '@zeroomega-nex/profile-workflow';
import { browser } from 'wxt/browser';

import {
  REQUEST_DIAGNOSTICS_ACTIVE_GLOBAL_LIMIT,
  REQUEST_DIAGNOSTICS_ACTIVE_PER_TAB_LIMIT,
  REQUEST_DIAGNOSTICS_TIMEOUT_MS,
  clearRequestDiagnostics,
  createRequestDiagnosticsState,
  inspectRequestDiagnostics,
  parseRequestDiagnosticsState,
  removeRequestDiagnostic,
  setRequestDiagnosticsActive,
  shouldIgnoreRequestError,
  upsertRequestDiagnostic,
  type RequestDiagnosticRecord,
  type RequestDiagnosticsState,
  type RequestDiagnosticsView,
} from './request-diagnostics-model';
import {
  isRequestDiagnosticsCommand,
  REQUEST_DIAGNOSTICS_PERMISSION,
  type RequestDiagnosticsCommandResponse,
} from './request-diagnostics-client';

export const REQUEST_DIAGNOSTICS_STORAGE_KEY = 'zeroomega-nex/request-diagnostics/v1/state';
const PROFILE_WORKFLOW_STATE_KEY = 'zeroomega-nex/profile-workflow/v1/state';

interface StorageArea {
  get(keys: string | readonly string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | readonly string[]): Promise<void>;
}

interface StorageChangedEvent {
  addListener(listener: (changes: Record<string, unknown>, areaName: string) => void): void;
  removeListener(listener: (changes: Record<string, unknown>, areaName: string) => void): void;
}

interface PermissionEvent {
  addListener(listener: () => void): void;
  removeListener(listener: () => void): void;
}

interface PermissionApi {
  contains(permission: {
    readonly permissions: readonly string[];
    readonly origins: readonly string[];
  }): Promise<boolean>;
  readonly onAdded?: PermissionEvent;
  readonly onRemoved?: PermissionEvent;
}

interface WebRequestDetails {
  readonly requestId: string;
  readonly tabId: number;
  readonly url: string;
  readonly method: string;
  readonly type: string;
  readonly timeStamp: number;
  readonly error?: string;
}

interface WebRequestEvent {
  addListener(listener: (details: WebRequestDetails) => void, filter: { urls: string[] }): void;
  removeListener(listener: (details: WebRequestDetails) => void): void;
}

interface RequestDiagnosticsWebRequestApi {
  readonly onBeforeRequest: WebRequestEvent;
  readonly onHeadersReceived: WebRequestEvent;
  readonly onCompleted: WebRequestEvent;
  readonly onErrorOccurred: WebRequestEvent;
}

interface TabRemovedEvent {
  addListener(listener: (tabId: number) => void): void;
  removeListener(listener: (tabId: number) => void): void;
}

interface MessageEvent {
  addListener(
    listener: (
      message: unknown,
    ) => RequestDiagnosticsCommandResponse | Promise<RequestDiagnosticsCommandResponse> | undefined,
  ): void;
  removeListener(listener: (message: unknown) => unknown): void;
}

export interface RequestDiagnosticsRuntimeApi {
  readonly runtime: { readonly onMessage: MessageEvent };
  readonly storage: {
    readonly local: StorageArea;
    readonly session?: StorageArea;
    readonly onChanged: StorageChangedEvent;
  };
  readonly permissions: PermissionApi;
  readonly webRequest?: RequestDiagnosticsWebRequestApi;
  readonly tabs: { readonly onRemoved: TabRemovedEvent };
}

interface ActiveRequest {
  readonly requestId: string;
  readonly tabId: number;
  readonly url: string;
  readonly method: string;
  readonly resourceType: string;
  readonly startedAt: number;
  timeoutHandle?: ReturnType<typeof setTimeout>;
  timedOut: boolean;
}

class RequestDiagnosticsRepository {
  readonly #area: StorageArea | undefined;
  #memory = createRequestDiagnosticsState();

  constructor(area: StorageArea | undefined) {
    this.#area = area;
  }

  async read(): Promise<RequestDiagnosticsState> {
    if (!this.#area) return this.#memory;
    const values = await this.#area.get(REQUEST_DIAGNOSTICS_STORAGE_KEY);
    return parseRequestDiagnosticsState(values[REQUEST_DIAGNOSTICS_STORAGE_KEY]);
  }

  async write(state: RequestDiagnosticsState): Promise<void> {
    const normalized = parseRequestDiagnosticsState(state);
    this.#memory = normalized;
    if (!this.#area) return;
    if (!normalized.active && normalized.records.length === 0) {
      await this.#area.remove(REQUEST_DIAGNOSTICS_STORAGE_KEY);
      return;
    }
    await this.#area.set({ [REQUEST_DIAGNOSTICS_STORAGE_KEY]: normalized });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export interface RegisteredRequestDiagnosticsRuntime {
  dispose(): void;
}

export class RequestDiagnosticsRuntime {
  readonly #api: RequestDiagnosticsRuntimeApi;
  readonly #repository: RequestDiagnosticsRepository;
  readonly #active = new Map<string, ActiveRequest>();
  readonly #activePerTab = new Map<number, number>();
  #enabled = true;
  #permissionGranted = false;
  #watching = false;
  #tail: Promise<void> = Promise.resolve();

  constructor(api: RequestDiagnosticsRuntimeApi) {
    this.#api = api;
    this.#repository = new RequestDiagnosticsRepository(api.storage.session);
  }

  #serialize<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.#tail.then(operation, operation);
    this.#tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  async initialize(): Promise<void> {
    await this.#refreshSettings();
  }

  async #readEnvironment(): Promise<RequestDiagnosticsState> {
    const [workflow, permissionGranted, state] = await Promise.all([
      new BrowserStorageProfileWorkflowRepository(this.#api.storage.local).read(),
      this.#api.permissions.contains(REQUEST_DIAGNOSTICS_PERMISSION).catch(() => false),
      this.#repository.read(),
    ]);
    this.#enabled = workflow?.applied.settings.interface.monitorWebRequests ?? true;
    this.#permissionGranted = permissionGranted;
    return state;
  }

  async #refreshSettings(): Promise<void> {
    let state = await this.#readEnvironment();
    if ((!this.#enabled || !this.#permissionGranted) && state.active) {
      this.#clearActiveRequests();
      state = setRequestDiagnosticsActive(state, false);
      await this.#repository.write(state);
    }
    this.#updateWebRequestListeners(state.active);
  }

  #clearActiveRequests(): void {
    for (const request of this.#active.values()) {
      if (request.timeoutHandle) clearTimeout(request.timeoutHandle);
    }
    this.#active.clear();
    this.#activePerTab.clear();
  }

  #clearActiveRequestsForTab(tabId: number): void {
    for (const request of [...this.#active.values()]) {
      if (request.tabId !== tabId) continue;
      if (request.timeoutHandle) clearTimeout(request.timeoutHandle);
      this.#forgetActiveRequest(request.requestId);
    }
  }

  #forgetActiveRequest(requestId: string): ActiveRequest | undefined {
    const request = this.#active.get(requestId);
    if (!request) return undefined;
    this.#active.delete(requestId);
    const count = this.#activePerTab.get(request.tabId) ?? 1;
    if (count <= 1) this.#activePerTab.delete(request.tabId);
    else this.#activePerTab.set(request.tabId, count - 1);
    return request;
  }

  #updateWebRequestListeners(sessionActive: boolean): void {
    const shouldWatch =
      sessionActive &&
      this.#enabled &&
      this.#permissionGranted &&
      this.#api.webRequest !== undefined;
    if (shouldWatch === this.#watching) return;
    const request = this.#api.webRequest;
    if (!request) return;
    if (shouldWatch) {
      const filter = { urls: ['http://*/*', 'https://*/*'] };
      request.onBeforeRequest.addListener(this.#onBeforeRequest, filter);
      request.onHeadersReceived.addListener(this.#onHeadersReceived, filter);
      request.onCompleted.addListener(this.#onCompleted, filter);
      request.onErrorOccurred.addListener(this.#onErrorOccurred, filter);
      this.#watching = true;
      return;
    }
    request.onBeforeRequest.removeListener(this.#onBeforeRequest);
    request.onHeadersReceived.removeListener(this.#onHeadersReceived);
    request.onCompleted.removeListener(this.#onCompleted);
    request.onErrorOccurred.removeListener(this.#onErrorOccurred);
    this.#watching = false;
  }

  readonly #onBeforeRequest = (details: WebRequestDetails): void => {
    if (details.tabId < 0 || this.#active.has(details.requestId)) return;
    if (details.type === 'main_frame') void this.clear(details.tabId);
    const perTab = this.#activePerTab.get(details.tabId) ?? 0;
    if (
      this.#active.size >= REQUEST_DIAGNOSTICS_ACTIVE_GLOBAL_LIMIT ||
      perTab >= REQUEST_DIAGNOSTICS_ACTIVE_PER_TAB_LIMIT
    ) {
      return;
    }
    const request: ActiveRequest = {
      requestId: details.requestId,
      tabId: details.tabId,
      url: details.url,
      method: details.method,
      resourceType: details.type,
      startedAt: Math.round(details.timeStamp || Date.now()),
      timedOut: false,
    };
    request.timeoutHandle = setTimeout(() => {
      const current = this.#active.get(details.requestId);
      if (!current) return;
      current.timedOut = true;
      delete current.timeoutHandle;
      void this.#record({
        requestId: current.requestId,
        tabId: current.tabId,
        url: current.url,
        method: current.method,
        resourceType: current.resourceType,
        startedAt: current.startedAt,
        failedAt: Date.now(),
        status: 'timeout',
      });
    }, REQUEST_DIAGNOSTICS_TIMEOUT_MS);
    this.#active.set(details.requestId, request);
    this.#activePerTab.set(details.tabId, perTab + 1);
  };

  readonly #onHeadersReceived = (details: WebRequestDetails): void => {
    const request = this.#active.get(details.requestId);
    if (!request) return;
    if (request.timeoutHandle) clearTimeout(request.timeoutHandle);
    delete request.timeoutHandle;
    if (request.timedOut) void this.#remove(details.tabId, details.requestId);
  };

  readonly #onCompleted = (details: WebRequestDetails): void => {
    const request = this.#forgetActiveRequest(details.requestId);
    if (request?.timeoutHandle) clearTimeout(request.timeoutHandle);
    if (request?.timedOut) void this.#remove(details.tabId, details.requestId);
  };

  readonly #onErrorOccurred = (details: WebRequestDetails): void => {
    const request = this.#forgetActiveRequest(details.requestId);
    if (request?.timeoutHandle) clearTimeout(request.timeoutHandle);
    const error = details.error ?? 'request failed';
    if (error === 'net::ERR_ABORTED' && request?.timedOut) return;
    if (shouldIgnoreRequestError(error, details.url)) {
      if (request?.timedOut) void this.#remove(details.tabId, details.requestId);
      return;
    }
    void this.#record({
      requestId: details.requestId,
      tabId: details.tabId,
      url: details.url,
      method: details.method,
      resourceType: details.type,
      startedAt: request?.startedAt ?? Math.round(details.timeStamp || Date.now()),
      failedAt: Math.round(details.timeStamp || Date.now()),
      status: 'error',
      error,
    });
  };

  async #record(record: RequestDiagnosticRecord): Promise<void> {
    await this.#serialize(async () => {
      const state = await this.#repository.read();
      if (!state.active) return;
      await this.#repository.write(upsertRequestDiagnostic(state, record));
    });
  }

  async #remove(tabId: number, requestId: string): Promise<void> {
    await this.#serialize(async () => {
      const state = await this.#repository.read();
      await this.#repository.write(removeRequestDiagnostic(state, tabId, requestId));
    });
  }

  async inspect(tabId?: number, includeRecords = true): Promise<RequestDiagnosticsView> {
    return inspectRequestDiagnostics(
      await this.#repository.read(),
      this.#enabled,
      this.#permissionGranted,
      tabId,
      Date.now(),
      includeRecords,
    );
  }

  async start(tabId?: number): Promise<RequestDiagnosticsView> {
    return this.#serialize(async () => {
      let state = await this.#readEnvironment();
      if (this.#enabled && this.#permissionGranted) {
        state = setRequestDiagnosticsActive(state, true);
        await this.#repository.write(state);
      }
      this.#updateWebRequestListeners(state.active);
      return inspectRequestDiagnostics(state, this.#enabled, this.#permissionGranted, tabId);
    });
  }

  async stop(tabId?: number): Promise<RequestDiagnosticsView> {
    return this.#serialize(async () => {
      this.#clearActiveRequests();
      const state = setRequestDiagnosticsActive(await this.#repository.read(), false);
      await this.#repository.write(state);
      this.#updateWebRequestListeners(false);
      return inspectRequestDiagnostics(state, this.#enabled, this.#permissionGranted, tabId);
    });
  }

  async clear(tabId?: number): Promise<RequestDiagnosticsView> {
    return this.#serialize(async () => {
      const state = clearRequestDiagnostics(await this.#repository.read(), tabId);
      await this.#repository.write(state);
      return inspectRequestDiagnostics(state, this.#enabled, this.#permissionGranted, tabId);
    });
  }

  readonly onWorkflowChange = (changes: Record<string, unknown>, areaName: string): void => {
    if (areaName !== 'local' || changes[PROFILE_WORKFLOW_STATE_KEY] === undefined) return;
    void this.#serialize(() => this.#refreshSettings());
  };

  readonly onPermissionChange = (): void => {
    void this.#serialize(() => this.#refreshSettings());
  };

  readonly onTabRemoved = (tabId: number): void => {
    this.#clearActiveRequestsForTab(tabId);
    void this.clear(tabId);
  };

  dispose(): void {
    this.#clearActiveRequests();
    if (this.#watching && this.#api.webRequest) {
      this.#api.webRequest.onBeforeRequest.removeListener(this.#onBeforeRequest);
      this.#api.webRequest.onHeadersReceived.removeListener(this.#onHeadersReceived);
      this.#api.webRequest.onCompleted.removeListener(this.#onCompleted);
      this.#api.webRequest.onErrorOccurred.removeListener(this.#onErrorOccurred);
    }
    this.#watching = false;
  }
}

export function registerRequestDiagnosticsRuntime(
  api: RequestDiagnosticsRuntimeApi,
): RegisteredRequestDiagnosticsRuntime {
  const runtime = new RequestDiagnosticsRuntime(api);
  const listener = (message: unknown): Promise<RequestDiagnosticsCommandResponse> | undefined => {
    if (!isRequestDiagnosticsCommand(message)) return undefined;
    const operation =
      message.action === 'clear'
        ? runtime.clear(message.tabId)
        : message.action === 'start'
          ? runtime.start(message.tabId)
          : message.action === 'stop'
            ? runtime.stop(message.tabId)
            : runtime.inspect(message.tabId, message.action !== 'summary');
    return operation.then(
      (view) => ({ ok: true, view }),
      (error: unknown) => ({ ok: false, message: errorMessage(error) }),
    );
  };
  api.runtime.onMessage.addListener(listener);
  api.storage.onChanged.addListener(runtime.onWorkflowChange);
  api.permissions.onAdded?.addListener(runtime.onPermissionChange);
  api.permissions.onRemoved?.addListener(runtime.onPermissionChange);
  api.tabs.onRemoved.addListener(runtime.onTabRemoved);
  void runtime.initialize().catch((error: unknown) => {
    console.error('request diagnostics initialization failed:', error);
  });
  return {
    dispose: () => {
      runtime.dispose();
      api.runtime.onMessage.removeListener(listener);
      api.storage.onChanged.removeListener(runtime.onWorkflowChange);
      api.permissions.onAdded?.removeListener(runtime.onPermissionChange);
      api.permissions.onRemoved?.removeListener(runtime.onPermissionChange);
      api.tabs.onRemoved.removeListener(runtime.onTabRemoved);
    },
  };
}

export function currentRequestDiagnosticsRuntimeApi(): RequestDiagnosticsRuntimeApi {
  return browser as unknown as RequestDiagnosticsRuntimeApi;
}
