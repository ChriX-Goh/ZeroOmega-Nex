from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
    '      const targetProfileId = current.targetRoute.profileId;\n',
    '      const targetProfileId: string = current.targetRoute.profileId;\n',
)

replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''        disabled: false,
        onReplaceDraft: replaceDraft,
      },
''',
    '''        disabled: false,
        onReplaceDraft: replaceDraft,
        onRequestReplacement: async () => undefined,
      },
''',
)
