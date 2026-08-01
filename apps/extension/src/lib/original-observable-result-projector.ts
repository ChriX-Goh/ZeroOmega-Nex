import type { SwitchProfile } from '@zeroomega-nex/profile-spec';

import { projectOriginalAttachedRuleListTrace } from './original-observable-attached-rule-list';
import {
  ORIGINAL_TOOLBAR_DIRECT_COLOR,
  projectOriginalObservableResultTrace,
  type OriginalObservableResultTrace,
  type ProjectOriginalObservableResultTraceInput,
} from './original-observable-result-trace';

/**
 * Single entry point for Original-observable result projection. Evidence-bounded
 * profile-family subprojectors are composed here while every unknown shape
 * continues to fail closed.
 */
export function projectOriginalObservableResult(
  input: ProjectOriginalObservableResultTraceInput,
): OriginalObservableResultTrace | undefined {
  const activeRoute = input.activeRoute;
  if (
    activeRoute.kind === 'profile' &&
    input.request !== undefined &&
    input.decision !== undefined
  ) {
    const parent = input.spec.profiles.find(
      (candidate): candidate is SwitchProfile =>
        candidate.id === activeRoute.profileId && candidate.kind === 'switch',
    );
    if (parent?.attachedRuleListProfileId !== undefined) {
      const directColor =
        input.spec.settings.interface.builtInProfiles?.direct?.color ??
        ORIGINAL_TOOLBAR_DIRECT_COLOR;
      return projectOriginalAttachedRuleListTrace({
        spec: input.spec,
        parent,
        decision: input.decision,
        request: input.request,
        i18n: input.i18n,
        directColor,
      });
    }
  }

  return projectOriginalObservableResultTrace(input);
}
