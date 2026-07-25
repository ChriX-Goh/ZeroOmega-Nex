import {
  activateBuiltInMode,
  activatePacSnapshot,
  createProxyAuthenticationPlan,
  type BrowserProxyDriver,
  type PlatformProxyState,
  type SnapshotActivationRepository,
  type SnapshotActivationState,
} from '@zeroomega-nex/browser-adapters';
import { serializeProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  sha256Hex,
  type PacRuntimeSnapshot,
} from '@zeroomega-nex/pac-compiler';
import type {
  ProfileWorkflowRevisionRepository,
  ProfileWorkflowSnapshotRollbackPreparation,
  ProfileWorkflowSnapshotRollbackService,
} from '@zeroomega-nex/profile-workflow';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
import type { ProfileWorkflowAuthenticationCoordinator } from './profile-workflow-activation';

interface SnapshotRollbackProxyRuntime {
  readonly driver: BrowserProxyDriver;
  readonly repository: SnapshotActivationRepository;
  dispose(): void;
}

export interface BrowserSnapshotRollbackServiceOptions {
  readonly revisions: ProfileWorkflowRevisionRepository;
  readonly authentication: ProfileWorkflowAuthenticationCoordinator;
  readonly createRuntime?: () => SnapshotRollbackProxyRuntime;
  readonly now?: () => Date;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function compatibleTarget(snapshot: PacRuntimeSnapshot, driver: BrowserProxyDriver): boolean {
  return snapshot.target === 'cross-browser' || snapshot.target === driver.family;
}

async function validateSnapshot(
  snapshot: PacRuntimeSnapshot,
  targetRevision: Awaited<ReturnType<ProfileWorkflowRevisionRepository['getRevision']>>,
  driver: BrowserProxyDriver,
): Promise<void> {
  if (!targetRevision) {
    throw new Error(`revision ${snapshot.sourceRevisionId} is unavailable`);
  }
  if (targetRevision.documentId !== snapshot.sourceDocumentId) {
    throw new Error(
      `snapshot ${snapshot.snapshotId} document does not match revision ${snapshot.sourceRevisionId}`,
    );
  }
  if (targetRevision.revision.id !== snapshot.sourceRevisionId) {
    throw new Error(`snapshot ${snapshot.snapshotId} revision identity is inconsistent`);
  }
  if (!compatibleTarget(snapshot, driver)) {
    throw new Error(
      `snapshot ${snapshot.snapshotId} targets ${snapshot.target}, current browser is ${driver.family}`,
    );
  }
  if (snapshot.verification?.passed !== true) {
    throw new Error(`snapshot ${snapshot.snapshotId} is not verified`);
  }

  const [profileSpecHash, scriptHash] = await Promise.all([
    sha256Hex(serializeProfileSpec(targetRevision)),
    sha256Hex(snapshot.script),
  ]);
  if (profileSpecHash !== snapshot.sourceProfileSpecSha256) {
    throw new Error(`snapshot ${snapshot.snapshotId} ProfileSpec hash does not match its revision`);
  }
  if (scriptHash !== snapshot.scriptSha256) {
    throw new Error(`snapshot ${snapshot.snapshotId} PAC script hash is invalid`);
  }
}

async function activateSnapshotOrThrow(
  repository: SnapshotActivationRepository,
  driver: BrowserProxyDriver,
  snapshot: PacRuntimeSnapshot,
  now: () => Date,
): Promise<void> {
  const startedAt = now().toISOString();
  const result = await activatePacSnapshot(repository, driver, snapshot, {
    startedAt,
    failedAt: now().toISOString(),
  });
  if (!result.ok) {
    throw new Error(`snapshot activation failed at ${result.stage}: ${result.message}`);
  }
}

async function restorePreviousActivation(
  repository: SnapshotActivationRepository,
  driver: BrowserProxyDriver,
  previousState: SnapshotActivationState,
  platformBefore: PlatformProxyState,
  now: () => Date,
): Promise<void> {
  if (previousState.activeSnapshotId) {
    const previousSnapshot = await repository.getSnapshot(previousState.activeSnapshotId);
    if (!previousSnapshot) {
      throw new Error(`previous snapshot ${previousState.activeSnapshotId} is unavailable`);
    }
    await activateSnapshotOrThrow(repository, driver, previousSnapshot, now);
    return;
  }
  if (previousState.activeBuiltInMode) {
    const startedAt = now().toISOString();
    const result = await activateBuiltInMode(
      repository,
      driver,
      previousState.activeBuiltInMode,
      { startedAt, failedAt: now().toISOString() },
    );
    if (!result.ok) {
      throw new Error(`built-in restore failed at ${result.stage}: ${result.message}`);
    }
    return;
  }
  await driver.restoreState(platformBefore);
  await repository.setState(previousState);
}

export class BrowserSnapshotRollbackService implements ProfileWorkflowSnapshotRollbackService {
  readonly #revisions: ProfileWorkflowRevisionRepository;
  readonly #authentication: ProfileWorkflowAuthenticationCoordinator;
  readonly #createRuntime: () => SnapshotRollbackProxyRuntime;
  readonly #now: () => Date;

