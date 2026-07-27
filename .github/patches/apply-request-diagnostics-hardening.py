from pathlib import Path
import os

def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old[:120]!r}")
    target.write_text(text.replace(old, new, 1))

model = r"""export const REQUEST_DIAGNOSTICS_SCHEMA_VERSION = 1 as const;
export const REQUEST_DIAGNOSTICS_PER_TAB_LIMIT = 1_000 as const;
export const REQUEST_DIAGNOSTICS_GLOBAL_LIMIT = 5_000 as const;
export const REQUEST_DIAGNOSTICS_ACTIVE_PER_TAB_LIMIT = 256 as const;
export const REQUEST_DIAGNOSTICS_ACTIVE_GLOBAL_LIMIT = 1_024 as const;
export const REQUEST_DIAGNOSTICS_RETENTION_MS = 10 * 60 * 1_000;
export const REQUEST_DIAGNOSTICS_TIMEOUT_MS = 5_000;

export type RequestDiagnosticStatus = 'error' | 'timeout';

export interface RequestDiagnosticRecord {
  readonly requestId: string;
  readonly tabId: number;
  readonly url: string;
  readonly method: string;
  readonly resourceType: string;
  readonly startedAt: number;
  readonly failedAt: number;
  readonly status: RequestDiagnosticStatus;
  readonly error?: string;
}

export interface RequestDiagnosticsState {
  readonly schemaVersion: typeof REQUEST_DIAGNOSTICS_SCHEMA_VERSION;
  readonly generation: number;
  readonly active: boolean;
  readonly records: readonly RequestDiagnosticRecord[];
}

export interface RequestDiagnosticDomainSummary {
  readonly domain: string;
  readonly count: number;
}

export interface RequestDiagnosticsView {
  readonly enabled: boolean;
  readonly permissionGranted: boolean;
  readonly active: boolean;
  readonly records: readonly RequestDiagnosticRecord[];
  readonly errorCount: number;
  readonly timeoutCount: number;
  readonly domains: readonly RequestDiagnosticDomainSummary[];
  readonly perTabLimit: typeof REQUEST_DIAGNOSTICS_PER_TAB_LIMIT;
  readonly globalLimit: typeof REQUEST_DIAGNOSTICS_GLOBAL_LIMIT;
  readonly retentionMs: typeof REQUEST_DIAGNOSTICS_RETENTION_MS;
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);
}

export function sanitizeDiagnosticUrl(value: string): string {
  try {
    const url = new URL(value);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.href.slice(0, 4_096);
  } catch {
    return 'invalid-url:';
  }
}

function parseRecord(value: unknown): RequestDiagnosticRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('request diagnostic record must be an object');
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.requestId !== 'string' ||
    !record.requestId ||
    !isFiniteInteger(record.tabId) ||
    record.tabId < 0 ||
    typeof record.url !== 'string' ||
    !record.url ||
    typeof record.method !== 'string' ||
    typeof record.resourceType !== 'string' ||
    !isFiniteInteger(record.startedAt) ||
    !isFiniteInteger(record.failedAt) ||
    (record.status !== 'error' && record.status !== 'timeout') ||
    (record.error !== undefined && typeof record.error !== 'string')
  ) {
    throw new TypeError('request diagnostic record is invalid');
  }
  return {
    requestId: record.requestId.slice(0, 256),
    tabId: record.tabId,
    url: sanitizeDiagnosticUrl(record.url),
    method: record.method.slice(0, 16),
    resourceType: record.resourceType.slice(0, 64),
    startedAt: record.startedAt,
    failedAt: record.failedAt,
    status: record.status,
    ...(record.error === undefined ? {} : { error: record.error.slice(0, 256) }),
  };
}

export function createRequestDiagnosticsState(): RequestDiagnosticsState {
  return {
    schemaVersion: REQUEST_DIAGNOSTICS_SCHEMA_VERSION,
    generation: 0,
    active: false,
    records: [],
  };
}

export function parseRequestDiagnosticsState(value: unknown): RequestDiagnosticsState {
  if (value === undefined) return createRequestDiagnosticsState();
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('request diagnostics state must be an object');
  }
  const record = value as Record<string, unknown>;
  if (
    record.schemaVersion !== REQUEST_DIAGNOSTICS_SCHEMA_VERSION ||
    !isFiniteInteger(record.generation) ||
    record.generation < 0 ||
    typeof record.active !== 'boolean' ||
    !Array.isArray(record.records)
  ) {
    throw new TypeError('request diagnostics state metadata is invalid');
  }
  const unique = new Map<string, RequestDiagnosticRecord>();
  for (const entry of record.records) {
    const parsed = parseRecord(entry);
    unique.set(`${parsed.tabId}:${parsed.requestId}`, parsed);
  }
  return {
    schemaVersion: REQUEST_DIAGNOSTICS_SCHEMA_VERSION,
    generation: record.generation,
    active: record.active,
    records: [...unique.values()].sort((left, right) => left.failedAt - right.failedAt),
  };
}

function pruneRecords(
  records: readonly RequestDiagnosticRecord[],
  now: number,
): RequestDiagnosticRecord[] {
  const fresh = records
    .filter((record) => now - record.failedAt <= REQUEST_DIAGNOSTICS_RETENTION_MS)
    .sort((left, right) => left.failedAt - right.failedAt);
  const perTab = new Map<number, RequestDiagnosticRecord[]>();
  for (const record of fresh) {
    const entries = perTab.get(record.tabId) ?? [];
    entries.push(record);
    perTab.set(record.tabId, entries);
  }
  const bounded: RequestDiagnosticRecord[] = [];
  for (const entries of perTab.values()) {
    bounded.push(...entries.slice(-REQUEST_DIAGNOSTICS_PER_TAB_LIMIT));
  }
  return bounded
    .sort((left, right) => left.failedAt - right.failedAt)
    .slice(-REQUEST_DIAGNOSTICS_GLOBAL_LIMIT);
}

export function setRequestDiagnosticsActive(
  state: RequestDiagnosticsState,
  active: boolean,
): RequestDiagnosticsState {
  if (state.active === active && (active || state.records.length === 0)) return state;
  return {
    schemaVersion: REQUEST_DIAGNOSTICS_SCHEMA_VERSION,
    generation: state.generation + 1,
    active,
    records: active ? [...state.records] : [],
  };
}

export function upsertRequestDiagnostic(
  state: RequestDiagnosticsState,
  value: RequestDiagnosticRecord,
  now = Date.now(),
): RequestDiagnosticsState {
  const record = parseRecord(value);
  const key = `${record.tabId}:${record.requestId}`;
  const records = state.records.filter(
    (entry) => `${entry.tabId}:${entry.requestId}` !== key,
  );
  records.push(record);
  return {
    schemaVersion: REQUEST_DIAGNOSTICS_SCHEMA_VERSION,
    generation: state.generation + 1,
    active: state.active,
    records: pruneRecords(records, now),
  };
}

export function removeRequestDiagnostic(
  state: RequestDiagnosticsState,
  tabId: number,
  requestId: string,
  now = Date.now(),
): RequestDiagnosticsState {
  const records = pruneRecords(
    state.records.filter((record) => !(record.tabId === tabId && record.requestId === requestId)),
    now,
  );
  if (records.length === state.records.length) return state;
  return {
    schemaVersion: REQUEST_DIAGNOSTICS_SCHEMA_VERSION,
    generation: state.generation + 1,
    active: state.active,
    records,
  };
}

export function clearRequestDiagnostics(
  state: RequestDiagnosticsState,
  tabId?: number,
): RequestDiagnosticsState {
  const records =
    tabId === undefined ? [] : state.records.filter((record) => record.tabId !== tabId);
  if (records.length === state.records.length) return state;
  return {
    schemaVersion: REQUEST_DIAGNOSTICS_SCHEMA_VERSION,
    generation: state.generation + 1,
    active: state.active,
    records,
  };
}

function diagnosticDomain(urlValue: string): string {
  try {
    return new URL(urlValue).hostname || '(unknown)';
  } catch {
    return '(unknown)';
  }
}

export function inspectRequestDiagnostics(
  state: RequestDiagnosticsState,
  enabled: boolean,
  permissionGranted: boolean,
  tabId?: number,
  now = Date.now(),
  includeRecords = true,
): RequestDiagnosticsView {
  const records = pruneRecords(
    tabId === undefined ? state.records : state.records.filter((record) => record.tabId === tabId),
    now,
  ).sort((left, right) => right.failedAt - left.failedAt);
  const domains = new Map<string, number>();
  let errorCount = 0;
  let timeoutCount = 0;
  for (const record of records) {
    if (record.status === 'error') errorCount += 1;
    else timeoutCount += 1;
    const domain = diagnosticDomain(record.url);
    domains.set(domain, (domains.get(domain) ?? 0) + 1);
  }
  return {
    enabled,
    permissionGranted,
    active: state.active && enabled && permissionGranted,
    records: includeRecords ? records.map((record) => structuredClone(record)) : [],
    errorCount,
    timeoutCount,
    domains: [...domains.entries()]
      .map(([domain, count]) => ({ domain, count }))
      .sort((left, right) => right.count - left.count || left.domain.localeCompare(right.domain)),
    perTabLimit: REQUEST_DIAGNOSTICS_PER_TAB_LIMIT,
    globalLimit: REQUEST_DIAGNOSTICS_GLOBAL_LIMIT,
    retentionMs: REQUEST_DIAGNOSTICS_RETENTION_MS,
  };
}

export function shouldIgnoreRequestError(error: string, urlValue: string): boolean {
  const normalizedError = error.toUpperCase();
  if (
    normalizedError.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
    normalizedError.includes('BLOCKED') ||
    normalizedError.includes('ERR_FILE_') ||
    normalizedError.startsWith('NS_ERROR_ABORT')
  ) {
    return true;
  }
  try {
    const url = new URL(urlValue);
    if (!['http:', 'https:'].includes(url.protocol)) return true;
    if (url.hostname === '127.0.0.1' || url.hostname === '::1') {
      return normalizedError.includes('ERR_ABORTED');
    }
  } catch {
    return true;
  }
  return false;
}
"""
Path('apps/extension/src/lib/request-diagnostics-model.ts').write_text(model)

