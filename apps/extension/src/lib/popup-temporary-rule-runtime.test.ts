import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  popupTemporaryProfileIdForBaseRoute,
  popupTemporarySnapshotId,
  type ProfileWorkflowActivationDriver,
  type ProfileWorkflowRuntimeView,
} from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import { PopupTemporaryRuleCoordinator } from './popup-temporary-rule-runtime';

class Area {
  readonly values = new Map<string, unknown>();
  async get(keys: string | readonly string[]): Promise<Record<string, unknown>> {
    const selected = Array.isArray(keys) ? keys : [keys];
    return Object.fromEntries(
      selected.flatMap((key) => (this.values.has(key) ? [[key, this.values.get(key)]] : [])),
    );
  }
  async set(items: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(items)) this.values.set(key, structuredClone(value));
  }
  async remove(keys: string | readonly string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) this.values.delete(key);
  }
}

class Driver implements ProfileWorkflowActivationDriver {
  readonly calls: { spec: ProfileSpec; route?: ProfileRouteTarget }[] = [];
  runtime: ProfileWorkflowRuntimeView = { activeRoute: { kind: 'profile', profileId: 'switch' } };
  async activate(spec: ProfileSpec, route?: ProfileRouteTarget) {
    this.calls.push({
      spec: structuredClone(spec),
      ...(route === undefined ? {} : { route: structuredClone(route) }),
    });
    const temporaryProfile =
      route?.kind === 'profile'
        ? spec.profiles.find((profile) => profile.id === route.profileId)
        : undefined;
    this.runtime = {
      activeSnapshotId:
        temporaryProfile?.kind === 'switch'
          ? popupTemporarySnapshotId(temporaryProfile.defaultRoute, 'runtime')
          : 'normal',
      ...(route === undefined ? {} : { activeRoute: structuredClone(route) }),
    };
    return { snapshotId: this.runtime.activeSnapshotId! };
  }
  async rollback(): Promise<void> {}
  async inspectRuntime(): Promise<ProfileWorkflowRuntimeView> {
    return structuredClone(this.runtime);
  }
}

function spec(): ProfileSpec {
  return {
    schemaVersion: '1.0',
    documentId: 'document',
    revision: { id: 'revision', createdAt: '2026-07-27T13:00:00.000Z' },
    profiles: [
      { id: 'fixed', name: 'Fixed', kind: 'fixed', proxyByScheme: {}, bypass: [] },
      { id: 'switch', name: 'Switch', kind: 'switch', rules: [], defaultRoute: { kind: 'direct' } },
    ],
    proxyEndpoints: [],
    ruleSources: [],
    settings: {
      startup: { route: { kind: 'profile', profileId: 'switch' }, revertProxyChanges: true },
      quickSwitch: { enabled: true, routes: [], refreshOnChange: false },
      interface: {
        confirmDeletion: true,
        showInspectMenu: true,
        addConditionsToBottom: false,
        showResultProfileOnActionBadgeText: false,
        showExternalProfile: true,
        showAdvancedConditions: false,
        exportLegacyRuleList: false,
      },
      ruleSourceUpdateIntervalMinutes: 1440,
    },
  };
}

describe('Popup temporary rule coordinator', () => {
  it('activates a hidden overlay and reports the underlying base route', async () => {
    const area = new Area();
    const driver = new Driver();
    const coordinator = new PopupTemporaryRuleCoordinator(driver, area);
    const view = await coordinator.toggle(spec(), 'example.com', {
      kind: 'profile',
      profileId: 'fixed',
    });
    expect(view.active).toBe(true);
    expect(driver.calls.at(-1)?.route).toEqual({
      kind: 'profile',
      profileId: popupTemporaryProfileIdForBaseRoute({ kind: 'profile', profileId: 'switch' }),
    });
    expect((await coordinator.inspectRuntime()).activeRoute).toEqual({
      kind: 'profile',
      profileId: 'switch',
    });
  });

  it('keeps an empty overlay active after removing the last rule and exposes it to Toolbar', async () => {
    const area = new Area();
    const driver = new Driver();
    const coordinator = new PopupTemporaryRuleCoordinator(driver, area);
    await coordinator.toggle(spec(), 'example.com', { kind: 'profile', profileId: 'fixed' });
    const removed = await coordinator.remove(spec(), 'example.com');
    expect(removed.rules).toEqual([]);
    expect(removed.active).toBe(true);
    const toolbar = await coordinator.inspectToolbarRuntime(spec());
    expect(toolbar.activeRoute).toEqual({ kind: 'profile', profileId: 'switch' });
    expect(toolbar.toolbarProjection?.activeRoute).toEqual({
      kind: 'profile',
      profileId: popupTemporaryProfileIdForBaseRoute({ kind: 'profile', profileId: 'switch' }),
    });
    expect(toolbar.toolbarProjection?.spec.profiles.at(-1)).toMatchObject({
      kind: 'switch',
      rules: [],
      defaultRoute: { kind: 'profile', profileId: 'switch' },
    });
  });

  it('retains rules but does not wrap System Proxy', async () => {
    const area = new Area();
    const driver = new Driver();
    const coordinator = new PopupTemporaryRuleCoordinator(driver, area);
    await coordinator.toggle(spec(), 'example.com', { kind: 'profile', profileId: 'fixed' });
    driver.runtime = { activeRoute: { kind: 'system' } };
    await coordinator.activate(spec(), { kind: 'system' });
    expect(driver.calls.at(-1)?.route).toEqual({ kind: 'system' });
    expect((await coordinator.view(spec())).rules).toHaveLength(1);
  });
});
