from pathlib import Path

path = Path('scripts/validate-parity-docs.mjs')
text = path.read_text()
old = "for (const [status, count] of Object.entries(statusCounts)) {\n  if (count === 0) failures.push(`UI audit has no ${status} rows`);\n}\n"
new = "for (const status of ['DONE', 'PARTIAL', 'MISSING', 'UNVERIFIED']) {\n  if (statusCounts[status] === 0) failures.push(`UI audit has no ${status} rows`);\n}\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one parity status-count loop, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
