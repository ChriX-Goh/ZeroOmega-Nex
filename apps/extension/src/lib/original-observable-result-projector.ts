import { projectOriginalAttachedRuleListTrace } from './original-observable-attached-rule-list';
import { projectOriginalNestedSwitchTrace } from './original-observable-nested-switch';
import { projectOriginalNestedVirtualTrace } from './original-observable-nested-virtual';
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
    const activeProfile = input.spec.profiles.find(
      (candidate) => candidate.id === activeRoute.profileId,
    );
    const directColor =
      input.spec.settings.interface.builtInProfiles?.direct?.color ??
      ORIGINAL_TOOLBAR_DIRECT_COLOR;

    if (activeProfile?.kind === 'switch') {
      if (activeProfile.attachedRuleListProfileId !== undefined) {
        return projectOriginalAttachedRuleListTrace({
          spec: input.spec,
          parent: activeProfile,
          decision: input.decision,
          request: input.request,
          i18n: input.i18n,
          directColor,
        });
      }

      const nestedSwitch = projectOriginalNestedSwitchTrace({
        spec: input.spec,
        parent: activeProfile,
        decision: input.decision,
        request: input.request,
        i18n: input.i18n,
        directColor,
      });
      if (nestedSwitch !== undefined) return nestedSwitch;
    }

    if (activeProfile?.kind === 'virtual') {
      const nestedVirtual = projectOriginalNestedVirtualTrace({
        spec: input.spec,
        parent: activeProfile,
        decision: input.decision,
        request: input.request,
        i18n: input.i18n,
        directColor,
      });
      if (nestedVirtual !== undefined) return nestedVirtual;
    }
  }

  return projectOriginalObservableResultTrace(input);
}
