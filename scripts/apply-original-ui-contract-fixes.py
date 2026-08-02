from pathlib import Path

options_app = Path('apps/extension/src/entrypoints/options/App.svelte').read_text()
needle = "uiText('options.builtin.directHelp', locale)"
index = options_app.index(needle)
start = max(0, index - 500)
end = min(len(options_app), index + len(needle) + 500)
print(options_app[start:end])
raise RuntimeError(f'located residual original-incompatible helper at byte {index}')
