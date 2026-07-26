import {
  cloneProfileSpec,
  validateProfileSpec,
  type AutoDetectProfile,
  type PacProfile,
  type ProfileSpec,
  type RuleListProfile,
  type RuleSource,
} from '@zeroomega-nex/profile-spec';

import type {
  ProfileWorkflowIdFactory,
  ProfileWorkflowProfileMutation,
} from './profile-operations.js';

function assertValidDraft(draft: ProfileSpec): void {
  const validation = validateProfileSpec(draft);
  if (validation.valid) return;
  const messages = validation.issues
    .filter((entry) => entry.severity === 'error')
    .slice(0, 8)
    .map((entry) => `${entry.code} at ${entry.path}: ${entry.message}`)
    .join('; ');
  throw new TypeError(`advanced profile operation produced an invalid ProfileSpec: ${messages}`);
}

function uniqueProfileName(spec: ProfileSpec, preferred: string): string {
  const names = new Set(spec.profiles.map((profile) => profile.name));
  if (!names.has(preferred)) return preferred;
  let suffix = 2;
  while (names.has(`${preferred} ${suffix}`)) suffix += 1;
  return `${preferred} ${suffix}`;
}

function appendQuickSwitchRoute(spec: ProfileSpec, profileId: string): void {
  if (
    spec.settings.quickSwitch.routes.some(
      (route) => route.kind === 'profile' && route.profileId === profileId,
    )
  ) {
    return;
  }
  spec.settings.quickSwitch.routes.push({ kind: 'profile', profileId });
}

export function createRuleListProfileDraft(
  spec: ProfileSpec,
  idFactory: ProfileWorkflowIdFactory,
): ProfileWorkflowProfileMutation {
  const draft = cloneProfileSpec(spec);
  const profileId = idFactory('profile');
  const sourceId = idFactory('source');
  const name = uniqueProfileName(draft, 'New rule list');
  const source: RuleSource = {
    id: sourceId,
    name: `${name} source`,
    format: 'autoproxy',
    location: {
      kind: 'inline',
      content: '',
    },
  };
  const profile: RuleListProfile = {
    id: profileId,
    name,
    color: '#4db6ac',
    kind: 'rule-list',
    sourceId,
    matchRoute: { kind: 'direct' },
    defaultRoute: { kind: 'system' },
  };
  draft.ruleSources.push(source);
  draft.profiles.push(profile);
  appendQuickSwitchRoute(draft, profileId);
  assertValidDraft(draft);
  return { draft, profileId };
}

export function createPacProfileDraft(
  spec: ProfileSpec,
  idFactory: ProfileWorkflowIdFactory,
  preferredName = 'New PAC profile',
): ProfileWorkflowProfileMutation {
  const draft = cloneProfileSpec(spec);
  const profileId = idFactory('profile');
  const profile: PacProfile = {
    id: profileId,
    name: uniqueProfileName(draft, preferredName),
    color: '#ffb74d',
    kind: 'pac',
    source: {
      kind: 'inline',
      script: "function FindProxyForURL(url, host) {\n  return 'DIRECT';\n}\n",
    },
    fallbackRoute: { kind: 'direct' },
  };
  draft.profiles.push(profile);
  appendQuickSwitchRoute(draft, profileId);
  assertValidDraft(draft);
  return { draft, profileId };
}

export function createAutoDetectProfileDraft(
  spec: ProfileSpec,
  idFactory: ProfileWorkflowIdFactory,
): ProfileWorkflowProfileMutation {
  const draft = cloneProfileSpec(spec);
  const profileId = idFactory('profile');
  const profile: AutoDetectProfile = {
    id: profileId,
    name: uniqueProfileName(draft, 'New auto-detect profile'),
    color: '#90a4ae',
    kind: 'auto-detect',
    fallbackRoute: { kind: 'direct' },
  };
  draft.profiles.push(profile);
  appendQuickSwitchRoute(draft, profileId);
  assertValidDraft(draft);
  return { draft, profileId };
}
