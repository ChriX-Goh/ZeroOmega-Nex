from pathlib import Path

Path('apps/extension/src/lib/request-diagnostics-model.ts').write_text(r'''export const REQUEST_DIAGNOSTICS_SCHEMA_VERSION = 1 as const;
export const REQUEST_DIAGNOSTICS_PER_TAB_LIMIT = 1_000 as const;
export const REQUEST_DIAGNOSTICS_GLOBAL_LIMIT = 5_000 as const;
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
  readonly records: readonly RequestDiagnosticRecord[];
}

export interface RequestDiagnosticDomainSummary {
  readonly domain: string;
  readonly count: number;
}

export interface RequestDiagnosticsView {
  readonly enabled: boolean;
  readonly permissionGranted: boolean;
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
    requestId: record.requestId,
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
    records: [...unique.values()].sort((left, right) => left.failedAt - right.failedAt),
  };
}

export function sanitizeDiagnosticUrl(value: string): string {
  try {
    const url = new URL(value);
    url.username = '';
    url.password = '';
    url.hash = '';
    return url.href;
  } catch {
    return value.slice(0, 4_096);
  }
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
    records: records.map((record) => structuredClone(record)),
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
    if (url.hostname === '127.0.0.1' || url.hostname === '::1') return true;
  } catch {
    return true;
  }
  return false;
}
''')

Path('apps/extension/src/lib/request-diagnostics-model.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import {
  REQUEST_DIAGNOSTICS_GLOBAL_LIMIT,
  REQUEST_DIAGNOSTICS_PER_TAB_LIMIT,
  REQUEST_DIAGNOSTICS_RETENTION_MS,
  clearRequestDiagnostics,
  createRequestDiagnosticsState,
  inspectRequestDiagnostics,
  removeRequestDiagnostic,
  sanitizeDiagnosticUrl,
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
  it('sanitizes credentials and fragments without recording headers or bodies', () => {
    expect(sanitizeDiagnosticUrl(record(1).url)).toBe(
      'https://example.com/resource/1?token=value',
    );
    const state = upsertRequestDiagnostic(createRequestDiagnosticsState(), record(1), 1);
    expect(state.records[0]).not.toHaveProperty('requestHeaders');
    expect(state.records[0]).not.toHaveProperty('requestBody');
    expect(state.records[0]).not.toHaveProperty('responseBody');
  });

  it('enforces per-tab, global, and retention bounds', () => {
    let state = createRequestDiagnosticsState();
    for (let index = 0; index < REQUEST_DIAGNOSTICS_PER_TAB_LIMIT + 20; index += 1) {
      state = upsertRequestDiagnostic(state, record(index, 1, index), index);
    }
    expect(state.records).toHaveLength(REQUEST_DIAGNOSTICS_PER_TAB_LIMIT);
    for (let index = 0; index < REQUEST_DIAGNOSTICS_GLOBAL_LIMIT + 100; index += 1) {
      state = upsertRequestDiagnostic(state, record(index + 10_000, index % 10, 20_000 + index), 20_000 + index);
    }
    expect(state.records.length).toBeLessThanOrEqual(REQUEST_DIAGNOSTICS_GLOBAL_LIMIT);
    const old = upsertRequestDiagnostic(
      state,
      record(99_999, 99, 1),
      REQUEST_DIAGNOSTICS_RETENTION_MS + 2,
    );
    expect(old.records.some((entry) => entry.requestId === 'request-99999')).toBe(false);
  });

  it('updates, removes, clears, and summarizes one tab', () => {
    let state = createRequestDiagnosticsState();
    state = upsertRequestDiagnostic(state, record(1, 1, 100), 100);
    state = upsertRequestDiagnostic(
      state,
      { ...record(2, 1, 200), status: 'timeout', error: undefined },
      200,
    );
    state = upsertRequestDiagnostic(state, record(3, 2, 300), 300);
    const view = inspectRequestDiagnostics(state, true, true, 1, 300);
    expect(view).toMatchObject({ errorCount: 1, timeoutCount: 1 });
    expect(view.domains).toEqual([{ domain: 'example.com', count: 2 }]);
    state = removeRequestDiagnostic(state, 1, 'request-1', 300);
    expect(inspectRequestDiagnostics(state, true, true, 1, 300).errorCount).toBe(0);
    state = clearRequestDiagnostics(state, 1);
    expect(state.records.map((entry) => entry.tabId)).toEqual([2]);
  });

  it('filters the original request-error noise classes', () => {
    expect(shouldIgnoreRequestError('net::ERR_BLOCKED_BY_CLIENT', 'https://example.com/x')).toBe(
      true,
    );
    expect(shouldIgnoreRequestError('NS_ERROR_ABORT', 'https://example.com/x')).toBe(true);
    expect(shouldIgnoreRequestError('net::ERR_FAILED', 'file:///tmp/x')).toBe(true);
    expect(shouldIgnoreRequestError('net::ERR_FAILED', 'https://127.0.0.1/x')).toBe(true);
    expect(shouldIgnoreRequestError('net::ERR_CONNECTION_RESET', 'https://example.com/x')).toBe(
      false,
    );
  });
});
''')
