from pathlib import Path

path = Path('.github/patches/apply-source-update-error-ui-tests.py')
text = path.read_text()
old = """    const pending = new BrowserRuleSourceDownloader().download({
      url: 'https://rules.example.invalid/list',
      headers: {},
      timeoutMs: 10,
      maxBytes: 100,
    });
    await vi.advanceTimersByTimeAsync(10);
    const error = await pending.catch((candidate) => candidate);
"""
new = """    const observed = new BrowserRuleSourceDownloader()
      .download({
        url: 'https://rules.example.invalid/list',
        headers: {},
        timeoutMs: 10,
        maxBytes: 100,
      })
      .catch((candidate) => candidate);
    await vi.advanceTimersByTimeAsync(10);
    const error = await observed;
"""
count = text.count(old)
if count != 1:
    raise SystemExit(f'{path}: expected one timeout test sequence, found {count}')
path.write_text(text.replace(old, new, 1))
print('Attached the timeout rejection handler before advancing fake timers.')
