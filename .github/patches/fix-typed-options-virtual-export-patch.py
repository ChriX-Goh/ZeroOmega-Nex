from pathlib import Path

path = Path('.github/patches/patch-typed-options-virtual.py')
text = path.read_text()
old = '''replace_once(
    app,
    "      profileExportMessage =\\n        result.exported.warnings.length === 0\\n          ? `Exported ${result.exported.filename}.`\\n          : `Exported ${result.exported.filename} with ${result.exported.warnings.length} warning(s).`;",
    "      profileExportMessage = uiMessage(\\n"
    "        'options.exported',\\n"
    "        { filename: result.exported.filename, warnings: result.exported.warnings.length },\\n"
    "        locale,\\n"
    "      );",
)
# The same source block occurs twice; replace the second independently.
replace_once(
    app,
    "      profileExportMessage =\\n        result.exported.warnings.length === 0\\n          ? `Exported ${result.exported.filename}.`\\n          : `Exported ${result.exported.filename} with ${result.exported.warnings.length} warning(s).`;",
    "      profileExportMessage = uiMessage(\\n"
    "        'options.exported',\\n"
    "        { filename: result.exported.filename, warnings: result.exported.warnings.length },\\n"
    "        locale,\\n"
    "      );",
)
'''
new = '''export_status_old = "      profileExportMessage =\\n        result.exported.warnings.length === 0\\n          ? `Exported ${result.exported.filename}.`\\n          : `Exported ${result.exported.filename} with ${result.exported.warnings.length} warning(s).`;"
export_status_new = (
    "      profileExportMessage = uiMessage(\\n"
    "        'options.exported',\\n"
    "        { filename: result.exported.filename, warnings: result.exported.warnings.length },\\n"
    "        locale,\\n"
    "      );"
)
app_text = app.read_text()
if app_text.count(export_status_old) != 2:
    raise SystemExit(f'{app}: expected two profile export status blocks')
app.write_text(app_text.replace(export_status_old, export_status_new))
'''
count = text.count(old)
if count != 1:
    raise SystemExit(f'{path}: expected one duplicate export patch block, found {count}')
path.write_text(text.replace(old, new, 1))
print('Fixed duplicate profile export status patching.')
