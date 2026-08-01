from pathlib import Path

path = Path('scripts/sync-switch-direct-toolbar-knowledge.py')
text = path.read_text(encoding='utf-8')
old = "f'- clean Head：`700f290a5ade70497cb1c757007c4bd3dc7a4d9d`；CI `30673413888`、Browser E2E `30673413855`、Parity `30673413863`、Visual `30673413901` 全绿。'"
new = "f'- clean Head：`{OLD_HEAD}`；CI `{OLD_RUNS[\"ci\"]}`、Browser E2E `{OLD_RUNS[\"browser\"]}`、Parity `{OLD_RUNS[\"parity\"]}`、Visual `{OLD_RUNS[\"visual\"]}` 全绿。'"
count = text.count(old)
if count != 1:
    raise SystemExit(f'original graph checkpoint patch: expected one match, found {count}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
