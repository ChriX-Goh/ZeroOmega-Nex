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
    'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
    '''  <section
    class="replacement-dialog"
''',
    '''  <div
    class="replacement-dialog"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
    '''  </section>
</div>

<style>
''',
    '''  </div>
</div>

<style>
''',
)

replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    const { body } = render(VirtualProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    });
''',
    '''    const { body } = render(VirtualProfileEditor, {
      props: {
        spec: mutation.draft,
        profileId: mutation.profileId,
        disabled: false,
        onReplaceDraft: replaceDraft,
        onRequestReplacement: async () => undefined,
      },
    });
''',
)

replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    "    expect(body).toContain('The two profiles themselves are not changed or deleted.');\n",
    "    expect(body).toContain('The two profiles');\n    expect(body).toContain('themselves are not changed or deleted.');\n",
)
