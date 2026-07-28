import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProfileWorkflowSourceUpdateError } from '@zeroomega-nex/profile-workflow';

import { BrowserRuleSourceDownloader } from './rule-source-downloader';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BrowserRuleSourceDownloader', () => {
  it('uses an isolated request and returns bounded text', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init).toMatchObject({
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
      });
      expect(new Headers(init?.headers).get('X-Test')).toBe('value');
      return new Response('downloaded rules', { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new BrowserRuleSourceDownloader().download({
        url: 'https://rules.example.invalid/list',
        headers: { 'X-Test': 'value' },
        timeoutMs: 1000,
        maxBytes: 100,
      }),
    ).resolves.toEqual({ content: 'downloaded rules', bytes: 16 });
  });

  it('rejects declared and streamed bodies beyond the configured limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response('123456', { status: 200, headers: { 'content-length': '6' } }),
      ),
    );
    await expect(
      new BrowserRuleSourceDownloader().download({
        url: 'https://rules.example.invalid/list',
        headers: {},
        timeoutMs: 1000,
        maxBytes: 5,
      }),
    ).rejects.toMatchObject({ code: 'response-too-large', limitBytes: 5 });
  });

  it('reports HTTP errors without reading the response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response('private response body', { status: 503, statusText: 'Offline' }),
      ),
    );
    await expect(
      new BrowserRuleSourceDownloader().download({
        url: 'https://rules.example.invalid/list',
        headers: {},
        timeoutMs: 1000,
        maxBytes: 100,
      }),
    ).rejects.toMatchObject({ code: 'response-http-error', httpStatus: 503 });
  });

  it('distinguishes timeout from a generic network failure without retaining raw error text', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new Error('secret transport text')),
            );
          }),
      ),
    );
    const observed = new BrowserRuleSourceDownloader()
      .download({
        url: 'https://rules.example.invalid/list',
        headers: {},
        timeoutMs: 10,
        maxBytes: 100,
      })
      .catch((candidate) => candidate);
    await vi.advanceTimersByTimeAsync(10);
    const error = await observed;
    expect(error).toBeInstanceOf(ProfileWorkflowSourceUpdateError);
    expect(error).toMatchObject({ code: 'request-timeout' });
    expect(String(error.message)).not.toContain('secret transport text');
    vi.useRealTimers();
  });
});
