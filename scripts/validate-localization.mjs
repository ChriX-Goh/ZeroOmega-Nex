import { readFile } from 'node:fs/promises';

const files = {
  catalog: 'apps/extension/src/lib/ui-messages.ts',
  fixed: 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
  newProfile: 'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
  deletion: 'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
  replacement: 'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
  switchProfile: 'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
  attachedRuleList: 'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',
  independentRuleList: 'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
  app: 'apps/extension/src/entrypoints/options/App.svelte',
  package: 'package.json',
};
const entries = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([key, filename]) => [key, await readFile(filename, 'utf8')]),
  ),
);
const failures = [];
const requireText = (source, marker, message) => {
  if (!source.includes(marker)) failures.push(message);
};
const forbidText = (source, marker, message) => {
  if (source.includes(marker)) failures.push(message);
};

requireText(entries.catalog, 'export const typedUiTextCatalog', 'Typed locale catalog is missing.');
requireText(
  entries.catalog,
  "readonly 'fixed.fieldAria'",
  'Typed dynamic Fixed ARIA message is missing.',
);
requireText(
  entries.catalog,
  "'zh-TW': '建立情境模式'",
  'Traditional Chinese New Profile source-backed label is missing.',
);
for (const [name, source] of [
  ['New Profile', entries.newProfile],
  ['Profile deletion', entries.deletion],
  ['Profile replacement', entries.replacement],
  ['Fixed Profile', entries.fixed],
  ['Switch Profile', entries.switchProfile],
  ['Attached Rule List', entries.attachedRuleList],
  ['Independent Rule List', entries.independentRuleList],
]) {
  requireText(
    source,
    "from '../../lib/ui-messages'",
    `${name} must render through the typed locale catalog.`,
  );
  requireText(
    source,
    'data-typed-locale={locale}',
    `${name} must expose its resolved typed locale for browser verification.`,
  );
}
for (const [source, marker, message] of [
  [
    entries.newProfile,
    '<h1 id="new-profile-title">New Profile</h1>',
    'New Profile title regressed to literal English.',
  ],
  [
    entries.newProfile,
    '>Profile type</legend>',
    'New Profile type label regressed to literal English.',
  ],
  [
    entries.deletion,
    '>Cannot delete profile</h2>',
    'Deletion blocker title regressed to literal English.',
  ],
  [
    entries.deletion,
    '>Delete profile</h2>',
    'Deletion confirmation title regressed to literal English.',
  ],
  [entries.replacement, '>Replace Profile</h2>', 'Replacement title regressed to literal English.'],
  [entries.fixed, '<h2>Proxy servers</h2>', 'Fixed Profile heading regressed to literal English.'],
  [
    entries.fixed,
    'aria-label="Authentication"',
    'Fixed authentication ARIA regressed to literal English.',
  ],
  [
    entries.fixed,
    "authError = 'Proxy server no longer exists.'",
    'Fixed error regressed to literal English.',
  ],
  [entries.switchProfile, '<h2>Switch rules</h2>', 'Switch heading regressed to literal English.'],
  [
    entries.switchProfile,
    '>Condition type</th>',
    'Switch condition header regressed to literal English.',
  ],
  [
    entries.switchProfile,
    'aria-label="Switch Profile source"',
    'Switch source ARIA regressed to literal English.',
  ],
  [
    entries.attachedRuleList,
    '<h2>Attached Rule List configuration</h2>',
    'Attached Rule List heading regressed to literal English.',
  ],
  [
    entries.attachedRuleList,
    '>Download now</button>',
    'Attached Rule List action regressed to literal English.',
  ],
  [
    entries.independentRuleList,
    '<h2>Rule List Config</h2>',
    'Independent Rule List heading regressed to literal English.',
  ],
  [
    entries.independentRuleList,
    'aria-label="Rule List text"',
    'Independent Rule List ARIA regressed to literal English.',
  ],
])
  forbidText(source, marker, message);
requireText(
  entries.app,
  'const locale = currentAppLocale();',
  'Options must resolve one locale for typed child components.',
);
requireText(
  entries.app,
  '<FixedProfileEditor\n          {locale}',
  'Options must pass locale to Fixed Profile.',
);
requireText(
  entries.app,
  '<ProfileDeletionDialog\n    {locale}',
  'Options must pass locale to deletion dialog.',
);
requireText(
  entries.app,
  '<SwitchProfileEditor\n            {locale}',
  'Options must pass locale to Switch Profile.',
);
requireText(
  entries.app,
  '<RuleListProfileEditor\n          {locale}',
  'Options must pass locale to independent Rule List.',
);
requireText(
  entries.catalog,
  "readonly 'switch.sourceError'",
  'Typed Switch source error messages are missing.',
);
requireText(
  entries.catalog,
  "readonly 'ruleList.lastUpdated'",
  'Typed Rule List update status messages are missing.',
);
requireText(
  entries.app,
  "return uiText('route.direct', locale);",
  'Shared Direct route label must be typed.',
);
requireText(
  entries.package,
  '"validate:locale"',
  'Repository verify scripts must include the locale guard.',
);

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Typed localization batch and untranslated-string guard passed.');
}
