from __future__ import annotations

from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new))


def replace_row(path: Path, row_id: str, replacement: str) -> None:
    lines = path.read_text().splitlines()
    matches = [index for index, line in enumerate(lines) if line.startswith(f'| {row_id} ')]
    if len(matches) != 1:
        raise SystemExit(f'{row_id} row matches: {len(matches)}')
    lines[matches[0]] = replacement
    path.write_text('\n'.join(lines) + '\n')


catalog = Path('apps/extension/src/lib/switch-condition-catalog.ts')
catalog.write_text("""import type { Condition } from '@zeroomega-nex/profile-spec';

import type { UiTextKey } from './ui-messages';

export type OriginalSwitchSelectableConditionKind = Exclude<
  Condition['kind'],
  'true' | 'bypass'
>;
export type SourceOnlySwitchConditionKind = Extract<Condition['kind'], 'true' | 'bypass'>;

export interface SwitchConditionOption {
  readonly value: OriginalSwitchSelectableConditionKind;
  readonly labelKey: UiTextKey;
  readonly helpKey: UiTextKey;
}

export interface SwitchConditionGroup {
  readonly labelKey: UiTextKey;
  readonly options: readonly SwitchConditionOption[];
}

export const ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS: readonly SwitchConditionGroup[] = [
  {
    labelKey: 'switch.group.basic',
    options: [
      {
        value: 'host-wildcard',
        labelKey: 'switch.condition.hostWildcard',
        helpKey: 'switch.condition.hostWildcardHelp',
      },
      {
        value: 'url-wildcard',
        labelKey: 'switch.condition.urlWildcard',
        helpKey: 'switch.condition.urlWildcardHelp',
      },
      {
        value: 'url-regex',
        labelKey: 'switch.condition.urlRegex',
        helpKey: 'switch.condition.urlRegexHelp',
      },
      {
        value: 'false',
        labelKey: 'switch.condition.never',
        helpKey: 'switch.condition.neverHelp',
      },
    ],
  },
];

export const ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS: readonly SwitchConditionGroup[] = [
  {
    labelKey: 'switch.group.host',
    options: [
      {
        value: 'host-wildcard',
        labelKey: 'switch.condition.hostWildcard',
        helpKey: 'switch.condition.hostWildcardHelp',
      },
      {
        value: 'host-regex',
        labelKey: 'switch.condition.hostRegex',
        helpKey: 'switch.condition.hostRegexHelp',
      },
      {
        value: 'host-levels',
        labelKey: 'switch.condition.hostLevels',
        helpKey: 'switch.condition.hostLevelsHelp',
      },
      { value: 'ip', labelKey: 'switch.condition.ip', helpKey: 'switch.condition.ipHelp' },
    ],
  },
  {
    labelKey: 'switch.group.url',
    options: [
      {
        value: 'url-wildcard',
        labelKey: 'switch.condition.urlWildcard',
        helpKey: 'switch.condition.urlWildcardHelp',
      },
      {
        value: 'url-regex',
        labelKey: 'switch.condition.urlRegex',
        helpKey: 'switch.condition.urlRegexHelp',
      },
      {
        value: 'keyword',
        labelKey: 'switch.condition.keyword',
        helpKey: 'switch.condition.keywordHelp',
      },
    ],
  },
  {
    labelKey: 'switch.group.special',
    options: [
      {
        value: 'weekday',
        labelKey: 'switch.condition.weekday',
        helpKey: 'switch.condition.weekdayHelp',
      },
      { value: 'time', labelKey: 'switch.condition.time', helpKey: 'switch.condition.timeHelp' },
      {
        value: 'false',
        labelKey: 'switch.condition.never',
        helpKey: 'switch.condition.neverHelp',
      },
    ],
  },
];

export const ORIGINAL_SWITCH_BASIC_CONDITION_KINDS = ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS.flatMap(
  (group) => group.options.map((option) => option.value),
);

export const ORIGINAL_SWITCH_ADVANCED_CONDITION_KINDS =
  ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS.flatMap((group) =>
    group.options.map((option) => option.value),
  );

export const SOURCE_ONLY_SWITCH_CONDITION_KINDS: readonly SourceOnlySwitchConditionKind[] = [
  'true',
  'bypass',
];

const selectableKinds = new Set<Condition['kind']>(ORIGINAL_SWITCH_ADVANCED_CONDITION_KINDS);
const sourceOnlyKinds = new Set<Condition['kind']>(SOURCE_ONLY_SWITCH_CONDITION_KINDS);

export function isOriginalSwitchSelectableConditionKind(
  kind: Condition['kind'],
): kind is OriginalSwitchSelectableConditionKind {
  return selectableKinds.has(kind);
}

export function isSourceOnlySwitchConditionKind(
  kind: Condition['kind'],
): kind is SourceOnlySwitchConditionKind {
  return sourceOnlyKinds.has(kind);
}

export function sourceOnlySwitchConditionLabelKey(
  kind: SourceOnlySwitchConditionKind,
): UiTextKey {
  return kind === 'true' ? 'switch.condition.always' : 'switch.condition.bypass';
}
""")

