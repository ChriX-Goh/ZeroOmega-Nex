from pathlib import Path

path = Path('.github/patches/apply-profile-replacement-dialog.py')
text = path.read_text()

replacements = {
    """      visited.add(current.id);
      current = spec.profiles.find((candidate) => candidate.id === current?.targetRoute.profileId);
""": """      visited.add(current.id);
      const targetProfileId = current.targetRoute.profileId;
      current = spec.profiles.find((candidate) => candidate.id === targetProfileId);
""",
    """replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
''',
    '''          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onRequestReplacement={requestProfileReplacement}
        />
''',
)
""": """replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''        <VirtualProfileEditor
          spec={state.draft}
          profileId={virtualProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
        />
''',
    '''        <VirtualProfileEditor
          spec={state.draft}
          profileId={virtualProfile.id}
          disabled={saving || view?.busy === true}
          onReplaceDraft={replaceDraft}
          onRequestReplacement={requestProfileReplacement}
        />
''',
)
""",
    "profile.id === 'profile-default-fixed'": "profile.id === 'profile-default-proxy'",
}

for old, new in replacements.items():
    if text.count(old) != 1:
        raise SystemExit(f'expected one replacement patch anchor, found {text.count(old)}: {old[:160]!r}')
    text = text.replace(old, new, 1)

path.write_text(text)
