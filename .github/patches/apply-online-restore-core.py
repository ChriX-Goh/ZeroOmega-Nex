from pathlib import Path

# Dedicated bounded online-backup downloader. Raw backup text stays in the Options page and never crosses runtime messaging.
Path('apps/extension/src/lib/online-backup-downloader.ts').write_text(r'''import { DEFAULT_LEGACY_DECODE_LIMITS } from '@zeroomega-nex/legacy-zeroomega';

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
    this.httpStatus = details.httpStatus;
    this.limitBytes = details.limitBytes;
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

async function readBounded(response: Response, maxBytes: number): Promise<{ content: string; bytes: number }> {
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
      throw new OnlineBackupDownloadError('network-failure', 'Online backup could not be downloaded.');
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
''')

Path('apps/extension/src/lib/online-backup-downloader.test.ts').write_text(r'''import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  downloadOnlineBackup,
  OnlineBackupDownloadError,
} from './online-backup-downloader';

afterEach(() => {
  vi.useRealTimers();
});

describe('online backup downloader', () => {
  it('requests only the normalized origin and downloads isolated bounded text', async () => {
    const permissions: string[] = [];
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(init).toMatchObject({
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
      });
      return new Response('{"schemaVersion":2}', { status: 200 });
    });
    await expect(
      downloadOnlineBackup('https://backup.example/path/options.bak', {
        requestPermission: async (url) => {
          permissions.push(url);
          return true;
        },
        fetcher,
      }),
    ).resolves.toMatchObject({
      url: 'https://backup.example/path/options.bak',
      content: '{"schemaVersion":2}',
      bytes: 19,
    });
    expect(permissions).toEqual(['https://backup.example/path/options.bak']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('fails closed on invalid protocols or denied permission without fetching', async () => {
    const fetcher = vi.fn();
    await expect(
      downloadOnlineBackup('file:///tmp/options.bak', {
        requestPermission: async () => true,
        fetcher,
      }),
    ).rejects.toMatchObject({ code: 'unsupported-protocol' });
    await expect(
      downloadOnlineBackup('https://backup.example/options.bak', {
        requestPermission: async () => false,
        fetcher,
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('classifies HTTP, size, empty, timeout, and raw network failures without leaking bodies or exceptions', async () => {
    await expect(
      downloadOnlineBackup('https://backup.example/http', {
        requestPermission: async () => true,
        fetcher: async () => new Response('private response body', { status: 503 }),
      }),
    ).rejects.toMatchObject({ code: 'response-http-error', httpStatus: 503 });
    await expect(
      downloadOnlineBackup('https://backup.example/large', {
        requestPermission: async () => true,
        maxBytes: 4,
        fetcher: async () => new Response('12345', { headers: { 'content-length': '5' } }),
      }),
    ).rejects.toMatchObject({ code: 'response-too-large', limitBytes: 4 });
    await expect(
      downloadOnlineBackup('https://backup.example/empty', {
        requestPermission: async () => true,
        fetcher: async () => new Response('  '),
      }),
    ).rejects.toMatchObject({ code: 'response-empty' });

    vi.useFakeTimers();
    const timeout = downloadOnlineBackup('https://backup.example/timeout', {
      requestPermission: async () => true,
      timeoutMs: 10,
      fetcher: async (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('secret transport text')));
        }),
    });
    const handled = timeout.catch((error) => error);
    await vi.advanceTimersByTimeAsync(10);
    const timeoutError = await handled;
    expect(timeoutError).toMatchObject({ code: 'request-timeout' });
    expect(String(timeoutError.message)).not.toContain('secret transport text');
    vi.useRealTimers();

    const networkError = await downloadOnlineBackup('https://backup.example/network', {
      requestPermission: async () => true,
      fetcher: async () => {
        throw new Error('socket failed token=secret');
      },
    }).catch((error) => error);
    expect(networkError).toBeInstanceOf(OnlineBackupDownloadError);
    expect(networkError).toMatchObject({ code: 'network-failure' });
    expect(JSON.stringify(networkError)).not.toContain('token=secret');
  });
});
''')

