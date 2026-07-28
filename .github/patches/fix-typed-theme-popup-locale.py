from pathlib import Path

path = Path('apps/extension/src/entrypoints/popup/App.svelte')
text = path.read_text()
old = '''  data-popup-locale={locale}
  aria-label={uiText('popup.switcherAria', locale)}
'''
new = '''  data-popup-locale={locale}
  data-typed-locale={locale}
  aria-label={uiText('popup.switcherAria', locale)}
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one Popup typed-locale marker, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
