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
  pac: 'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
  history: 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',
  legacyImport: 'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',
  chromiumE2e: 'scripts/e2e-chromium.mjs',
  firefoxE2e: 'scripts/e2e-firefox.mjs',
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
  ['PAC Profile', entries.pac],
  ['Snapshot History', entries.history],
  ['Legacy Import', entries.legacyImport],
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
  [entries.pac, '<h2>PAC URL</h2>', 'PAC URL heading regressed to literal English.'],
  [entries.pac, 'aria-label="PAC Script"', 'PAC Script ARIA regressed to literal English.'],
  [entries.pac, '>Download now</button>', 'PAC download action regressed to literal English.'],
  [
    entries.history,
    '<h2>Configuration history</h2>',
    'History heading regressed to literal English.',
  ],
  [
    entries.history,
    '>Rollback to this snapshot</button>',
    'History rollback action regressed to literal English.',
  ],
  [
    entries.legacyImport,
    '<h2>Export options</h2>',
    'Legacy export heading regressed to literal English.',
  ],
  [
    entries.legacyImport,
    'aria-label="Legacy backup file"',
    'Legacy backup ARIA regressed to literal English.',
  ],
  [
    entries.legacyImport,
    '>Import and use now</button>',
    'Legacy import action regressed to literal English.',
  ],
  [
    entries.legacyImport,
    'item.message',
    'Legacy Import must not render backend English report messages.',
  ],
  [
    entries.legacyImport,
    'error.message',
    'Legacy Import must not render backend exception messages.',
  ],
  [
    entries.pac,
    'Proxy authentication permission was not granted.',
    'PAC auth error regressed to literal English.',
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
  entries.app,
  '<PacProfileEditor\n          {locale}',
  'Options must pass locale to PAC Profile.',
);
requireText(
  entries.app,
  '<LegacyImportPanel\n        {locale}',
  'Options must pass locale to Legacy Import.',
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
  entries.catalog,
  "readonly 'pac.lastUpdated'",
  'Typed PAC update status messages are missing.',
);
requireText(
  entries.chromiumE2e,
  'Imported non-default startup route did not become the browser-confirmed active start route',
  'Chromium imported startup-route coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'data-snapshot-rollback-confirm',
  'Chromium real snapshot rollback interaction coverage is missing.',
);
requireText(
  entries.firefoxE2e,
  "'raw-pac/1'",
  'Firefox PAC raw-snapshot interaction coverage is missing.',
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