# Typed messages for online restore and stable errors.
ui = Path('apps/extension/src/lib/ui-messages.ts')
text = ui.read_text()
anchor = "  'legacy.encoding.json': { en: 'JSON', 'zh-CN': 'JSON', 'zh-TW': 'JSON' },\n"
entries = """  'legacy.onlineTitle': {
    en: 'Restore from online',
    'zh-CN': '从在线地址恢复',
    'zh-TW': '從線上位址還原',
  },
  'legacy.onlineHelp': {
    en: 'Download a backup for local compatibility review. Downloading never imports, activates, or changes the current configuration.',
    'zh-CN': '下载备份并在本地进行兼容性检查。下载本身不会导入、启用或更改当前配置。',
    'zh-TW': '下載備份並在本機進行相容性檢查。下載本身不會匯入、啟用或變更目前設定。',
  },
  'legacy.onlineUrl': { en: 'Online backup URL', 'zh-CN': '在线备份网址', 'zh-TW': '線上備份網址' },
  'legacy.onlineRestore': { en: 'Restore', 'zh-CN': '恢复', 'zh-TW': '還原' },
  'legacy.onlineDownloading': { en: 'Downloading…', 'zh-CN': '正在下载…', 'zh-TW': '正在下載…' },
  'legacy.onlineDownloaded': {
    en: 'Backup downloaded. Review compatibility before importing.',
    'zh-CN': '备份已下载。请先检查兼容性，再决定是否导入。',
    'zh-TW': '備份已下載。請先檢查相容性，再決定是否匯入。',
  },
  'legacy.onlineError.invalidUrl': {
    en: 'Enter a valid absolute backup URL.',
    'zh-CN': '请输入有效的绝对备份网址。',
    'zh-TW': '請輸入有效的絕對備份網址。',
  },
  'legacy.onlineError.unsupportedProtocol': {
    en: 'Online restore supports only HTTP and HTTPS URLs.',
    'zh-CN': '在线恢复只支持 HTTP 和 HTTPS 网址。',
    'zh-TW': '線上還原只支援 HTTP 與 HTTPS 網址。',
  },
  'legacy.onlineError.embeddedCredentials': {
    en: 'Remove the embedded username or password from the backup URL.',
    'zh-CN': '请移除备份网址中嵌入的用户名或密码。',
    'zh-TW': '請移除備份網址中嵌入的使用者名稱或密碼。',
  },
  'legacy.onlineError.permissionDenied': {
    en: 'Access to this backup origin was not granted.',
    'zh-CN': '未授予对此备份来源网站的访问权限。',
    'zh-TW': '未授予對此備份來源網站的存取權限。',
  },
  'legacy.onlineError.timeout': {
    en: 'The online backup download timed out.',
    'zh-CN': '在线备份下载超时。',
    'zh-TW': '線上備份下載逾時。',
  },
  'legacy.onlineError.network': {
    en: 'The online backup could not be downloaded.',
    'zh-CN': '无法下载在线备份。',
    'zh-TW': '無法下載線上備份。',
  },
  'legacy.onlineError.empty': {
    en: 'The downloaded backup is empty.',
    'zh-CN': '下载的备份为空。',
    'zh-TW': '下載的備份是空的。',
  },
"""
if text.count(anchor) != 1:
    raise SystemExit('legacy message insertion anchor mismatch')
text = text.replace(anchor, entries + anchor)
param_anchor = "  readonly 'legacy.technicalDetails': { readonly count: number };\n"
params = """  readonly 'legacy.onlineHttpError': { readonly status: number };
  readonly 'legacy.onlineTooLarge': { readonly limitBytes: number };
"""
if text.count(param_anchor) != 1:
    raise SystemExit('legacy message parameter anchor mismatch')
