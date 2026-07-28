from pathlib import Path

path = Path('apps/extension/src/lib/online-backup-downloader.ts')
text = path.read_text()
old = """    this.name = 'OnlineBackupDownloadError';
    this.code = code;
    this.httpStatus = details.httpStatus;
    this.limitBytes = details.limitBytes;
"""
new = """    this.name = 'OnlineBackupDownloadError';
    this.code = code;
    if (details.httpStatus !== undefined) this.httpStatus = details.httpStatus;
    if (details.limitBytes !== undefined) this.limitBytes = details.limitBytes;
"""
if text.count(old) != 1:
    raise SystemExit(f'expected one optional detail assignment, found {text.count(old)}')
path.write_text(text.replace(old, new))