model_test = r"""import { describe, expect, it } from 'vitest';

import {
  REQUEST_DIAGNOSTICS_GLOBAL_LIMIT,
  REQUEST_DIAGNOSTICS_PER_TAB_LIMIT,
  REQUEST_DIAGNOSTICS_RETENTION_MS,
  clearRequestDiagnostics,
  createRequestDiagnosticsState,
  inspectRequestDiagnostics,
  removeRequestDiagnostic,
  sanitizeDiagnosticUrl,
  setRequestDiagnosticsActive,
  shouldIgnoreRequestError,
  upsertRequestDiagnostic,
} from './request-diagnostics-model';

function record(index: number, tabId = 1, failedAt = index) {
  return {
    requestId: `request-${index}`,
    tabId,
    url: `https://user:secret@example.com/resource/${index}?token=value#fragment`,
    method: 'GET',
    resourceType: 'image',
    startedAt: Math.max(0, failedAt - 10),
    failedAt,
    status: 'error' as const,
    error: 'net::ERR_CONNECTION_RESET',
  };
}

describe('bounded request diagnostics model', () => {
  it('removes credentials, query strings, and fragments without collecting payload data', () => {
    expect(sanitizeDiagnosticUrl(record(1).url)).toBe('https://example.com/resource/1');
    const state = upsertRequestDiagnostic(
      setRequestDiagnosticsActive(createRequestDiagnosticsState(), true),
      record(1),
      1,
    );
    expect(state.records[0]).not.toHaveProperty('requestHeaders');
    expect(state.records[0]).not.toHaveProperty('requestBody');
    expect(state.records[0]).not.toHaveProperty('responseBody');
    expect(JSON.stringify(state)).not.toContain('token=value');
    expect(JSON.stringify(state)).not.toContain('secret');
  });

  it('enforces per-tab, global, and retention bounds', () => {
    let state = setRequestDiagnosticsActive(createRequestDiagnosticsState(), true);
    for (let index = 0; index < REQUEST_DIAGNOSTICS_PER_TAB_LIMIT + 20; index += 1) {
      state = upsertRequestDiagnostic(state, record(index, 1, index), index);
    }
    expect(state.records).toHaveLength(REQUEST_DIAGNOSTICS_PER_TAB_LIMIT);
    for (let index = 0; index < REQUEST_DIAGNOSTICS_GLOBAL_LIMIT + 100; index += 1) {
      state = upsertRequestDiagnostic(
        state,
        record(index + 10_000, index % 10, 20_000 + index),
        20_000 + index,
      );
    }
    expect(state.records.length).toBeLessThanOrEqual(REQUEST_DIAGNOSTICS_GLOBAL_LIMIT);
    const old = upsertRequestDiagnostic(
      state,
      record(99_999, 99, 1),
      REQUEST_DIAGNOSTICS_RETENTION_MS + 2,
    );
    expect(old.records.some((entry) => entry.requestId === 'request-99999')).toBe(false);
  });

  it('updates, removes, clears, summarizes, and stops a session', () => {
    let state = setRequestDiagnosticsActive(createRequestDiagnosticsState(), true);
    state = upsertRequestDiagnostic(state, record(1, 1, 100), 100);
    state = upsertRequestDiagnostic(
      state,
      { ...record(2, 1, 200), status: 'timeout', error: undefined },
      200,
    );
    state = upsertRequestDiagnostic(state, record(3, 2, 300), 300);
    const summary = inspectRequestDiagnostics(state, true, true, 1, 300, false);
    expect(summary).toMatchObject({ active: true, errorCount: 1, timeoutCount: 1, records: [] });
    expect(summary.domains).toEqual([{ domain: 'example.com', count: 2 }]);
    state = removeRequestDiagnostic(state, 1, 'request-1', 300);
    expect(inspectRequestDiagnostics(state, true, true, 1, 300).errorCount).toBe(0);
    state = clearRequestDiagnostics(state, 1);
    expect(state.records.map((entry) => entry.tabId)).toEqual([2]);
    state = setRequestDiagnosticsActive(state, false);
    expect(state).toMatchObject({ active: false, records: [] });
  });

  it('filters the original request-error noise classes', () => {
    expect(shouldIgnoreRequestError('net::ERR_BLOCKED_BY_CLIENT', 'https://example.com/x')).toBe(
      true,
    );
    expect(shouldIgnoreRequestError('NS_ERROR_ABORT', 'https://example.com/x')).toBe(true);
    expect(shouldIgnoreRequestError('net::ERR_FAILED', 'file:///tmp/x')).toBe(true);
    expect(shouldIgnoreRequestError('net::ERR_CONNECTION_RESET', 'https://example.com/x')).toBe(
      false,
    );
  });
});
"""
Path('apps/extension/src/lib/request-diagnostics-model.test.ts').write_text(model_test)

