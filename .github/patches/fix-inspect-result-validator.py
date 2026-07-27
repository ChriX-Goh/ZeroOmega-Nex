from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
old = """const requestDiagnosticsPagePath = 'apps/extension/src/entrypoints/network/App.svelte';
"""
new = """const requestDiagnosticsPagePath = 'apps/extension/src/entrypoints/network/App.svelte';
const inspectRuntimePath = 'apps/extension/src/lib/inspect-runtime.ts';
"""
if text.count(old) != 1:
    raise SystemExit('validator path insertion anchor missing')
text = text.replace(old, new, 1)
old = """  requestDiagnosticsRuntime,
  requestDiagnosticsPage,
] = await Promise.all(["""
new = """  requestDiagnosticsRuntime,
  requestDiagnosticsPage,
  inspectRuntime,
] = await Promise.all(["""
if text.count(old) != 1:
    raise SystemExit('validator binding insertion anchor missing')
text = text.replace(old, new, 1)
old = """  readFile(requestDiagnosticsRuntimePath, 'utf8'),
  readFile(requestDiagnosticsPagePath, 'utf8'),
]);"""
new = """  readFile(requestDiagnosticsRuntimePath, 'utf8'),
  readFile(requestDiagnosticsPagePath, 'utf8'),
  readFile(inspectRuntimePath, 'utf8'),
]);"""
if text.count(old) != 1:
    raise SystemExit('validator read insertion anchor missing')
path.write_text(text.replace(old, new, 1))
