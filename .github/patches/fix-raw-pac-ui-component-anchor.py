from pathlib import Path

path = Path('.github/patches/apply-raw-pac-ui-e2e-docs.py')
text = path.read_text()
old = '''replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    \'''        disabled: false,
        onReplaceDraft: replaceDraft,
      },
\''',
    \'''        disabled: false,
        onReplaceDraft: replaceDraft,
        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
      },
\''',
)
'''
new = '''replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    \'''    const { body } = render(PacProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    });
\''',
    \'''    const { body } = render(PacProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onReplaceDraftWithSecrets: async () => true,
        onReadSecret: async () => '',
      },
    });
\''',
)
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one generic PAC component patch block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
