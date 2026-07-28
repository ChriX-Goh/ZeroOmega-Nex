from pathlib import Path

path = Path('scripts/validate-parity-docs.mjs')
text = path.read_text()
old = '''for (const [status, count] of Object.entries(statusCounts)) {
  if (count === 0) failures.push(`UI audit has no ${status} rows`);
}
'''
new = '''for (const status of ['DONE', 'PARTIAL', 'MISSING', 'UNVERIFIED']) {
  if (statusCounts[status] === 0) failures.push(`UI audit has no ${status} rows`);
}

const openCount =
  statusCounts.PARTIAL + statusCounts.MISSING + statusCounts.BROKEN + statusCounts.UNVERIFIED;
if (openCount === 0) failures.push('UI audit has no open rows while PR #11 remains Draft');
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one parity status-count guard, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
