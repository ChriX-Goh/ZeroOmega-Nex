from pathlib import Path

path = Path('.github/patches/apply-virtual-browser-migration.py')
text = path.read_text()
old = '''replace_once(
    'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
    '  <section class="settings-section">\\n',
    '  <section class="settings-section" data-virtual-profile-editor>\\n',
)
'''
new = '''replace_once(
    'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
    '  <section class="settings-section">\\n    <h2>Target profile</h2>\\n',
    '  <section class="settings-section" data-virtual-profile-editor>\\n    <h2>Target profile</h2>\\n',
)
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one Virtual section patch block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
