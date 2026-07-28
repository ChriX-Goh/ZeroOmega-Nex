from pathlib import Path

path = Path('.github/patches/apply-virtual-browser-migration.py')
text = path.read_text()
old = '''replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    ''' + "'''" + '''    expect(body).toContain('Virtual profiles keep a stable name');
''' + "'''" + ''',
    ''' + "'''" + '''    expect(body).toContain('data-virtual-profile-editor');
    expect(body).toContain('data-virtual-target');
    expect(body).toContain('data-virtual-replace');
    expect(body).toContain('Virtual profiles keep a stable name');
''' + "'''" + ''',
)
'''
new = '''replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    ''' + "'''" + '''    expect(body).toContain('Target profile');
    expect(body).toContain('Migrate to Virtual Profile');
    expect(body).toContain('Replace target profile');
''' + "'''" + ''',
    ''' + "'''" + '''    expect(body).toContain('data-virtual-profile-editor');
    expect(body).toContain('data-virtual-target');
    expect(body).toContain('data-virtual-replace');
    expect(body).toContain('Target profile');
    expect(body).toContain('Migrate to Virtual Profile');
    expect(body).toContain('Replace target profile');
''' + "'''" + ''',
)
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one Virtual component patch block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
