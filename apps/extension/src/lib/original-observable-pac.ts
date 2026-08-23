import type { PacProfile } from '@zeroomega-nex/profile-spec';
import type { GraphDecision } from '@zeroomega-nex/reference-interpreter';

import type { OriginalObservableResultTrace } from './original-observable-result-trace';

interface ProjectOriginalPacTraceInput {
  readonly profile: PacProfile;
  readonly decision: GraphDecision;
  readonly directColor: string;
}

/**
 * Evidence-bounded projection for the original URL-backed PAC Toolbar state.
 * The original Action does not expose the PAC result for each URL; it shows the
 * applied PAC profile and source URL while the browser PAC runtime owns routing.
 */
export function projectOriginalPacTrace(
  input: ProjectOriginalPacTraceInput,
): OriginalObservableResultTrace | undefined {
  const { profile, decision } = input;
  if (
    profile.color === undefined ||
    profile.source.kind !== 'url' ||
    profile.source.script === undefined ||
    profile.headers !== undefined ||
    profile.credential !== undefined ||
    profile.fallbackRoute !== undefined ||
    decision.status !== 'indeterminate' ||
    decision.support !== 'target-dependent' ||
    decision.trace.length !== 2
  ) {
    return undefined;
  }

  const [entered, pac] = decision.trace;
  if (
    entered?.action !== 'enter-profile' ||
    entered.profileId !== profile.id ||
    entered.profileKind !== 'pac' ||
    pac?.action !== 'pac' ||
    pac.profileId !== profile.id ||
    pac.profileKind !== 'pac' ||
    pac.support !== 'target-dependent' ||
    JSON.stringify(pac.pacSource) !== JSON.stringify(profile.source)
  ) {
    return undefined;
  }

  const profileReference = {
    displayName: profile.name,
    badgeName: profile.name,
    color: profile.color,
    builtin: false,
  } as const;

  return {
    currentProfile: profileReference,
    resultProfile: profileReference,
    details: profile.source.url,
    routeKind: 'proxy',
    directProfileColor: input.directColor,
    directResult: false,
    currentProfileStatic: true,
    matchedProfileIsCurrent: true,
  };
}