text = text.replace(param_anchor, param_anchor + params)
switch_anchor = "    case 'legacy.compatibilityWarnings': {\n"
switches = """    case 'legacy.onlineHttpError': {
      const { status } = params as UiMessageParameters['legacy.onlineHttpError'];
      if (locale === 'zh-CN') return `备份服务器返回 HTTP ${status}。`;
      if (locale === 'zh-TW') return `備份伺服器傳回 HTTP ${status}。`;
      return `The backup server returned HTTP ${status}.`;
    }
    case 'legacy.onlineTooLarge': {
      const { limitBytes } = params as UiMessageParameters['legacy.onlineTooLarge'];
      if (locale === 'zh-CN') return `在线备份超过 ${limitBytes} 字节的大小上限。`;
      if (locale === 'zh-TW') return `線上備份超過 ${limitBytes} 位元組的大小上限。`;
      return `The online backup exceeds the ${limitBytes}-byte size limit.`;
    }
"""
if text.count(switch_anchor) != 1:
    raise SystemExit('legacy dynamic switch anchor mismatch')
ui.write_text(text.replace(switch_anchor, switches + switch_anchor))

# Legacy Import Panel online-review-first flow.
panel = Path('apps/extension/src/entrypoints/options/LegacyImportPanel.svelte')
text = panel.read_text()
text = text.replace(
    """  import type { ProfileWorkflowSecretMaterial } from '@zeroomega-nex/profile-workflow';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
""",
    """  import type { ProfileWorkflowSecretMaterial } from '@zeroomega-nex/profile-workflow';

  import { currentAppLocale, type AppLocale } from '../../lib/i18n';
  import {
    downloadOnlineBackup,
    OnlineBackupDownloadError,
    type OnlineBackupDownloadErrorCode,
  } from '../../lib/online-backup-downloader';
""",
)
text = text.replace(
    """  let backupText = '';
  let selectedFileName = '';
""",
    """  let backupText = '';
  let onlineUrl = '';
  let selectedFileName = '';
""",
)
text = text.replace(
    """  let analyzing = false;
  let accepting = false;
""",
    """  let analyzing = false;
  let downloadingOnline = false;
  let accepting = false;
""",
)
text = text.replace(
    """  let acceptedMessage = '';
  let exportedMessage = '';
""",
    """  let acceptedMessage = '';
  let onlineMessage = '';
  let exportedMessage = '';
""",
)
text = text.replace(
    """  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLTextAreaElement).value;
  }
""",
    """  function valueFrom(event: Event): string {
    return (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
  }

  function onlineErrorText(error: unknown): string {
    if (!(error instanceof OnlineBackupDownloadError)) {
      return uiText('legacy.onlineError.network', locale);
    }
    if (error.code === 'response-http-error') {
      return uiMessage('legacy.onlineHttpError', { status: error.httpStatus ?? 0 }, locale);
    }
    if (error.code === 'response-too-large') {
      return uiMessage('legacy.onlineTooLarge', { limitBytes: error.limitBytes ?? 0 }, locale);
    }
    const keys: Record<Exclude<OnlineBackupDownloadErrorCode, 'response-http-error' | 'response-too-large'>, UiTextKey> = {
      'invalid-url': 'legacy.onlineError.invalidUrl',
      'unsupported-protocol': 'legacy.onlineError.unsupportedProtocol',
      'embedded-credentials': 'legacy.onlineError.embeddedCredentials',
      'permission-denied': 'legacy.onlineError.permissionDenied',
      'request-timeout': 'legacy.onlineError.timeout',
      'network-failure': 'legacy.onlineError.network',
      'response-empty': 'legacy.onlineError.empty',
    };
    return uiText(keys[error.code], locale);
  }
""",
)
function_anchor = """  async function chooseFile(event: Event): Promise<void> {
"""
function_text = """  async function restoreOnline(): Promise<void> {
    if (downloadingOnline || disabled || !onlineUrl.trim()) return;
    downloadingOnline = true;
    onlineMessage = '';
    acceptedMessage = '';
    errorMessage = '';
    try {
      const downloaded = await downloadOnlineBackup(onlineUrl);
      backupText = downloaded.content;
      selectedFileName = '';
      result = undefined;
      analyzedGeneration = undefined;
      await analyze();
      onlineMessage = uiText('legacy.onlineDownloaded', locale);
    } catch (error) {
      errorMessage = onlineErrorText(error);
    } finally {
      downloadingOnline = false;
    }
  }

"""
if text.count(function_anchor) != 1:
    raise SystemExit('online restore function anchor mismatch')