catalog_test = Path('apps/extension/src/lib/switch-condition-catalog.test.ts')
catalog_test.write_text("""import { describe, expect, it } from 'vitest';

import {
  ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS,
  ORIGINAL_SWITCH_ADVANCED_CONDITION_KINDS,
  ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS,
  ORIGINAL_SWITCH_BASIC_CONDITION_KINDS,
  SOURCE_ONLY_SWITCH_CONDITION_KINDS,
  isOriginalSwitchSelectableConditionKind,
  isSourceOnlySwitchConditionKind,
} from './switch-condition-catalog';

describe('original ZeroOmega Switch condition catalog', () => {
  it('matches the source-backed basic and advanced controller groups exactly', () => {
    expect(ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS.map((group) => group.options.map((item) => item.value))).toEqual([
      ['host-wildcard', 'url-wildcard', 'url-regex', 'false'],
    ]);
    expect(ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS.map((group) => group.options.map((item) => item.value))).toEqual([
      ['host-wildcard', 'host-regex', 'host-levels', 'ip'],
      ['url-wildcard', 'url-regex', 'keyword'],
      ['weekday', 'time', 'false'],
    ]);
    expect(ORIGINAL_SWITCH_BASIC_CONDITION_KINDS).toEqual([
      'host-wildcard',
      'url-wildcard',
      'url-regex',
      'false',
    ]);
    expect(ORIGINAL_SWITCH_ADVANCED_CONDITION_KINDS).toEqual([
      'host-wildcard',
      'host-regex',
      'host-levels',
      'ip',
      'url-wildcard',
      'url-regex',
      'keyword',
      'weekday',
      'time',
      'false',
    ]);
  });

  it('keeps True and Bypass as source/import compatibility kinds only', () => {
    expect(SOURCE_ONLY_SWITCH_CONDITION_KINDS).toEqual(['true', 'bypass']);
    expect(isOriginalSwitchSelectableConditionKind('true')).toBe(false);
    expect(isOriginalSwitchSelectableConditionKind('bypass')).toBe(false);
    expect(isSourceOnlySwitchConditionKind('true')).toBe(true);
    expect(isSourceOnlySwitchConditionKind('bypass')).toBe(true);
    expect(isOriginalSwitchSelectableConditionKind('weekday')).toBe(true);
  });
});
""")

editor = Path('apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte')
replace_once(
    editor,
    """  import { uiMessage, uiText, type UiTextKey } from '../../lib/ui-messages';
""",
    """  import { uiMessage, uiText, type UiTextKey } from '../../lib/ui-messages';
  import {
    ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS as advancedConditionGroups,
    ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS as basicConditionGroups,
    ORIGINAL_SWITCH_BASIC_CONDITION_KINDS,
    isOriginalSwitchSelectableConditionKind,
    isSourceOnlySwitchConditionKind,
    sourceOnlySwitchConditionLabelKey,
    type SwitchConditionGroup,
  } from '../../lib/switch-condition-catalog';
""",
    'Switch condition catalog import',
)
text = editor.read_text()
start = text.find('  interface ConditionKindOption {')
end = text.find('  const weekdays:', start)
if start == -1 or end == -1:
    raise SystemExit(f'Switch condition catalog block markers: start={start}, end={end}')
text = text[:start] + """  const basicConditionKinds = new Set(ORIGINAL_SWITCH_BASIC_CONDITION_KINDS);

""" + text[end:]
text = text.replace('let conditionGroups: readonly ConditionGroup[] = basicConditionGroups;', 'let conditionGroups: readonly SwitchConditionGroup[] = basicConditionGroups;')
editor.write_text(text)

replace_once(
    editor,
    """  function conditionAddress(condition: Condition): string {
    return condition.kind === 'ip' ? condition.address : '';
  }
""",
    """  function conditionIpNetwork(condition: Condition): string {
    return condition.kind === 'ip' ? `${condition.address}/${condition.prefixLength}` : '';
  }

  function hostWildcardHasWarning(condition: Condition): boolean {
    return condition.kind === 'host-wildcard' && /[:/]/u.test(condition.pattern);
  }
""",
    'Switch IP display helper',
)
replace_once(
    editor,
    """  async function updateConditionKind(ruleId: string, kind: Condition['kind']): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      rule.condition = createDefaultSwitchCondition(kind);
      delete rule.enabled;
    });
  }
""",
    """  async function updateConditionKind(ruleId: string, kind: Condition['kind']): Promise<void> {
    if (!isOriginalSwitchSelectableConditionKind(kind)) return;
    await mutateRule(ruleId, (rule) => {
      rule.condition = createDefaultSwitchCondition(kind);
      delete rule.enabled;
    });
  }
""",
    'Switch selectable condition guard',
)
replace_once(
    editor,
    """  async function normalizeLegacySourceState(ruleId: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      delete rule.enabled;
      if (rule.condition.kind === 'host-regex' || rule.condition.kind === 'url-regex') {
        delete rule.condition.flags;
      }
    });
  }

  async function updateConditionPattern(ruleId: string, pattern: string): Promise<void> {
""",
    """  async function normalizeLegacySourceState(ruleId: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      delete rule.enabled;
      if (rule.condition.kind === 'host-regex' || rule.condition.kind === 'url-regex') {
        delete rule.condition.flags;
      }
    });
  }

  async function normalizeTrueCondition(ruleId: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind === 'true') {
        rule.condition = { kind: 'host-wildcard', pattern: '*' };
      }
    });
  }

  async function updateConditionPattern(ruleId: string, pattern: string): Promise<void> {
""",
    'Switch True normalization',
)
replace_once(
    editor,
    """  async function updateIpAddress(ruleId: string, address: string): Promise<void> {
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind === 'ip') rule.condition.address = address.trim();
    });
  }
""",
    """  async function updateIpNetwork(ruleId: string, network: string): Promise<void> {
    const normalized = network.trim();
    const separator = normalized.lastIndexOf('/');
    const address = separator < 0 ? normalized : normalized.slice(0, separator).trim();
    const prefix = separator < 0 ? Number.NaN : Number.parseInt(normalized.slice(separator + 1), 10);
    await mutateRule(ruleId, (rule) => {
      if (rule.condition.kind !== 'ip') return;
      rule.condition.address = address;
      rule.condition.prefixLength = Number.isInteger(prefix) ? prefix : 0;
    });
  }
""",
    'Switch combined IP update',
)

