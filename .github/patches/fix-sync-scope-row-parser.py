from pathlib import Path

path = Path('scripts/validate-parity-docs.mjs')
text = path.read_text()
old = """requireAll('remote sync audit rows', audit, [
  '| G-13 | Gist 同步',
  '| NOT_PORTING | DONE | N/A | ADR-016',
  '| G-14 | WebDAV 同步',
  '| NOT_PORTING | DONE | N/A | ADR-017',
  '| G-15 | Built-in browser sync',
  '| INTENTIONAL_DIVERGENCE | DONE | N/A | ADR-018',
]);
"""
new = """for (const [rowId, classification, adr] of [
  ['G-13', 'NOT_PORTING', 'ADR-016'],
  ['G-14', 'NOT_PORTING', 'ADR-017'],
  ['G-15', 'INTENTIONAL_DIVERGENCE', 'ADR-018'],
]) {
  const row = audit.split('\\n').find((line) => line.startsWith(`| ${rowId} `));
  if (
    !row ||
    !row.includes(`| ${classification}`) ||
    !row.includes('| DONE') ||
    !row.includes(adr)
  ) {
    failures.push(`${rowId} must be DONE with ${classification} and ${adr}`);
  }
}
"""
if text.count(old) != 1:
    raise SystemExit(f'validator row block mismatch: {text.count(old)}')
path.write_text(text.replace(old, new))
