import {
  MemorySnapshotActivationRepository,
  type BrowserProxyCapabilities,
  type BrowserProxyDriver,
  type PacInstallConfirmation,
  type PlatformProxyState,
  type ProxyAuthenticationBinding,
} from '@zeroomega-nex/browser-adapters';
import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { cloneProfileSpec } from '@zeroomega-nex/profile-spec';
import { createDefaultProfileSpec } from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import {
  BrowserProfileWorkflowActivationDriver,
  buildProfileWorkflowVerificationVectors,
  type ProfileWorkflowAuthenticationCoordinator,
  type ProfileWorkflowProxyRuntime,
} from './profile-workflow-activation';
import type { ProxyAuthenticationPreparationResult } from './proxy-auth-runtime';

function defaultSpec() {
  return createDefaultProfileSpec({
    documentId: 'document-activation-test',
    revisionId: 'revision-activation-test',
    createdAt: '2026-07-25T09:00:00.000Z',
    deviceId: 'device-activation-test',
  });
}

function authenticatedSpec(protocol: 'http' | 'socks5' = 'http') {
  const spec = cloneProfileSpec(defaultSpec());
  const endpoint = spec.proxyEndpoints[0]!;
  endpoint.protocol = protocol;
  endpoint.credential = {
    username: 'proxy-user',
    passwordSecretRef: 'secret-proxy-password',
  };
  return spec;
}

class FakeProxyDriver implements BrowserProxyDriver {
  readonly family: 'chromium' | 'firefox';
  installed: PacRuntimeSnapshot | undefined;
  installCount = 0;
  failInstall = false;
  state: PlatformProxyState;

  constructor(family: 'chromium' | 'firefox' = 'chromium') {
    this.family = family;
    this.state = {
      family,
      controlLevel: 'controllable-by-this-extension',
      value: family === 'chromium' ? { mode: 'system' } : { proxyType: 'system' },
    };
  }

  async getCapabilities(): Promise<BrowserProxyCapabilities> {
    return {
      family: this.family,
      canSetProxy: true,
      controlLevel: this.installed
        ? 'controlled-by-this-extension'
        : 'controllable-by-this-extension',
      supportsInlinePac: this.family === 'chromium',
      requiresPrivateBrowsingAccess: this.family === 'firefox',
      privateBrowsingAllowed: true,
      supportsPersistentRegularScope: true,
      notes: [],
    };
  }

  async readState(): Promise<PlatformProxyState> {
    return structuredClone(this.state);
  }

  async installPac(snapshot: PacRuntimeSnapshot): Promise<void> {
    this.installCount += 1;
    if (this.failInstall) throw new Error('PAC install failed for test');
    this.installed = structuredClone(snapshot);
    this.state = {
      family: this.family,
      controlLevel: 'controlled-by-this-extension',
      value: { snapshotId: snapshot.snapshotId },
    };
  }

  async confirmPac(snapshot: PacRuntimeSnapshot): Promise<PacInstallConfirmation> {
    return this.installed?.snapshotId === snapshot.snapshotId
      ? {
          confirmed: true,
          controlLevel: 'controlled-by-this-extension',
          installedScriptSha256: snapshot.scriptSha256,
        }
      : {
          confirmed: false,
          controlLevel: 'controlled-by-this-extension',
          reason: 'snapshot mismatch',
        };
  }

  async setDirect(): Promise<void> {
    this.state = {
      family: this.family,
      controlLevel: 'controlled-by-this-extension',
      value: this.family === 'chromium' ? { mode: 'direct' } : { proxyType: 'none' },
    };
  }

  async setSystem(): Promise<void> {
    this.state = {
      family: this.family,
      controlLevel: 'controlled-by-this-extension',
      value: this.family === 'chromium' ? { mode: 'system' } : { proxyType: 'system' },
    };
  }

  async restoreState(state: PlatformProxyState): Promise<void> {
    this.state = structuredClone(state);
  }

  async clearControl(): Promise<void> {
    this.installed = undefined;
  }
}