client = r"""import { browser } from 'wxt/browser';

import type { RequestDiagnosticsView } from './request-diagnostics-model';

export const REQUEST_DIAGNOSTICS_MESSAGE_CHANNEL =
  'zeroomega-nex/request-diagnostics/v1' as const;
export const REQUEST_DIAGNOSTICS_PERMISSION = {
  permissions: ['webRequest'],
  origins: ['http://*/*', 'https://*/*'],
};

export type RequestDiagnosticsCommand = {
  readonly channel: typeof REQUEST_DIAGNOSTICS_MESSAGE_CHANNEL;
  readonly action: 'get' | 'summary' | 'clear' | 'start' | 'stop';
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
    ['get', 'summary', 'clear', 'start', 'stop'].includes(String(record.action)) &&
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
    typeof view.active === 'boolean' &&
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
"""
Path('apps/extension/src/lib/request-diagnostics-client.ts').write_text(client)

runtime = r"""import { BrowserStorageProfileWorkflowRepository } from '@zeroomega-nex/profile-workflow';
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

export const REQUEST_DIAGNOSTICS_STORAGE_KEY =
  'zeroomega-nex/request-diagnostics/v1/state';
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
      sessionActive && this.#enabled && this.#permissionGranted && this.#api.webRequest !== undefined;
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
      current.timeoutHandle = undefined;
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
    request.timeoutHandle = undefined;
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
      return inspectRequestDiagnostics(
        state,
        this.#enabled,
        this.#permissionGranted,
        tabId,
      );
    });
  }

  async stop(tabId?: number): Promise<RequestDiagnosticsView> {
    return this.#serialize(async () => {
      this.#clearActiveRequests();
      const state = setRequestDiagnosticsActive(await this.#repository.read(), false);
      await this.#repository.write(state);
      this.#updateWebRequestListeners(false);
      return inspectRequestDiagnostics(
        state,
        this.#enabled,
        this.#permissionGranted,
        tabId,
      );
    });
  }

  async clear(tabId?: number): Promise<RequestDiagnosticsView> {
    return this.#serialize(async () => {
      const state = clearRequestDiagnostics(await this.#repository.read(), tabId);
      await this.#repository.write(state);
      return inspectRequestDiagnostics(
        state,
        this.#enabled,
        this.#permissionGranted,
        tabId,
      );
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
  const listener = (
    message: unknown,
  ): Promise<RequestDiagnosticsCommandResponse> | undefined => {
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
"""
Path('apps/extension/src/lib/request-diagnostics-runtime.ts').write_text(runtime)

