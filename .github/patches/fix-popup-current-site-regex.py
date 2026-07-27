from pathlib import Path

path = Path('apps/extension/src/lib/current-site.ts')
lines = path.read_text().splitlines()
matches = [index for index, line in enumerate(lines) if line.strip().startswith('return value.replace(')]
if len(matches) != 1:
    raise SystemExit(f'escapeRegex line match count: {len(matches)}')
lines[matches[0]] = r"  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');"
path.write_text('\n'.join(lines) + '\n')
