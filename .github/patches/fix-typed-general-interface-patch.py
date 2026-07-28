from pathlib import Path

path = Path('.github/patches/apply-typed-general-interface.py')
text = path.read_text()
text = text.replace('from pathlib import Path\n', 'import re\nfrom pathlib import Path\n', 1)
old = '''raw_catch = "} catch (error) {\\n      errorMessage = messageFrom(error);"
raw_catch_count = app.count(raw_catch)
if raw_catch_count < 10:
    raise SystemExit(f'expected at least 10 raw Options catches, found {raw_catch_count}')
app = app.replace(
    raw_catch,
    "} catch {\\n      errorMessage = uiText('options.error.safeMessage', locale);",
)
if app.count('errorMessage = messageFrom(error);') != 0:
    raise SystemExit('unmigrated raw Options exception remains')
'''
new = '''raw_error_assignment = 'errorMessage = messageFrom(error);'
raw_catch_count = app.count(raw_error_assignment)
if raw_catch_count < 10:
    raise SystemExit(f'expected at least 10 raw Options catches, found {raw_catch_count}')
app = app.replace(
    raw_error_assignment,
    "errorMessage = uiText('options.error.safeMessage', locale);",
)
app = re.sub(
    r"} catch \\(error\\) \\{\\n(\\s+)(errorMessage = uiText\\('options\\.error\\.safeMessage', locale\\);)",
    r"} catch {\\n\\1\\2",
    app,
)
if 'messageFrom(' in app:
    raise SystemExit('unmigrated raw Options exception remains')
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one raw exception migration block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
