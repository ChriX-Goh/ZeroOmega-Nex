from pathlib import Path

path = Path('.github/patches/apply-locale-batch-two-switch.py')
text = path.read_text()
old_entry = "    '<span>to</span>': \"<span>{uiText('switch.rangeTo', locale)}</span>\",\n"
if text.count(old_entry) != 1:
    raise SystemExit(f'expected one Switch range replacement entry, found {text.count(old_entry)}')
text = text.replace(old_entry, '', 1)
old_loop = "for old, new in replacements.items():\n    replace_once(path, old, new)\nreplace_all(path, '<option value=\"direct\">Direct</option>',"
new_loop = "for old, new in replacements.items():\n    replace_once(path, old, new)\nreplace_all(path, '<span>to</span>', \"<span>{uiText('switch.rangeTo', locale)}</span>\", 2)\nreplace_all(path, '<option value=\"direct\">Direct</option>',"
if text.count(old_loop) != 1:
    raise SystemExit(f'expected one Switch replacement loop anchor, found {text.count(old_loop)}')
path.write_text(text.replace(old_loop, new_loop, 1))
