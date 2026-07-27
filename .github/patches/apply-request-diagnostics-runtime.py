from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


Path('apps/extension/src/lib/request-diagnostics-client.ts').write_text(r'''import { browser } from 'wxt/browser';

import type { RequestDiagnosticsView } from './request-diagnostics-model';

export const REQUEST_DIAGNOSTICS_MESSAGE_CHANNEL =
  'zeroomega-nex/request-diagnostics/v1' as const;
export const REQUEST_DIAGNOSTICS_PERMISSION = {
  permissions: ['webRequest'],
  origins: ['http://*/*', 'https://*/*'],
} as const;

export type RequestDiagnosticsCommand =
  | {
      readonly channel: typeof REQUEST_DIAGNOSTICS_MESSAGE_CHANNEL;
      readonly action: 'get';
      readonly tabId?: number;
    }
  | {
      readonly channel: typeof REQUEST_DIAGNOSTICS_MESSAGE_CHANNEL;
      readonly action: 'clear';
      readonly tabId?: number;
    };

export type RequestDiagnosticsCommandResponse =
  | { readonly ok: true; readonly view: RequestDiagnosticsView }
  | { readonly ok: false; readonly message: string };

export function isRequestDiagnosticsCommand(value: unknown): value is RequestDiagnosticsCommand {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.channel === REQUEST_DIAGNOSTICS_MESSAGE_CHANNEL &&
    (record.action === 'get' || record.action === 'clear') &&
    (record.tabId === undefined ||
      (typeof record.tabId === 'number' && Number.isInteger(record.tabId) && record.tabId >= 0))
  );
}

function isResponse(value: unknown): value is RequestDiagnosticsCommandResponse {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.ok === false) return typeof record.message === 'string';
  if (record.ok !== true || record.view === null || typeof record.view !== 'object') return false;
  const view = record.view as Record<string, unknown>;
  return (
    typeof view.enabled === 'boolean' &&
    typeof view.permissionGranted === 'boolean' &&
    Array.isArray(view.records) &&
    typeof view.errorCount === 'number' &&
    typeof view.timeoutCount === 'number' &&
    Array.isArray(view.domains)
  );
}

export async function sendRequestDiagnosticsCommand(
  command: Omit<RequestDiagnosticsCommand, 'channel'>,
): Promise<RequestDiagnosticsCommandResponse> {
  const response = await browser.runtime.sendMessage({
    channel: REQUEST_DIAGNOSTICS_MESSAGE_CHANNEL,
    ...command,
  });
  if (!isResponse(response)) {
    return { ok: false, message: 'request diagnostics runtime returned an invalid response' };
  }
  return response;
}

export async function hasRequestDiagnosticsPermission(): Promise<boolean> {
  return browser.permissions.contains(REQUEST_DIAGNOSTICS_PERMISSION);
}

export async function requestRequestDiagnosticsPermission(): Promise<boolean> {
  return browser.permissions.request(REQUEST_DIAGNOSTICS_PERMISSION);
}
''')

