import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { describe, expect, it } from 'vitest';

import {
  activatePacSnapshot,
  recoverPendingActivation,
  restoreActiveSnapshot,
} from './activation.js';
import type {
  BrowserProxyCapabilities,
  BrowserProxyDriver,
  PacInstallConfirmation,
  PlatformProxyState,
} from './contracts.js';
import { MemorySnapshotActivationRepository } from './memory-repository.js';

function snapshot(id: string, hash = `${id}-hash`): PacRuntimeSnapshot {
  return {
    snapshotSchemaVersion: 1,
    snapshotId: id,
    createdAt: '2026-07-25T08:00:00.000Z',
    sourceDocumentId: 'document-adapter-test',
    sourceRevisionId: `revision-${id}`,
    sourceProfileSpecSha256: `${id}-profile-hash`,
    startRoute: { kind: 'direct' },
    target: 'cross-browser',
    compilerVersion: '0.1.0',
    scriptSha256: hash,
    capability: 'exact',
    script: `function FindProxyForURL(){return "DIRECT";} /* ${id} */`,
    stats: {
      scriptBytes: 64,
      profileCount: 0,
      endpointCount: 0,
      conditionCount: 0,
      ruleListRuleCount: 0,
    },
    warnings: [],
    verification: { passed: true, vectorCount: 1, matchedCount: 1 },
  };
}

const baseline: PlatformProxyState = {
  family: 'chromium',
  controlLevel: 'controllable-by-this-extension',
  value: { mode: 'system' },
};

class FakeDriver implements BrowserProxyDriver {
  readonly family = 'chromium' as const;
  capabilities: BrowserProxyCapabilities = {
    family: 'chromium',
    canSetProxy: true,
    controlLevel: 'controllable-by-this-extension',
    supportsInlinePac: true,
    requiresPrivateBrowsingAccess: false,
    privateBrowsingAllowed: true,
    supportsPersistentRegularScope: true,
    notes: [],
  };
  currentState: PlatformProxyState = structuredClone(baseline);
  installedSnapshot: PacRuntimeSnapshot | undefined;
  installError: Error | undefined;
  confirmError: Error | undefined;
  confirmOverride: PacInstallConfirmation | undefined;
  restoreError: Error | undefined;
  readonly operations: string[] = [];

  async getCapabilities(): Promise<BrowserProxyCapabilities> {
    this.operations.push('capabilities');
    return structuredClone(this.capabilities);
  }

  async readState(): Promise<PlatformProxyState> {
    this.operations.push('read');
    return structuredClone(this.currentState);
  }

  async installPac(value: PacRuntimeSnapshot): Promise<void> {
    this.operations.push(`install:${value.snapshotId}`);
    if (this.installError) throw this.installError;
    this.installedSnapshot = structuredClone(value);
    this.currentState = {
      family: this.family,
      controlLevel: 'controlled-by-this-extension',
      value: { mode: 'pac_script', snapshotId: value.snapshotId, hash: value.scriptSha256 },
    };
  }

  async confirmPac(value: PacRuntimeSnapshot): Promise<PacInstallConfirmation> {
    this.operations.push(`confirm:${value.snapshotId}`);
    if (this.confirmError) throw this.confirmError;
    if (this.confirmOverride) return structuredClone(this.confirmOverride);
    return {
      confirmed: this.installedSnapshot?.snapshotId === value.snapshotId,
      controlLevel: 'controlled-by-this-extension',
      ...(this.installedSnapshot === undefined
        ? { reason: 'no snapshot installed' }
        : { installedScriptSha256: this.installedSnapshot.scriptSha256 }),
    };
  }

  async setDirect(): Promise<void> {
    this.operations.push('direct');
  }

  async setSystem(): Promise<void> {
    this.operations.push('system');
  }

  async restoreState(state: PlatformProxyState): Promise<void> {
    this.operations.push('restore-baseline');
    if (this.restoreError) throw this.restoreError;
    this.currentState = structuredClone(state);
    this.installedSnapshot = undefined;
  }

  async clearControl(): Promise<void> {
    this.operations.push('clear');
  }
}

