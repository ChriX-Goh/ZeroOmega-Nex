from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
old = "requestDiagnosticsRuntime.includes('this.#api.storage.session')"
new = "requestDiagnosticsRuntime.includes('new RequestDiagnosticsRepository(api.storage.session)')"
if text.count(old) != 1:
    raise SystemExit('request diagnostics validator storage-session assertion was not found')
path.write_text(text.replace(old, new, 1))
