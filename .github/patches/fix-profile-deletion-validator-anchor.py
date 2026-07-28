from pathlib import Path

path = Path('.github/patches/apply-profile-deletion-protection.py')
text = path.read_text()
old = '''replace_once(
    'scripts/validate-ui-compatibility.mjs',
    ''' + "'''" + '''    'Options must retain familiar left profile navigation.',
  ],
''' + "'''" + ''',
    ''' + "'''" + '''    'Options must retain familiar left profile navigation.',
  ],
  [
    profileOperations.includes('export function listProfileReferenceBlockers') &&
      profileOperations.includes('profileReferencesTarget') &&
      profileOperations.includes('viaAttachedRuleListProfileId') &&
      profileOperations.includes('profile is referenced by') &&
      !profileOperations.includes('rewriteProfileRoutes(profile, deletedId)') &&
      optionsApp.includes('listProfileReferenceBlockers') &&
      optionsApp.includes('data-profile-delete-action') &&
      optionsApp.includes('<ProfileDeletionDialog') &&
      profileDeletionDialog.includes('role="alertdialog"') &&
      profileDeletionDialog.includes('data-profile-deletion-mode="blocked"') &&
      profileDeletionDialog.includes('data-profile-deletion-mode="confirm"') &&
      chromiumE2e.includes('Existing Alias') &&
      chromiumE2e.includes('Confirmed profile deletion did not commit through normal Apply'),
    'Profile deletion must block typed references with an explicit referrer dialog, collapse hidden attached Rule Lists to their owner, and only delete unreferenced profiles through Draft plus normal Apply.',
  ],
''' + "'''" + ''',
)
'''
new = '''replace_once(
    'scripts/validate-ui-compatibility.mjs',
    ''' + "'''" + '''  [optionsApp.includes('class="sidebar"'), 'Options must retain familiar left profile navigation.'],
''' + "'''" + ''',
    ''' + "'''" + '''  [optionsApp.includes('class="sidebar"'), 'Options must retain familiar left profile navigation.'],
  [
    profileOperations.includes('export function listProfileReferenceBlockers') &&
      profileOperations.includes('profileReferencesTarget') &&
      profileOperations.includes('viaAttachedRuleListProfileId') &&
      profileOperations.includes('profile is referenced by') &&
      !profileOperations.includes('rewriteProfileRoutes(profile, deletedId)') &&
      optionsApp.includes('listProfileReferenceBlockers') &&
      optionsApp.includes('data-profile-delete-action') &&
      optionsApp.includes('<ProfileDeletionDialog') &&
      profileDeletionDialog.includes('role="alertdialog"') &&
      profileDeletionDialog.includes('data-profile-deletion-mode="blocked"') &&
      profileDeletionDialog.includes('data-profile-deletion-mode="confirm"') &&
      chromiumE2e.includes('Existing Alias') &&
      chromiumE2e.includes('Confirmed profile deletion did not commit through normal Apply'),
    'Profile deletion must block typed references with an explicit referrer dialog, collapse hidden attached Rule Lists to their owner, and only delete unreferenced profiles through Draft plus normal Apply.',
  ],
''' + "'''" + ''',
)
'''
if text.count(old) != 1:
    raise SystemExit(f'expected one profile deletion validator insertion block, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