runtime_test = r"""import { describe, expect, it } from 'vitest';

import { isRequestDiagnosticsCommand } from './request-diagnostics-client';

describe('request diagnostics message contract', () => {
  it('accepts only its own bounded session commands', () => {
    for (const action of ['get', 'summary', 'clear', 'start', 'stop']) {
      expect(
        isRequestDiagnosticsCommand({
          channel: 'zeroomega-nex/request-diagnostics/v1',
          action,
          tabId: 7,
        }),
      ).toBe(true);
    }
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
"""
Path('apps/extension/src/lib/request-diagnostics-runtime.test.ts').write_text(runtime_test)

# Popup should receive summary-only data and show it only during an active session.
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    "await sendRequestDiagnosticsCommand({ action: 'get', tabId: currentSite.tabId })",
    "await sendRequestDiagnosticsCommand({ action: 'summary', tabId: currentSite.tabId })",
)
replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    """    requestDiagnostics &&
    requestDiagnostics.errorCount + requestDiagnostics.timeoutCount > 0}""",
    """    requestDiagnostics?.active &&
    requestDiagnostics.errorCount + requestDiagnostics.timeoutCount > 0}""",
)

# Tighten Options language around explicit browser-session activation.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n",
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n  import { translate } from '../../lib/i18n';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '<h2>Request diagnostics</h2>',
    '<h2>{translate(\'Request diagnostics\')}</h2>',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    'Monitor failed and timed-out web requests',
    "{translate('Allow bounded request diagnostics')}",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    """          Diagnostics are session-only and bounded. Request bodies, headers, cookies, credentials,
          and response content are never collected.""",
    """          {translate(
            'Monitoring starts only from the diagnostics page for this browser session. Headers, bodies, cookies, credentials, query strings, and response content are never collected.',
          )}""",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '<span role="status">Browser permission granted.</span>',
    "<span role=\"status\">{translate('Browser permission granted.')}</span>",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "{requestingDiagnosticsPermission ? 'Requesting…' : 'Grant monitoring permission'}",
    "{requestingDiagnosticsPermission ? translate('Requesting…') : translate('Grant monitoring permission')}",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '<button type="button" on:click={openRequestDiagnostics}>Open request diagnostics</button>',
    """<button type="button" onclick={openRequestDiagnostics}>
            {translate('Open request diagnostics')}
          </button>""",
)
options_app = Path('apps/extension/src/entrypoints/options/App.svelte')
options_app.write_text(
    options_app.read_text().replace('on:change=', 'onchange=').replace('on:click=', 'onclick=')
)

