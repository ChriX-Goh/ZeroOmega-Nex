import { readFile } from 'node:fs/promises';

const popupAppPath = 'apps/extension/src/entrypoints/popup/App.svelte';
const popupStylePath = 'apps/extension/src/entrypoints/popup/style.css';
const currentSitePath = 'apps/extension/src/lib/current-site.ts';
const optionsAppPath = 'apps/extension/src/entrypoints/options/App.svelte';
const optionsStylePath = 'apps/extension/src/entrypoints/options/style.css';
const snapshotHistoryPath = 'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte';
const legacyImportPath = 'apps/extension/src/entrypoints/options/LegacyImportPanel.svelte';
const themePanelPath = 'apps/extension/src/entrypoints/options/ThemePanel.svelte';
const fixedProfilePath = 'apps/extension/src/entrypoints/options/FixedProfileEditor.svelte';
const switchProfilePath = 'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte';
const attachedRuleListConfigPath =
  'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte';
const virtualProfilePath = 'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte';
const optionsHtmlPath = 'apps/extension/src/entrypoints/options/index.html';
const i18nPath = 'apps/extension/src/lib/i18n.ts';
const profileIconPath = 'apps/extension/src/components/ProfileIcon.svelte';
const manifestPath = 'apps/extension/wxt.config.ts';
const defaultsPath = 'packages/profile-workflow/src/defaults.ts';
const advancedProfileEditorPath =
  'apps/extension/src/entrypoints/options/AdvancedProfileEditor.svelte';
const advancedProfileOperationsPath =
  'packages/profile-workflow/src/advanced-profile-operations.ts';
const profileOperationsPath = 'packages/profile-workflow/src/profile-operations.ts';
const runtimePath = 'apps/extension/src/lib/profile-workflow-runtime.ts';
const workflowClientPath = 'apps/extension/src/lib/profile-workflow-client.ts';
const ruleSourceDownloaderPath = 'apps/extension/src/lib/rule-source-downloader.ts';
const ruleSourceSchedulerPath = 'apps/extension/src/lib/rule-source-scheduler.ts';
const ruleSourceUpdatePath = 'packages/profile-workflow/src/rule-source-update.ts';
const switchOperationsPath = 'packages/profile-workflow/src/switch-operations.ts';
const popupConditionPath = 'packages/profile-workflow/src/popup-condition.ts';
const switchSourcePath = 'packages/profile-workflow/src/switch-source.ts';
const attachedRuleListOperationsPath =
  'packages/profile-workflow/src/attached-rule-list-operations.ts';
const profileSpecTypesPath = 'packages/profile-spec/src/types.ts';
const legacyImportImplementationPath = 'packages/legacy-zeroomega/src/import.ts';
const profileSpecValidationPath = 'packages/profile-spec/src/validation.ts';
const profileSpecSerializationPath = 'packages/profile-spec/src/serialization.ts';
const workflowStatePath = 'packages/profile-workflow/src/state.ts';
const storageRepositoryPath = 'packages/profile-workflow/src/storage-repository.ts';

