from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:200]!r}')
    path.write_text(text.replace(old, new, 1))


def insert_before(path: Path, anchor: str, addition: str) -> None:
    text = path.read_text()
    count = text.count(anchor)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {anchor[:200]!r}')
    path.write_text(text.replace(anchor, addition + anchor, 1))


ui = ROOT / 'apps/extension/src/lib/ui-messages.ts'
replace_once(
    ui,
    "import { currentAppLocale, type AppLocale } from './i18n';",
    "import type { ProfileWorkflowSourceUpdateErrorCode } from '@zeroomega-nex/profile-workflow';\n\n"
    "import { currentAppLocale, type AppLocale } from './i18n';",
)
error_params = """export interface SourceUpdateFailureMessageParameters {
  readonly timestamp: string;
  readonly code: ProfileWorkflowSourceUpdateErrorCode;
  readonly httpStatus?: number;
  readonly limitBytes?: number;
}

"""
insert_before(ui, 'export interface UiMessageParameters {\n', error_params)
replace_once(
    ui,
    "  readonly 'pac.updateFailed': { readonly timestamp: string };",
    "  readonly 'pac.updateFailed': SourceUpdateFailureMessageParameters;",
)
replace_once(
    ui,
    "  readonly 'ruleList.updateFailed': { readonly timestamp: string };",
    "  readonly 'ruleList.updateFailed': SourceUpdateFailureMessageParameters;",
)
helper = """function sourceUpdateFailureDetail(
  params: SourceUpdateFailureMessageParameters,
  locale: AppLocale,
): string {
  const { code, httpStatus, limitBytes } = params;
  const messages: Readonly<Record<ProfileWorkflowSourceUpdateErrorCode, LocalizedText>> = {
    'url-invalid': {
      en: 'The download URL is invalid.',
      'zh-CN': '下载网址无效。',
      'zh-TW': '下載網址無效。',
    },
    'url-scheme-unsupported': {
      en: 'Only HTTP and HTTPS downloads are supported.',
      'zh-CN': '仅支持 HTTP 和 HTTPS 下载。',
      'zh-TW': '僅支援 HTTP 與 HTTPS 下載。',
    },
    'url-credentials-forbidden': {
      en: 'The download URL cannot contain a username or password.',
      'zh-CN': '下载网址不能包含用户名或密码。',
      'zh-TW': '下載網址不可包含使用者名稱或密碼。',
    },
    'header-name-required': {
      en: 'A request-header name is required.',
      'zh-CN': '请求头名称不能为空。',
      'zh-TW': '請求標頭名稱不可留空。',
    },
    'header-name-invalid': {
      en: 'A request-header name is invalid.',
      'zh-CN': '请求头名称无效。',
      'zh-TW': '請求標頭名稱無效。',
    },
    'header-browser-controlled': {
      en: 'A request header is controlled by the browser.',
      'zh-CN': '该请求头由浏览器控制。',
      'zh-TW': '該請求標頭由瀏覽器控制。',
    },
    'header-duplicate': {
      en: 'A request-header name is duplicated.',
      'zh-CN': '请求头名称重复。',
      'zh-TW': '請求標頭名稱重複。',
    },
    'header-secret-unavailable': {
      en: 'A required secret request-header value is unavailable.',
      'zh-CN': '请求头所需的秘密值不可用。',
      'zh-TW': '請求標頭所需的秘密值不可用。',
    },
    'request-timeout': {
      en: 'The download request timed out.',
      'zh-CN': '下载请求超时。',
      'zh-TW': '下載請求逾時。',
    },
    'request-network-failed': {
      en: 'The download request failed before a response was received.',
      'zh-CN': '建立下载请求失败。',
      'zh-TW': '建立下載請求失敗。',
    },
    'response-http-error': {
      en: 'The server returned an HTTP error.',
      'zh-CN': '服务器返回 HTTP 错误。',
      'zh-TW': '伺服器傳回 HTTP 錯誤。',
    },
    'response-too-large': {
      en: 'The downloaded content exceeded the size limit.',
      'zh-CN': '下载内容超过大小上限。',
      'zh-TW': '下載內容超過大小上限。',
    },
    'response-empty': {
      en: 'The downloaded content was empty.',
      'zh-CN': '下载内容为空。',
      'zh-TW': '下載內容為空。',
    },
    'response-byte-count-invalid': {
      en: 'The downloader returned an invalid content size.',
      'zh-CN': '下载器返回了无效的内容大小。',
      'zh-TW': '下載器傳回了無效的內容大小。',
    },
    'unknown-failure': {
      en: 'The download failed for an unclassified reason.',
      'zh-CN': '下载失败，原因未分类。',
      'zh-TW': '下載失敗，原因未分類。',
    },
  };
  const base = messages[code][locale];
  if (code === 'response-http-error' && httpStatus !== undefined) {
    return locale === 'en'
      ? `${base.slice(0, -1)} (${httpStatus}).`
      : locale === 'zh-CN'
        ? `服务器返回 HTTP 错误（${httpStatus}）。`
        : `伺服器傳回 HTTP 錯誤（${httpStatus}）。`;
  }
  if (code === 'response-too-large' && limitBytes !== undefined) {
    return locale === 'en'
      ? `${base.slice(0, -1)} (${limitBytes} bytes).`
      : locale === 'zh-CN'
        ? `下载内容超过大小上限（${limitBytes} 字节）。`
        : `下載內容超過大小上限（${limitBytes} 位元組）。`;
  }
  return base;
}

"""
insert_before(ui, 'export function uiMessage<K extends UiMessageKey>(\n', helper)
replace_once(
    ui,
    """    case 'ruleList.updateFailed': {
      const { timestamp } = params as UiMessageParameters['ruleList.updateFailed'];
      if (locale === 'zh-CN') return `上次更新于 ${timestamp} 失败；已保留现有缓存内容。`;
      if (locale === 'zh-TW') return `上次更新於 ${timestamp} 失敗；已保留現有快取內容。`;
      return `Last update failed ${timestamp}. Existing cached content was preserved.`;
    }
""",
    """    case 'ruleList.updateFailed': {
      const failure = params as UiMessageParameters['ruleList.updateFailed'];
      const detail = sourceUpdateFailureDetail(failure, locale);
      if (locale === 'zh-CN') {
        return `上次更新于 ${failure.timestamp} 失败：${detail} 已保留现有缓存内容。`;
      }
      if (locale === 'zh-TW') {
        return `上次更新於 ${failure.timestamp} 失敗：${detail} 已保留現有快取內容。`;
      }
      return `Last update failed ${failure.timestamp}: ${detail} Existing cached content was preserved.`;
    }
""",
)
replace_once(
    ui,
    """    case 'pac.updateFailed': {
      const { timestamp } = params as UiMessageParameters['pac.updateFailed'];
      if (locale === 'zh-CN') return `上次更新于 ${timestamp} 失败；已保留现有缓存脚本。`;
      if (locale === 'zh-TW') return `上次更新於 ${timestamp} 失敗；已保留現有快取指令碼。`;
      return `Last update failed ${timestamp}. Existing cached script was preserved.`;
    }
""",
    """    case 'pac.updateFailed': {
      const failure = params as UiMessageParameters['pac.updateFailed'];
      const detail = sourceUpdateFailureDetail(failure, locale);
      if (locale === 'zh-CN') {
        return `上次更新于 ${failure.timestamp} 失败：${detail} 已保留现有缓存脚本。`;
      }
      if (locale === 'zh-TW') {
        return `上次更新於 ${failure.timestamp} 失敗：${detail} 已保留現有快取指令碼。`;
      }
      return `Last update failed ${failure.timestamp}: ${detail} Existing cached script was preserved.`;
    }
""",
)