network_app = r"""<script lang="ts">
  import { onMount } from 'svelte';

  import { translate } from '../../lib/i18n';
  import {
    requestRequestDiagnosticsPermission,
    sendRequestDiagnosticsCommand,
  } from '../../lib/request-diagnostics-client';
  import type { RequestDiagnosticsView } from '../../lib/request-diagnostics-model';
  import { applyThemeMode, readThemeMode } from '../../lib/ui-theme';

  const parsedTabId = Number.parseInt(new URLSearchParams(location.search).get('tabId') ?? '', 10);
  const tabId = Number.isInteger(parsedTabId) && parsedTabId >= 0 ? parsedTabId : undefined;
  let view: RequestDiagnosticsView | undefined;
  let loading = true;
  let clearing = false;
  let changingSession = false;
  let errorMessage = '';

  async function command(action: 'get' | 'clear' | 'start' | 'stop'): Promise<void> {
    const response = await sendRequestDiagnosticsCommand({ action, tabId });
    if (!response.ok) throw new Error(response.message);
    view = response.view;
    errorMessage = '';
  }

  async function load(): Promise<void> {
    try {
      await command('get');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      loading = false;
    }
  }

  async function clear(): Promise<void> {
    if (clearing) return;
    clearing = true;
    try {
      await command('clear');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      clearing = false;
    }
  }

  async function start(): Promise<void> {
    if (changingSession) return;
    changingSession = true;
    try {
      if (!view?.permissionGranted) {
        const granted = await requestRequestDiagnosticsPermission();
        if (!granted) throw new Error(translate('Request monitoring permission was not granted.'));
      }
      await command('start');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      changingSession = false;
    }
  }

  async function stop(): Promise<void> {
    if (changingSession) return;
    changingSession = true;
    try {
      await command('stop');
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
    } finally {
      changingSession = false;
    }
  }

  function formatTime(value: number): string {
    return new Date(value).toLocaleTimeString();
  }

  onMount(() => {
    applyThemeMode(readThemeMode());
    let disposed = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    void load().then(() => {
      if (disposed) return;
      timer = setInterval(() => {
        if (document.visibilityState === 'visible' && view?.active) void load();
      }, 1_000);
    });
    return () => {
      disposed = true;
      if (timer) clearInterval(timer);
    };
  });
</script>

<main class="network-shell" aria-busy={loading || clearing || changingSession}>
  <header>
    <div>
      <h1>{translate('Request diagnostics')}</h1>
      <p>{translate('Failed and timed-out requests for this browser session.')}</p>
    </div>
    <div class="header-actions">
      {#if view?.active}
        <button type="button" data-request-diagnostics-stop disabled={changingSession} onclick={() => void stop()}>
          {translate('Stop monitoring')}
        </button>
      {:else}
        <button type="button" data-request-diagnostics-start disabled={changingSession || view?.enabled === false} onclick={() => void start()}>
          {translate('Start monitoring')}
        </button>
      {/if}
      <button type="button" disabled={loading} onclick={() => void load()}>{translate('Refresh')}</button>
      <button
        type="button"
        data-request-diagnostics-clear
        disabled={clearing || (view?.records.length ?? 0) === 0}
        onclick={() => void clear()}
      >
        {translate('Clear diagnostics')}
      </button>
    </div>
  </header>

  {#if errorMessage}<p class="message error" role="alert">{errorMessage}</p>{/if}
  {#if view && !view.enabled}
    <p class="message">{translate('Monitoring is disabled in Options.')}</p>
  {:else if view && !view.active}
    <section class="message permission" data-request-diagnostics-stopped>
      <strong>{translate('Monitoring is stopped for this browser session.')}</strong>
      {#if !view.permissionGranted}<span>{translate('Permission will be requested when monitoring starts.')}</span>{/if}
    </section>
  {:else if loading}
    <p class="message" role="status">{translate('Loading…')}</p>
  {:else if !view || view.records.length === 0}
    <p class="message" role="status">{translate('No request errors recorded.')}</p>
  {:else}
    <p class="bounds" data-request-diagnostics-bounds>
      {view.records.length} records · max {view.perTabLimit} per tab · max {view.globalLimit} total ·
      retained {Math.round(view.retentionMs / 60_000)} minutes
    </p>
    <table data-request-diagnostics-table>
      <thead>
        <tr>
          <th>{translate('Time')}</th>
          <th>{translate('Status')}</th>
          <th>{translate('Type')}</th>
          <th>{translate('URL')}</th>
          <th>{translate('Error')}</th>
        </tr>
      </thead>
      <tbody>
        {#each view.records as record (`${record.tabId}:${record.requestId}`)}
          <tr data-request-diagnostic-status={record.status}>
            <td>{formatTime(record.failedAt)}</td>
            <td>{record.status === 'timeout' ? translate('Timed out') : translate('Failed')}</td>
            <td>{record.resourceType}</td>
            <td><code>{record.url}</code></td>
            <td>{record.error ?? 'ERR_TIMEOUT'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</main>
"""
Path('apps/extension/src/entrypoints/network/App.svelte').write_text(network_app)

