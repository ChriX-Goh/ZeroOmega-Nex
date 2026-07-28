from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
old = '      profileExport.includes("replace(/\\W+/g, \'_\')") &&\n'
new = "      profileExport.includes('sanitizeProfileExportName') &&\n      profileExport.includes('/\\\\W+/g') &&\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one generated profile export regex guard, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
