from pathlib import Path

path = Path('.github/patches/fix-options-sync-chain-race.py')
source = path.read_text()
old = '''replace_once(test, 'expect(calls).toBe(0);', 'expect(values).toEqual([]);')
replace_once(test, 'expect(calls).toBe(1);', 'expect(values).toEqual([3]);')
replace_once(
    test,
    ''' + "'''" + '''    expect(calls).toBe(1);
  });
''' + "'''" + ''',
    ''' + "'''" + '''    expect(values).toEqual([3]);
  });
''' + "'''" + ''',
)
'''
new = '''replace_once(
    test,
    ''' + "'''" + '''    onChanged.fire({ other: { newValue: 1 } }, 'local');
    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 2 } }, 'sync');
    expect(calls).toBe(0);

    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 3 } }, 'local');
    expect(calls).toBe(1);

    dispose();
    expect(onChanged.listeners.size).toBe(0);
    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 4 } }, 'local');
    expect(calls).toBe(1);
''' + "'''" + ''',
    ''' + "'''" + '''    onChanged.fire({ other: { newValue: 1 } }, 'local');
    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 2 } }, 'sync');
    expect(values).toEqual([]);

    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 3 } }, 'local');
    expect(values).toEqual([3]);

    dispose();
    expect(onChanged.listeners.size).toBe(0);
    onChanged.fire({ [PROFILE_WORKFLOW_STATE_STORAGE_KEY]: { newValue: 4 } }, 'local');
    expect(values).toEqual([3]);
''' + "'''" + ''',
)
'''
if source.count(old) != 1:
    raise SystemExit(f'chain test patch match: {source.count(old)}')
path.write_text(source.replace(old, new))
