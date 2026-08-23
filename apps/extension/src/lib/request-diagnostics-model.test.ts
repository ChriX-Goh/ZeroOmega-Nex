import { describe, expect, it } from 'vitest';

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
      { ...record(2, 1, 200), status: 'timeout', error: 'ERR_TIMEOUT' },
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