  constructor(options: BrowserSnapshotRollbackServiceOptions) {
    this.#revisions = options.revisions;
    this.#authentication = options.authentication;
    this.#createRuntime = options.createRuntime ?? currentBrowserProxyRuntime;
    this.#now = options.now ?? (() => new Date());
  }

  async prepare(
    snapshotId: string,
  ): Promise<ProfileWorkflowSnapshotRollbackPreparation> {
    const runtime = this.#createRuntime();
    let disposed = false;
    const dispose = (): void => {
      if (disposed) return;
      disposed = true;
      runtime.dispose();
    };

    try {
      const [snapshot, previousState, platformBefore] = await Promise.all([
        runtime.repository.getSnapshot(snapshotId),
        runtime.repository.getState(),
        runtime.driver.readState(),
      ]);
      if (!snapshot) throw new Error(`snapshot ${snapshotId} is unavailable`);
      const targetRevision = await this.#revisions.getRevision(snapshot.sourceRevisionId);
      await validateSnapshot(snapshot, targetRevision, runtime.driver);
      if (!targetRevision) throw new Error(`revision ${snapshot.sourceRevisionId} is unavailable`);

      const authenticationPlan = createProxyAuthenticationPlan(
        targetRevision,
        snapshot.startRoute,
      );
      if (authenticationPlan.unsupported.length > 0) {
        const endpoints = authenticationPlan.unsupported
          .map((endpoint) => `${endpoint.endpointId} (${endpoint.protocol})`)
          .join(', ');
        throw new Error(
          `browser-only proxy authentication does not support SOCKS credentials: ${endpoints}`,
        );
      }
      const authentication = await this.#authentication.prepare(authenticationPlan.bindings);
      if (!authentication.ok) {
        throw new Error(`proxy authentication preparation failed: ${authentication.message}`);
      }

      try {
        await activateSnapshotOrThrow(
          runtime.repository,
          runtime.driver,
          snapshot,
          this.#now,
        );
      } catch (error) {
        try {
          await authentication.preparation.rollback();
        } catch (rollbackError) {
          throw new Error(
            `${errorMessage(error)}; authentication rollback failed: ${errorMessage(rollbackError)}`,
            { cause: rollbackError },
          );
        }
        throw error;
      }

      let settled = false;
      const settle = (): void => {
        if (settled) return;
        settled = true;
        dispose();
      };
      return {
        snapshotId: snapshot.snapshotId,
        targetRevision,
        commit: () => {
          if (settled) return;
          authentication.preparation.commit();
          settle();
        },
        rollback: async () => {
          if (settled) return;
          try {
            await authentication.preparation.rollback();
          } catch (error) {
            settle();
            throw new Error(`authentication rollback failed: ${errorMessage(error)}`, {
              cause: error,
            });
          }
          try {
            await restorePreviousActivation(
              runtime.repository,
              runtime.driver,
              previousState,
              platformBefore,
              this.#now,
            );
          } catch (error) {
            const compensation = await this.#authentication.prepare(authenticationPlan.bindings);
            if (compensation.ok) compensation.preparation.commit();
            settle();
            throw new Error(
              compensation.ok
                ? `previous browser proxy state could not be restored: ${errorMessage(error)}`
                : `previous browser proxy state could not be restored: ${errorMessage(error)}; target authentication compensation failed: ${compensation.message}`,
              { cause: error },
            );
          }
          settle();
        },
      };
    } catch (error) {
      dispose();
      throw error;
    }
  }
}