# Localization additions.
replace_once(
    'apps/extension/src/lib/i18n.ts',
    """  'request errors': { 'zh-CN': '个请求错误', 'zh-TW': '個請求錯誤' },""",
    """  'request errors': { 'zh-CN': '个请求错误', 'zh-TW': '個請求錯誤' },
  'Allow bounded request diagnostics': {
    'zh-CN': '允许有界请求诊断',
    'zh-TW': '允許有界請求診斷',
  },
  'Monitoring starts only from the diagnostics page for this browser session. Headers, bodies, cookies, credentials, query strings, and response content are never collected.': {
    'zh-CN': '只有从诊断页明确启动后，才会在当前浏览器会话中监控。不会收集请求头、正文、Cookie、凭据、查询参数或响应内容。',
    'zh-TW': '只有從診斷頁明確啟動後，才會在目前瀏覽器工作階段中監控。不會收集請求標頭、本文、Cookie、憑證、查詢參數或回應內容。',
  },
  'Browser permission granted.': { 'zh-CN': '浏览器权限已授予。', 'zh-TW': '瀏覽器權限已授予。' },
  'Open request diagnostics': { 'zh-CN': '打开请求诊断', 'zh-TW': '開啟請求診斷' },
  'Start monitoring': { 'zh-CN': '开始监控', 'zh-TW': '開始監控' },
  'Stop monitoring': { 'zh-CN': '停止监控', 'zh-TW': '停止監控' },
  'Monitoring is stopped for this browser session.': {
    'zh-CN': '当前浏览器会话的监控已停止。',
    'zh-TW': '目前瀏覽器工作階段的監控已停止。',
  },
  'Permission will be requested when monitoring starts.': {
    'zh-CN': '开始监控时才会请求权限。',
    'zh-TW': '開始監控時才會要求權限。',
  },
  'Request monitoring permission was not granted.': {
    'zh-CN': '未授予请求监控权限。',
    'zh-TW': '未授予請求監控權限。',
  },""",
)

# Guard the exact exception without weakening the rest of the source tree.
guard = Path('scripts/guard-architecture.mjs')
text = guard.read_text()
text = text.replace(
    """  {
    expression: /webRequest\.(?!onAuthRequired\b)[A-Za-z]+\.addListener/u,
    reason: 'only the opt-in proxy authentication challenge listener may use WebRequest',
  },""",
    """  {
    expression: /webRequest\.(?!onAuthRequired\b)[A-Za-z]+\.addListener/u,
    allowedPaths: ['apps/extension/src/lib/request-diagnostics-runtime.ts'],
    reason: 'ordinary WebRequest listeners are prohibited outside the explicit bounded request-diagnostics runtime',
  },""",
)
text = text.replace(
    """  {
    expression: /on(?:Completed|ErrorOccurred)\??\.addListener/u,
    reason: 'proxy authentication must not add persistent request completion monitoring',
  },""",
    """  {
    expression: /on(?:Completed|ErrorOccurred)\??\.addListener/u,
    allowedPaths: ['apps/extension/src/lib/request-diagnostics-runtime.ts'],
    reason: 'completion/error listeners are prohibited outside the explicit bounded request-diagnostics runtime',
  },""",
)
text = text.replace(
    """    const source = await readFile(file, 'utf8');
    for (const rule of rules) {
      if (rule.expression.test(source)) {
        violations.push(`${relative(repositoryRoot.pathname, file)} [${scope}]: ${rule.reason}`);
      }
    }""",
    """    const source = await readFile(file, 'utf8');
    const repositoryPath = relative(repositoryRoot.pathname, file);
    for (const rule of rules) {
      if (
        rule.expression.test(source) &&
        !(rule.allowedPaths ?? []).includes(repositoryPath)
      ) {
        violations.push(`${repositoryPath} [${scope}]: ${rule.reason}`);
      }
    }""",
)
text = text.replace(
    """const violations = [...architecture.violations, ...ui.violations];""",
    """const violations = [...architecture.violations, ...ui.violations];
const diagnosticsPath = new URL(
  'apps/extension/src/lib/request-diagnostics-runtime.ts',
  repositoryRoot,
);
try {
  const diagnostics = await readFile(diagnosticsPath, 'utf8');
  const required = [
    'storage.session',
    'REQUEST_DIAGNOSTICS_ACTIVE_GLOBAL_LIMIT',
    'REQUEST_DIAGNOSTICS_ACTIVE_PER_TAB_LIMIT',
    "urls: ['http://*/*', 'https://*/*']",
    "message.action === 'start'",
    "message.action === 'stop'",
  ];
  const forbidden = [
    '<all_urls>',
    'requestHeaders',
    'requestBody',
    'responseBody',
    'cookieStoreId',
  ];
  if (!required.every((entry) => diagnostics.includes(entry))) {
    violations.push(
      'apps/extension/src/lib/request-diagnostics-runtime.ts [bounded diagnostics]: session-only activation, listener, or active-request bounds are missing',
    );
  }
  if (forbidden.some((entry) => diagnostics.includes(entry))) {
    violations.push(
      'apps/extension/src/lib/request-diagnostics-runtime.ts [bounded diagnostics]: forbidden payload or all-host capture surface detected',
    );
  }
} catch (error) {
  if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error;
}""",
)
guard.write_text(text)

