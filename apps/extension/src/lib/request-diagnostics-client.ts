import { browser } from 'wxt/browser';

import type { RequestDiagnosticsView } from './request-diagnostics-model';

export const REQUEST_DIAGNOSTICS_MESSAGE_CHANNEL = 'zeroomega-nex/request-diagnostics/v1' as const;
export const REQUEST_DIAGNOSTICS_PERMISSION = {
  permissions: ['webRequest'],
  origins: ['http://*/*', 'https://*/*'],
};

interface RequestDiagnosticsClientApi {
  readonly runtime: { sendMessage(message: RequestDiagnosticsCommand): Promise<unknown> };
  readonly permissions: {
    contains(permission: { permissions: string[]; origins: string[] }): Promise<boolean>;
    request(permission: { permissions: string[]; origins: string[] }): Promise<boolean>;
  };
}

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
  api: RequestDiagnosticsClientApi = browser as unknown as RequestDiagnosticsClientApi,
): Promise<RequestDiagnosticsCommandResponse> {
  const response = await api.runtime.sendMessage({
    channel: REQUEST_DIAGNOSTICS_MESSAGE_CHANNEL,
    ...command,
  });
  if (!isResponse(response)) {
    return { ok: false, message: 'request diagnostics runtime returned an invalid response' };
  }
  return response;
}

export async function hasRequestDiagnosticsPermission(
  api: RequestDiagnosticsClientApi = browser as unknown as RequestDiagnosticsClientApi,
): Promise<boolean> {
  return api.permissions.contains(REQUEST_DIAGNOSTICS_PERMISSION);
}

export async function requestRequestDiagnosticsPermission(
  api: RequestDiagnosticsClientApi = browser as unknown as RequestDiagnosticsClientApi,
): Promise<boolean> {
  return api.permissions.request(REQUEST_DIAGNOSTICS_PERMISSION);
}
