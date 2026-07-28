from pathlib import Path

path = Path('.github/patches/patch-typed-auto-detect.py')
text = path.read_text()
old = '''replace_once(
    spec,
    "import AttachedRuleListConfig from './entrypoints/options/AttachedRuleListConfig.svelte';",
    "import AttachedRuleListConfig from './entrypoints/options/AttachedRuleListConfig.svelte';\\n"
    "import AdvancedProfileEditor from './entrypoints/options/AdvancedProfileEditor.svelte';",
)
'''
new = '''replace_once(
    spec,
    "import FixedProfileEditor from './entrypoints/options/FixedProfileEditor.svelte';",
    "import AdvancedProfileEditor from './entrypoints/options/AdvancedProfileEditor.svelte';\\n"
    "import FixedProfileEditor from './entrypoints/options/FixedProfileEditor.svelte';",
)
'''
count = text.count(old)
if count != 1:
    raise SystemExit(f'{path}: expected one stale component import patch, found {count}')
path.write_text(text.replace(old, new, 1))
print('Updated Auto Detect component test import anchor.')