# Permanent UI compatibility guard.
validator = Path('scripts/validate-ui-compatibility.mjs')
text = validator.read_text()
text = text.replace(
    """const storageRepositoryPath = 'packages/profile-workflow/src/storage-repository.ts';""",
    """const storageRepositoryPath = 'packages/profile-workflow/src/storage-repository.ts';
const requestDiagnosticsModelPath = 'apps/extension/src/lib/request-diagnostics-model.ts';
const requestDiagnosticsRuntimePath = 'apps/extension/src/lib/request-diagnostics-runtime.ts';
const requestDiagnosticsPagePath = 'apps/extension/src/entrypoints/network/App.svelte';""",
)
text = text.replace(
    """  storageRepository,
] = await Promise.all([""",
    """  storageRepository,
  requestDiagnosticsModel,
  requestDiagnosticsRuntime,
  requestDiagnosticsPage,
] = await Promise.all([""",
)
text = text.replace(
    """  readFile(storageRepositoryPath, 'utf8'),
]);""",
    """  readFile(storageRepositoryPath, 'utf8'),
  readFile(requestDiagnosticsModelPath, 'utf8'),
  readFile(requestDiagnosticsRuntimePath, 'utf8'),
  readFile(requestDiagnosticsPagePath, 'utf8'),
]);""",
)
text = text.replace(
    """  [
    popupStyle.includes("font-family: 'Segoe UI'"),""",
    """  [
    popupApp.includes('data-popup-request-diagnostics') &&
      popupApp.includes("action: 'summary'") &&
      requestDiagnosticsModel.includes('REQUEST_DIAGNOSTICS_PER_TAB_LIMIT') &&
      requestDiagnosticsModel.includes('REQUEST_DIAGNOSTICS_GLOBAL_LIMIT') &&
      requestDiagnosticsModel.includes("url.search = ''") &&
      requestDiagnosticsModel.includes("url.hash = ''") &&
      requestDiagnosticsRuntime.includes('this.#api.storage.session') &&
      requestDiagnosticsRuntime.includes("message.action === 'start'") &&
      requestDiagnosticsRuntime.includes("message.action === 'stop'") &&
      requestDiagnosticsPage.includes('data-request-diagnostics-start') &&
      requestDiagnosticsPage.includes('data-request-diagnostics-stop') &&
      requestDiagnosticsPage.includes('<code>{record.url}</code>') &&
      !requestDiagnosticsPage.includes('<a href={record.url}'),
    'Request diagnostics must be explicit browser-session monitoring with bounded session storage, summary-only Popup data, sanitized URLs, and a non-navigating inspection page.',
  ],
  [
    popupStyle.includes("font-family: 'Segoe UI'"),""",
)
validator.write_text(text)

# Documentation and acceptance graph.
kg = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg.write_text(
    kg.read_text()
    + """
- 请求错误诊断不属于常驻数据平面。用户必须在独立网络检查页明确启动当前浏览器会话；持久 `monitorWebRequests` 仅控制功能是否可用，不能在浏览器启动时自动注册监听器。
- 启动时才请求可选 `webRequest` 与 HTTP(S) 主机权限。记录只保存在 `storage.session`；停止、关闭设置、撤销权限或浏览器重启都会停止监听并清除记录。
- 只记录失败/超时所需的最小字段：标签页、方法、资源类型、开始/失败时间、错误码和净化 URL。URL 必须移除用户名、密码、查询参数和 fragment；请求头、正文、Cookie、凭据、响应头、响应正文一律不采集。
- 等待响应头超过 5 秒才标记临时超时；随后成功完成会撤销该超时记录。忽略阻止类、文件类、主动取消和原版已过滤的噪声错误。
- 记录保留 10 分钟，每标签页最多 1,000 条、全局最多 5,000 条；并发活动请求另设每标签页 256、全局 1,024 上限，防止异常页面制造无界计时器。
- Popup 只读取当前标签页的聚合计数与域名摘要，不接收完整 URL 列表；完整记录仅在独立网络检查页显示，URL 作为不可点击文本，避免诊断页重新触发失败请求。
"""
)

audit = Path('docs/UI_AUDIT_MATRIX.md')
replace_once(
    str(audit),
    "| I-08 | 请求错误列表       | popup/network      | 有界错误/请求查看              | MUST_MATCH | MISSING  | MISSING  | 无                                                                                                                                                                               | 安全设计后实现                  |",
    "| I-08 | 请求错误列表       | popup/network      | 有界错误/请求查看              | MUST_MATCH | DONE     | PARTIAL  | 明确会话启动、可选权限、`storage.session`、10 分钟/每 tab 1000/全局 5000 上限、URL 去凭据/查询/fragment、Popup 聚合摘要、独立不可点击明细页及 Chromium 真实失败请求 E2E 已实现 | 补 Firefox 真实错误与完整 locale |",
)

decisions = Path('docs/DECISIONS.md')
replace_once(
    str(decisions),
    """**Consequence:** Diagnostics use time/entry limits, ring buffers, and privacy-preserving defaults.""",
    """**Consequence:** Diagnostics use time/entry limits, ring buffers, and privacy-preserving defaults. A persistent preference may expose the feature, but listeners start only after an explicit browser-session action and stop on session end, disablement, permission revocation, or browser restart. Records use session storage, strip URL credentials/query/fragment, exclude headers/bodies/cookies/response content, and expose only aggregate summaries to Popup.""",
)