Path('apps/extension/src/lib/request-diagnostics-runtime.ts').write_text(r'''import { BrowserStorageProfileWorkflowRepository } from '@zeroomega-nex/profile-workflow';
import { browser } from 'wxt/browser';

import {
  REQUEST_DIAGNOSTICS_TIMEOUT_MS,
  clearRequestDiagnostics,
  createRequestDiagnosticsState,
  inspectRequestDiagnostics,
  parseRequestDiagnosticsState,
  removeRequestDiagnostic,
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

export const REQUEST_DIAGNOSTICS_STORAGE_KEY =
  'zeroomega-nex/request-diagnostics/v1/state';

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
  contains(permission: typeof REQUEST_DIAGNOSTICS_PERMISSION): Promise<boolean>;
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
    if (normalized.records.length === 0) {
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

  async #refreshSettings(): Promise<void> {
    const workflow = await new BrowserStorageProfileWorkflowRepository(
      this.#api.storage.local,
    ).read();
    this.#enabled = workflow?.applied.settings.interface.monitorWebRequests ?? true;
    this.#permissionGranted = await this.#api.permissions
      .contains(REQUEST_DIAGNOSTICS_PERMISSION)
      .catch(() => false);
    this.#updateWebRequestListeners();
    if (!this.#enabled || !this.#permissionGranted) {
      this.#clearActiveRequests();
      await this.#repository.write(createRequestDiagnosticsState());
    }
  }

  #clearActiveRequests(): void {
    for (const request of this.#active.values()) {
      if (request.timeoutHandle) clearTimeout(request.timeoutHandle);
    }
    this.#active.clear();
  }

  #updateWebRequestListeners(): void {
    const shouldWatch =
      this.#enabled && this.#permissionGranted && this.#api.webRequest !== undefined;
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
    if (details.tabId < 0) return;
    if (details.type === 'main_frame') {
      void this.clear(details.tabId);
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
  };

  readonly #onHeadersReceived = (details: WebRequestDetails): void => {
    const request = this.#active.get(details.requestId);
    if (!request) return;
    if (request.timeoutHandle) clearTimeout(request.timeoutHandle);
    request.timeoutHandle = undefined;
    if (request.timedOut) void this.#remove(details.tabId, details.requestId);
  };

  readonly #onCompleted = (details: WebRequestDetails): void => {
    const request = this.#active.get(details.requestId);
    if (request?.timeoutHandle) clearTimeout(request.timeoutHandle);
    if (request?.timedOut) void this.#remove(details.tabId, details.requestId);
    this.#active.delete(details.requestId);
  };

  readonly #onErrorOccurred = (details: WebRequestDetails): void => {
    const request = this.#active.get(details.requestId);
    if (request?.timeoutHandle) clearTimeout(request.timeoutHandle);
    this.#active.delete(details.requestId);
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
      await this.#repository.write(upsertRequestDiagnostic(state, record));
    });
  }

  async #remove(tabId: number, requestId: string): Promise<void> {
    await this.#serialize(async () => {
      const state = await this.#repository.read();
      await this.#repository.write(removeRequestDiagnostic(state, tabId, requestId));
    });
  }

  async inspect(tabId?: number): Promise<RequestDiagnosticsView> {
    return inspectRequestDiagnostics(
      await this.#repository.read(),
      this.#enabled,
      this.#permissionGranted,
      tabId,
    );
  }

  async clear(tabId?: number): Promise<RequestDiagnosticsView> {
    return this.#serialize(async () => {
      const state = await this.#repository.read();
      await this.#repository.write(clearRequestDiagnostics(state, tabId));
      return this.inspect(tabId);
    });
  }

  readonly onWorkflowChange = (_changes: Record<string, unknown>, areaName: string): void => {
    if (areaName !== 'local') return;
    void this.#serialize(() => this.#refreshSettings());
  };

  readonly onPermissionChange = (): void => {
    void this.#serialize(() => this.#refreshSettings());
  };

  readonly onTabRemoved = (tabId: number): void => {
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
  const listener = (
    message: unknown,
  ): Promise<RequestDiagnosticsCommandResponse> | undefined => {
    if (!isRequestDiagnosticsCommand(message)) return undefined;
    const operation = message.action === 'clear' ? runtime.clear(message.tabId) : runtime.inspect(message.tabId);
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
''')

Path('apps/extension/src/lib/request-diagnostics-runtime.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import { isRequestDiagnosticsCommand } from './request-diagnostics-client';


describe('request diagnostics message contract', () => {
  it('accepts only its own bounded get and clear commands', () => {
    expect(
      isRequestDiagnosticsCommand({
        channel: 'zeroomega-nex/request-diagnostics/v1',
        action: 'get',
        tabId: 7,
      }),
    ).toBe(true);
    expect(
      isRequestDiagnosticsCommand({
        channel: 'zeroomega-nex/request-diagnostics/v1',
        action: 'clear',
      }),
    ).toBe(true);
    expect(
      isRequestDiagnosticsCommand({
        channel: 'zeroomega-nex/profile-workflow/v1',
        action: 'get',
      }),
    ).toBe(false);
    expect(
      isRequestDiagnosticsCommand({
        channel: 'zeroomega-nex/request-diagnostics/v1',
        action: 'get',
        tabId: -1,
      }),
    ).toBe(false);
  });
});
''')

replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """import {
  currentProxyOwnershipRuntimeApi,
  registerProxyOwnershipRuntime,
  type RegisteredProxyOwnershipRuntime,
} from '../lib/proxy-ownership-runtime';
""",
    """import {
  currentProxyOwnershipRuntimeApi,
  registerProxyOwnershipRuntime,
  type RegisteredProxyOwnershipRuntime,
} from '../lib/proxy-ownership-runtime';
import {
  currentRequestDiagnosticsRuntimeApi,
  registerRequestDiagnosticsRuntime,
  type RegisteredRequestDiagnosticsRuntime,
} from '../lib/request-diagnostics-runtime';
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """let proxyOwnershipRuntime: RegisteredProxyOwnershipRuntime | undefined;
""",
    """let proxyOwnershipRuntime: RegisteredProxyOwnershipRuntime | undefined;
let requestDiagnosticsRuntime: RegisteredRequestDiagnosticsRuntime | undefined;
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """  proxyOwnershipRuntime?.dispose();
  popupTemporaryRuleRuntime?.dispose();
""",
    """  requestDiagnosticsRuntime?.dispose();
  proxyOwnershipRuntime?.dispose();
  popupTemporaryRuleRuntime?.dispose();
""",
)
replace_once(
    'apps/extension/src/entrypoints/background.ts',
    """  proxyOwnershipRuntime = registerProxyOwnershipRuntime(currentProxyOwnershipRuntimeApi());

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch(
""",
    """  proxyOwnershipRuntime = registerProxyOwnershipRuntime(currentProxyOwnershipRuntimeApi());
  requestDiagnosticsRuntime = registerRequestDiagnosticsRuntime(
    currentRequestDiagnosticsRuntimeApi(),
  );

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch(
""",
)
