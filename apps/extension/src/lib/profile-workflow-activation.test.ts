import {
  MemorySnapshotActivationRepository,
  type BrowserProxyCapabilities,
  type BrowserProxyDriver,
  type PacInstallConfirmation,
  type PlatformProxyState,
} from '@zeroomega-nex/browser-adapters';
import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { cloneProfileSpec } from '@zeroomega-nex/profile-spec';
import { createDefaultProfileSpec } from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import {
  BrowserProfileWorkflowActivationDriver,
  buildProfileWorkflowVerificationVectors,
  type ProfileWorkflowProxyRuntime,
} from './profile-workflow-activation';

function defaultSpec() {
  return createDefaultProfileSpec({
    documentId: 'document-activation-test',
    revisionId: 'revision-activation-test',
    createdAt: '2026-07-25T09:00:00.000Z',
    deviceId: 'device-activation-test',
  });
}

class FakeProxyDriver implements BrowserProxyDriver {
  readonly family: 'chromium' | 'firefox';
  installed?: PacRuntimeSnapshot;
  installCount = 0;
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
      value: { mode: 'direct' },
    };
  }

  async setSystem(): Promise<void> {
    this.state = {
      family: this.family,
      controlLevel: 'controlled-by-this-extension',
      value: { mode: 'system' },
    };
  }

  async restoreState(state: PlatformProxyState): Promise<void> {
    this.state = structuredClone(state);
  }

  async clearControl(): Promise<void> {
    this.installed = undefined;
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
    expect(new Set(first.map((vector) => JSON.stringify(vector.request))).size).toBe(
      first.length,
    );
  });

  it('compiles, verifies, stores, installs, and confirms the candidate snapshot', async () => {
    const proxy = new FakeProxyDriver('chromium');
    const created = runtime(proxy);
    const times = [
      new Date('2026-07-25T09:01:00.000Z'),
      new Date('2026-07-25T09:01:01.000Z'),
    ];
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

  it('rejects an unsupported startup route before touching browser proxy state', async () => {
    const spec = cloneProfileSpec(defaultSpec());
    spec.settings.startup.route = { kind: 'system' };
    const proxy = new FakeProxyDriver();
    const created = runtime(proxy);
    const driver = new BrowserProfileWorkflowActivationDriver({
      createRuntime: () => created.runtime,
      now: () => new Date('2026-07-25T09:03:00.000Z'),
    });
    await expect(driver.activate(spec)).rejects.toThrow('PAC compilation failed');
    expect(proxy.installCount).toBe(0);
    expect(created.disposed()).toBe(true);
  });
});