replace_once(
    editor,
    """                  <select
                    aria-label={uiMessage(
                      'switch.ruleFieldAria',
                      { index: index + 1, field: 'conditionType' },
                      locale,
                    )}
""",
    """                  <select
                    data-switch-condition-select
                    data-switch-condition-kind={rule.condition.kind}
                    aria-label={uiMessage(
                      'switch.ruleFieldAria',
                      { index: index + 1, field: 'conditionType' },
                      locale,
                    )}
""",
    'Switch condition select marker',
)
replace_once(
    editor,
    """                    {#each conditionGroups as group (group.labelKey)}
                      <optgroup label={uiText(group.labelKey, locale)}>
                        {#each group.options as option (option.value)}
                          <option value={option.value}>{uiText(option.labelKey, locale)}</option>
                        {/each}
                      </optgroup>
                    {/each}
""",
    """                    {#if isSourceOnlySwitchConditionKind(rule.condition.kind)}
                      <optgroup
                        label={uiText('switch.group.compatibility', locale)}
                        data-switch-source-only-condition-group
                      >
                        <option
                          value={rule.condition.kind}
                          data-switch-source-only-condition-option={rule.condition.kind}
                        >
                          {uiText(sourceOnlySwitchConditionLabelKey(rule.condition.kind), locale)}
                        </option>
                      </optgroup>
                    {/if}
                    {#each conditionGroups as group (group.labelKey)}
                      <optgroup label={uiText(group.labelKey, locale)}>
                        {#each group.options as option (option.value)}
                          <option
                            value={option.value}
                            data-switch-condition-selectable-option={option.value}
                          >
                            {uiText(option.labelKey, locale)}
                          </option>
                        {/each}
                      </optgroup>
                    {/each}
""",
    'Switch selectable/source-only options',
)

text = editor.read_text()
detail_start = text.find("                  {#if rule.condition.kind === 'true'}")
detail_end = text.find("                  {:else if rule.condition.kind === 'host-levels'}", detail_start)
if detail_start == -1 or detail_end == -1:
    raise SystemExit(f'Switch condition detail markers: start={detail_start}, end={detail_end}')
replacement = """                  {#if rule.condition.kind === 'true'}
                    <span data-switch-true-condition>{uiText('switch.alwaysMatches', locale)}</span>
                  {:else if rule.condition.kind === 'false'}
                    {#if rule.condition.annotation}
                      <input
                        data-switch-false-annotation
                        value={rule.condition.annotation}
                        disabled
                        title={rule.condition.annotation}
                      />
                    {:else}
                      <span data-switch-false-condition>{uiText('switch.neverMatches', locale)}</span>
                    {/if}
                  {:else if 'pattern' in rule.condition}
                    <div class="inline-details">
                      <input
                        data-switch-condition-field="pattern"
                        aria-label={uiMessage(
                          'switch.ruleFieldAria',
                          { index: index + 1, field: 'pattern' },
                          locale,
                        )}
                        value={conditionPattern(rule.condition)}
                        {disabled}
                        on:change={(event) => updateConditionPattern(rule.id, valueFrom(event))}
                      />
                    </div>
                    {#if hostWildcardHasWarning(rule.condition)}
                      <p
                        class="legacy-source-warning"
                        role="alert"
                        data-switch-host-wildcard-warning
                      >
                        {uiText('switch.condition.hostWildcardWarning', locale)}
                      </p>
                    {/if}
                  {:else if rule.condition.kind === 'ip'}
                    <div class="inline-details ip-details">
                      <input
                        data-switch-condition-field="ipNetwork"
                        aria-label={uiMessage(
                          'switch.ruleFieldAria',
                          { index: index + 1, field: 'ipAddress' },
                          locale,
                        )}
                        value={conditionIpNetwork(rule.condition)}
                        placeholder="127.0.0.1/8"
                        {disabled}
                        on:change={(event) => updateIpNetwork(rule.id, valueFrom(event))}
                      />
                    </div>
"""
editor.write_text(text[:detail_start] + replacement + text[detail_end:])

for field in ['minimumHostLevels', 'maximumHostLevels', 'startHour', 'endHour']:
    replace_once(
        editor,
        f"""                      <input
                        class="small-number"
                        aria-label={{uiMessage(
                          'switch.ruleFieldAria',
                          {{ index: index + 1, field: '{field}' }},
""",
        f"""                      <input
                        class="small-number"
                        data-switch-condition-field="{field}"
                        aria-label={{uiMessage(
                          'switch.ruleFieldAria',
                          {{ index: index + 1, field: '{field}' }},
""",
        f'Switch {field} marker',
    )