const [
  popupApp,
  popupStyle,
  currentSite,
  optionsApp,
  optionsStyle,
  snapshotHistory,
  legacyImport,
  themePanel,
  fixedProfile,
  switchProfile,
  attachedRuleListConfig,
  virtualProfile,
  optionsHtml,
  i18n,
  profileIcon,
  manifest,
  defaults,
  advancedProfileEditor,
  advancedProfileOperations,
  profileOperations,
  runtime,
  workflowClient,
  ruleSourceDownloader,
  ruleSourceScheduler,
  ruleSourceUpdate,
  switchOperations,
  popupCondition,
  switchSource,
  attachedRuleListOperations,
  profileSpecTypes,
  legacyImportImplementation,
  profileSpecValidation,
  profileSpecSerialization,
  workflowState,
  storageRepository,
] = await Promise.all([
  readFile(popupAppPath, 'utf8'),
  readFile(popupStylePath, 'utf8'),
  readFile(currentSitePath, 'utf8'),
  readFile(optionsAppPath, 'utf8'),
  readFile(optionsStylePath, 'utf8'),
  readFile(snapshotHistoryPath, 'utf8'),
  readFile(legacyImportPath, 'utf8'),
  readFile(themePanelPath, 'utf8'),
  readFile(fixedProfilePath, 'utf8'),
  readFile(switchProfilePath, 'utf8'),
  readFile(attachedRuleListConfigPath, 'utf8'),
  readFile(virtualProfilePath, 'utf8'),
  readFile(optionsHtmlPath, 'utf8'),
  readFile(i18nPath, 'utf8'),
  readFile(profileIconPath, 'utf8'),
  readFile(manifestPath, 'utf8'),
  readFile(defaultsPath, 'utf8'),
  readFile(advancedProfileEditorPath, 'utf8'),
  readFile(advancedProfileOperationsPath, 'utf8'),
  readFile(profileOperationsPath, 'utf8'),
  readFile(runtimePath, 'utf8'),
  readFile(workflowClientPath, 'utf8'),
  readFile(ruleSourceDownloaderPath, 'utf8'),
  readFile(ruleSourceSchedulerPath, 'utf8'),
  readFile(ruleSourceUpdatePath, 'utf8'),
  readFile(switchOperationsPath, 'utf8'),
  readFile(popupConditionPath, 'utf8'),
  readFile(switchSourcePath, 'utf8'),
  readFile(attachedRuleListOperationsPath, 'utf8'),
  readFile(profileSpecTypesPath, 'utf8'),
  readFile(legacyImportImplementationPath, 'utf8'),
  readFile(profileSpecValidationPath, 'utf8'),
  readFile(profileSpecSerializationPath, 'utf8'),
  readFile(workflowStatePath, 'utf8'),
  readFile(storageRepositoryPath, 'utf8'),
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
    popupApp.includes('data-popup-add-current-site') &&
      popupApp.includes('data-popup-condition-form') &&
      popupApp.includes("action: 'add-current-site-condition'") &&
      popupApp.includes('listPopupConditionResultRoutes') &&
      currentSite.includes("import { parse } from 'tldts'") &&
      currentSite.includes('allowPrivateDomains: true') &&
      currentSite.includes('parsedDomain.domain ?? hostname') &&
      currentSite.includes('suggestCurrentSiteCondition') &&
      popupCondition.includes('draft.settings.interface.addConditionsToBottom') &&
      popupCondition.includes('profile.rules.unshift(rule)') &&
      popupCondition.includes('profile.rules.push(rule)') &&
      popupCondition.includes('popupConditionTag(input.condition)') &&
      manifest.includes("'activeTab'"),
    'Popup must derive the current site with the public suffix list, add typed conditions only to the active Switch Profile, deduplicate by condition, honor top/bottom ordering, and use least-privilege activeTab access.',
  ],
  [
    popupStyle.includes("font-family: 'Segoe UI'"),
    'Popup must use explicit Windows typography for browser parity.',
  ],
  [popupStyle.includes('font-size: 13px'), 'Popup base type size must remain explicitly fixed.'],
  [popupStyle.includes('line-height: 1.35'), 'Popup line height must remain explicitly fixed.'],
  [
    popupStyle.includes('width: 320px'),
    'Popup width must remain deterministic and provide room for larger icons.',
  ],
  [
    popupStyle.includes('.profile-list button:focus-visible'),
    'Popup route controls must expose visible keyboard focus.',
  ],
  [
    ['zh-CN', 'zh-TW', "return 'en'"].every((entry) => i18n.includes(entry)),
    'Options and Popup must auto-select Simplified Chinese, Traditional Chinese, or English fallback.',
  ],
  [
    manifest.includes("default_locale: 'en'") &&
      manifest.includes('default_icon: icons') &&
      ['16.png', '32.png', '48.png', '128.png'].every((entry) => manifest.includes(entry)),
    'The browser manifest must expose localized metadata and toolbar icons at all standard sizes.',
  ],
  [
    popupApp.includes('import ProfileIcon') &&
      popupApp.includes('normalizedRoutes') &&
      popupApp.includes('applyThemeMode(readThemeMode())'),
    'Popup must show type icons, retain built-in ordering, and share the selected theme.',
  ],
  [
    profileIcon.includes("kind === 'fixed'") && profileIcon.includes("kind === 'switch'"),
    'Profile rows must use distinct type icons instead of plain color blocks.',
  ],
  [
    defaults.indexOf("{ kind: 'direct' }") < defaults.indexOf("{ kind: 'system' }"),
    'Default Popup order must list Direct before System Proxy.',
  ],
  [optionsApp.includes('class="sidebar"'), 'Options must retain familiar left profile navigation.'],
  [
    optionsApp.includes('class="nav-group actions"'),
    'Options must retain original sidebar Apply/Discard actions.',
  ],
  [
    optionsHtml.includes('name="manifest.open_in_tab" content="true"'),
    'Options must open as a complete browser tab instead of an embedded extension dialog.',
  ],
  [
    ['Settings', 'Profiles', 'Actions', 'Built-in Profiles', 'New profile…'].every((label) =>
      optionsApp.includes(label),
    ),
    'Options must preserve the original ZeroOmega navigation groups and profile workflow.',
  ],
  [
    optionsApp.includes("activeSection === 'general'") &&
      optionsApp.includes("activeSection === 'profile'"),
    'General settings and profile details must be independent routed pages.',
  ],
  [
    legacyImport.includes('aria-label="Legacy backup file"') &&
      legacyImport.includes('Import and use now'),
    'Original ZeroOmega backups must support file-first one-step import and activation.',
  ],
  [
    ['Automatic', 'Light', 'Dark'].every((label) => themePanel.includes(label)),
    'Options must provide Automatic, Light, and Dark appearance modes.',
  ],
  [
    ['fallback', 'http', 'https', 'ftp'].every((scheme) =>
      fixedProfile.includes(`key: '${scheme}'`),
    ) &&
      fixedProfile.includes('Show Advanced') &&
      fixedProfile.includes('Proxy Authentication') &&
      fixedProfile.includes('fallbackPlaceholder'),
    'Fixed Profile must preserve the original default/HTTP/HTTPS/FTP table, advanced rows, inherited placeholders, and per-row authentication.',
  ],

  [
    switchProfile.includes('data-switch-rules-table') &&
      switchProfile.includes('data-switch-rule-row') &&
      switchProfile.includes('data-switch-drag-handle') &&
      switchProfile.includes('Condition help') &&
      switchProfile.includes('<optgroup label={group.label}>') &&
      switchProfile.includes('Default profile') &&
      !switchProfile.includes('Ordered Switch Profile rules'),
    'Switch Profile must use the original compact rule table, grouped condition help, drag handle, and table-bottom default row.',
  ],
  [
    switchProfile.includes('data-switch-source-toggle') &&
      switchProfile.includes('data-switch-source-editor') &&
      switchProfile.includes('data-switch-source-error') &&
      switchProfile.includes('onRegisterBeforeAction') &&
      switchProfile.includes('onSourceDirtyChange') &&
      optionsApp.includes('commitActiveProfileEditor') &&
      optionsApp.includes('profileEditorDirty') &&
      optionsApp.includes('onRegisterBeforeAction={registerBeforeProfileEditorAction}') &&
      switchSource.includes('export function composeSwitchProfileSource') &&
      switchSource.includes('export function parseSwitchProfileSourceDraft') &&
      switchSource.includes("const HEADER = '[SwitchyOmega Conditions]'") &&
      switchSource.includes("const WITH_RESULT = '@with result'") &&
      switchSource.includes("lines.push('', `* +${defaultName}`, '')") &&
      !switchProfile.includes('Rule enabled') &&
      !switchProfile.includes('regular-expression flags'),
    'Switch Profile must provide the original result-enabled source editor, block invalid source on Apply/navigation, and avoid Nex-only enable/regex-flags controls.',
  ],
  [
    profileSpecTypes.includes('attachedRuleListProfileId?: Identifier') &&
      profileSpecTypes.includes("{ kind: 'url'; url: string; content?: string }") &&
      attachedRuleListOperations.includes('export function createAttachedRuleListDraft') &&
      attachedRuleListOperations.includes('export function setAttachedRuleListEnabledDraft') &&
      attachedRuleListOperations.includes('export function detachAttachedRuleListDraft') &&
      attachedRuleListOperations.includes('`__ruleListOf_${owner.name}`') &&
      switchProfile.includes('data-attached-rule-list-row') &&
      switchProfile.includes('data-attach-rule-list-section') &&
      attachedRuleListConfig.includes('data-attached-rule-list-config') &&
      attachedRuleListConfig.includes('data-attached-rule-list-headers') &&
      attachedRuleListConfig.includes('$: headerItems = state?.source.headers ?? []') &&
      attachedRuleListConfig.includes('{#each headerItems as header') &&
      !attachedRuleListConfig.includes('function headers()') &&
      optionsApp.includes('attachedRuleListProfileIds') &&
      virtualProfile.includes('attachedRuleListProfileIds') &&
      legacyImportImplementation.includes('profile.attached-rule-list-linked') &&
      legacyImportImplementation.includes('rule-source.downloaded-cache-preserved') &&
      profileSpecValidation.includes('profile.external-attached-rule-list-reference') &&
      profileOperations.includes('duplicateSwitchProfileResources') &&
      profileOperations.includes('deleted.attachedRuleListProfileId'),
    'Switch attached Rule Lists must be hidden owned profiles with source-backed lifecycle, import reconstruction, cached URL content, duplication, and cascading deletion.',
  ],
  [
    attachedRuleListConfig.includes('data-rule-source-update-now') &&
      attachedRuleListConfig.includes('data-rule-source-update-status') &&
      attachedRuleListConfig.includes('Existing cached content was preserved') &&
      optionsApp.includes("action: 'update-rule-source'") &&
      optionsApp.includes('requestRuleSourceOriginPermission') &&
      runtime.includes('BrowserRuleSourceDownloader') &&
      ruleSourceDownloader.includes("credentials: 'omit'") &&
      ruleSourceDownloader.includes("cache: 'no-store'") &&
      ruleSourceDownloader.includes("referrerPolicy: 'no-referrer'") &&
      ruleSourceUpdate.includes('RULE_SOURCE_UPDATE_TIMEOUT_MS = 10_000') &&
      ruleSourceUpdate.includes('RULE_SOURCE_UPDATE_MAX_BYTES = 4 * 1024 * 1024') &&
      ruleSourceUpdate.includes('repository.compareAndSwap(current.generation, next)') &&
      ruleSourceUpdate.includes('Rule Source request header') &&
      ruleSourceUpdate.includes('old cached content') === false,
    'Remote Rule Sources must use background-only bounded downloads, user-granted host permission, safe secret headers, atomic CAS replacement, and preserved old cache on failure.',
  ],
  [
    manifest.includes("permissions: ['proxy', 'storage', 'alarms', 'activeTab']") &&
      runtime.includes('registerRuleSourceScheduler') &&
      ruleSourceScheduler.includes(
        "RULE_SOURCE_UPDATE_ALARM_NAME = 'zeroomega-nex/rule-source-update-scan'",
      ) &&
      ruleSourceScheduler.includes('RULE_SOURCE_UPDATE_SCAN_PERIOD_MINUTES = 1') &&
      ruleSourceScheduler.includes('listDueProfileWorkflowRuleSourceUpdates') &&
      ruleSourceScheduler.includes('api.permissions.contains') &&
      ruleSourceScheduler.includes('if (running) return running') &&
      ruleSourceUpdate.includes('export function listDueProfileWorkflowRuleSourceUpdates'),
    'Remote Rule Sources must use one coalesced alarm scheduler, scan on startup, refresh only due sources with existing host permission, and wait each interval after success or failure.',
  ],
  [
    workflowClient.includes('PROFILE_WORKFLOW_STATE_STORAGE_KEY') &&
      workflowClient.includes('subscribeProfileWorkflowStateChanges') &&
      workflowClient.includes("areaName === 'local'") &&
      workflowClient.includes('changes[PROFILE_WORKFLOW_STATE_STORAGE_KEY]?.newValue') &&
      optionsApp.includes('parseProfileWorkflowState(value)') &&
      optionsApp.includes('inspectProfileWorkflow(nextState)') &&
      optionsApp.includes('subscribeProfileWorkflowStateChanges') &&
      !optionsApp.includes('workflowRefreshPending'),
    'Options must synchronously consume validated background workflow-state changes without interrupting chained commands or rebuilding the persistent Switch source editor instance.',
  ],
  [
    !switchOperations.includes('`${source.note} copy`') &&
      switchOperations.includes('...structuredClone(source)'),
    'Cloning a Switch rule must preserve the original note exactly instead of adding a Nex-only suffix.',
  ],
  [
    switchOperations.includes('const template = profile.rules.at(-1);') &&
      switchOperations.includes('...structuredClone(template)') &&
      switchOperations.includes('profile.rules.push(rule);') &&
      !switchOperations
        .slice(
          switchOperations.indexOf('export function addSwitchRuleDraft'),
          switchOperations.indexOf('export function duplicateSwitchRuleDraft'),
        )
        .includes('addConditionsToBottom'),
    'Options-added Switch rules must append and copy the previous rule; the Popup insertion preference must not control the editor button.',
  ],
  [
    profileSpecValidation.includes("options.mode === 'draft' ? 'warning' : 'error'") &&
      profileSpecValidation.includes('export function validateProfileSpecDraft') &&
      profileSpecSerialization.includes('export function cloneProfileSpecDraft') &&
      profileSpecSerialization.includes('export function serializeProfileSpecDraft') &&
      workflowState.includes('cloneProfileSpecDraft(state.draft)') &&
      workflowState.includes('createProfileSpecRevision(state.applied') &&
      storageRepository.includes("parseProfileSpecDraft(state.draft, 'draft')") &&
      [fixedProfile, switchProfile, virtualProfile, advancedProfileEditor, optionsApp].every(
        (source) => source.includes('cloneProfileSpecDraft'),
      ),
    'Draft editing must allow temporary Switch condition warnings while strict Applied, storage revision, import, and Apply boundaries remain separate.',
  ],
  [
    switchOperations.includes("return { kind: 'host-wildcard', pattern: '' };") &&
      switchOperations.includes("if ('pattern' in rule.condition) rule.condition.pattern = '';") &&
      !switchOperations.includes("pattern: '*.example.com'"),
    'Options-added Switch text conditions must start blank and copied text rules must clear their pattern like the original editor.',
  ],
  [
    profileOperations.includes('proxyByScheme: {}') &&
      profileOperations.includes("pattern: '[::1]'") &&
      !profileOperations
        .slice(
          profileOperations.indexOf('export function createFixedProfileDraft'),
          profileOperations.indexOf('export function duplicateProfileDraft'),
        )
        .includes("host: '127.0.0.1'"),
    'New Fixed Profiles must begin without an example proxy endpoint and retain the original local bypass defaults.',
  ],
  [
    runtime.includes('initialProfile.proxyByScheme = {}') &&
      runtime.includes('initial.proxyEndpoints = []'),
    'Fresh browser installation must not turn an example proxy server into user configuration.',
  ],
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
    optionsStyle.includes('@media (max-width: 760px)') &&
      optionsStyle.includes('@media (prefers-color-scheme: dark)'),
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
  [
    optionsApp.includes('class="settings-section global-error"'),
    'Options must surface background errors independently of the selected section.',
  ],
  [
    snapshotHistory.includes('Extension reference-safety check plus browser install confirmation'),
    'Snapshot history must disclose browser-safe runtime verification mode.',
  ],
  [
    !advancedProfileEditor.includes('https://example.invalid/') &&
      !advancedProfileEditor.includes('! Add rules here.') &&
      !advancedProfileEditor.includes("value: 'ZeroOmega Nex'"),
    'Profile source controls must create blank URL, rule text, and request-header values.',
  ],
  [
    !advancedProfileOperations.includes('! Add AutoProxy rules here.'),
    'New Rule List profiles must not persist instructional text as rule data.',
  ],
];

const failures = requirements.filter(([passed]) => !passed).map(([, message]) => message);

if (failures.length > 0) {
  console.error('UI compatibility validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  'UI compatibility guard passed: original navigation, full-tab pages, direct legacy import, automatic theme, keyboard focus, responsive layout, and rollback confirmation are present.',
);
