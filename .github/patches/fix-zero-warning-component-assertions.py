from pathlib import Path

path = Path('.github/patches/apply-zero-svelte-warnings.py')
text = path.read_text()
replacements = {
    "    '''    expect(blocked).toContain('<div class=\"deletion-dialog\" role=\"alertdialog\" tabindex=\"-1\"');\n''',": "    '''    expect(blocked).toContain('<div class=\"deletion-dialog');\n    expect(blocked).toContain('role=\"alertdialog\"');\n    expect(blocked).toContain('tabindex=\"-1\"');\n''',",
    "    '''    expect(confirm).toContain('<div class=\"deletion-dialog\" role=\"dialog\" tabindex=\"-1\"');\n''',": "    '''    expect(confirm).toContain('<div class=\"deletion-dialog');\n    expect(confirm).toContain('role=\"dialog\"');\n    expect(confirm).toContain('tabindex=\"-1\"');\n''',",
    "    '''    expect(body).toContain('<div class=\"new-profile-dialog\" role=\"dialog\" tabindex=\"-1\"');\n    expect(body).toContain('data-new-profile-name-input');": "    '''    expect(body).toContain('<div class=\"new-profile-dialog');\n    expect(body).toContain('role=\"dialog\"');\n    expect(body).toContain('tabindex=\"-1\"');\n    expect(body).toContain('data-new-profile-name-input');",
}
for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'expected one zero-warning component assertion block, found {count}: {old!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
