from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


def replace_all(path: str, old: str, new: str, expected: int) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(f'{path}: expected {expected} matches, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new))


path = 'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte'
replace_once(
    path,
    "  import { onMount } from 'svelte';\n\n  import AttachedRuleListConfig",
    "  import { onMount } from 'svelte';\n\n  import { currentAppLocale, type AppLocale } from '../../lib/i18n';\n  import { uiMessage, uiText, type UiTextKey } from '../../lib/ui-messages';\n  import AttachedRuleListConfig",
)
replace_once(
    path,
    '''  export let spec: ProfileSpec;
  export let profileId: string;
''',
    '''  export let spec: ProfileSpec;
  export let profileId: string;
  export let locale: AppLocale = currentAppLocale();
''',
)

old_groups = r'''  interface ConditionKindOption {
    readonly value: Condition['kind'];
    readonly label: string;
    readonly help: string;
  }

  interface ConditionGroup {
    readonly label: string;
    readonly options: readonly ConditionKindOption[];
  }

  const basicConditionGroups: readonly ConditionGroup[] = [
    {
      label: 'Basic conditions',
      options: [
        {
          value: 'host-wildcard',
          label: 'Host wildcard',
          help: 'Match a hostname pattern such as *.example.com.',
        },
        {
          value: 'url-wildcard',
          label: 'URL wildcard',
          help: 'Match a complete URL wildcard pattern.',
        },
        {
          value: 'url-regex',
          label: 'URL regular expression',
          help: 'Match a complete URL using a regular expression.',
        },
        {
          value: 'false',
          label: 'Never',
          help: 'Keep a disabled placeholder rule without deleting it.',
        },
      ],
    },
  ];

  const advancedConditionGroups: readonly ConditionGroup[] = [
    {
      label: 'Host',
      options: [
        {
          value: 'host-wildcard',
          label: 'Host wildcard',
          help: 'Match a hostname wildcard without path or port details.',
        },
        {
          value: 'host-regex',
          label: 'Host regular expression',
          help: 'Match the hostname using a regular expression.',
        },
        {
          value: 'host-levels',
          label: 'Host levels',
          help: 'Match hostnames whose label count falls inside a range.',
        },
        {
          value: 'ip',
          label: 'IP network',
          help: 'Match an IPv4 or IPv6 network and prefix length.',
        },
        {
          value: 'bypass',
          label: 'Bypass pattern',
          help: 'Match a browser bypass-list pattern.',
        },
      ],
    },
    {
      label: 'URL',
      options: [
        {
          value: 'url-wildcard',
          label: 'URL wildcard',
          help: 'Match a complete URL wildcard pattern.',
        },
        {
          value: 'url-regex',
          label: 'URL regular expression',
          help: 'Match a complete URL using a regular expression.',
        },
        {
          value: 'keyword',
          label: 'URL keyword',
          help: 'Match an HTTP URL containing a keyword.',
        },
      ],
    },
    {
      label: 'Special',
      options: [
        {
          value: 'weekday',
          label: 'Weekday',
          help: 'Match selected local weekdays.',
        },
        {
          value: 'time',
          label: 'Local time',
          help: 'Match a local-time hour range.',
        },
        {
          value: 'true',
          label: 'Always',
          help: 'Always match. Imported profiles may retain this explicit form.',
        },
        {
          value: 'false',
          label: 'Never',
          help: 'Never match; useful as a retained placeholder.',
        },
      ],
    },
  ];
'''
new_groups = r'''  interface ConditionKindOption {
    readonly value: Condition['kind'];
    readonly labelKey: UiTextKey;
    readonly helpKey: UiTextKey;
  }

  interface ConditionGroup {
    readonly labelKey: UiTextKey;
    readonly options: readonly ConditionKindOption[];
  }

  const basicConditionGroups: readonly ConditionGroup[] = [
    {
      labelKey: 'switch.group.basic',
      options: [
        { value: 'host-wildcard', labelKey: 'switch.condition.hostWildcard', helpKey: 'switch.condition.hostWildcardHelp' },
        { value: 'url-wildcard', labelKey: 'switch.condition.urlWildcard', helpKey: 'switch.condition.urlWildcardHelp' },
        { value: 'url-regex', labelKey: 'switch.condition.urlRegex', helpKey: 'switch.condition.urlRegexHelp' },
        { value: 'false', labelKey: 'switch.condition.never', helpKey: 'switch.condition.neverHelp' },
      ],
    },
  ];

  const advancedConditionGroups: readonly ConditionGroup[] = [
    {
      labelKey: 'switch.group.host',
      options: [
        { value: 'host-wildcard', labelKey: 'switch.condition.hostWildcard', helpKey: 'switch.condition.hostWildcardHelp' },
        { value: 'host-regex', labelKey: 'switch.condition.hostRegex', helpKey: 'switch.condition.hostRegexHelp' },
        { value: 'host-levels', labelKey: 'switch.condition.hostLevels', helpKey: 'switch.condition.hostLevelsHelp' },
        { value: 'ip', labelKey: 'switch.condition.ip', helpKey: 'switch.condition.ipHelp' },
        { value: 'bypass', labelKey: 'switch.condition.bypass', helpKey: 'switch.condition.bypassHelp' },
      ],
    },
    {
      labelKey: 'switch.group.url',
      options: [
        { value: 'url-wildcard', labelKey: 'switch.condition.urlWildcard', helpKey: 'switch.condition.urlWildcardHelp' },
        { value: 'url-regex', labelKey: 'switch.condition.urlRegex', helpKey: 'switch.condition.urlRegexHelp' },
        { value: 'keyword', labelKey: 'switch.condition.keyword', helpKey: 'switch.condition.keywordHelp' },
      ],
    },
    {
      labelKey: 'switch.group.special',
      options: [
        { value: 'weekday', labelKey: 'switch.condition.weekday', helpKey: 'switch.condition.weekdayHelp' },
        { value: 'time', labelKey: 'switch.condition.time', helpKey: 'switch.condition.timeHelp' },
        { value: 'true', labelKey: 'switch.condition.always', helpKey: 'switch.condition.alwaysHelp' },
        { value: 'false', labelKey: 'switch.condition.never', helpKey: 'switch.condition.neverHelp' },
      ],
    },
  ];
'''
replace_once(path, old_groups, new_groups)
replace_once(
    path,
    '''  const weekdays: readonly { value: Weekday; label: string }[] = [
    { value: 'sun', label: 'Sun' },
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
  ];
''',
    '''  const weekdays: readonly { value: Weekday; labelKey: UiTextKey }[] = [
    { value: 'sun', labelKey: 'switch.weekday.sun' },
    { value: 'mon', labelKey: 'switch.weekday.mon' },
    { value: 'tue', labelKey: 'switch.weekday.tue' },
    { value: 'wed', labelKey: 'switch.weekday.wed' },
    { value: 'thu', labelKey: 'switch.weekday.thu' },
    { value: 'fri', labelKey: 'switch.weekday.fri' },
    { value: 'sat', labelKey: 'switch.weekday.sat' },
  ];
''',
)
replace_once(
    path,
    '''      !globalThis.confirm(
        'Delete the attached Rule List? The Switch default route will be restored before removal.',
      )
''',
    "      !globalThis.confirm(uiText('switch.detachConfirm', locale))\n",
)
replace_once(
    path,
    '''  function sourceErrorText(value: SwitchSourceError): string {
    const location = value.line === undefined ? '' : `Line ${value.line}: `;
    return `${location}${value.message}`;
  }
''',
    '''  function sourceErrorText(value: SwitchSourceError): string {
    return uiMessage('switch.sourceError', { code: value.code, line: value.line }, locale);
  }
''',
)

replacements = {
    '<section class="settings-section condition-help-section" data-switch-condition-help>': '<section class="settings-section condition-help-section" data-switch-condition-help data-typed-locale={locale}>',
    '<h2>Condition help</h2>': "<h2>{uiText('switch.conditionHelp', locale)}</h2>",
    'aria-label="Close condition help"': "aria-label={uiText('switch.closeConditionHelp', locale)}",
    '{#each conditionGroups as group, groupIndex (group.label)}': '{#each conditionGroups as group, groupIndex (group.labelKey)}',
    '<summary>{group.label}</summary>': '<summary>{uiText(group.labelKey, locale)}</summary>',
    '<dt>{option.label}</dt>': '<dt>{uiText(option.labelKey, locale)}</dt>',
    '<dd>{option.help}</dd>': '<dd>{uiText(option.helpKey, locale)}</dd>',
    'data-switch-source-mode={editSource ? \'source\' : \'table\'}': "data-switch-source-mode={editSource ? 'source' : 'table'}\n    data-typed-locale={locale}",
    '<h2>Switch rules</h2>': "<h2>{uiText('switch.rules', locale)}</h2>",
    'Rules are evaluated from top to bottom. The first matching rule selects its result\n          profile.': "{uiText('switch.rulesHelp', locale)}",
    '✎ Edit Source': "✎ {uiText('switch.editSource', locale)}",
    '? Condition help': "? {uiText('switch.conditionHelp', locale)}",
    'Full-URL conditions depend on browser request information and may be limited for some\n        requests.': "{uiText('switch.urlWarning', locale)}",
    'aria-label="Switch Profile source"': "aria-label={uiText('switch.source', locale)}",
    'Uses the original result-enabled SwitchyOmega conditions format. Invalid source remains in\n          this editor until corrected.': "{uiText('switch.sourceHelp', locale)}",
    'rel="noreferrer">Format help</a': "rel=\"noreferrer\">{uiText('switch.formatHelp', locale)}</a",
    '<th scope="col">Sort</th>': "<th scope=\"col\">{uiText('switch.sort', locale)}</th>",
    '<th scope="col">Condition type</th>': "<th scope=\"col\">{uiText('switch.conditionType', locale)}</th>",
    '<th scope="col">Condition details</th>': "<th scope=\"col\">{uiText('switch.conditionDetails', locale)}</th>",
    '<th scope="col">Result profile</th>': "<th scope=\"col\">{uiText('switch.resultProfile', locale)}</th>",
    '<th scope="col">Actions</th>': "<th scope=\"col\">{uiText('switch.actions', locale)}</th>",
    '{#if showNotes}<th scope="col">Note</th>{/if}': "{#if showNotes}<th scope=\"col\">{uiText('switch.note', locale)}</th>{/if}",
    'title="Drag to reorder"': "title={uiText('switch.dragToReorder', locale)}",
    'aria-label={`Drag rule ${index + 1} to reorder`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'drag' }, locale)}",
    'aria-label={`Move rule ${index + 1} up`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'moveUp' }, locale)}",
    'aria-label={`Move rule ${index + 1} down`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'moveDown' }, locale)}",
    'aria-label={`Rule ${index + 1} condition type`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'conditionType' }, locale)}",
    '{#each conditionGroups as group (group.label)}': '{#each conditionGroups as group (group.labelKey)}',
    '<optgroup label={group.label}>': '<optgroup label={uiText(group.labelKey, locale)}>',
    '<option value={option.value}>{option.label}</option>': '<option value={option.value}>{uiText(option.labelKey, locale)}</option>',
    '<span>Always matches</span>': "<span>{uiText('switch.alwaysMatches', locale)}</span>",
    '<span>Never matches</span>': "<span>{uiText('switch.neverMatches', locale)}</span>",
    'aria-label={`Rule ${index + 1} pattern`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'pattern' }, locale)}",
    'aria-label={`Rule ${index + 1} IP address`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'ipAddress' }, locale)}",
    'aria-label={`Rule ${index + 1} prefix length`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'prefixLength' }, locale)}",
    'aria-label={`Rule ${index + 1} minimum host levels`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'minimumHostLevels' }, locale)}",
    'aria-label={`Rule ${index + 1} maximum host levels`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'maximumHostLevels' }, locale)}",
    '<span>to</span>': "<span>{uiText('switch.rangeTo', locale)}</span>",
    'aria-label={`Rule ${index + 1} weekdays`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'weekdays' }, locale)}",
    '{day.label}': '{uiText(day.labelKey, locale)}',
    'aria-label={`Rule ${index + 1} start hour`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'startHour' }, locale)}",
    'aria-label={`Rule ${index + 1} end hour`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'endHour' }, locale)}",
    'Legacy Nex-only rule state cannot be represented in original source format.': "{uiText('switch.legacyWarning', locale)}",
    'aria-label={`Rule ${index + 1} result profile`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'resultProfile' }, locale)}",
    'title="Delete rule"': "title={uiText('switch.deleteRule', locale)}",
    'aria-label={`Delete rule ${index + 1}`}': "aria-label={uiMessage('switch.ruleActionAria', { index: index + 1, action: 'delete' }, locale)}",
    'title="Clone rule"': "title={uiText('switch.cloneRule', locale)}",
    'aria-label={`Clone rule ${index + 1}`}': "aria-label={uiMessage('switch.ruleActionAria', { index: index + 1, action: 'clone' }, locale)}",
    'title="Remove legacy Nex-only rule state"': "title={uiText('switch.normalizeRuleTitle', locale)}",
    'aria-label={`Normalize rule ${index + 1} for source editing`}': "aria-label={uiMessage('switch.ruleActionAria', { index: index + 1, action: 'normalize' }, locale)}",
    '>Normalize</button': ">{uiText('switch.normalizeRule', locale)}</button",
    'title="Add note"': "title={uiText('switch.addNote', locale)}",
    'aria-label={`Show note for rule ${index + 1}`}': "aria-label={uiMessage('switch.ruleActionAria', { index: index + 1, action: 'showNote' }, locale)}",
    'aria-label={`Rule ${index + 1} note`}': "aria-label={uiMessage('switch.ruleFieldAria', { index: index + 1, field: 'note' }, locale)}",
    'placeholder="Optional note"': "placeholder={uiText('switch.optionalNote', locale)}",
    'No conditions. Requests use the default profile below.': "{uiText('switch.empty', locale)}",
    '＋ Add condition': "＋ {uiText('switch.addCondition', locale)}",
    'Use attached Rule List': "{uiText('switch.attachedUse', locale)}",
    "? 'Matching attached rules use the selected result profile.'\n                    : 'Attached rules are retained but bypassed.'": "? uiText('switch.attachedEnabled', locale)\n                    : uiText('switch.attachedDisabled', locale)",
    'aria-label="Attached Rule List matching route"': "aria-label={uiText('switch.attachedMatchRoute', locale)}",
    'aria-label="Delete attached Rule List"': "aria-label={uiText('switch.deleteAttached', locale)}",
    '<th scope="row" colspan="2">Default profile</th>': "<th scope=\"row\" colspan=\"2\">{uiText('switch.defaultProfile', locale)}</th>",
    'aria-label="Switch Profile default route"': "aria-label={uiText('switch.defaultRouteAria', locale)}",
    '<h2>Attach Profile</h2>': "<h2>{uiText('switch.attachTitle', locale)}</h2>",
    'Attach a hidden Rule List Profile to extend this Switch Profile without adding another\n        normal navigation entry.': "{uiText('switch.attachHelp', locale)}",
    '＋ Attach Rule List': "＋ {uiText('switch.attachButton', locale)}",
}
for old, new in replacements.items():
    replace_once(path, old, new)
replace_all(path, '<option value="direct">Direct</option>', "<option value=\"direct\">{uiText('route.direct', locale)}</option>", 3)
replace_all(path, '<option value="system">System Proxy</option>', "<option value=\"system\">{uiText('route.system', locale)}</option>", 3)
replace_once(
    path,
    '''    <AttachedRuleListConfig
      {spec}
''',
    '''    <AttachedRuleListConfig
      {locale}
      {spec}
''',
)
