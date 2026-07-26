import {
  cloneProfileSpec,
  validateProfileSpec,
  type Condition,
  type ProfileSpec,
  type SwitchProfile,
  type SwitchRule,
} from '@zeroomega-nex/profile-spec';

import type {
  ProfileWorkflowIdFactory,
  ProfileWorkflowProfileMutation,
} from './profile-operations.js';

export interface ProfileWorkflowSwitchRuleMutation {
  readonly draft: ProfileSpec;
  readonly ruleId: string;
}

function assertValidDraft(draft: ProfileSpec): void {
  const validation = validateProfileSpec(draft);
  if (validation.valid) return;
  const messages = validation.issues
    .filter((entry) => entry.severity === 'error')
    .slice(0, 8)
    .map((entry) => `${entry.code} at ${entry.path}: ${entry.message}`)
    .join('; ');
  throw new TypeError(`switch operation produced an invalid ProfileSpec: ${messages}`);
}

function uniqueProfileName(spec: ProfileSpec, preferred: string): string {
  const names = new Set(spec.profiles.map((profile) => profile.name));
  if (!names.has(preferred)) return preferred;
  let suffix = 2;
  while (names.has(`${preferred} ${suffix}`)) suffix += 1;
  return `${preferred} ${suffix}`;
}

function findSwitchProfile(draft: ProfileSpec, profileId: string): SwitchProfile {
  const profile = draft.profiles.find(
    (candidate): candidate is SwitchProfile =>
      candidate.id === profileId && candidate.kind === 'switch',
  );
  if (!profile) throw new RangeError(`switch profile ${profileId} does not exist`);
  return profile;
}

export function createDefaultSwitchCondition(kind: Condition['kind']): Condition {
  switch (kind) {
    case 'true':
      return { kind: 'true' };
    case 'false':
      return { kind: 'false' };
    case 'url-regex':
      return { kind: 'url-regex', pattern: '^https://example\\.com/' };
    case 'url-wildcard':
      return { kind: 'url-wildcard', pattern: 'https://*.example.com/*' };
    case 'host-regex':
      return { kind: 'host-regex', pattern: '(^|\\.)example\\.com$' };
    case 'host-wildcard':
      return { kind: 'host-wildcard', pattern: '*.example.com' };
    case 'bypass':
      return { kind: 'bypass', pattern: '<local>' };
    case 'keyword':
      return { kind: 'keyword', pattern: 'example', httpOnly: true };
    case 'ip':
      return { kind: 'ip', address: '127.0.0.1', prefixLength: 32 };
    case 'host-levels':
      return { kind: 'host-levels', min: 1, max: 3 };
    case 'weekday':
      return { kind: 'weekday', days: ['mon'], timezone: 'local' };
    case 'time':
      return { kind: 'time', startHour: 9, endHour: 17, timezone: 'local' };
  }
}

export function createSwitchProfileDraft(
  spec: ProfileSpec,
  idFactory: ProfileWorkflowIdFactory,
  preferredName = 'New switch profile',
): ProfileWorkflowProfileMutation {
  const draft = cloneProfileSpec(spec);
  const profileId = idFactory('profile');
  const profile: SwitchProfile = {
    id: profileId,
    name: uniqueProfileName(draft, preferredName),
    color: '#9575cd',
    kind: 'switch',
    rules: [],
    defaultRoute: { kind: 'direct' },
  };
  draft.profiles.push(profile);
  if (
    !draft.settings.quickSwitch.routes.some(
      (route) => route.kind === 'profile' && route.profileId === profileId,
    )
  ) {
    draft.settings.quickSwitch.routes.push({ kind: 'profile', profileId });
  }
  assertValidDraft(draft);
  return { draft, profileId };
}

export function addSwitchRuleDraft(
  spec: ProfileSpec,
  profileId: string,
  idFactory: ProfileWorkflowIdFactory,
  conditionKind: Condition['kind'] = 'host-wildcard',
): ProfileWorkflowSwitchRuleMutation {
  const draft = cloneProfileSpec(spec);
  const profile = findSwitchProfile(draft, profileId);
  const ruleId = idFactory('rule');
  const rule: SwitchRule = {
    id: ruleId,
    condition: createDefaultSwitchCondition(conditionKind),
    route: structuredClone(profile.defaultRoute),
  };
  if (draft.settings.interface.addConditionsToBottom) profile.rules.push(rule);
  else profile.rules.unshift(rule);
  assertValidDraft(draft);
  return { draft, ruleId };
}

export function duplicateSwitchRuleDraft(
  spec: ProfileSpec,
  profileId: string,
  ruleId: string,
  idFactory: ProfileWorkflowIdFactory,
): ProfileWorkflowSwitchRuleMutation {
  const draft = cloneProfileSpec(spec);
  const profile = findSwitchProfile(draft, profileId);
  const index = profile.rules.findIndex((rule) => rule.id === ruleId);
  const source = profile.rules[index];
  if (!source) throw new RangeError(`switch rule ${ruleId} does not exist`);
  const duplicateRuleId = idFactory('rule');
  const duplicate: SwitchRule = {
    ...structuredClone(source),
    id: duplicateRuleId,
    ...(source.note === undefined ? {} : { note: `${source.note} copy` }),
  };
  profile.rules.splice(index + 1, 0, duplicate);
  assertValidDraft(draft);
  return { draft, ruleId: duplicateRuleId };
}

export function deleteSwitchRuleDraft(
  spec: ProfileSpec,
  profileId: string,
  ruleId: string,
): ProfileSpec {
  const draft = cloneProfileSpec(spec);
  const profile = findSwitchProfile(draft, profileId);
  const index = profile.rules.findIndex((rule) => rule.id === ruleId);
  if (index === -1) throw new RangeError(`switch rule ${ruleId} does not exist`);
  profile.rules.splice(index, 1);
  assertValidDraft(draft);
  return draft;
}

export function moveSwitchRuleDraft(
  spec: ProfileSpec,
  profileId: string,
  ruleId: string,
  offset: -1 | 1,
): ProfileSpec {
  const draft = cloneProfileSpec(spec);
  const profile = findSwitchProfile(draft, profileId);
  const index = profile.rules.findIndex((rule) => rule.id === ruleId);
  if (index === -1) throw new RangeError(`switch rule ${ruleId} does not exist`);
  const target = index + offset;
  if (target < 0 || target >= profile.rules.length) return draft;
  const [rule] = profile.rules.splice(index, 1);
  if (rule) profile.rules.splice(target, 0, rule);
  assertValidDraft(draft);
  return draft;
}