for component in [
    ROOT / 'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',
    ROOT / 'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
    ROOT / 'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
]:
    text = component.read_text()
    old = "{ timestamp: formatTimestamp(view.lastError.occurredAt) }"
    new = """{
          timestamp: formatTimestamp(view.lastError.occurredAt),
          code: view.lastError.code,
          ...(view.lastError.httpStatus === undefined
            ? {}
            : { httpStatus: view.lastError.httpStatus }),
          ...(view.lastError.limitBytes === undefined
            ? {}
            : { limitBytes: view.lastError.limitBytes }),
        }"""
    if text.count(old) != 1:
        raise SystemExit(f'{component}: expected one update failure summary, found {text.count(old)}')
    component.write_text(text.replace(old, new, 1))

# Downloader tests now assert stable typed errors rather than English exception strings.
downloader_test = ROOT / 'apps/extension/src/lib/rule-source-downloader.test.ts'
replace_once(
    downloader_test,
    "import { BrowserRuleSourceDownloader } from './rule-source-downloader';",
    "import { ProfileWorkflowSourceUpdateError } from '@zeroomega-nex/profile-workflow';\n\n"
    "import { BrowserRuleSourceDownloader } from './rule-source-downloader';",
)
replace_once(
    downloader_test,
    ").rejects.toThrow('exceeds 5 bytes');",
    ").rejects.toMatchObject({ code: 'response-too-large', limitBytes: 5 });",
)
replace_once(
    downloader_test,
    ").rejects.toThrow('HTTP 503 Offline');",
    ").rejects.toMatchObject({ code: 'response-http-error', httpStatus: 503 });",
)
insert_before(
    downloader_test,
    "});\n",
    """
  it('distinguishes timeout from a generic network failure without retaining raw error text', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('secret transport text')));
          }),
      ),
    );
    const pending = new BrowserRuleSourceDownloader().download({
      url: 'https://rules.example.invalid/list',
      headers: {},
      timeoutMs: 10,
      maxBytes: 100,
    });
    await vi.advanceTimersByTimeAsync(10);
    await expect(pending).rejects.toMatchObject({ code: 'request-timeout' });
    await pending.catch((error) => {
      expect(error).toBeInstanceOf(ProfileWorkflowSourceUpdateError);
      expect(String(error.message)).not.toContain('secret transport text');
    });
    vi.useRealTimers();
  });
""",
)

