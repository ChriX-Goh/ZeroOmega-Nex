from pathlib import Path

path = Path('.github/patches/apply-source-update-error-ui-tests.py')
text = path.read_text()
old = '''insert_before(
    downloader_test,
    "});\\n",
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
'''
new = '''downloader_test_text = downloader_test.read_text()
downloader_test_addition = """

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
    const error = await pending.catch((candidate) => candidate);
    expect(error).toBeInstanceOf(ProfileWorkflowSourceUpdateError);
    expect(error).toMatchObject({ code: 'request-timeout' });
    expect(String(error.message)).not.toContain('secret transport text');
    vi.useRealTimers();
  });
"""
downloader_test_end = downloader_test_text.rfind('\\n});\\n')
if downloader_test_end < 0:
    raise SystemExit(f'{downloader_test}: final describe closure not found')
downloader_test.write_text(
    downloader_test_text[:downloader_test_end] + downloader_test_addition + downloader_test_text[downloader_test_end:]
)
'''
count = text.count(old)
if count != 1:
    raise SystemExit(f'{path}: expected one ambiguous downloader test insertion, found {count}')
path.write_text(text.replace(old, new, 1))
print('Fixed source-update downloader test insertion and rejection handling.')
