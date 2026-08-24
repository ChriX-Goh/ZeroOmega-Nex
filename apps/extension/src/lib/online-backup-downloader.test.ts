import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadOnlineBackup, OnlineBackupDownloadError } from './online-backup-downloader';

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