status = Path('docs/MILESTONE_8_STATUS.md')
replace_once(
    str(status),
    "**Current product implementation head:** `e305394dae78ce98fa359f5ddc3521ed01675fe9`  ",
    "**Current product implementation head:** request-diagnostics product commit containing this document  ",
)
integration_run = os.environ.get('INTEGRATION_RUN_ID', 'pending')
replace_once(
    str(status),
    "**Latest integration verification:** run `30289377957` passed full `pnpm verify`, an E2E-host Chromium build, and the complete Chromium regression suite before product commit `e305394dae78ce98fa359f5ddc3521ed01675fe9`  ",
    f"**Latest integration verification:** run `{integration_run}` validates the bounded request-diagnostics product commit with full `pnpm verify`, an E2E-host Chromium build, and the complete Chromium regression suite  ",
)
replace_once(
    str(status),
    "- Popup bounded request-error diagnostics and the full network-inspection page,\n",
    "",
)
replace_once(
    str(status),
    """## Current next action

Proceed to bounded request-error diagnostics and the network inspection page. Update both canonical parity documents in the same product commit, pass full integration, then pass exact-Head CI, Chromium/Firefox E2E, and Parity Documentation. Do not request repository-owner installation until a consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.""",
    """### Bounded request diagnostics and network inspection

- Monitoring requires an explicit start action for the current browser session and optional WebRequest/HTTP(S) permission; it never auto-starts merely because a persistent preference is enabled.
- Records are session-only and bounded to 10 minutes, 1,000 entries per tab, 5,000 globally, 256 active requests per tab, and 1,024 active requests globally.
- URLs remove credentials, query strings, and fragments. Headers, bodies, cookies, credentials, and response content are never collected.
- Popup receives only the current tab's count/domain summary. The dedicated page displays non-clickable records, supports start/stop/clear, and does not recreate failed requests.
- Unit tests and Chromium E2E cover the privacy bounds, explicit session lifecycle, real failed request capture, Popup summary, sanitized detail display, and clearing.

## Current next action

Complete Inspect result-route badge color/title evaluation and a real Chromium context-menu interaction E2E, then continue the remaining profile/export/localization blockers. Do not request repository-owner installation until a consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.""",
)

# E2E: create a real network failure after explicit permission/session start.
e2e = Path('scripts/e2e-chromium.mjs')
text = e2e.read_text()
text = text.replace(
    """const ruleServer = createServer((request, response) => {
  ruleRequestCount += 1;
  receivedRuleHeader = String(request.headers['x-e2e'] ?? '');
  response.writeHead(200, {""",
    """const ruleServer = createServer((request, response) => {
  if (request.url?.startsWith('/diagnostic-error')) {
    request.socket.destroy();
    return;
  }
  ruleRequestCount += 1;
  receivedRuleHeader = String(request.headers['x-e2e'] ?? '');
  response.writeHead(200, {""",
)
text = text.replace(
    """  await temporaryManager.close();
  await currentSitePage.close();
  await options.bringToFront();""",
    """  await temporaryManager.close();

  const diagnosticsPage = await context.newPage();
  await diagnosticsPage.goto(
    `chrome-extension://${extensionId}/network.html?tabId=${currentSiteTabId}`,
  );
  const diagnosticsStart = diagnosticsPage.locator('[data-request-diagnostics-start]');
  await diagnosticsStart.waitFor({ state: 'visible', timeout: 20_000 });
  await diagnosticsStart.click();
  await assertEventually(
    async () => (await diagnosticsPage.locator('[data-request-diagnostics-stop]').count()) === 1,
    'Request diagnostics did not start after the explicit user gesture',
  );
  await currentSitePage.goto(`http://127.0.0.1:${ruleAddress.port}/diagnostic-page`);
  const diagnosticErrorUrl = `http://127.0.0.1:${ruleAddress.port}/diagnostic-error?token=private#fragment`;
  await currentSitePage.evaluate(async (url) => {
    await fetch(url).catch(() => undefined);
  }, diagnosticErrorUrl);
  const diagnosticsTable = diagnosticsPage.locator('[data-request-diagnostics-table]');
  await diagnosticsTable.waitFor({ state: 'visible', timeout: 20_000 });
  const diagnosticsText = await diagnosticsTable.innerText();
  assert.match(diagnosticsText, /diagnostic-error/u);
  assert.doesNotMatch(diagnosticsText, /token=private|fragment/u);
  const diagnosticsPopup = await context.newPage();
  await diagnosticsPopup.goto(
    `chrome-extension://${extensionId}/popup.html?activeTabId=${currentSiteTabId}`,
  );
  const diagnosticsSummary = diagnosticsPopup.locator('[data-popup-request-diagnostics]');
  await diagnosticsSummary.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await diagnosticsSummary.innerText(), /请求错误/u);
  await diagnosticsPopup.close();
  await diagnosticsPage.locator('[data-request-diagnostics-clear]').click();
  await diagnosticsPage.getByText('没有记录到请求错误。').waitFor({ timeout: 20_000 });
  await diagnosticsPage.locator('[data-request-diagnostics-stop]').click();
  await diagnosticsPage.locator('[data-request-diagnostics-stopped]').waitFor();
  await diagnosticsPage.close();

  await currentSitePage.close();
  await options.bringToFront();""",
)
e2e.write_text(text)
