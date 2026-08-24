import { projectOriginalAttachedRuleListTrace } from './original-observable-attached-rule-list';
import { projectOriginalNestedSwitchTrace } from './original-observable-nested-switch';
import { projectOriginalNestedVirtualTrace } from './original-observable-nested-virtual';
import { projectOriginalPacTrace } from './original-observable-pac';
import { projectOriginalTemporaryRuleTrace } from './original-observable-temporary-rule';
import {
  ORIGINAL_TOOLBAR_DIRECT_COLOR,
  projectOriginalObservableResultTrace,
  type OriginalObservableResultTrace,
  type ProjectOriginalObservableResultTraceInput,
} from './original-observable-result-trace';
import { projectOriginalVirtualSwitchTrace } from './original-observable-virtual-switch';

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
      input.spec.settings.interface.builtInProfiles?.direct?.color ?? ORIGINAL_TOOLBAR_DIRECT_COLOR;

    if (activeProfile?.kind === 'switch' && activeProfile.id === 'zeroomega-nex.popup-temporary') {
      return projectOriginalTemporaryRuleTrace({
        spec: input.spec,
        temporary: activeProfile,
        decision: input.decision,
        request: input.request,
        i18n: input.i18n,
        directColor,
      });
    }

    if (activeProfile?.kind === 'pac') {
      const pac = projectOriginalPacTrace({
        profile: activeProfile,
        decision: input.decision,
        directColor,
      });
      if (pac !== undefined) return pac;
    }

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
      const virtualSwitch = projectOriginalVirtualSwitchTrace({
        spec: input.spec,
        parent: activeProfile,
        decision: input.decision,
        request: input.request,
        i18n: input.i18n,
        directColor,
      });
      if (virtualSwitch !== undefined) return virtualSwitch;

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
