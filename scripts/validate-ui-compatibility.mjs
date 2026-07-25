import { readFile } from 'node:fs/promises';

const popupAppPath = 'apps/extension/src/entrypoints/popup/App.svelte';
const popupStylePath = 'apps/extension/src/entrypoints/popup/style.css';
const optionsAppPath = 'apps/extension/src/entrypoints/options/App.svelte';
const optionsStylePath = 'apps/extension/src/entrypoints/options/style.css';
const snapshotHistoryPath = 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte';

const [popupApp, popupStyle, optionsApp, optionsStyle, snapshotHistory] = await Promise.all([
  readFile(popupAppPath, 'utf8'),
  readFile(popupStylePath, 'utf8'),
  readFile(optionsAppPath, 'utf8'),
  readFile(optionsStylePath, 'utf8'),
  readFile(snapshotHistoryPath, 'utf8'),
]);

const requirements = [
  [
    popupApp.includes("import { browser } from 'wxt/browser'"),
    'Popup must use the WXT browser API wrapper.',
  ],
  [
    popupApp.includes('browser.runtime.openOptionsPage()'),
    'Popup settings must open the declared options page.',
  ],
  [
    popupApp.includes('onclick={openOptions}'),
    'Popup settings button must be wired to its click handler.',
  ],
  [
    !popupApp.includes('⚙'),
    'Popup must use a fixed SVG icon instead of a platform-dependent emoji glyph.',
  ],
  [
    popupApp.includes('class="popup-footer"'),
    'Popup must retain the familiar bottom options action area.',
  ],
  [
    popupStyle.includes("font-family: 'Segoe UI'"),
    'Popup must use explicit Windows typography for browser parity.',
  ],
  [popupStyle.includes('font-size: 13px'), 'Popup base type size must remain explicitly fixed.'],
  [popupStyle.includes('line-height: 1.35'), 'Popup line height must remain explicitly fixed.'],
  [popupStyle.includes('width: 300px'), 'Popup width must remain deterministic across browsers.'],
  [
    popupStyle.includes('.profile-list button:focus-visible'),
    'Popup route controls must expose visible keyboard focus.',
  ],
  [optionsApp.includes('class="sidebar"'), 'Options must retain familiar left profile navigation.'],
  [optionsApp.includes('class="actions"'), 'Options must retain top Apply/Revert actions.'],
  [
    optionsApp.includes('class="settings-section"'),
    'Options profile pages must use familiar flat settings sections.',
  ],
  [
    optionsStyle.includes("font-family: 'Segoe UI'"),
    'Options must use explicit Windows typography for browser parity.',
  ],
  [
    optionsStyle.includes('font-size: 14px'),
    'Options base type size must remain explicitly fixed.',
  ],
  [
    optionsStyle.includes('button:focus-visible'),
    'Options interactive controls must expose visible keyboard focus.',
  ],
  [
    optionsStyle.includes('@media (max-width: 760px)'),
    'Options must provide a narrow-screen single-column layout.',
  ],
  [
    !optionsStyle.includes('min-width: 860px'),
    'Options must not force a desktop-only minimum viewport width.',
  ],
  [
    snapshotHistory.includes('role="alertdialog"'),
    'Snapshot rollback must use an explicit confirmation dialog semantic.',
  ],
  [
    snapshotHistory.includes('Confirm rollback'),
    'Snapshot rollback must require an explicit second confirmation action.',
  ],
];

const failures = requirements.filter(([passed]) => !passed).map(([, message]) => message);

if (failures.length > 0) {
  console.error('UI compatibility validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  'UI compatibility guard passed: classic workflow, fixed typography, keyboard focus, responsive layout, and rollback confirmation are present.',
);
