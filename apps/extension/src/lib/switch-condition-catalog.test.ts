import { describe, expect, it } from 'vitest';

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
    expect(
      ORIGINAL_SWITCH_BASIC_CONDITION_GROUPS.map((group) =>
        group.options.map((item) => item.value),
      ),
    ).toEqual([['host-wildcard', 'url-wildcard', 'url-regex', 'false']]);
    expect(
      ORIGINAL_SWITCH_ADVANCED_CONDITION_GROUPS.map((group) =>
        group.options.map((item) => item.value),
      ),
    ).toEqual([
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
