import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  buildPopupTemporaryRuleOverlay,
  createPopupTemporaryRuleState,
  createProfileWorkflowState,
  removePopupTemporaryRule,
  togglePopupTemporaryRule,
  type ProfileWorkflowRuntimeView,
  type ProfileWorkflowState,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import type { OriginalToolbarI18nApi } from './original-toolbar-i18n';
import {
  OriginalToolbarProfileResolver,
  type OriginalToolbarProfileStateRepository,
  type OriginalToolbarRuntimeInspector,
  type OriginalToolbarRuntimeView,
} from './original-toolbar-profile-resolver';

class MemoryRepository implements OriginalToolbarProfileStateRepository {
  constructor(readonly state: ProfileWorkflowState) {}
  async read(): Promise<ProfileWorkflowState> {
    return this.state;
  }
}

class ProjectedRuntime implements OriginalToolbarRuntimeInspector {
  constructor(readonly view: OriginalToolbarRuntimeView) {}
  async inspectRuntime(): Promise<OriginalToolbarRuntimeView> {
    return this.view;
  }
}

class EnglishI18n implements OriginalToolbarI18nApi {
  getMessage(name: string): string {
    if (name === 'routeDirect') return 'Direct';
    if (name === 'browserAction_defaultRuleDetails') return '(default)';
    if (name === 'browserAction_tempRulePrefix') return '(TEMP) ';
    return '';
  }
}

function fixture(): {
  readonly state: ProfileWorkflowState;
  readonly baseRoute: ProfileRouteTarget;
  readonly fixedRoute: ProfileRouteTarget;
} {
  const spec: ProfileSpec = {
    schemaVersion: '1.0',
    documentId: 'temporary-rule-toolbar',
    revision: { id: 'temporary-rule-revision', createdAt: '2026-08-02T04:42:00.000Z' },
    profiles: [
      {
        id: 'temporary-fixed',
        name: 'Runtime Temporary Fixed',
        color: '#64b5f6',
        kind: 'fixed',
        proxyByScheme: { fallback: 'temporary-endpoint' },
        bypass: [],
      },
      {
        id: 'temporary-base',
        name: 'Runtime Temporary Base',
        color: '#ffb74d',
        kind: 'switch',
        rules: [],
        defaultRoute: { kind: 'direct' },
      },
    ],
    proxyEndpoints: [
      {
        id: 'temporary-endpoint',
        name: 'Temporary endpoint',
        protocol: 'http',
        host: '127.0.0.1',
        port: 18187,
      },
    ],
    ruleSources: [],
    settings: {
      startup: {
        route: { kind: 'profile', profileId: 'temporary-base' },
        revertProxyChanges: true,
      },
      quickSwitch: { enabled: true, routes: [], refreshOnChange: false },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: true,
        showExternalProfile: true,
        showAdvancedConditions: false,
        exportLegacyRuleList: false,
        builtInProfiles: { direct: { color: '#aaaaaa' } },
      },
      ruleSourceUpdateIntervalMinutes: 1440,
    },
  };
  return {
    state: createProfileWorkflowState(spec),
    baseRoute: { kind: 'profile', profileId: 'temporary-base' },
    fixedRoute: { kind: 'profile', profileId: 'temporary-fixed' },
  };
}

async function resolve(
  state: ProfileWorkflowState,
  projection: { readonly spec: ProfileSpec; readonly startRoute: ProfileRouteTarget },
  url: string,
) {
  const runtime: ProfileWorkflowRuntimeView = {
    activeRoute: { kind: 'profile', profileId: 'temporary-base' },
  };
  return new OriginalToolbarProfileResolver({
    repository: new MemoryRepository(state),
    runtime: new ProjectedRuntime({
      ...runtime,
      toolbarProjection: { spec: projection.spec, activeRoute: projection.startRoute },
    }),
    i18n: new EnglishI18n(),
  }).resolve({ tabId: 71, url });
}

describe('original temporary-rule Toolbar projection', () => {
  it('reproduces the matched Fixed result and TEMP prefix', async () => {
    const { state, baseRoute, fixedRoute } = fixture();
    const temporary = togglePopupTemporaryRule(
      createPopupTemporaryRuleState(),
      'temp-rule.test',
      fixedRoute,
      baseRoute,
    );
    const projection = buildPopupTemporaryRuleOverlay(state.applied, temporary, baseRoute);
    await expect(resolve(state, projection, 'http://temp-rule.test/path')).resolves.toEqual({
      icon: {
        mode: 'two-color',
        outerCircleColor: '#64b5f6',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Runtime Temporary Base',
        resultProfileName: 'Runtime Temporary Fixed',
        details: '(TEMP) *.temp-rule.test => Runtime Temporary Fixed\n' + 'PROXY 127.0.0.1:18187\n',
      },
      badgeText: 'Runt',
      detailPrefix: '(TEMP) ',
    });
  });

  it('keeps the hidden overlay default transition before and after removing the last rule', async () => {
    const { state, baseRoute, fixedRoute } = fixture();
    const active = togglePopupTemporaryRule(
      createPopupTemporaryRuleState(),
      'temp-rule.test',
      fixedRoute,
      baseRoute,
    );
    const expected = {
      icon: {
        mode: 'two-color' as const,
        outerCircleColor: '#aaaaaa',
        innerCircleColor: '#ffb74d',
      },
      titleArguments: {
        currentProfileName: 'Runtime Temporary Base',
        resultProfileName: '[Direct]',
        details: '(default) => Runtime Temporary Base\n(default) => [Direct]\n',
      },
      badgeText: 'Dire',
    };
    await expect(
      resolve(
        state,
        buildPopupTemporaryRuleOverlay(state.applied, active, baseRoute),
        'http://temp-rule-default.test/path',
      ),
    ).resolves.toEqual(expected);

    const removed = removePopupTemporaryRule(active, 'temp-rule.test');
    expect(removed.overlayActive).toBe(true);
    await expect(
      resolve(
        state,
        buildPopupTemporaryRuleOverlay(state.applied, removed, baseRoute),
        'http://temp-rule.test/path',
      ),
    ).resolves.toEqual(expected);
  });
});