class FakeAuthenticationCoordinator implements ProfileWorkflowAuthenticationCoordinator {
  readonly preparedBindings: ProxyAuthenticationBinding[][] = [];
  commitCount = 0;
  rollbackCount = 0;
  failure?: Extract<ProxyAuthenticationPreparationResult, { ok: false }>;
  rollbackError?: Error;

  async prepare(
    bindings: readonly ProxyAuthenticationBinding[],
  ): Promise<ProxyAuthenticationPreparationResult> {
    this.preparedBindings.push(structuredClone([...bindings]));
    if (this.failure) return this.failure;
    let settled = false;
    return {
      ok: true,
      preparation: {
        status: 'prepared',
        runtimeStatus: bindings.length === 0 ? 'not-configured' : 'registered',
        commit: () => {
          if (settled) return;
          settled = true;
          this.commitCount += 1;
        },
        rollback: async () => {
          if (settled) return;
          settled = true;
          this.rollbackCount += 1;
          if (this.rollbackError) throw this.rollbackError;
        },
      },
    };
  }
}

function runtime(driver: FakeProxyDriver): {
  runtime: ProfileWorkflowProxyRuntime;
  repository: MemorySnapshotActivationRepository;
  disposed: () => boolean;
} {
  const repository = new MemorySnapshotActivationRepository();
  let disposed = false;
  return {
    repository,
    disposed: () => disposed,
    runtime: {
      driver,
      repository,
      dispose: () => {
        disposed = true;
      },
    },
  };
}

