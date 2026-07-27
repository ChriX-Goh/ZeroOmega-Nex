import type { ProxyOwnershipView as BrowserProxyOwnershipView } from '@zeroomega-nex/browser-adapters';
export type { ProxyOwnershipBlockReason } from '@zeroomega-nex/browser-adapters';

export interface ExternalProfilePreview {
  readonly kind: 'fixed' | 'pac';
  readonly suggestedName: string;
}

export interface ProxyOwnershipView extends BrowserProxyOwnershipView {
  readonly externalProfile?: ExternalProfilePreview;
}
import { browser } from 'wxt/browser';

export const PROXY_OWNERSHIP_MESSAGE_CHANNEL = 'zeroomega-nex/proxy-ownership/v1' as const;

export interface ProxyOwnershipCommand {
  readonly channel: typeof PROXY_OWNERSHIP_MESSAGE_CHANNEL;
  readonly action: 'get';
}

export type ProxyOwnershipCommandResponse =
  | { readonly ok: true; readonly view: ProxyOwnershipView }
  | { readonly ok: false; readonly message: string };

export function isProxyOwnershipCommand(value: unknown): value is ProxyOwnershipCommand {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.channel === PROXY_OWNERSHIP_MESSAGE_CHANNEL && record.action === 'get';
}

function isResponse(value: unknown): value is ProxyOwnershipCommandResponse {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.ok === false) return typeof record.message === 'string';
  if (record.ok !== true || record.view === null || typeof record.view !== 'object') return false;
  const view = record.view as Record<string, unknown>;
  return (
    (view.family === 'chromium' || view.family === 'firefox') &&
    typeof view.blocked === 'boolean' &&
    typeof view.controlLevel === 'string' &&
    (view.externalProfile === undefined ||
      (view.externalProfile !== null &&
        typeof view.externalProfile === 'object' &&
        ((view.externalProfile as Record<string, unknown>).kind === 'fixed' ||
          (view.externalProfile as Record<string, unknown>).kind === 'pac') &&
        typeof (view.externalProfile as Record<string, unknown>).suggestedName === 'string'))
  );
}

export async function sendProxyOwnershipCommand(): Promise<ProxyOwnershipCommandResponse> {
  const response = await browser.runtime.sendMessage({
    channel: PROXY_OWNERSHIP_MESSAGE_CHANNEL,
    action: 'get',
  } satisfies ProxyOwnershipCommand);
  if (!isResponse(response)) {
    return { ok: false, message: 'proxy ownership runtime returned an invalid response' };
  }
  return response;
}
