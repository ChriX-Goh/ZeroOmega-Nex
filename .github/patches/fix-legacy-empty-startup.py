from pathlib import Path

path = Path('packages/legacy-zeroomega/src/import.ts')
text = path.read_text()
old = """  const startupName = options['-startupProfileName'];
  const startupRoute =
    startupName === undefined
      ? undefined
      : routeForName(startupName, '/-startupProfileName', state);
"""
new = """  const startupName = options['-startupProfileName'];
  const startupRoute =
    startupName === undefined || startupName === ''
      ? undefined
      : routeForName(startupName, '/-startupProfileName', state);
  if (startupName === '') {
    state.report.add(
      'exact',
      'settings.startup-empty',
      '/-startupProfileName',
      'Empty original startup profile means no automatic startup switch.',
    );
  }
"""
if text.count(old) != 1:
    raise SystemExit('legacy startup mapping block was not found exactly once')
path.write_text(text.replace(old, new, 1))