describe('ProfileSpec PAC activation driver', () => {
  it('builds deterministic baseline and condition probes', () => {
    const spec = defaultSpec();
    const first = buildProfileWorkflowVerificationVectors(spec);
    const second = buildProfileWorkflowVerificationVectors(spec);
    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThanOrEqual(6);
    expect(first.some((vector) => vector.request.host === 'localhost')).toBe(true);
    expect(first.some((vector) => vector.request.host === '127.0.0.1')).toBe(true);
    expect(new Set(first.map((vector) => JSON.stringify(vector.request))).size).toBe(first.length);
  });

  it('compiles, verifies, stores, installs, and confirms the candidate snapshot', async () => {
    const proxy = new FakeProxyDriver('chromium');
    const created = runtime(proxy);
    const times = [new Date('2026-07-25T09:01:00.000Z'), new Date('2026-07-25T09:01:01.000Z')];
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      now: () => times.shift() ?? new Date('2026-07-25T09:01:02.000Z'),
    });

    const result = await driver.activate(defaultSpec());
    expect(result.snapshotId).toMatch(/^pac-/u);
    expect(proxy.installCount).toBe(1);
    expect(proxy.installed).toMatchObject({
      snapshotId: result.snapshotId,
      sourceRevisionId: 'revision-activation-test',
      target: 'chromium',
      verification: { passed: true },
    });
    await expect(created.repository.getState()).resolves.toMatchObject({
      activeSnapshotId: result.snapshotId,
      lastKnownGoodSnapshotId: result.snapshotId,
    });
    expect(created.disposed()).toBe(true);
  });

  it('targets Firefox when the runtime driver is Firefox', async () => {
    const proxy = new FakeProxyDriver('firefox');
    const created = runtime(proxy);
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      now: () => new Date('2026-07-25T09:02:00.000Z'),
    });
    await driver.activate(defaultSpec());
    expect(proxy.installed?.target).toBe('firefox');
  });

  it('activates System without compiling or installing PAC', async () => {
    const spec = cloneProfileSpec(defaultSpec());
    spec.settings.startup.route = { kind: 'system' };
    const proxy = new FakeProxyDriver();
    const created = runtime(proxy);
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      now: () => new Date('2026-07-25T09:03:00.000Z'),
    });

    await expect(driver.activate(spec)).resolves.toEqual({ snapshotId: 'built-in-system' });
    expect(proxy.installCount).toBe(0);
    expect(proxy.state.value).toEqual({ mode: 'system' });
    await expect(created.repository.getState()).resolves.toEqual({
      activeBuiltInMode: 'system',
      lastKnownGoodBuiltInMode: 'system',
    });
  });

  it('uses an explicit quick-switch route instead of the startup route', async () => {
    const proxy = new FakeProxyDriver();
    const created = runtime(proxy);
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      now: () => new Date('2026-07-25T09:04:00.000Z'),
    });

    await expect(driver.activate(defaultSpec(), { kind: 'direct' })).resolves.toEqual({
      snapshotId: 'built-in-direct',
    });
    expect(proxy.installCount).toBe(0);
    expect(proxy.state.value).toEqual({ mode: 'direct' });
    await expect(driver.inspectRuntime()).resolves.toMatchObject({
      activeRoute: { kind: 'direct' },
    });
  });

  it('prepares reachable HTTP credentials before PAC activation and commits them', async () => {
    const proxy = new FakeProxyDriver();
    const created = runtime(proxy);
    const authentication = new FakeAuthenticationCoordinator();
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      authentication,
      now: () => new Date('2026-07-25T09:05:00.000Z'),
    });

    await driver.activate(authenticatedSpec());

    expect(authentication.preparedBindings).toEqual([
      [
        {
          endpointId: 'endpoint-default-proxy',
          protocol: 'http',
          host: '127.0.0.1',
          port: 7890,
          username: 'proxy-user',
          passwordSecretRef: 'secret-proxy-password',
        },
      ],
    ]);
    expect(authentication.commitCount).toBe(1);
    expect(authentication.rollbackCount).toBe(0);
    expect(proxy.installCount).toBe(1);
  });

  it('does not switch browser proxy state when authentication preparation fails', async () => {
    const proxy = new FakeProxyDriver();
    const created = runtime(proxy);
    const authentication = new FakeAuthenticationCoordinator();
    authentication.failure = {
      ok: false,
      status: 'permissions-required',
      message: 'permissions are missing',
    };
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      authentication,
    });

    await expect(driver.activate(authenticatedSpec())).rejects.toThrow(
      'proxy authentication preparation failed: permissions are missing',
    );
    expect(proxy.installCount).toBe(0);
    expect(authentication.commitCount).toBe(0);
    expect(authentication.rollbackCount).toBe(0);
  });

  it('rolls authentication state back when browser proxy installation fails', async () => {
    const proxy = new FakeProxyDriver();
    proxy.failInstall = true;
    const created = runtime(proxy);
    const authentication = new FakeAuthenticationCoordinator();
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      authentication,
      now: () => new Date('2026-07-25T09:06:00.000Z'),
    });

    await expect(driver.activate(authenticatedSpec())).rejects.toThrow(
      'browser proxy activation failed at install',
    );
    expect(authentication.commitCount).toBe(0);
    expect(authentication.rollbackCount).toBe(1);
  });

  it('prepares an empty authentication plan when switching to Direct', async () => {
    const proxy = new FakeProxyDriver();
    const created = runtime(proxy);
    const authentication = new FakeAuthenticationCoordinator();
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      authentication,
      now: () => new Date('2026-07-25T09:07:00.000Z'),
    });

    await driver.activate(authenticatedSpec(), { kind: 'direct' });

    expect(authentication.preparedBindings).toEqual([[]]);
    expect(authentication.commitCount).toBe(1);
    expect(proxy.state.value).toEqual({ mode: 'direct' });
  });

  it('rejects browser-only SOCKS credentials before authentication or proxy changes', async () => {
    const proxy = new FakeProxyDriver();
    const created = runtime(proxy);
    const authentication = new FakeAuthenticationCoordinator();
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      authentication,
    });

    await expect(driver.activate(authenticatedSpec('socks5'))).rejects.toThrow(
      'browser-only proxy authentication does not support SOCKS credentials',
    );
    expect(authentication.preparedBindings).toEqual([]);
    expect(proxy.installCount).toBe(0);
  });
});
