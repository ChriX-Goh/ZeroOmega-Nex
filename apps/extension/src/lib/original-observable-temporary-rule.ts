import type { FixedProfile, ProfileSpec, SwitchProfile } from '@zeroomega-nex/profile-spec';
import { POPUP_TEMPORARY_PROFILE_ID_PREFIX } from '@zeroomega-nex/profile-workflow';
import type { GraphDecision, ReferenceRequest } from '@zeroomega-nex/reference-interpreter';

import {
  localizeOriginalToolbarDetail,
  ORIGINAL_TOOLBAR_DETAIL_KEYS,
  type OriginalToolbarI18nApi,
} from './original-toolbar-i18n';
import type {
  OriginalObservableProfileReference,
  OriginalObservableResultTrace,
} from './original-observable-result-trace';

interface ProjectOriginalTemporaryRuleTraceInput {
  readonly spec: ProfileSpec;
  readonly temporary: SwitchProfile;
  readonly decision: GraphDecision;
  readonly request: ReferenceRequest;
  readonly i18n: OriginalToolbarI18nApi;
  readonly directColor: string;
}

function userProfile(name: string, color: string): OriginalObservableProfileReference {
  return { displayName: name, badgeName: name, color, builtin: false };
}

function directProfile(
  i18n: OriginalToolbarI18nApi,
  color: string,
): OriginalObservableProfileReference | undefined {
  const name = i18n.getMessage('routeDirect');
  return name.length === 0
    ? undefined
    : { displayName: `[${name}]`, badgeName: name, color, builtin: true };
}

function baseProfile(spec: ProfileSpec, temporary: SwitchProfile): SwitchProfile | undefined {
  if (
    temporary.id !== POPUP_TEMPORARY_PROFILE_ID_PREFIX ||
    temporary.name !== POPUP_TEMPORARY_PROFILE_ID_PREFIX ||
    temporary.defaultRoute.kind !== 'profile' ||
    temporary.attachedRuleListProfileId !== undefined ||
    temporary.rules.length > 1
  ) {
    return undefined;
  }
  const baseProfileId = temporary.defaultRoute.profileId;
  const base = spec.profiles.find(
    (profile): profile is SwitchProfile =>
      profile.id === baseProfileId &&
      profile.kind === 'switch' &&
      profile.enabled !== false &&
      profile.color !== undefined &&
      profile.rules.length === 0 &&
      profile.defaultRoute.kind === 'direct' &&
      profile.attachedRuleListProfileId === undefined,
  );
  if (base === undefined || temporary.color !== base.color) return undefined;
  return base;
}

function fixedResult(spec: ProfileSpec, temporary: SwitchProfile): FixedProfile | undefined {
  const rule = temporary.rules[0];
  if (
    rule === undefined ||
    rule.enabled === false ||
    rule.condition.kind !== 'host-wildcard' ||
    !rule.condition.pattern.startsWith('*.') ||
    rule.condition.pattern.length <= 2 ||
    rule.condition.pattern.includes('\n') ||
    rule.condition.pattern.includes('\r') ||
    rule.route.kind !== 'profile'
  ) {
    return undefined;
  }
  const fixedProfileId = rule.route.profileId;
  return spec.profiles.find(
    (profile): profile is FixedProfile =>
      profile.id === fixedProfileId &&
      profile.kind === 'fixed' &&
      profile.enabled !== false &&
      profile.color !== undefined &&
      profile.bypass.length === 0,
  );
}

export function projectOriginalTemporaryRuleTrace(
  input: ProjectOriginalTemporaryRuleTraceInput,
): OriginalObservableResultTrace | undefined {
  const { decision, i18n, spec, temporary } = input;
  if (decision.status !== 'resolved' || decision.support !== 'exact') return undefined;
  const base = baseProfile(spec, temporary);
  if (base === undefined || base.color === undefined) return undefined;
  const trace = decision.trace;
  let index = 0;
  if (trace[index]?.action !== 'enter-profile' || trace[index]?.profileId !== temporary.id) {
    return undefined;
  }
  index += 1;

  const rule = temporary.rules[0];
  if (rule !== undefined) {
    const ruleEntry = trace[index];
    if (
      ruleEntry?.action !== 'switch-rule' ||
      ruleEntry.profileId !== temporary.id ||
      ruleEntry.ruleId !== rule.id
    ) {
      return undefined;
    }
    index += 1;

    if (ruleEntry.matched === true) {
      const fixed = fixedResult(spec, temporary);
      if (
        fixed === undefined ||
        fixed.color === undefined ||
        decision.route.kind !== 'proxy' ||
        decision.route.endpoint.protocol !== 'http' ||
        fixed.proxyByScheme.fallback !== decision.route.endpointId ||
        fixed.proxyByScheme.http !== undefined ||
        trace[index]?.action !== 'enter-profile' ||
        trace[index]?.profileId !== fixed.id ||
        trace[index + 1]?.action !== 'fixed-endpoint' ||
        trace[index + 1]?.profileId !== fixed.id ||
        trace[index + 1]?.endpointId !== decision.route.endpointId ||
        trace.length !== index + 2
      ) {
        return undefined;
      }
      const prefix = localizeOriginalToolbarDetail(
        i18n,
        ORIGINAL_TOOLBAR_DETAIL_KEYS.temporaryRulePrefix,
      );
      return {
        currentProfile: userProfile(base.name, base.color),
        resultProfile: userProfile(fixed.name, fixed.color),
        details:
          `${prefix}${rule.condition.kind === 'host-wildcard' ? rule.condition.pattern : ''} => ${fixed.name}\n` +
          `PROXY ${decision.route.endpoint.host}:${decision.route.endpoint.port}\n`,
        routeKind: 'proxy',
        directProfileColor: input.directColor,
        directResult: false,
        currentProfileStatic: false,
        matchedProfileIsCurrent: false,
        detailPrefix: prefix,
      };
    }
    if (ruleEntry.matched !== false) return undefined;
  }

  if (
    decision.route.kind !== 'direct' ||
    trace[index]?.action !== 'switch-default' ||
    trace[index]?.profileId !== temporary.id ||
    trace[index + 1]?.action !== 'enter-profile' ||
    trace[index + 1]?.profileId !== base.id ||
    trace[index + 2]?.action !== 'switch-default' ||
    trace[index + 2]?.profileId !== base.id ||
    trace[index + 3]?.action !== 'direct' ||
    trace.length !== index + 4
  ) {
    return undefined;
  }
  const direct = directProfile(i18n, input.directColor);
  const defaultDetail = localizeOriginalToolbarDetail(
    i18n,
    ORIGINAL_TOOLBAR_DETAIL_KEYS.defaultRule,
  );
  if (direct === undefined) return undefined;
  return {
    currentProfile: userProfile(base.name, base.color),
    resultProfile: direct,
    details: `${defaultDetail} => ${base.name}\n` + `${defaultDetail} => ${direct.displayName}\n`,
    routeKind: 'direct',
    directProfileColor: input.directColor,
    directResult: true,
    currentProfileStatic: false,
    matchedProfileIsCurrent: false,
  };
}