replace_once(
    editor,
    """                    <div
                      class="weekday-options"
                      aria-label={uiMessage(
""",
    """                    <div
                      class="weekday-options"
                      data-switch-condition-field="weekdays"
                      aria-label={uiMessage(
""",
    'Switch weekday field marker',
)
replace_once(
    editor,
    """                          <input
                            type="checkbox"
                            checked={conditionWeekdays(rule.condition).includes(day.value)}
""",
    """                          <input
                            type="checkbox"
                            data-switch-weekday={day.value}
                            checked={conditionWeekdays(rule.condition).includes(day.value)}
""",
    'Switch weekday checkbox marker',
)

text = editor.read_text()
warning_anchor = """                  {#if hasLegacySourceState(rule)}
                    <p class="legacy-source-warning">
"""
warning_index = text.find(warning_anchor)
if warning_index == -1:
    raise SystemExit('Switch legacy warning anchor missing')
source_warning = """                  {#if isSourceOnlySwitchConditionKind(rule.condition.kind)}
                    <p
                      class="legacy-source-warning"
                      role="note"
                      data-switch-source-only-condition={rule.condition.kind}
                    >
                      {uiText('switch.condition.sourceOnlyWarning', locale)}
                    </p>
                  {/if}
"""
text = text[:warning_index] + source_warning + text[warning_index:]
editor.write_text(text)

text = editor.read_text()
action_anchor = """                    {#if hasLegacySourceState(rule)}
                      <button
                        type="button"
                        title={uiText('switch.normalizeRuleTitle', locale)}
"""
action_index = text.find(action_anchor)
if action_index == -1:
    raise SystemExit('Switch legacy action anchor missing')
true_action = """                    {#if rule.condition.kind === 'true'}
                      <button
                        type="button"
                        data-switch-normalize-true-condition
                        title={uiText('switch.normalizeTrueTitle', locale)}
                        aria-label={uiText('switch.normalizeTrueTitle', locale)}
                        {disabled}
                        on:click={() => normalizeTrueCondition(rule.id)}
                        >{uiText('switch.normalizeRule', locale)}</button
                      >
                    {/if}
"""
editor.write_text(text[:action_index] + true_action + text[action_index:])

messages = Path('apps/extension/src/lib/ui-messages.ts')
replace_once(
    messages,
    """  'switch.conditionHelp': {
""",
    """  'switch.group.compatibility': {
    en: 'Source compatibility',
    'zh-CN': '源码兼容',
    'zh-TW': '原始碼相容',
  },
  'switch.condition.sourceOnlyWarning': {
    en: 'This condition is retained for imported or source-edited profiles, but the original Switch Profile UI does not offer it as a normal selectable type.',
    'zh-CN': '此条件仅为导入或源码编辑的情景模式保留；原版自动切换界面不会把它作为普通可选类型。',
    'zh-TW': '此條件僅為匯入或原始碼編輯的情境模式保留；原版自動切換介面不會把它作為一般可選類型。',
  },
  'switch.normalizeTrueTitle': {
    en: 'Normalize Always to the original host wildcard * form',
    'zh-CN': '将“总是”规范化为原版域名通配符 *',
    'zh-TW': '將「永遠」正規化為原版網域萬用字元 *',
  },
  'switch.condition.hostWildcardWarning': {
    en: 'A host wildcard containing “:” or “/” is probably a full URL. Use a URL condition instead.',
    'zh-CN': '域名通配符中包含“:”或“/”时通常表示完整网址，请改用网址条件。',
    'zh-TW': '網域萬用字元中包含「:」或「/」時通常表示完整網址，請改用網址條件。',
  },
  'switch.conditionHelp': {
""",
    'Switch condition compatibility messages',
)

components = Path('apps/extension/src/component-rendering.component.spec.ts')
component_anchor = """  it('renders the attached Rule List row, configuration, headers, and detach action', () => {
"""
component_test = """  it('renders the exact original advanced condition controls and source-only compatibility states', () => {
    const ids = idFactory();
    const created = createSwitchProfileDraft(baseSpec(), ids, 'Condition matrix');
    created.draft.settings.interface.showAdvancedConditions = true;
    const profile = created.draft.profiles.find(
      (candidate) => candidate.id === created.profileId && candidate.kind === 'switch',
    );
    if (!profile || profile.kind !== 'switch') throw new Error('Switch condition matrix profile missing');
    profile.rules = [
      {
        id: 'rule-host-warning',
        condition: { kind: 'host-wildcard', pattern: 'https://example.invalid/' },
        route: { kind: 'direct' },
      },
      {
        id: 'rule-false-annotation',
        condition: { kind: 'false', annotation: 'disabled fixture rule' },
        route: { kind: 'direct' },
      },
      {
        id: 'rule-ip-network',
        condition: { kind: 'ip', address: '192.0.2.0', prefixLength: 24 },
        route: { kind: 'direct' },
      },
      { id: 'rule-true-source', condition: { kind: 'true' }, route: { kind: 'direct' } },
      {
        id: 'rule-bypass-source',
        condition: { kind: 'bypass', pattern: '<local>' },
        route: { kind: 'direct' },
      },
    ];
    const body = render(SwitchProfileEditor, {
      props: {
        spec: created.draft,
        profileId: created.profileId,
        disabled: false,
        idFactory: ids,
        onReplaceDraft: replaceDraft,
        onRegisterBeforeAction: () => undefined,
        onSourceDirtyChange: () => undefined,
      },
    }).body;

    expect(body).toContain('data-switch-condition-selectable-option="host-wildcard"');
    expect(body).toContain('data-switch-condition-selectable-option="weekday"');
    expect(body).not.toContain('data-switch-condition-selectable-option="true"');
    expect(body).not.toContain('data-switch-condition-selectable-option="bypass"');
    expect(body).toContain('data-switch-source-only-condition-option="true"');
    expect(body).toContain('data-switch-source-only-condition-option="bypass"');
    expect(body).toContain('data-switch-normalize-true-condition');
    expect(body).toContain('data-switch-false-annotation');
    expect(body).toContain('disabled fixture rule');
    expect(body).toContain('data-switch-condition-field="ipNetwork"');
    expect(body).toContain('value="192.0.2.0/24"');
    expect(body).toContain('data-switch-host-wildcard-warning');
  });

"""
replace_once(components, component_anchor, component_test + component_anchor, 'Switch matrix component test')

