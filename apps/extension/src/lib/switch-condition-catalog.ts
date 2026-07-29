import type { Condition } from '@zeroomega-nex/profile-spec';

import type { UiTextKey } from './ui-messages';

export type OriginalSwitchSelectableConditionKind = Exclude<Condition['kind'], 'true' | 'bypass'>;
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

export function sourceOnlySwitchConditionLabelKey(kind: SourceOnlySwitchConditionKind): UiTextKey {
  return kind === 'true' ? 'switch.condition.always' : 'switch.condition.bypass';
}
