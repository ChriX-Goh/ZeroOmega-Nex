from pathlib import Path

path = Path('apps/extension/src/component-rendering.component.spec.ts')
text = path.read_text()
old = "import AdvancedProfileEditor from './entrypoints/options/AdvancedProfileEditor.svelte';\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one AdvancedProfileEditor test import, found {text.count(old)}')
path.write_text(text.replace(old, '', 1))
