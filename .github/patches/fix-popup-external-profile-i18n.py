from pathlib import Path
import re

path = Path('.github/patches/apply-popup-external-profile-ui.py')
text = path.read_text()
patterns = [
    r"(?m)^  'Profile name': \{ 'zh-CN': .*\n",
    r"(?m)^  'Saving…': \{ 'zh-CN': .*\n",
]
for pattern in patterns:
    text, count = re.subn(pattern, '', text, count=1)
    if count != 1:
        raise SystemExit(f'external profile duplicate locale pattern count: {count}')
path.write_text(text)
