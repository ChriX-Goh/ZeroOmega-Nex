import {
  MemorySnapshotActivationRepository,
  type BrowserProxyCapabilities,
  type BrowserProxyDriver,
  type PacInstallConfirmation,
  type PlatformProxyState,
  type ProxyAuthenticationBinding,
} from '@zeroomega-nex/browser-adapters';
import { sha256Hex, type PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import {
  cloneProfileSpec,
  serializeProfileSpec,
  type ProfileSpec,
} from '@zeroomega-nex/profile-spec';
import type { ProfileWorkflowRevisionRepository } from '@zeroomega-nex/profile-workflow';
import { createDefaultProfileSpec } from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import type { ProfileWorkflowAuthenticationCoordinator } from './profile-workflow-activation';
import type { ProxyAuthenticationPreparationResult } from './proxy-auth-runtime';
import { BrowserSnapshotRollbackService } from './snapshot-rollback-runtime';

class FakeProxyDriver implements BrowserProxyDriver {
  readonly family: 'chromium' | 'firefox';
  state: PlatformProxyState;
  installed: PacRuntimeSnapshot | undefined;
  failInstallFor?: string;
  restoreCount = 0;

  constructor(family: 'chromium' | 'firefox' = 'chromium') {
    this.family = family;
    this.state = {
      family,
      controlLevel: 'controlled-by-this-extension',
      value: family === 'chromium' ? { mode: 'system' } : { proxyType: 'system' },
    };
  }

  async getCapabilities(): Promise<BrowserProxyCapabilities> {
    return {
      family: this.family,
      canSetProxy: true,
      controlLevel: 'controlled-by-this-extension',
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
    if (this.failInstallFor === snapshot.snapshotId) {
      throw new Error(`install failed for ${snapshot.snapshotId}`);
    }
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
    this.restoreCount += 1;
    this.state = structuredClone(state);
  }

  async clearControl(): Promise<void> {
    this.installed = undefined;
  }
}

class FakeAuthenticationCoordinator implements ProfileWorkflowAuthenticationCoordinator {
  readonly plans: ProxyAuthenticationBinding[][] = [];
  commitCount = 0;
  rollbackCount = 0;
  failPreparation?: Extract<ProxyAuthenticationPreparationResult, { ok: false }>;

  async prepare(
    bindings: readonly ProxyAuthenticationBinding[],
  ): Promise<ProxyAuthenticationPreparationResult> {
    this.plans.push(structuredClone([...bindings]));
    if (this.failPreparation) return this.failPreparation;
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
        },
      },
    };
  }
}

function baseSpec(revisionId: string, name: string): ProfileSpec {
  const spec = createDefaultProfileSpec({
    documentId: 'document-snapshot-rollback',
    revisionId,
    createdAt: '2026-07-25T17:00:00.000Z',
    deviceId: 'device-snapshot-rollback',
  });
  const fixed = spec.profiles.find((profile) => profile.id === 'profile-default-proxy');
  if (!fixed || fixed.kind !== 'fixed') throw new Error('missing rollback Fixed profile');
  fixed.name = name;
  fixed.color = '#64b5f6';
  const endpoint = spec.proxyEndpoints.find(
    (candidate) => candidate.id === fixed.proxyByScheme.fallback,
  );
  if (!endpoint) throw new Error('missing rollback endpoint');
  endpoint.host = '127.0.0.1';
  endpoint.port = 7890;
  spec.settings.startup.route = { kind: 'profile', profileId: fixed.id };
  return spec;
}

function authenticatedSpec(revisionId: string): ProfileSpec {
  const spec = baseSpec(revisionId, 'Authenticated target');
  spec.proxyEndpoints[0]!.credential = {
    username: 'proxy-user',
    passwordSecretRef: 'secret-proxy-password',
  };
  return spec;
}

async function snapshotFor(
  spec: ProfileSpec,
  snapshotId: string,
  target: PacRuntimeSnapshot['target'] = 'chromium',
): Promise<PacRuntimeSnapshot> {
  const script = `function FindProxyForURL(){return ${JSON.stringify(snapshotId)};}`;
  return {
    snapshotSchemaVersion: 1,
    snapshotId,
    createdAt: '2026-07-25T17:01:00.000Z',
    sourceDocumentId: spec.documentId,
    sourceRevisionId: spec.revision.id,
    sourceProfileSpecSha256: await sha256Hex(serializeProfileSpec(spec)),
    startRoute: structuredClone(spec.settings.startup.route ?? { kind: 'direct' }),
    target,
    compilerVersion: '0.1.0',
    scriptSha256: await sha256Hex(script),
    capability: 'exact',
    script,
    stats: {
      scriptBytes: script.length,
      profileCount: spec.profiles.length,
      endpointCount: spec.proxyEndpoints.length,
      conditionCount: 0,
      ruleListRuleCount: 0,
    },
    warnings: [],
    verification: { passed: true, vectorCount: 1, matchedCount: 1 },
  };
}

