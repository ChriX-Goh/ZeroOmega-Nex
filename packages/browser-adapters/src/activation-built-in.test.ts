import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { describe, expect, it } from 'vitest';

import {
  activateBuiltInMode,
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

function snapshot(id = 'snapshot-previous'): PacRuntimeSnapshot {
  return {
    snapshotSchemaVersion: 1,
    snapshotId: id,
    createdAt: '2026-07-25T13:30:00.000Z',
    sourceDocumentId: 'document-built-in-test',
    sourceRevisionId: 'revision-built-in-test',
    sourceProfileSpecSha256: 'source-sha-256',
    startRoute: { kind: 'profile', profileId: 'profile-primary' },
    target: 'chromium',
    compilerVersion: '0.1.0',
    scriptSha256: `script-sha-${id}`,
    capability: 'exact',
    script: 'function FindProxyForURL(){return "DIRECT";}',
    stats: {
      scriptBytes: 45,
      profileCount: 1,
      endpointCount: 1,
      conditionCount: 0,
      ruleListRuleCount: 0,
    },
    warnings: [],
    verification: { passed: true, vectorCount: 1, matchedCount: 1 },
  };
}

class StatefulProxyDriver implements BrowserProxyDriver {
  readonly family = 'chromium' as const;
  readonly operations: string[] = [];
  state: PlatformProxyState;
  installed?: PacRuntimeSnapshot;
  failPacInstall = false;
  leaveBuiltInUnconfirmed = false;

  constructor(mode: 'direct' | 'system' = 'system') {
    this.state = {
      family: 'chromium',
      controlLevel: 'controllable-by-this-extension',
      value: { mode },
    };
  }

  async getCapabilities(): Promise<BrowserProxyCapabilities> {
    return {
      family: 'chromium',
      canSetProxy: true,
      controlLevel: this.state.controlLevel,
      supportsInlinePac: true,
      requiresPrivateBrowsingAccess: false,
      privateBrowsingAllowed: true,
      supportsPersistentRegularScope: true,
      notes: [],
    };
  }

  async readState(): Promise<PlatformProxyState> {
    this.operations.push('read-state');
    return structuredClone(this.state);
  }

  async installPac(candidate: PacRuntimeSnapshot): Promise<void> {
    this.operations.push(`install:${candidate.snapshotId}`);
    if (this.failPacInstall) throw new Error('PAC installation failed for test');
    this.installed = structuredClone(candidate);
    this.state = {
      family: 'chromium',
      controlLevel: 'controlled-by-this-extension',
      value: { mode: 'pac_script', snapshotId: candidate.snapshotId },
    };
  }

  async confirmPac(candidate: PacRuntimeSnapshot): Promise<PacInstallConfirmation> {
    this.operations.push(`confirm:${candidate.snapshotId}`);
    return this.installed?.snapshotId === candidate.snapshotId
      ? {
          confirmed: true,
          controlLevel: 'controlled-by-this-extension',
          installedScriptSha256: candidate.scriptSha256,
        }
      : {
          confirmed: false,
          controlLevel: 'controlled-by-this-extension',
          reason: 'snapshot mismatch',
        };
  }

  async setDirect(): Promise<void> {
    this.operations.push('set-direct');
    if (this.leaveBuiltInUnconfirmed) return;
    this.state = {
      family: 'chromium',
      controlLevel: 'controlled-by-this-extension',
      value: { mode: 'direct' },
    };
  }

  async setSystem(): Promise<void> {
    this.operations.push('set-system');
    if (this.leaveBuiltInUnconfirmed) return;
    this.state = {
      family: 'chromium',
      controlLevel: 'controlled-by-this-extension',
      value: { mode: 'system' },
    };
  }

  async restoreState(state: PlatformProxyState): Promise<void> {
    this.operations.push('restore-platform');
    this.state = structuredClone(state);
  }

  async clearControl(): Promise<void> {
    this.operations.push('clear-control');
    delete this.installed;
  }
}

describe('built-in proxy activation transactions', () => {
  it('activates Direct and records it as the active last-known-good mode', async () => {
    const repository = new MemorySnapshotActivationRepository();
    const driver = new StatefulProxyDriver('system');

    const result = await activateBuiltInMode(repository, driver, 'direct', {
      startedAt: '2026-07-25T13:31:00.000Z',
    });

    expect(result).toEqual({ ok: true, activeBuiltInMode: 'direct' });
    await expect(repository.getState()).resolves.toEqual({
      activeBuiltInMode: 'direct',
      lastKnownGoodBuiltInMode: 'direct',
    });
    expect(driver.state).toMatchObject({
      controlLevel: 'controlled-by-this-extension',
      value: { mode: 'direct' },
    });
  });

  it('rolls a failed built-in confirmation back to the previous PAC snapshot', async () => {
    const previous = snapshot();
    const repository = new MemorySnapshotActivationRepository({
      activeSnapshotId: previous.snapshotId,
      lastKnownGoodSnapshotId: previous.snapshotId,
    });
    await repository.putSnapshot(previous);
    const driver = new StatefulProxyDriver('system');
    driver.leaveBuiltInUnconfirmed = true;

    const result = await activateBuiltInMode(repository, driver, 'direct', {
      startedAt: '2026-07-25T13:32:00.000Z',
      failedAt: '2026-07-25T13:32:01.000Z',
    });

    expect(result).toMatchObject({
      ok: false,
      stage: 'confirm',
      rollbackSucceeded: true,
    });
    expect(driver.operations).toContain(`install:${previous.snapshotId}`);
    await expect(repository.getState()).resolves.toMatchObject({
      activeSnapshotId: previous.snapshotId,
      lastKnownGoodSnapshotId: previous.snapshotId,
      lastFailure: {
        snapshotId: 'built-in-direct',
        stage: 'confirm',
        rollbackSucceeded: true,
      },
    });
  });

  it('restores the previous Direct mode when a PAC transition fails', async () => {
    const repository = new MemorySnapshotActivationRepository({
      activeBuiltInMode: 'direct',
      lastKnownGoodBuiltInMode: 'direct',
    });
    const driver = new StatefulProxyDriver('direct');
    driver.failPacInstall = true;

    const result = await activatePacSnapshot(repository, driver, snapshot('snapshot-candidate'), {
      startedAt: '2026-07-25T13:33:00.000Z',
      failedAt: '2026-07-25T13:33:01.000Z',
    });

    expect(result).toMatchObject({
      ok: false,
      stage: 'install',
      rollbackSucceeded: true,
    });
    expect(driver.operations).toContain('set-direct');
    await expect(repository.getState()).resolves.toMatchObject({
      activeBuiltInMode: 'direct',
      lastKnownGoodBuiltInMode: 'direct',
      lastFailure: { stage: 'install', rollbackSucceeded: true },
    });
  });

  it('recovers an interrupted transition to the previous System mode', async () => {
    const repository = new MemorySnapshotActivationRepository({
      activeBuiltInMode: 'system',
      lastKnownGoodBuiltInMode: 'system',
      pending: {
        snapshotId: 'snapshot-interrupted',
        previousActiveBuiltInMode: 'system',
        platformBefore: {
          family: 'chromium',
          controlLevel: 'controlled-by-this-extension',
          value: { mode: 'system' },
        },
        startedAt: '2026-07-25T13:34:00.000Z',
      },
    });
    const driver = new StatefulProxyDriver('direct');

    const result = await recoverPendingActivation(
      repository,
      driver,
      '2026-07-25T13:34:01.000Z',
    );

    expect(result).toEqual({
      status: 'recovered',
      activeBuiltInMode: 'system',
      restoredPlatformBaseline: false,
    });
    expect(driver.operations).toContain('set-system');
    await expect(repository.getState()).resolves.toMatchObject({
      activeBuiltInMode: 'system',
      lastKnownGoodBuiltInMode: 'system',
      lastFailure: { stage: 'recovery', rollbackSucceeded: true },
    });
  });

  it('restores the persisted built-in mode on extension restart', async () => {
    const repository = new MemorySnapshotActivationRepository({
      activeBuiltInMode: 'direct',
      lastKnownGoodBuiltInMode: 'direct',
    });
    const driver = new StatefulProxyDriver('system');

    await expect(restoreActiveSnapshot(repository, driver)).resolves.toEqual({
      status: 'restored-built-in',
      mode: 'direct',
    });
    expect(driver.state.value).toEqual({ mode: 'direct' });
  });
});
