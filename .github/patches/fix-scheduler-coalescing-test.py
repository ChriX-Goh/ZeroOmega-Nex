from pathlib import Path

path = Path('apps/extension/src/lib/rule-source-scheduler.test.ts')
source = path.read_text()
old = '''    const second = scheduler.scanNow();
    api.fire(RULE_SOURCE_UPDATE_ALARM_NAME);
    expect(calls).toBe(1);
    release?.();
'''
new = '''    const second = scheduler.scanNow();
    api.fire(RULE_SOURCE_UPDATE_ALARM_NAME);
    for (let attempt = 0; calls === 0 && attempt < 50; attempt += 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    expect(calls).toBe(1);
    release?.();
'''
if source.count(old) != 1:
    raise SystemExit(f'coalescing test match count: {source.count(old)}')
path.write_text(source.replace(old, new))