chromium = Path('scripts/e2e-chromium.mjs')
chromium_anchor = """  await creationOptions.getByRole('button', { name: 'Created Fixed', exact: true }).click();
  const createdFixedTable = creationOptions.locator('[data-fixed-proxy-table]');
"""
chromium_test = """  await creationOptions.getByRole('button', { name: '界面', exact: true }).click();
  const advancedConditionsSetting = creationOptions.locator(
    '[data-show-advanced-conditions-setting]',
  );
  await advancedConditionsSetting.waitFor({ state: 'visible', timeout: 20_000 });
  if (!(await advancedConditionsSetting.isChecked())) await advancedConditionsSetting.check();

  await creationOptions.getByRole('button', { name: 'Created Switch', exact: true }).click();
  const createdSwitchTable = creationOptions.locator('[data-switch-rules-table]');
  await createdSwitchTable.waitFor({ state: 'visible', timeout: 20_000 });
  await createdSwitchTable.locator('.add-condition-row button').click();
  const conditionRow = createdSwitchTable.locator('[data-switch-rule-row]').first();
  const conditionSelect = conditionRow.locator('[data-switch-condition-select]');
  const originalConditionKinds = await conditionSelect
    .locator('option[data-switch-condition-selectable-option]')
    .evaluateAll((options) => options.map((option) => option.value));
  assert.deepEqual(originalConditionKinds, [
    'host-wildcard',
    'host-regex',
    'host-levels',
    'ip',
    'url-wildcard',
    'url-regex',
    'keyword',
    'weekday',
    'time',
    'false',
  ]);
  assert.equal(
    await conditionSelect.locator('option[value="true"], option[value="bypass"]').count(),
    0,
    'Source-only True/Bypass conditions leaked into the ordinary original selector',
  );

  const selectCondition = async (kind) => {
    await conditionSelect.selectOption(kind);
    await assertEventually(
      async () => (await conditionSelect.inputValue()) === kind,
      `Switch condition ${kind} did not become active`,
    );
  };

  await selectCondition('host-wildcard');
  let patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('https://wrong.example.invalid/path');
  await patternField.press('Tab');
  await conditionRow.locator('[data-switch-host-wildcard-warning]').waitFor({ state: 'visible' });
  await patternField.fill('*.matrix.example.invalid');
  await patternField.press('Tab');

  await selectCondition('host-regex');
  patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('[');
  await patternField.press('Tab');
  const conditionApply = creationOptions.getByRole('button', { name: '应用选项', exact: true });
  await assertEventually(
    async () => !(await conditionApply.isDisabled()),
    'Invalid regex Draft did not remain available for strict Apply validation',
  );
  await conditionApply.click();
  await assertEventually(
    async () =>
      creationWorker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow?.lastApply?.status === 'failed' &&
          workflow?.draft?.profiles?.some((profile) => profile.name === 'Created Switch') &&
          !workflow?.applied?.profiles?.some((profile) => profile.name === 'Created Switch')
        );
      }),
    'Strict Apply did not reject the invalid regular expression while preserving Draft',
    20_000,
  );
  await patternField.fill('(^|\\.)matrix\\.example\\.invalid$');
  await patternField.press('Tab');

  await selectCondition('host-levels');
  await conditionRow.locator('[data-switch-condition-field="minimumHostLevels"]').fill('2');
  await conditionRow.locator('[data-switch-condition-field="minimumHostLevels"]').press('Tab');
  await conditionRow.locator('[data-switch-condition-field="maximumHostLevels"]').fill('4');
  await conditionRow.locator('[data-switch-condition-field="maximumHostLevels"]').press('Tab');

  await selectCondition('ip');
  const ipNetwork = conditionRow.locator('[data-switch-condition-field="ipNetwork"]');
  assert.equal(await ipNetwork.getAttribute('placeholder'), '127.0.0.1/8');
  await ipNetwork.fill('192.0.2.0/24');
  await ipNetwork.press('Tab');

  await selectCondition('url-wildcard');
  patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('https://*.assets.example.invalid/*');
  await patternField.press('Tab');

  await selectCondition('url-regex');
  patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('^https://secure\\.example\\.invalid/');
  await patternField.press('Tab');

  await selectCondition('keyword');
  patternField = conditionRow.locator('[data-switch-condition-field="pattern"]');
  await patternField.fill('matrix-keyword');
  await patternField.press('Tab');

  await selectCondition('false');
  await conditionRow.locator('[data-switch-false-condition]').waitFor({ state: 'visible' });

  await selectCondition('weekday');
  const monday = conditionRow.locator('[data-switch-weekday="mon"]');
  const friday = conditionRow.locator('[data-switch-weekday="fri"]');
  assert.equal(await monday.isChecked(), true);
  await monday.uncheck();
  await friday.check();

  await selectCondition('time');
  await conditionRow.locator('[data-switch-condition-field="startHour"]').fill('8');
  await conditionRow.locator('[data-switch-condition-field="startHour"]').press('Tab');
  await conditionRow.locator('[data-switch-condition-field="endHour"]').fill('18');
  await conditionRow.locator('[data-switch-condition-field="endHour"]').press('Tab');

  await creationOptions.locator('[data-switch-source-toggle]').click();
  const conditionSource = creationOptions.locator('[data-switch-source-editor] textarea');
  await conditionSource.waitFor({ state: 'visible', timeout: 20_000 });
  assert.match(await conditionSource.inputValue(), /Time: 8~18 \+direct/u);
  await conditionSource.fill(
    '[SwitchyOmega Conditions]\\n@with result\\n\\nWeekday: -M----- +direct\\n\\n* +direct\\n',
  );
  await creationOptions.locator('[data-switch-source-toggle]').click();
  await createdSwitchTable.waitFor({ state: 'visible', timeout: 20_000 });
  await assertEventually(
    async () => (await conditionSelect.inputValue()) === 'weekday' && (await monday.isChecked()),
    'Switch source round trip did not restore the weekday field state',
  );

  await creationOptions.getByRole('button', { name: 'Created Fixed', exact: true }).click();
  const createdFixedTable = creationOptions.locator('[data-fixed-proxy-table]');
"""
replace_once(chromium, chromium_anchor, chromium_test, 'Chromium Switch condition matrix insertion')
replace_once(
    chromium,
    """        profiles['Created Virtual'].targetRoute.profileId !== profiles['Created Fixed'].id ||
        profiles['Created Fixed'].proxyByScheme === undefined
""",
    """        profiles['Created Virtual'].targetRoute.profileId !== profiles['Created Fixed'].id ||
        profiles['Created Fixed'].proxyByScheme === undefined ||
        profiles['Created Switch'].rules?.[0]?.condition?.kind !== 'weekday' ||
        !profiles['Created Switch'].rules[0].condition.days?.includes('mon')
""",
    'Chromium Switch Draft convergence assertion',
)

