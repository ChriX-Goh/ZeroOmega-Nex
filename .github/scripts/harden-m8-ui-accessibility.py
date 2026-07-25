from pathlib import Path


def replace_once(path_string: str, old: str, new: str, label: str) -> None:
    path = Path(path_string)
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path_string} {label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new, 1))


replace_once(
    'apps/extension/src/entrypoints/options/style.css',
    '  min-width: 860px;',
    '  min-width: 320px;',
    'responsive document minimum width',
)

replace_once(
    'apps/extension/src/entrypoints/options/style.css',
    '''button {
  color: inherit;
}
''',
    '''button {
  color: inherit;
}

button:not(:disabled) {
  cursor: pointer;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
summary:focus-visible {
  outline: 3px solid #1565c0;
  outline-offset: 2px;
}
''',
    'options keyboard focus baseline',
)

options_path = Path('apps/extension/src/entrypoints/options/style.css')
options_text = options_path.read_text()
options_append = '''

@media (max-width: 760px) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto minmax(0, 1fr);
  }

  .topbar {
    grid-column: 1;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 52px;
    padding: 8px 12px;
  }

  .actions {
    flex-wrap: wrap;
  }

  .sidebar {
    border-right: 0;
    border-bottom: 1px solid #cfd8dc;
  }

  .sidebar nav {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    max-height: 260px;
    overflow: auto;
  }

  .settings-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: 0;
  }

  .editor {
    padding: 18px 16px 40px;
  }

  .editor-heading {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .profile-actions {
    flex-wrap: wrap;
  }

  .proxy-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .proxy-headings {
    display: none;
  }

  .shell-status dl div {
    align-items: flex-start;
  }

  .shell-status dd {
    overflow-wrap: anywhere;
    text-align: right;
  }
}

@media (max-width: 480px) {
  .actions,
  .profile-actions {
    width: 100%;
  }

  .actions button,
  .profile-actions button {
    flex: 1 1 auto;
  }

  .settings-links {
    grid-template-columns: minmax(0, 1fr);
  }

  .profile-title {
    align-items: flex-start;
  }

  .shell-status dl div {
    flex-direction: column;
    gap: 3px;
  }

  .shell-status dd {
    text-align: left;
  }
}
'''
if '@media (max-width: 760px)' in options_text:
    raise SystemExit('options responsive media query already exists')
options_path.write_text(options_text.rstrip() + options_append)

replace_once(
    'apps/extension/src/entrypoints/popup/style.css',
    '''.profile-list button.active {
  border-left-color: #7cb342;
  background: #eaf4e4;
}
''',
    '''.profile-list button.active {
  border-left-color: #7cb342;
  background: #eaf4e4;
}

.profile-list button:focus-visible,
.settings-button:focus-visible {
  outline: 3px solid #1565c0;
  outline-offset: -2px;
}
''',
    'popup keyboard focus baseline',
)