# Rule Source tests cover typed persistence, cache preservation, and secret-safe fallback.
rule_test = ROOT / 'packages/profile-workflow/src/rule-source-update.test.ts'
replace_once(
    rule_test,
    "import type { ProfileWorkflowRuleSourceDownloader } from './rule-source-update.js';",
    "import { ProfileWorkflowSourceUpdateError } from './source-update-error.js';\n"
    "import type { ProfileWorkflowRuleSourceDownloader } from './rule-source-update.js';",
)
replace_once(
    rule_test,
    """      downloader: downloader(async () => {
        throw new Error(`network failed ${'x'.repeat(800)}`);
      }),
""",
    """      downloader: downloader(async () => {
        throw new ProfileWorkflowSourceUpdateError(
          'response-http-error',
          'The source server returned an HTTP error.',
          { httpStatus: 503 },
        );
      }),
""",
)
replace_once(
    rule_test,
    """    expect(result.message.length).toBeLessThanOrEqual(500);
    expect(result.update?.lastError?.message).toBe(result.message);
""",
    """    expect(result.message).toBe('The source server returned an HTTP error.');
    expect(result.update?.lastError).toMatchObject({
      code: 'response-http-error',
      httpStatus: 503,
      message: 'The source server returned an HTTP error.',
    });
""",
)
replace_once(
    rule_test,
    """    expect(result.message).toContain('controlled by the browser');
    expect(called).toBe(false);
""",
    """    expect(result.message).toBe('A Rule Source request header is controlled by the browser.');
    expect(result.update?.lastError?.code).toBe('header-browser-controlled');
    expect(JSON.stringify(result.update)).not.toContain('private-cookie');
    expect(called).toBe(false);
""",
)
insert_before(
    rule_test,
    "  it('does not overwrite a concurrent edit made while downloading', async () => {\n",
    """  it('maps an unknown downloader exception to a non-secret stable fallback', async () => {
    const initial = sourceState();
    const repository = new MemoryProfileWorkflowRepository(initial);
    const secrets = new MemorySecretStore();
    secrets.values.set('secret-rule-auth', 'Bearer secret-value');
    const result = await updateProfileWorkflowRuleSource(repository, initial, 'source-rules', {
      secretStore: secrets,
      downloader: downloader(async () => {
        throw new Error('socket failed for https://private.invalid/?token=secret');
      }),
    });
    expect(result.status).toBe('failed');
    expect(result.update?.lastError).toMatchObject({
      code: 'unknown-failure',
      message: 'Rule List download failed.',
    });
    expect(JSON.stringify(result)).not.toContain('private.invalid');
    expect(JSON.stringify(result)).not.toContain('token=secret');
  });

""",
)