describe('atomic PAC snapshot activation', () => {
  it('commits active and last-known-good IDs only after installation confirmation', async () => {
    const repository = new MemorySnapshotActivationRepository();
    const driver = new FakeDriver();
    const result = await activatePacSnapshot(repository, driver, snapshot('candidate'), {
      startedAt: '2026-07-25T08:01:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(driver.operations).toEqual([
      'capabilities',
      'read',
      'install:candidate',
      'confirm:candidate',
    ]);
    expect(await repository.getState()).toEqual({
      activeSnapshotId: 'candidate',
      lastKnownGoodSnapshotId: 'candidate',
    });
  });

  it('detects control by another extension before reading or changing proxy state', async () => {
    const repository = new MemorySnapshotActivationRepository();
    const driver = new FakeDriver();
    driver.capabilities = {
      ...driver.capabilities,
      canSetProxy: false,
      controlLevel: 'controlled-by-other-extension',
    };

    const result = await activatePacSnapshot(repository, driver, snapshot('candidate'), {
      startedAt: '2026-07-25T08:02:00.000Z',
    });
    expect(result).toMatchObject({
      ok: false,
      stage: 'preflight',
      rollbackSucceeded: true,
      controlLevel: 'controlled-by-other-extension',
    });
    expect(driver.operations).toEqual(['capabilities']);
    expect((await repository.getState()).activeSnapshotId).toBeUndefined();
  });

  it('restores the platform baseline when first installation throws', async () => {
    const repository = new MemorySnapshotActivationRepository();
    const driver = new FakeDriver();
    driver.installError = new Error('browser set failed');

    const result = await activatePacSnapshot(repository, driver, snapshot('candidate'), {
      startedAt: '2026-07-25T08:03:00.000Z',
      failedAt: '2026-07-25T08:03:01.000Z',
    });
    expect(result).toMatchObject({ ok: false, stage: 'install', rollbackSucceeded: true });
    expect(driver.operations).toEqual([
      'capabilities',
      'read',
      'install:candidate',
      'restore-baseline',
    ]);
    expect(driver.currentState).toEqual(baseline);
    expect((await repository.getState()).pending).toBeUndefined();
  });

  it('reinstalls and confirms the previous active snapshot after candidate confirmation fails', async () => {
    const previous = snapshot('previous');
    const repository = new MemorySnapshotActivationRepository({
      activeSnapshotId: previous.snapshotId,
      lastKnownGoodSnapshotId: previous.snapshotId,
    });
    await repository.putSnapshot(previous);
    const driver = new FakeDriver();
    driver.confirmOverride = {
      confirmed: false,
      controlLevel: 'controlled-by-this-extension',
      reason: 'browser rejected PAC',
    };

    let confirmCalls = 0;
    const originalConfirm = driver.confirmPac.bind(driver);
    driver.confirmPac = async (value) => {
      confirmCalls += 1;
      if (confirmCalls === 1) return originalConfirm(value);
      return {
        confirmed: true,
        controlLevel: 'controlled-by-this-extension',
        installedScriptSha256: value.scriptSha256,
      };
    };

    const result = await activatePacSnapshot(repository, driver, snapshot('candidate'), {
      startedAt: '2026-07-25T08:04:00.000Z',
    });
    expect(result).toMatchObject({ ok: false, stage: 'confirm', rollbackSucceeded: true });
    expect(driver.operations).toContain('install:previous');
    expect(await repository.getState()).toMatchObject({
      activeSnapshotId: 'previous',
      lastKnownGoodSnapshotId: 'previous',
    });
  });

  it('reports rollback failure without claiming the candidate active', async () => {
    const repository = new MemorySnapshotActivationRepository();
    const driver = new FakeDriver();
    driver.installError = new Error('install failed');
    driver.restoreError = new Error('restore failed');

    const result = await activatePacSnapshot(repository, driver, snapshot('candidate'), {
      startedAt: '2026-07-25T08:05:00.000Z',
    });
    expect(result).toMatchObject({ ok: false, stage: 'rollback', rollbackSucceeded: false });
    expect((await repository.getState()).activeSnapshotId).toBeUndefined();
  });
});

describe('restart recovery', () => {
  it('rolls an interrupted replacement back to the previous snapshot', async () => {
    const previous = snapshot('previous');
    const repository = new MemorySnapshotActivationRepository({
      activeSnapshotId: previous.snapshotId,
      lastKnownGoodSnapshotId: previous.snapshotId,
      pending: {
        snapshotId: 'candidate',
        previousActiveSnapshotId: previous.snapshotId,
        platformBefore: baseline,
        startedAt: '2026-07-25T08:10:00.000Z',
      },
    });
    await repository.putSnapshot(previous);
    const driver = new FakeDriver();

    const result = await recoverPendingActivation(repository, driver, '2026-07-25T08:11:00.000Z');
    expect(result).toEqual({
      status: 'recovered',
      activeSnapshotId: 'previous',
      restoredPlatformBaseline: false,
    });
    expect(driver.operations).toEqual(['install:previous', 'confirm:previous']);
    expect((await repository.getState()).pending).toBeUndefined();
  });

  it('restores the browser baseline after an interrupted first activation', async () => {
    const repository = new MemorySnapshotActivationRepository({
      pending: {
        snapshotId: 'candidate',
        platformBefore: baseline,
        startedAt: '2026-07-25T08:12:00.000Z',
      },
    });
    const driver = new FakeDriver();
    driver.currentState = {
      family: 'chromium',
      controlLevel: 'controlled-by-this-extension',
      value: { mode: 'pac_script' },
    };

    const result = await recoverPendingActivation(repository, driver, '2026-07-25T08:13:00.000Z');
    expect(result).toEqual({ status: 'recovered', restoredPlatformBaseline: true });
    expect(driver.currentState).toEqual(baseline);
  });

  it('confirms an existing active snapshot or reinstalls it after browser state loss', async () => {
    const active = snapshot('active');
    const repository = new MemorySnapshotActivationRepository({
      activeSnapshotId: active.snapshotId,
      lastKnownGoodSnapshotId: active.snapshotId,
    });
    await repository.putSnapshot(active);
    const driver = new FakeDriver();
    driver.installedSnapshot = structuredClone(active);

    await expect(restoreActiveSnapshot(repository, driver)).resolves.toEqual({
      status: 'already-confirmed',
      snapshotId: 'active',
    });

    driver.installedSnapshot = undefined;
    driver.operations.length = 0;
    await expect(restoreActiveSnapshot(repository, driver)).resolves.toEqual({
      status: 'restored',
      snapshotId: 'active',
    });
    expect(driver.operations).toEqual(['confirm:active', 'install:active', 'confirm:active']);
  });
});