firefox = Path('scripts/e2e-firefox.mjs')
replace_once(
    firefox,
    """  await driver.get(`moz-extension://${extensionUuid}/options.html`);
  const newRuleProfileAction = await driver.wait(
""",
    """  await driver.get(`moz-extension://${extensionUuid}/options.html`);
  const interfaceAction = await driver.wait(
    until.elementLocated(By.css('[data-interface-action]')),
    15_000,
  );
  await interfaceAction.click();
  const advancedConditionsSetting = await driver.wait(
    until.elementLocated(By.css('[data-show-advanced-conditions-setting]')),
    15_000,
  );
  if (!(await advancedConditionsSetting.isSelected())) await advancedConditionsSetting.click();

  const newRuleProfileAction = await driver.wait(
""",
    'Firefox advanced condition setting',
)
replace_once(
    firefox,
    """  const attachRuleListSection = await driver.wait(
    until.elementLocated(By.css('[data-attach-rule-list-section]')),
""",
    """  const switchRulesTable = await driver.wait(
    until.elementLocated(By.css('[data-switch-rules-table]')),
    20_000,
  );
  await switchRulesTable.findElement(By.css('.add-condition-row button')).click();
  const conditionRow = await driver.wait(
    until.elementLocated(By.css('[data-switch-rule-row]')),
    15_000,
  );
  const conditionSelect = await conditionRow.findElement(By.css('[data-switch-condition-select]'));
  const originalConditionKinds = await driver.executeScript(
    `return [...arguments[0].querySelectorAll('option[data-switch-condition-selectable-option]')]
      .map((option) => option.value);`,
    conditionSelect,
  );
  assert.deepEqual(originalConditionKinds, [
    'host-wildcard',
    'host-regex',
    'host-levels',
    'ip',
    'url-wildcard',
    'url-regex',
    'keyword',
    'weekday',
    'time',
    'false',
  ]);
  assert.equal(
    await driver.executeScript(
      `return arguments[0].querySelectorAll('option[value="true"], option[value="bypass"]').length;`,
      conditionSelect,
    ),
    0,
    'Firefox ordinary Switch selector exposed source-only conditions',
  );
  await setControlValue(conditionSelect, 'ip');
  const ipNetwork = await driver.wait(
    until.elementLocated(By.css('[data-switch-condition-field="ipNetwork"]')),
    10_000,
  );
  assert.equal(await ipNetwork.getAttribute('placeholder'), '127.0.0.1/8');
  await setControlValue(ipNetwork, '198.51.100.0/24');
  await setControlValue(conditionSelect, 'false');
  await driver.wait(until.elementLocated(By.css('[data-switch-false-condition]')), 10_000);
  await setControlValue(conditionSelect, 'host-wildcard');
  const hostPattern = await driver.wait(
    until.elementLocated(By.css('[data-switch-condition-field="pattern"]')),
    10_000,
  );
  await setControlValue(hostPattern, '*.firefox-condition.example.invalid');

  const attachRuleListSection = await driver.wait(
    until.elementLocated(By.css('[data-attach-rule-list-section]')),
""",
    'Firefox Switch condition matrix insertion',
)

