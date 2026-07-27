from pathlib import Path

path = Path('.github/patches/apply-popup-external-profile-core.py')
text = path.read_text()
replacements = [
    (
        """  const rules = recordValue(value.rules);
  if (!rules) return undefined;
""",
        """  const rawRules = value.rules;
  if (rawRules === undefined) return undefined;
  const rules = recordValue(rawRules);
  if (!rules) return undefined;
""",
    ),
    (
        """  const pac = recordValue(value.pacScript);
  if (!pac) return undefined;
""",
        """  const rawPac = value.pacScript;
  if (rawPac === undefined) return undefined;
  const pac = recordValue(rawPac);
  if (!pac) return undefined;
""",
    ),
]
for old, new in replacements:
    if text.count(old) != 1:
        raise SystemExit(f'external profile optional field match count {text.count(old)}: {old!r}')
    text = text.replace(old, new)
path.write_text(text)
