from pathlib import Path

path = Path('.github/patches/apply-typed-legacy-import.py')
text = path.read_text()
old = '''    "  [entries.history, '>Rollback to this snapshot</button>', 'History rollback action regressed to literal English.'],\\n",
    "  [entries.history, '>Rollback to this snapshot</button>', 'History rollback action regressed to literal English.'],\\n"
'''
new = '''    "  [\\n    entries.history,\\n    '>Rollback to this snapshot</button>',\\n    'History rollback action regressed to literal English.',\\n  ],\\n",
    "  [\\n    entries.history,\\n    '>Rollback to this snapshot</button>',\\n    'History rollback action regressed to literal English.',\\n  ],\\n"
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one Legacy Import localization anchor patch, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