matrix_doc = Path('docs/SWITCH_CONDITION_MATRIX.md')
matrix_doc.write_text("""# Switch Condition Matrix — ZeroOmega v3.5.0 Source Baseline

This document is the durable D-04/D-05 acceptance authority for Switch Profile condition types and fields.

## Source authority

- `zero-peak/ZeroOmega@v3.5.0`
- `omega-web/src/omega/controllers/switch_profile.coffee`
- `omega-web/src/partials/profile_switch.jade`
- `omega-pac/src/conditions.coffee`
- frozen source artifact `original-zeroomega-ui-evidence-v3.5.0`, ID `8625759489`

## Ordinary selectable UI matrix

| Original group | Original type | Nex kind | Original field shape | Nex acceptance |
| --- | --- | --- | --- | --- |
| Basic / Host | HostWildcardCondition | `host-wildcard` | required pattern; warn on `:` or `/` | selectable; one pattern input; warning restored |
| Basic / URL | UrlWildcardCondition | `url-wildcard` | required pattern | selectable; one pattern input |
| Basic / URL | UrlRegexCondition | `url-regex` | required regex | selectable; invalid regex allowed in Draft and rejected by Apply |
| Basic / Special | FalseCondition | `false` | static Never, or disabled imported annotation | selectable; both forms retained |
| Host | HostRegexCondition | `host-regex` | required regex | selectable; invalid regex allowed in Draft and rejected by Apply |
| Host | HostLevelsCondition | `host-levels` | required min/max number inputs, 1–99 | selectable; two bounded inputs |
| Host | IpCondition | `ip` | one required `address/prefix` input | selectable; one combined CIDR input |
| URL | KeywordCondition | `keyword` | required pattern | selectable; HTTP-only semantics retained by compiler/interpreter |
| Special | WeekdayCondition | `weekday` | seven weekday checkboxes | selectable; seven typed checkboxes |
| Special | TimeCondition | `time` | required start/end hour inputs, 0–23 | selectable; two bounded inputs |

The advanced selector order is exactly:

`host-wildcard`, `host-regex`, `host-levels`, `ip`, `url-wildcard`, `url-regex`, `keyword`, `weekday`, `time`, `false`.

## Source/import compatibility-only kinds

| Model/source kind | Original behavior | Nex behavior |
| --- | --- | --- |
| `true` / TrueCondition | condition engine accepts it; Switch controller normalizes it to HostWildcard `*`; not offered in the selector | retained when imported/source-edited, shown in a compatibility-only selected option, and explicitly normalizable to `host-wildcard: *` |
| `bypass` / BypassCondition | condition engine and source format accept it; Switch controller does not list it in basic or advanced selectors | retained when imported/source-edited and shown in a compatibility-only selected option; never offered for ordinary new selection |

## Draft and Apply contract

- Every editor change first updates typed Draft state.
- Temporarily invalid patterns and regular expressions remain editable in Draft.
- Strict Apply validates the entire ProfileSpec and cannot replace Applied/browser state on failure.
- Corrected conditions can Apply normally and survive reload.
- Table-to-source and source-to-table round trips preserve supported fields.
- Chromium exercises all ten ordinary types, every field family, invalid-regex rejection, correction, source round trip, and final Apply.
- Firefox independently verifies the exact ten-option target matrix, source-only exclusion, combined IP field, False field, and ordinary pattern mutation.

## Permanent acceptance

D-04 and D-05 may remain `DONE` only while:

- the typed catalog preserves the exact original groups and order;
- `true` and `bypass` remain absent from ordinary selectable options;
- the original field shapes and warnings remain rendered;
- component, unit, Chromium, Firefox, parity, localization, and build gates pass.
""")

ui_matrix = Path('docs/UI_AUDIT_MATRIX.md')
replace_row(
    ui_matrix,
    'D-04',
    '| D-04 | 条件类型下拉     | `profile_switch.jade`、`switch_profile.coffee` | 原版基础 4 项/高级 10 项和分组；True/Bypass 非普通选项 | MUST_MATCH | DONE | COMPLETE | `SWITCH_CONDITION_MATRIX.md` 固化原版精确顺序；typed catalog、组件及 Chromium/Firefox 均证明普通 selector 仅 10 项；True/Bypass 仅按源码/导入兼容保留 | 保持 catalog 与双浏览器守卫 |',
)
replace_row(
    ui_matrix,
    'D-05',
    '| D-05 | 条件专属字段     | `profile_switch.jade`、`switch_profile.coffee` | 专属控件允许编辑中暂时无效；Apply 严格校验 | MUST_MATCH | DONE | COMPLETE | 恢复 False 注释、单框 IP/CIDR、HostWildcard 警告、HostLevels/Weekday/Time 字段；Chromium 覆盖全部 10 类、无效正则拒绝/修正、源码往返和 Apply，Firefox 独立覆盖目标矩阵 | 保持字段、Draft/Apply 与源码往返守卫 |',
)

