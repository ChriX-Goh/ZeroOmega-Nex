from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
text = path.read_text()
replacements = {
    "      profileReplacementDialog.includes('The two profiles') &&\n": "      profileReplacementDialog.includes(\"uiText('profile.replace.help', locale)\") &&\n",
    "      fixedProfile.includes('Show Advanced') &&\n      fixedProfile.includes('Proxy Authentication') &&\n": "      fixedProfile.includes(\"uiText('fixed.showAdvanced', locale)\") &&\n      fixedProfile.includes(\"uiText('fixed.authTitle', locale)\") &&\n",
}
for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'expected one typed locale UI guard anchor, found {count}: {old!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
