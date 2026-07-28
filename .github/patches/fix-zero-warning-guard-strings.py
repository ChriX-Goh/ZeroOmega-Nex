from pathlib import Path

path = Path('.github/patches/apply-zero-svelte-warnings.py')
text = path.read_text()
replacements = {
    r'''!fixedProfile.includes('<section\n      class="auth-dialog"') &&''': r'''!fixedProfile.includes(['<section', '      class="auth-dialog"', '      data-fixed-auth-dialog'].join('\\n')) &&''',
    r'''!pacProfileEditor.includes('<section\n      class="auth-dialog"') &&''': r'''!pacProfileEditor.includes(['<section', '      class="auth-dialog"', '      data-pac-auth-dialog'].join('\\n')) &&''',
}
for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'expected one zero-warning guard string, found {count}: {old!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