status = Path('docs/MILESTONE_8_STATUS.md')
status_text = status.read_text()
status_text = status_text.replace('`DONE=122`, `PARTIAL=4`', '`DONE=124`, `PARTIAL=2`')
status_text = status_text.replace(
    """Two release-blocking `MUST_MATCH` rows remain:

1. D-04 — Switch condition-type matrix acceptance.
2. D-05 — condition-specific fields and Draft/Apply browser acceptance.

Additional open rows:
""",
    """No release-blocking `MUST_MATCH` rows remain. D-04 and D-05 are closed by `docs/SWITCH_CONDITION_MATRIX.md`, typed catalog tests, complete Chromium field/Apply/source acceptance, and independent Firefox target acceptance.

The only open rows are non-blocking visual references:
""",
)
status_text = status_text.replace(
    'Proceed to D-04 and D-05 Switch condition matrix acceptance. Do not request installation of intermediate slices.',
    'Freeze one consolidated installable candidate, then perform repository-owner visual, real complex-backup, restart-recovery, rollback, and authenticated-route QC in Chromium and Firefox.',
)
status.write_text(status_text)

for path_name, heading in [
    ('docs/MILESTONE_8_SESSION_7_CHECKPOINT.md', 'Switch condition matrix closure'),
    ('docs/MILESTONE_8_RELEASE_CANDIDATE.md', 'Switch condition candidate prerequisite'),
    ('docs/ORIGINAL_KNOWLEDGE_GRAPH.md', 'D-04/D-05 Switch condition knowledge'),
]:
    path = Path(path_name)
    text = path.read_text().rstrip()
    addition = f"""

## {heading}

- Source-backed ordinary Switch selectors contain exactly 4 basic and 10 advanced entries.
- `TrueCondition` and `BypassCondition` remain model/source compatibility states, not ordinary selectable UI entries.
- False annotation, combined IP/CIDR, HostWildcard warning, host-level range, weekday checkboxes, and time range match the original field shapes.
- Draft accepts temporary invalid editor state; strict Apply rejects invalid regex without changing Applied/browser state; correction, source round trip, reload, and Apply are browser-verified.
- Durable authority: `docs/SWITCH_CONDITION_MATRIX.md`.
- D-04 and D-05 are complete; only A-14 and I-11 non-blocking visual references remain open before consolidated candidate QC.
"""
    path.write_text(text + addition + '\n')

validator = Path('scripts/validate-parity-docs.mjs')
replace_once(
    validator,
    """const failures = [];
""",
    """const [switchConditionCatalog, switchConditionEditor, switchConditionMatrix, switchConditionCatalogTest] =
  await Promise.all([
    readFile('apps/extension/src/lib/switch-condition-catalog.ts', 'utf8'),
    readFile('apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte', 'utf8'),
    readFile('docs/SWITCH_CONDITION_MATRIX.md', 'utf8'),
    readFile('apps/extension/src/lib/switch-condition-catalog.test.ts', 'utf8'),
  ]);

const failures = [];
""",
    'Switch matrix validator sources',
)
replace_once(
    validator,
    """const auditRowLines = audit.split('\n').filter((line) => /^\|\s+[A-J]-\d+\s+\|/u.test(line));
""",
    """requireAll('source-backed Switch condition catalog', switchConditionCatalog, [
  'ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS',
  'ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS',
  "['true', 'bypass']",
  "value: 'host-levels'",
  "value: 'weekday'",
  "value: 'time'",
]);
requireAll('Switch condition field UI', switchConditionEditor, [
  'data-switch-condition-selectable-option',
  'data-switch-source-only-condition-option',
  'data-switch-false-annotation',
  'data-switch-condition-field="ipNetwork"',
  'data-switch-host-wildcard-warning',
  'data-switch-normalize-true-condition',
]);
requireAll('Switch condition matrix document', switchConditionMatrix, [
  'HostWildcardCondition',
  'IpCondition',
  'TrueCondition',
  'BypassCondition',
  'invalid-regex rejection',
  'Chromium',
  'Firefox',
]);
requireAll('Switch condition catalog regression', switchConditionCatalogTest, [
  "['host-wildcard', 'host-regex', 'host-levels', 'ip']",
  "['weekday', 'time', 'false']",
  "SOURCE_ONLY_SWITCH_CONDITION_KINDS",
]);
requireAll('Switch condition Chromium acceptance', chromiumE2e, [
  'Source-only True/Bypass conditions leaked into the ordinary original selector',
  'Strict Apply did not reject the invalid regular expression while preserving Draft',
  'data-switch-condition-field="ipNetwork"',
  'Switch source round trip did not restore the weekday field state',
]);
requireAll('Switch condition Firefox acceptance', firefoxE2e, [
  'Firefox ordinary Switch selector exposed source-only conditions',
  'data-switch-condition-field="ipNetwork"',
  "'host-wildcard'",
  "'false'",
]);
for (const rowId of ['D-04', 'D-05']) {
  const row = audit.split('\n').find((line) => line.startsWith(`| ${rowId} `));
  if (!row || !row.includes('| DONE') || !row.includes('Chromium') || !row.includes('Firefox')) {
    failures.push(`${rowId} must remain DONE with dual-browser Switch condition evidence`);
  }
}

const auditRowLines = audit.split('\n').filter((line) => /^\|\s+[A-J]-\d+\s+\|/u.test(line));
""",
    'Switch matrix permanent guards',
)

print('Applied source-backed Switch condition matrix slice.')
