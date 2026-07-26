import type { Condition, SwitchProfile, SwitchRule } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import {
  createAttachedRuleListDraft,
  inspectAttachedRuleList,
} from './attached-rule-list-operations.js';
import type { ProfileWorkflowIdFactory } from './profile-operations.js';
import { createSwitchProfileDraft } from './switch-operations.js';
import { composeSwitchProfileSource, parseSwitchProfileSourceDraft } from './switch-source.js';
import { workflowFixture } from './test-fixture.js';

function deterministicIds(): ProfileWorkflowIdFactory {
  let next = 0;
  return (kind) => `${kind}-source-${++next}`;
}

function fixture() {
  const ids = deterministicIds();
  const created = createSwitchProfileDraft(workflowFixture(), ids, 'Automatic');
  const profile = created.draft.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === created.profileId && candidate.kind === 'switch',
  );
  if (!profile) throw new Error('missing Switch fixture');
  return { ids, spec: created.draft, profile };
}

function rule(id: string, condition: Condition, routeProfileId = 'profile-primary'): SwitchRule {
  return {
    id,
    condition,
    route: { kind: 'profile', profileId: routeProfileId },
  };
}

describe('SwitchyOmega source editing', () => {
  it('composes the original result-enabled format and parses it back', () => {
    const { ids, spec, profile } = fixture();
    profile.rules = [
      {
        ...rule('rule-one', { kind: 'host-wildcard', pattern: '*.example.com' }),
        note: 'Example host',
      },
      rule('rule-two', { kind: 'url-regex', pattern: '^https://example\\.com/' }),
      rule('rule-three', { kind: 'time', startHour: 9, endHour: 17, timezone: 'local' }),
    ];
    profile.defaultRoute = { kind: 'system' };

    const composed = composeSwitchProfileSource(spec, profile.id);
    expect(composed).toEqual({
      ok: true,
      source: [
        '[SwitchyOmega Conditions]',
        '@with result',
        '',
        '@note Example host',
        '*.example.com +Proxy',
        'UrlRegex: ^https://example\\.com/ +Proxy',
        'Time: 9~17 +Proxy',
        '',
        '* +system',
        '',
      ].join('\r\n'),
    });
    if (!composed.ok) throw new Error(composed.error.message);

    const parsed = parseSwitchProfileSourceDraft(spec, profile.id, composed.source, ids);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.error.message);
    const parsedProfile = parsed.draft.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === profile.id && candidate.kind === 'switch',
    );
    expect(parsedProfile?.rules).toEqual(profile.rules);
    expect(parsedProfile?.defaultRoute).toEqual({ kind: 'system' });
  });

  it('uses the visible base default while an attached Rule List owns the runtime default route', () => {
    const { ids, spec, profile } = fixture();
    profile.defaultRoute = { kind: 'system' };
    const attached = createAttachedRuleListDraft(spec, profile.id, ids);
    const state = inspectAttachedRuleList(attached, profile.id);
    expect(state?.enabled).toBe(true);

    const composed = composeSwitchProfileSource(attached, profile.id);
    expect(composed.ok).toBe(true);
    if (!composed.ok) throw new Error(composed.error.message);
    expect(composed.source).toContain('* +system');
    expect(composed.source).not.toContain('__ruleListOf_');

    const parsed = parseSwitchProfileSourceDraft(
      attached,
      profile.id,
      composed.source.replace('* +system', '* +direct'),
      ids,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.error.message);
    const parsedState = inspectAttachedRuleList(parsed.draft, profile.id);
    expect(parsedState?.enabled).toBe(true);
    expect(parsedState?.profile.defaultRoute).toEqual({ kind: 'direct' });
  });

  it('round-trips every original condition representation', () => {
    const { ids, spec, profile } = fixture();
    const conditions: Condition[] = [
      { kind: 'true' },
      { kind: 'false', annotation: 'disabled placeholder' },
      { kind: 'url-regex', pattern: '^https://' },
      { kind: 'url-wildcard', pattern: 'https://*.example.com/*' },
      { kind: 'host-regex', pattern: '(^|\\.)example\\.com$' },
      { kind: 'host-wildcard', pattern: '@internal' },
      { kind: 'bypass', pattern: '<local>' },
      { kind: 'keyword', pattern: 'download', httpOnly: true },
      { kind: 'ip', address: '2001:db8::', prefixLength: 32 },
      { kind: 'host-levels', min: 1, max: 4 },
      { kind: 'weekday', days: ['sun', 'mon', 'fri'], timezone: 'local' },
      { kind: 'time', startHour: 8, endHour: 18, timezone: 'local' },
    ];
    profile.rules = conditions.map((condition, index) => rule(`rule-${index}`, condition));

    const composed = composeSwitchProfileSource(spec, profile.id);
    expect(composed.ok).toBe(true);
    if (!composed.ok) throw new Error(composed.error.message);
    expect(composed.source).toContain(': @internal +Proxy');
    expect(composed.source).toContain('Weekday: SM---F- +Proxy');

    const parsed = parseSwitchProfileSourceDraft(spec, profile.id, composed.source, ids);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.error.message);
    const parsedProfile = parsed.draft.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === profile.id && candidate.kind === 'switch',
    );
    expect(parsedProfile?.rules.map((entry) => entry.condition)).toEqual(conditions);
  });

  it('accepts original abbreviations, comments, disabled-result shorthand, and weekday ranges', () => {
    const { ids, spec, profile } = fixture();
    profile.defaultRoute = { kind: 'profile', profileId: 'profile-secondary' };
    const parsed = parseSwitchProfileSourceDraft(
      spec,
      profile.id,
      [
        '; header comment',
        '@with results',
        '@note shorthand',
        'H: *.example.com +Proxy',
        '!Weekday: 1~3',
        'Ip: 10.0.0.0/8 +Backup Proxy',
        '* +Backup Proxy',
      ].join('\n'),
      ids,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.error.message);
    const parsedProfile = parsed.draft.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === profile.id && candidate.kind === 'switch',
    );
    expect(parsedProfile?.rules).toMatchObject([
      {
        condition: { kind: 'host-wildcard', pattern: '*.example.com' },
        route: { kind: 'profile', profileId: 'profile-primary' },
        note: 'shorthand',
      },
      {
        condition: { kind: 'weekday', days: ['mon', 'tue', 'wed'], timezone: 'local' },
        route: { kind: 'profile', profileId: 'profile-secondary' },
      },
      {
        condition: { kind: 'ip', address: '10.0.0.0', prefixLength: 8 },
        route: { kind: 'profile', profileId: 'profile-secondary' },
      },
    ]);
  });

  it('returns source-backed line errors instead of mutating the Draft', () => {
    const { ids, spec, profile } = fixture();
    const cases = [
      {
        source: '*.example.com +Proxy\n* +direct',
        code: 'switch-source.results-required',
      },
      {
        source: '@with result\n*.example.com\n* +direct',
        code: 'switch-source.missing-result-profile',
      },
      {
        source: '@with result\n*.example.com +Missing\n* +direct',
        code: 'switch-source.unknown-profile',
      },
      {
        source: '@with result\n*.example.com +Proxy',
        code: 'switch-source.no-default-rule',
      },
      {
        source: '@with result\nNoSuchType: value +Proxy\n* +direct',
        code: 'switch-source.invalid-rule',
      },
    ];
    for (const entry of cases) {
      const parsed = parseSwitchProfileSourceDraft(spec, profile.id, entry.source, ids);
      expect(parsed).toMatchObject({ ok: false, error: { code: entry.code } });
    }
    expect(profile.rules).toEqual([]);
  });

  it('refuses Nex-only rule state that the original source format cannot preserve', () => {
    const { spec, profile } = fixture();
    profile.rules = [rule('rule-flags', { kind: 'host-regex', pattern: 'example', flags: 'i' })];
    expect(composeSwitchProfileSource(spec, profile.id)).toMatchObject({
      ok: false,
      error: { code: 'switch-source.unsupported-regex-flags' },
    });

    const regexRule = profile.rules[0];
    if (!regexRule || regexRule.condition.kind !== 'host-regex') {
      throw new Error('regex fixture mismatch');
    }
    delete regexRule.condition.flags;
    regexRule.enabled = false;
    expect(composeSwitchProfileSource(spec, profile.id)).toMatchObject({
      ok: false,
      error: { code: 'switch-source.unsupported-disabled-rule' },
    });
  });

  it('preserves stable rule IDs where source rows still match', () => {
    const { ids, spec, profile } = fixture();
    profile.rules = [
      rule('stable-one', { kind: 'host-wildcard', pattern: '*.one.example' }),
      rule('stable-two', { kind: 'host-wildcard', pattern: '*.two.example' }),
    ];
    const parsed = parseSwitchProfileSourceDraft(
      spec,
      profile.id,
      [
        '[SwitchyOmega Conditions]',
        '@with result',
        '*.two.example +Proxy',
        '*.one.example +Proxy',
        '* +direct',
      ].join('\n'),
      ids,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error(parsed.error.message);
    const parsedProfile = parsed.draft.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === profile.id && candidate.kind === 'switch',
    );
    expect(parsedProfile?.rules.map((entry) => entry.id)).toEqual(['stable-two', 'stable-one']);
  });
});
