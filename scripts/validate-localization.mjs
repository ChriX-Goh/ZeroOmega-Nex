import { readFile } from 'node:fs/promises';

const files = {
  catalog: 'apps/extension/src/lib/ui-messages.ts',
  fixed: 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte',
  newProfile: 'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
  deletion: 'apps/extension/src/entrypoints/options/ProfileDeletionDialog.svelte',
  replacement: 'apps/extension/src/entrypoints/options/ProfileReplacementDialog.svelte',
  switchProfile: 'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
  autoDetect: 'apps/extension/src/entrypoints/options/AdvancedProfileEditor.svelte',
  attachedRuleList: 'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',
  independentRuleList: 'apps/extension/src/entrypoints/options/RuleListProfileEditor.svelte',
  pac: 'apps/extension/src/entrypoints/options/PacProfileEditor.svelte',
  history: 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',
  legacyImport: 'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte',
  theme: 'apps/extension/src/entrypoints/options/ThemePanel.svelte',
  popup: 'apps/extension/src/entrypoints/popup/App.svelte',
  temporaryRules: 'apps/extension/src/entrypoints/temp-rules/App.svelte',
  network: 'apps/extension/src/entrypoints/network/App.svelte',
  virtual: 'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
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
  ['Auto Detect', entries.autoDetect],
  ['Attached Rule List', entries.attachedRuleList],
  ['Independent Rule List', entries.independentRuleList],
  ['PAC Profile', entries.pac],
  ['Snapshot History', entries.history],
  ['Legacy Import', entries.legacyImport],
  ['Theme', entries.theme],
  ['Popup', entries.popup],
  ['Temporary Rules', entries.temporaryRules],
  ['Network', entries.network],
  ['Virtual Profile', entries.virtual],
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
  [entries.theme, '<strong>Automatic</strong>', 'Theme choice regressed to literal English.'],
  [entries.theme, 'aria-label="Theme"', 'Theme ARIA regressed to literal English.'],
  [entries.popup, 'Loading applied profiles…', 'Popup loading state regressed to literal English.'],
  [
    entries.popup,
    'Temporary profile for {currentSite.domain}',
    'Popup temporary rule regressed to literal English.',
  ],
  [
    entries.popup,
    'Add condition for {currentSite.domain}',
    'Popup current-site action regressed to literal English.',
  ],
  [entries.popup, 'translate(', 'Popup regressed to the observer translation layer.'],
  [
    entries.popup,
    'errorMessage = response.message',
    'Popup must not render raw backend response messages.',
  ],
  [
    entries.popup,
    'error instanceof Error ? error.message',
    'Popup must not render raw exception messages.',
  ],
  [
    entries.temporaryRules,
    '<h1>Temporary Rules</h1>',
    'Temporary Rules title regressed to literal English.',
  ],
  [
    entries.temporaryRules,
    'Delete all temporary rules',
    'Temporary Rules clear action regressed to literal English.',
  ],
  [
    entries.temporaryRules,
    'errorMessage = response.message',
    'Temporary Rules must not render raw backend response messages.',
  ],
  [
    entries.network,
    "translate('Request diagnostics')",
    'Network diagnostics regressed to the observer translation layer.',
  ],
  [
    entries.network,
    'error instanceof Error ? error.message',
    'Network diagnostics must not render raw exception messages.',
  ],
  [
    entries.virtual,
    '<h2>Target profile</h2>',
    'Virtual target title regressed to literal English.',
  ],
  [
    entries.virtual,
    'aria-label="Virtual Profile target"',
    'Virtual target ARIA regressed to literal English.',
  ],
  [
    entries.virtual,
    '>Replace target profile</button>',
    'Virtual migration action regressed to literal English.',
  ],
  [entries.app, '<h1>Built-in Profiles</h1>', 'Built-in page title regressed to literal English.'],
  [
    entries.app,
    '<h2>Compatibility-first continuation</h2>',
    'About compatibility text regressed to literal English.',
  ],
  [entries.app, '<h1>No user profiles</h1>', 'Empty profile state regressed to literal English.'],
  [
    entries.app,
    "translate('Publish rule list')",
    'Profile Rule List export action regressed to the observer translation layer.',
  ],
  [
    entries.app,
    "translate('Export PAC')",
    'Profile PAC export action regressed to the observer translation layer.',
  ],
  [
    entries.app,
    '`Exported ${result.exported.filename}.`',
    'Profile export status regressed to literal English.',
  ],
  [entries.autoDetect, '<h2>Auto Detect</h2>', 'Auto Detect title regressed to literal English.'],
  [
    entries.autoDetect,
    '>Fallback route',
    'Auto Detect fallback label regressed to literal English.',
  ],
  [
    entries.autoDetect,
    '>No fallback</option>',
    'Auto Detect fallback option regressed to literal English.',
  ],
  [
    entries.autoDetect,
    "candidate.kind === 'rule-list'",
    'Advanced Profile editor regressed to the superseded Rule List branch.',
  ],
  [
    entries.autoDetect,
    "profile?.kind === 'pac'",
    'Advanced Profile editor regressed to the superseded PAC branch.',
  ],
  [entries.app, '<h1>General</h1>', 'General heading regressed to literal English.'],
  [entries.app, '<h1>Interface</h1>', 'Interface heading regressed to literal English.'],
  [
    entries.app,
    "saving ? 'Working…' : 'Apply changes'",
    'Apply action regressed to literal English.',
  ],
  [entries.app, '<span>Discard changes</span>', 'Discard action regressed to literal English.'],
  [
    entries.app,
    "translate('Request diagnostics')",
    'General diagnostics regressed to the observer translation layer.',
  ],
  [
    entries.app,
    'errorMessage = messageFrom(error)',
    'Options must not render raw exception messages.',
  ],
  [
    entries.app,
    'errorMessage = response.message',
    'Options must not render raw backend response messages.',
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
  entries.app,
  'data-options-shell-locale={locale}',
  'Options shell must expose its typed locale.',
);
requireText(
  entries.app,
  'data-general-settings',
  'General settings must expose typed browser evidence.',
);
requireText(
  entries.app,
  'data-interface-settings',
  'Interface settings must expose typed browser evidence.',
);
requireText(entries.app, '<ThemePanel {locale}', 'Options must pass locale to Theme.');
requireText(entries.theme, 'data-theme-panel', 'Theme must expose typed browser evidence.');
requireText(entries.popup, 'data-popup-locale={locale}', 'Popup must expose its typed locale.');

requireText(
  entries.temporaryRules,
  "uiMessage('tempRules.deleteAria'",
  'Temporary Rules dynamic delete ARIA must be typed.',
);
requireText(
  entries.network,
  `uiMessage(
        'network.bounds'`,
  'Network diagnostics bounds must be a typed dynamic message.',
);
requireText(
  entries.chromiumE2e,
  'Temporary Rules typed locale coverage regressed',
  'Chromium Temporary Rules typed-locale coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'Network typed locale coverage regressed',
  'Chromium Network typed-locale coverage is missing.',
);
requireText(
  entries.firefoxE2e,
  '[data-temp-rules-manager][data-typed-locale="zh-TW"]',
  'Firefox Temporary Rules typed-locale coverage is missing.',
);
requireText(
  entries.firefoxE2e,
  '[data-network-diagnostics][data-typed-locale="zh-TW"]',
  'Firefox Network typed-locale coverage is missing.',
);

requireText(
  entries.app,
  `uiMessage(
        'options.exported'`,
  'Profile export status must use the typed dynamic message.',
);
requireText(
  entries.app,
  'data-builtin-settings data-typed-locale={locale}',
  'Built-in Profiles must expose typed browser evidence.',
);
requireText(
  entries.app,
  'data-about-settings data-typed-locale={locale}',
  'About must expose typed browser evidence.',
);
requireText(
  entries.app,
  `<VirtualProfileEditor
          {locale}`,
  'Options must pass locale to Virtual Profile.',
);
requireText(
  entries.chromiumE2e,
  'Normal Options typed locale coverage regressed',
  'Chromium normal Options typed-locale coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'Virtual Profile typed locale coverage regressed',
  'Chromium Virtual Profile typed-locale coverage is missing.',
);

requireText(
  entries.autoDetect,
  "uiText('autoDetect.fallbackAria', locale)",
  'Auto Detect fallback ARIA must use the typed catalog.',
);
requireText(
  entries.app,
  '<AdvancedProfileEditor\n          {locale}',
  'Options must pass locale to imported Auto Detect.',
);
requireText(
  entries.chromiumE2e,
  'Auto Detect typed locale coverage regressed',
  'Chromium imported Auto Detect typed-locale coverage is missing.',
);

requireText(
  entries.catalog,
  'export interface SourceUpdateFailureMessageParameters',
  'Stable source-update UI parameters are missing.',
);
requireText(
  entries.catalog,
  "'response-http-error':",
  'Code-specific source-update localization is missing.',
);
requireText(
  entries.attachedRuleList,
  'code: view.lastError.code',
  'Attached Rule List must render failure status from the stable code.',
);
requireText(
  entries.independentRuleList,
  'code: view.lastError.code',
  'Independent Rule List must render failure status from the stable code.',
);
requireText(
  entries.pac,
  'code: view.lastError.code',
  'PAC must render failure status from the stable code.',
);
requireText(
  entries.chromiumE2e,
  'ruleFailureRecord?.code',
  'Chromium stable Rule Source failure-code coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'pacFailureRecord?.code',
  'Chromium stable PAC failure-code coverage is missing.',
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
  'Popup typed locale coverage regressed',
  'Chromium Popup typed-locale coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  "locator('[data-theme-panel]')",
  'Chromium Theme typed-locale coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'Options General typed locale coverage regressed',
  'Chromium General typed-locale coverage is missing.',
);
requireText(
  entries.chromiumE2e,
  'Options Interface typed locale coverage regressed',
  'Chromium Interface typed-locale coverage is missing.',
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