text = text.replace(function_anchor, function_text + function_anchor)
ui_anchor = """  <h2>{uiText('legacy.restoreTitle', locale)}</h2>
  <p class="section-help">{uiText('legacy.restoreHelp', locale)}</p>
  <label class="file-picker">
"""
ui_markup = """  <h2>{uiText('legacy.restoreTitle', locale)}</h2>
  <p class="section-help">{uiText('legacy.restoreHelp', locale)}</p>
  <div class="online-restore" data-legacy-online-restore>
    <h3>{uiText('legacy.onlineTitle', locale)}</h3>
    <div class="inline-fields">
      <label>
        {uiText('legacy.onlineUrl', locale)}
        <input
          type="url"
          data-legacy-online-url
          aria-label={uiText('legacy.onlineUrl', locale)}
          placeholder="https://example.com/options.bak"
          value={onlineUrl}
          disabled={disabled || downloadingOnline || analyzing || accepting}
          oninput={(event) => {
            onlineUrl = valueFrom(event);
            onlineMessage = '';
            errorMessage = '';
          }}
        />
      </label>
      <button
        type="button"
        data-legacy-online-download
        disabled={disabled || downloadingOnline || analyzing || accepting || !onlineUrl.trim()}
        onclick={() => void restoreOnline()}
        >{uiText(
          downloadingOnline ? 'legacy.onlineDownloading' : 'legacy.onlineRestore',
          locale,
        )}</button
      >
    </div>
    <p class="section-help">{uiText('legacy.onlineHelp', locale)}</p>
    {#if onlineMessage}<p role="status" data-legacy-online-status>{onlineMessage}</p>{/if}
  </div>
  <label class="file-picker">
"""
if text.count(ui_anchor) != 1:
    raise SystemExit('online restore UI anchor mismatch')
text = text.replace(ui_anchor, ui_markup)
text = text.replace('disabled={disabled || analyzing || accepting}', 'disabled={disabled || downloadingOnline || analyzing || accepting}')
panel.write_text(text)

# Component rendering evidence.
component_test = Path('apps/extension/src/component-rendering.component.spec.ts')
text = component_test.read_text()
text = text.replace(
    """    expect(body).toContain('aria-label="Legacy backup file"');
    expect(body).toContain('Paste backup text instead');
""",
    """    expect(body).toContain('aria-label="Online backup URL"');
    expect(body).toContain('data-legacy-online-download');
    expect(body).toContain('aria-label="Legacy backup file"');
    expect(body).toContain('Paste backup text instead');
""",
)
text = text.replace(
    """    expect(simplified).toContain('aria-label="原版备份文件"');
    expect(simplified).toContain('改为粘贴备份文本');
""",
    """    expect(simplified).toContain('aria-label="在线备份网址"');
    expect(simplified).toContain('从在线地址恢复');
    expect(simplified).toContain('aria-label="原版备份文件"');
    expect(simplified).toContain('改为粘贴备份文本');
""",
)
text = text.replace(
    """    expect(traditional).toContain('aria-label="原版備份檔案"');
    expect(traditional).toContain('改為貼上備份文字');
""",
    """    expect(traditional).toContain('aria-label="線上備份網址"');
    expect(traditional).toContain('從線上位址還原');
    expect(traditional).toContain('aria-label="原版備份檔案"');
    expect(traditional).toContain('改為貼上備份文字');
""",
)
component_test.write_text(text)