# Add PAC-specific cache-preservation coverage.
pac_test = ROOT / 'packages/profile-workflow/src/pac-source-update.test.ts'
pac_test.write_text("""import { describe, expect, it } from 'vitest';

import { createProfileWorkflowState } from './state.js';
import { MemoryProfileWorkflowRepository } from './memory-repository.js';
import { updateProfileWorkflowPacSource } from './pac-source-update.js';
import { workflowFixture } from './test-fixture.js';

class EmptySecretStore {
  async getSecret(): Promise<string | undefined> {
    return undefined;
  }
  async putSecret(): Promise<void> {}
  async removeSecret(): Promise<void> {}
}

function pacState() {
  const spec = workflowFixture();
  spec.profiles.push({
    id: 'pac-remote',
    name: 'Remote PAC',
    kind: 'pac',
    source: {
      kind: 'url',
      url: 'https://pac.example.invalid/proxy.pac',
      script: "function FindProxyForURL() { return 'DIRECT'; }",
    },
  });
  return createProfileWorkflowState(spec);
}

describe('PAC background update service', () => {
  it('records a stable empty-response code and preserves the existing cached script', async () => {
    const initial = pacState();
    const repository = new MemoryProfileWorkflowRepository(initial);
    const result = await updateProfileWorkflowPacSource(repository, initial, 'pac-remote', {
      secretStore: new EmptySecretStore(),
      now: () => '2026-07-29T04:00:00.000Z',
      downloader: { download: async () => ({ content: '   ', bytes: 3 }) },
    });
    expect(result.status).toBe('failed');
    expect(result.update?.lastError).toMatchObject({
      code: 'response-empty',
      message: 'The PAC response was empty.',
    });
    const profile = result.state?.draft.profiles.find((candidate) => candidate.id === 'pac-remote');
    expect(profile?.kind === 'pac' ? profile.source.script : undefined).toContain('DIRECT');
  });
});
""")

# Storage parser accepts legacy errors and validates new details.
storage_test = ROOT / 'packages/profile-workflow/src/storage-repository.test.ts'
insert_before(
    storage_test,
    "  it('isolates versioned namespaces', async () => {\n",
    """  it('normalizes legacy update errors and round-trips stable typed details', () => {
    const initial = createProfileWorkflowState(workflowFixture());
    const legacy = parseProfileWorkflowState({
      ...initial,
      ruleSourceUpdates: {
        source: {
          sourceId: 'source',
          url: 'https://rules.example.invalid/list',
          lastAttemptAt: '2026-07-29T04:00:00.000Z',
          lastError: {
            occurredAt: '2026-07-29T04:00:00.000Z',
            message: 'legacy failure',
          },
        },
      },
    });
    expect(legacy.ruleSourceUpdates?.source?.lastError?.code).toBe('unknown-failure');

    const typed = parseProfileWorkflowState({
      ...initial,
      ruleSourceUpdates: {
        source: {
          sourceId: 'source',
          url: 'https://rules.example.invalid/list',
          lastAttemptAt: '2026-07-29T04:00:00.000Z',
          lastError: {
            occurredAt: '2026-07-29T04:00:00.000Z',
            code: 'response-http-error',
            message: 'The source server returned an HTTP error.',
            httpStatus: 503,
          },
        },
      },
    });
    expect(typed.ruleSourceUpdates?.source?.lastError).toMatchObject({
      code: 'response-http-error',
      httpStatus: 503,
    });
  });

""",
)

ui_test = ROOT / 'apps/extension/src/lib/ui-messages.test.ts'
insert_before(
    ui_test,
    "  it('formats source-backed PAC text and dynamic status in all three locales', () => {\n",
    """  it('localizes stable source-update failure codes without backend prose', () => {
    expect(
      uiMessage(
        'ruleList.updateFailed',
        {
          timestamp: '2026/7/29 12:00',
          code: 'response-http-error',
          httpStatus: 503,
        },
        'zh-CN',
      ),
    ).toContain('服务器返回 HTTP 错误（503）');
    expect(
      uiMessage(
        'pac.updateFailed',
        {
          timestamp: '2026/7/29 12:00',
          code: 'response-too-large',
          limitBytes: 4096,
        },
        'zh-TW',
      ),
    ).toContain('下載內容超過大小上限（4096 位元組）');
  });

""",
)

print('Patched source-update UI localization and unit/storage/downloader tests.')
