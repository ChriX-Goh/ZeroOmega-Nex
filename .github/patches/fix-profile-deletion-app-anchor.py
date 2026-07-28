from pathlib import Path

path = Path('.github/patches/apply-profile-deletion-protection.py')
text = path.read_text()
old = '''replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    ''' + "'''" + '''</div>
''' + "'''" + ''',
    ''' + "'''" + '''</div>

{#if pendingProfileDeletion}
  <ProfileDeletionDialog
    profileName={pendingProfileDeletion.profileName}
    blockers={pendingProfileDeletion.blockers}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileDeletion = undefined)}
    onConfirm={confirmProfileDeletion}
  />
{/if}
''' + "'''" + ''',
)
'''
new = '''replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    ''' + "'''" + '''  </main>
</div>
''' + "'''" + ''',
    ''' + "'''" + '''  </main>
</div>

{#if pendingProfileDeletion}
  <ProfileDeletionDialog
    profileName={pendingProfileDeletion.profileName}
    blockers={pendingProfileDeletion.blockers}
    disabled={saving || view?.busy === true}
    onCancel={() => (pendingProfileDeletion = undefined)}
    onConfirm={confirmProfileDeletion}
  />
{/if}
''' + "'''" + ''',
)
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one generic App dialog insertion block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
