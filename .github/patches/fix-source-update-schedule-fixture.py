from pathlib import Path

path = Path('packages/profile-workflow/src/rule-source-schedule.test.ts')
text = path.read_text()
old = "lastError: { occurredAt: '2026-07-27T05:30:00.000Z', message: 'offline' },"
new = """lastError: {
            occurredAt: '2026-07-27T05:30:00.000Z',
            code: 'unknown-failure' as const,
            message: 'offline',
          },"""
count = text.count(old)
if count != 1:
    raise SystemExit(f'{path}: expected one legacy schedule fixture, found {count}')
path.write_text(text.replace(old, new, 1))
print('Updated in-memory Rule Source schedule fixture with an explicit stable code.')
