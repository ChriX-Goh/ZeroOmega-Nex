from pathlib import Path

path = Path('scripts/validate-parity-docs.mjs')
text = path.read_text()
old = """requireAll('remote sync audit rows', audit, [
  '| G-13 | Gist 同步',
  '| NOT_PORTING | DONE |',
  '| G-14 | WebDAV 同步',
  '| G-15 | Built-in browser sync',
  '| INTENTIONAL_DIVERGENCE | DONE |',
]);
"""
new = """requireAll('remote sync audit rows', audit, [
  '| G-13 | Gist 同步',
  '| NOT_PORTING | DONE | N/A | ADR-016',
  '| G-14 | WebDAV 同步',
  '| NOT_PORTING | DONE | N/A | ADR-017',
  '| G-15 | Built-in browser sync',
  '| INTENTIONAL_DIVERGENCE | DONE | N/A | ADR-018',
]);
"""
if text.count(old) != 1:
    raise SystemExit(f'validator audit anchor mismatch: {text.count(old)}')
path.write_text(text.replace(old, new))