class RevisionRepository implements ProfileWorkflowRevisionRepository {
  readonly revisions = new Map<string, ProfileSpec>();

  constructor(...specs: ProfileSpec[]) {
    for (const spec of specs) this.revisions.set(spec.revision.id, cloneProfileSpec(spec));
  }

  async getRevision(revisionId: string): Promise<ProfileSpec | undefined> {
    const revision = this.revisions.get(revisionId);
    return revision === undefined ? undefined : cloneProfileSpec(revision);
  }

  async listRevisions(): Promise<readonly ProfileSpec[]> {
    return [...this.revisions.values()].map(cloneProfileSpec);
  }
}

function runtime(repository: MemorySnapshotActivationRepository, driver: FakeProxyDriver) {
  let disposed = false;
  return {
    createRuntime: () => ({
      repository,
      driver,
      dispose: () => {
        disposed = true;
      },
    }),
    disposed: () => disposed,
  };
}

describe('browser snapshot rollback service', () => {
  it('validates, installs, and commits an archived snapshot with target authentication', async () => {
    const previous = baseSpec('revision-current', 'Current');
    const target = authenticatedSpec('revision-target');
    const previousSnapshot = await snapshotFor(previous, 'snapshot-current');
    const targetSnapshot = await snapshotFor(target, 'snapshot-target');
    const repository = new MemorySnapshotActivationRepository({
      activeSnapshotId: previousSnapshot.snapshotId,
      lastKnownGoodSnapshotId: previousSnapshot.snapshotId,
    });
    await repository.putSnapshot(previousSnapshot);
    await repository.putSnapshot(targetSnapshot);
    const driver = new FakeProxyDriver();
    await driver.installPac(previousSnapshot);
    const authentication = new FakeAuthenticationCoordinator();
    const created = runtime(repository, driver);
    const service = new BrowserSnapshotRollbackService({
      revisions: new RevisionRepository(previous, target),
      authentication,
      createRuntime: created.createRuntime,
      now: () => new Date('2026-07-25T17:02:00.000Z'),
    });

    const preparation = await service.prepare('snapshot-target', previous);

    expect(preparation.targetRevision.revision.id).toBe('revision-target');
    expect(driver.installed?.snapshotId).toBe('snapshot-target');
    expect(authentication.plans).toEqual([
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
    preparation.commit();
    expect(authentication.commitCount).toBe(1);
    expect(created.disposed()).toBe(true);
    await expect(repository.getState()).resolves.toMatchObject({
      activeSnapshotId: 'snapshot-target',
      lastKnownGoodSnapshotId: 'snapshot-target',
    });
  });

  it('restores the previous snapshot and authentication when the outer transaction rolls back', async () => {
    const previous = baseSpec('revision-current', 'Current');
    const target = authenticatedSpec('revision-target');
    const previousSnapshot = await snapshotFor(previous, 'snapshot-current');
    const targetSnapshot = await snapshotFor(target, 'snapshot-target');
    const repository = new MemorySnapshotActivationRepository({
      activeSnapshotId: previousSnapshot.snapshotId,
      lastKnownGoodSnapshotId: previousSnapshot.snapshotId,
    });
    await repository.putSnapshot(previousSnapshot);
    await repository.putSnapshot(targetSnapshot);
    const driver = new FakeProxyDriver();
    await driver.installPac(previousSnapshot);
    const authentication = new FakeAuthenticationCoordinator();
    const service = new BrowserSnapshotRollbackService({
      revisions: new RevisionRepository(previous, target),
      authentication,
      createRuntime: runtime(repository, driver).createRuntime,
      now: () => new Date('2026-07-25T17:03:00.000Z'),
    });

    const preparation = await service.prepare('snapshot-target', previous);
    await preparation.rollback();

    expect(driver.installed?.snapshotId).toBe('snapshot-current');
    expect(authentication.rollbackCount).toBe(1);
    await expect(repository.getState()).resolves.toMatchObject({
      activeSnapshotId: 'snapshot-current',
      lastKnownGoodSnapshotId: 'snapshot-current',
    });
  });

  it('rejects a ProfileSpec hash mismatch before authentication or browser changes', async () => {
    const target = baseSpec('revision-target', 'Target');
    const targetSnapshot = await snapshotFor(target, 'snapshot-target');
    const corrupted = { ...targetSnapshot, sourceProfileSpecSha256: '0'.repeat(64) };
    const repository = new MemorySnapshotActivationRepository();
    await repository.putSnapshot(corrupted);
    const driver = new FakeProxyDriver();
    const authentication = new FakeAuthenticationCoordinator();
    const service = new BrowserSnapshotRollbackService({
      revisions: new RevisionRepository(target),
      authentication,
      createRuntime: runtime(repository, driver).createRuntime,
    });

    await expect(service.prepare('snapshot-target', target)).rejects.toThrow(
      'ProfileSpec hash does not match its revision',
    );
    expect(authentication.plans).toEqual([]);
    expect(driver.installed).toBeUndefined();
  });

  it('rejects a snapshot for another browser target', async () => {
    const target = baseSpec('revision-target', 'Target');
    const targetSnapshot = await snapshotFor(target, 'snapshot-target', 'firefox');
    const repository = new MemorySnapshotActivationRepository();
    await repository.putSnapshot(targetSnapshot);
    const service = new BrowserSnapshotRollbackService({
      revisions: new RevisionRepository(target),
      authentication: new FakeAuthenticationCoordinator(),
      createRuntime: runtime(repository, new FakeProxyDriver('chromium')).createRuntime,
    });

    await expect(service.prepare('snapshot-target', target)).rejects.toThrow(
      'targets firefox, current browser is chromium',
    );
  });

  it('rolls authentication back when target snapshot activation fails', async () => {
    const target = authenticatedSpec('revision-target');
    const targetSnapshot = await snapshotFor(target, 'snapshot-target');
    const repository = new MemorySnapshotActivationRepository();
    await repository.putSnapshot(targetSnapshot);
    const driver = new FakeProxyDriver();
    driver.failInstallFor = 'snapshot-target';
    const authentication = new FakeAuthenticationCoordinator();
    const service = new BrowserSnapshotRollbackService({
      revisions: new RevisionRepository(target),
      authentication,
      createRuntime: runtime(repository, driver).createRuntime,
      now: () => new Date('2026-07-25T17:04:00.000Z'),
    });

    await expect(service.prepare('snapshot-target', target)).rejects.toThrow(
      'snapshot activation failed at install',
    );
    expect(authentication.rollbackCount).toBe(1);
  });

  it('restores the unmanaged platform baseline when no managed activation existed', async () => {
    const target = baseSpec('revision-target', 'Target');
    const targetSnapshot = await snapshotFor(target, 'snapshot-target');
    const repository = new MemorySnapshotActivationRepository();
    await repository.putSnapshot(targetSnapshot);
    const driver = new FakeProxyDriver();
    const baseline = await driver.readState();
    const service = new BrowserSnapshotRollbackService({
      revisions: new RevisionRepository(target),
      authentication: new FakeAuthenticationCoordinator(),
      createRuntime: runtime(repository, driver).createRuntime,
      now: () => new Date('2026-07-25T17:05:00.000Z'),
    });

    const preparation = await service.prepare('snapshot-target', target);
    await preparation.rollback();

    expect(driver.restoreCount).toBe(1);
    expect(driver.state).toEqual(baseline);
    await expect(repository.getState()).resolves.toEqual({});
  });

  it('rejects browser-only SOCKS authentication before activation', async () => {
    const target = authenticatedSpec('revision-target');
    target.proxyEndpoints[0]!.protocol = 'socks5';
    const targetSnapshot = await snapshotFor(target, 'snapshot-target');
    const repository = new MemorySnapshotActivationRepository();
    await repository.putSnapshot(targetSnapshot);
    const authentication = new FakeAuthenticationCoordinator();
    const service = new BrowserSnapshotRollbackService({
      revisions: new RevisionRepository(target),
      authentication,
      createRuntime: runtime(repository, new FakeProxyDriver()).createRuntime,
    });

    await expect(service.prepare('snapshot-target', target)).rejects.toThrow(
      'does not support SOCKS credentials',
    );
    expect(authentication.plans).toEqual([]);
  });
});
