from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
replacements = {
    "optionsApp.includes('Apply current changes before replacing profile references?') &&":
        "optionsApp.includes(\"uiText('options.confirm.replace', locale)\") &&",
    "optionsApp.includes(\"uiText('options.actions.apply', locale)\") &&":
        "optionsApp.includes(\"'options.actions.apply'\") &&",
}
for old, new in replacements.items():
    if text.count(old) != 1:
        raise SystemExit(f'expected one typed UI guard anchor, found {text.count(old)}: {old!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
