import { browser } from 'wxt/browser';

export const INSPECT_MESSAGE_CHANNEL = 'zeroomega-nex/inspect/v1' as const;

export interface InspectTargetView {
  readonly tabId: number;
  readonly url?: string;
  readonly inspectedAt?: string;
}

export interface InspectCommand {
  readonly channel: typeof INSPECT_MESSAGE_CHANNEL;
  readonly action: 'get';
  readonly tabId: number;
}

export type InspectCommandResponse =
  | { readonly ok: true; readonly view: InspectTargetView }
  | { readonly ok: false; readonly message: string };

export function isInspectCommand(value: unknown): value is InspectCommand {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    record.channel === INSPECT_MESSAGE_CHANNEL &&
    record.action === 'get' &&
    Number.isInteger(record.tabId) &&
    Number(record.tabId) >= 0
  );
}

function isResponse(value: unknown): value is InspectCommandResponse {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.ok === false) return typeof record.message === 'string';
  if (record.ok !== true || record.view === null || typeof record.view !== 'object') return false;
  const view = record.view as Record<string, unknown>;
  return (
    Number.isInteger(view.tabId) &&
    Number(view.tabId) >= 0 &&
    (view.url === undefined || typeof view.url === 'string') &&
    (view.inspectedAt === undefined || typeof view.inspectedAt === 'string')
  );
}

export async function sendInspectCommand(tabId: number): Promise<InspectCommandResponse> {
  const response = await browser.runtime.sendMessage({
    channel: INSPECT_MESSAGE_CHANNEL,
    action: 'get',
    tabId,
  } satisfies InspectCommand);
  if (!isResponse(response)) {
    return { ok: false, message: 'inspect runtime returned an invalid response' };
  }
  return response;
}
