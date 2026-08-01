from pathlib import Path

path = Path('docs/MILESTONE_8_STATUS.md')
text = path.read_text(encoding='utf-8')
old = """- forced renderer-fallback Action evidence and headed toolbar pixels where browser-readable state is insufficient;
- headed toolbar pixels where browser-readable state is insufficient;
"""
new = """- forced renderer-fallback Action evidence and headed toolbar pixels where browser-readable state is insufficient;
"""
count = text.count(old)
if count != 1:
    raise SystemExit(f'duplicate renderer bullet: expected one match, found {count}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
