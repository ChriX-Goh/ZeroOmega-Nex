import { DEFAULT_LEGACY_DECODE_LIMITS } from '@zeroomega-nex/legacy-zeroomega';

import { requestRuleSourceOriginPermission } from './profile-workflow-client';

export const ONLINE_BACKUP_DOWNLOAD_TIMEOUT_MS = 10_000;
export const ONLINE_BACKUP_DOWNLOAD_MAX_BYTES = DEFAULT_LEGACY_DECODE_LIMITS.maxInputBytes;

export type OnlineBackupDownloadErrorCode =
  | 'invalid-url'
  | 'unsupported-protocol'
  | 'embedded-credentials'
  | 'permission-denied'
  | 'request-timeout'
  | 'network-failure'
  | 'response-http-error'
  | 'response-too-large'
  | 'response-empty';

export class OnlineBackupDownloadError extends Error {
  readonly code: OnlineBackupDownloadErrorCode;
  readonly httpStatus?: number;
  readonly limitBytes?: number;

  constructor(
    code: OnlineBackupDownloadErrorCode,
    message: string,
    details: { readonly httpStatus?: number; readonly limitBytes?: number } = {},
  ) {
    super(message);
    this.name = 'OnlineBackupDownloadError';
    this.code = code;
    if (details.httpStatus !== undefined) this.httpStatus = details.httpStatus;
    if (details.limitBytes !== undefined) this.limitBytes = details.limitBytes;
  }
}

export interface OnlineBackupDownloadResult {
  readonly url: string;
  readonly content: string;
  readonly bytes: number;
}

export interface OnlineBackupDownloadOptions {
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
  readonly requestPermission?: (url: string) => Promise<boolean>;
  readonly fetcher?: typeof fetch;
}

function validatedUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new OnlineBackupDownloadError('invalid-url', 'Enter a valid absolute backup URL.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new OnlineBackupDownloadError(
      'unsupported-protocol',
      'Online restore supports only HTTP and HTTPS URLs.',
    );
  }
  if (parsed.username || parsed.password) {
    throw new OnlineBackupDownloadError(
      'embedded-credentials',
      'The backup URL must not contain embedded credentials.',
    );
  }
  return parsed.href;
}

function tooLarge(limitBytes: number): OnlineBackupDownloadError {
  return new OnlineBackupDownloadError(
    'response-too-large',
    'The online backup exceeds the configured size limit.',
    { limitBytes },
  );
}

async function readBounded(
  response: Response,
  maxBytes: number,
): Promise<{ content: string; bytes: number }> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) throw tooLarge(maxBytes);
  if (!response.body) {
    const content = await response.text();
    const bytes = new TextEncoder().encode(content).byteLength;
    if (bytes > maxBytes) throw tooLarge(maxBytes);
    return { content, bytes };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let content = '';
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel('Online backup exceeded the configured limit');
        throw tooLarge(maxBytes);
      }
      content += decoder.decode(chunk.value, { stream: true });
    }
    content += decoder.decode();
    return { content, bytes };
  } finally {
    reader.releaseLock();
  }
}

export async function downloadOnlineBackup(
  value: string,
  options: OnlineBackupDownloadOptions = {},
): Promise<OnlineBackupDownloadResult> {
  const url = validatedUrl(value);
  const requestPermission = options.requestPermission ?? requestRuleSourceOriginPermission;
  if (!(await requestPermission(url))) {
    throw new OnlineBackupDownloadError(
      'permission-denied',
      'Access to the selected backup origin was not granted.',
    );
  }

  const timeoutMs = options.timeoutMs ?? ONLINE_BACKUP_DOWNLOAD_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? ONLINE_BACKUP_DOWNLOAD_MAX_BYTES;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      response = await (options.fetcher ?? fetch)(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) {
        throw new OnlineBackupDownloadError('request-timeout', 'Online backup download timed out.');
      }
      throw new OnlineBackupDownloadError(
        'network-failure',
        'Online backup could not be downloaded.',
      );
    }
    if (!response.ok) {
      throw new OnlineBackupDownloadError(
        'response-http-error',
        'The backup server returned an HTTP error.',
        { httpStatus: response.status },
      );
    }
    const downloaded = await readBounded(response, maxBytes);
    if (!downloaded.content.trim()) {
      throw new OnlineBackupDownloadError('response-empty', 'The downloaded backup is empty.');
    }
    return { url, ...downloaded };
  } finally {
    clearTimeout(timer);
  }
}
