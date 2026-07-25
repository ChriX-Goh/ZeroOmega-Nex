import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';

import type {
  ActivationContext,
  ActivationFailureRecord,
  ActiveSnapshotRestoreResult,
  BrowserProxyCapabilities,
  BrowserProxyDriver,
  BuiltInModeActivationResult,
  BuiltInProxyMode,
  PacInstallConfirmation,
  PlatformProxyState,
  SnapshotActivationRepository,
  SnapshotActivationResult,
  SnapshotActivationState,
  SnapshotRecoveryResult,
} from './contracts.js';

function canControl(capabilities: BrowserProxyCapabilities): boolean {
  return (
    capabilities.canSetProxy &&
    capabilities.privateBrowsingAllowed &&
    (capabilities.controlLevel === 'controllable-by-this-extension' ||
      capabilities.controlLevel === 'controlled-by-this-extension')
  );
}

function failureRecord(
  snapshotId: string,
  stage: ActivationFailureRecord['stage'],
  message: string,
  occurredAt: string,
  rollbackSucceeded?: boolean,
): ActivationFailureRecord {
  return {
    snapshotId,
    stage,
    message,
    occurredAt,
    ...(rollbackSucceeded === undefined ? {} : { rollbackSucceeded }),
  };
}

function controlFailureMessage(capabilities: BrowserProxyCapabilities): string {
  return capabilities.controlLevel === 'controlled-by-other-extension'
    ? 'proxy settings are controlled by another extension'
    : capabilities.requiresPrivateBrowsingAccess && !capabilities.privateBrowsingAllowed
      ? 'Firefox private browsing access is required before proxy settings can be changed'
      : 'proxy settings are not controllable by this extension';
}

async function confirmOrThrow(
  driver: BrowserProxyDriver,
  snapshot: PacRuntimeSnapshot,
): Promise<PacInstallConfirmation> {
  const confirmation = await driver.confirmPac(snapshot);
  if (!confirmation.confirmed) {
    throw new Error(confirmation.reason ?? 'browser did not confirm the installed PAC snapshot');
  }
  if (
    confirmation.installedScriptSha256 !== undefined &&
    confirmation.installedScriptSha256 !== snapshot.scriptSha256
  ) {
    throw new Error('browser confirmed a different PAC script hash');
  }
  return confirmation;
}

async function setBuiltInMode(driver: BrowserProxyDriver, mode: BuiltInProxyMode): Promise<void> {
  if (mode === 'direct') await driver.setDirect();
  else await driver.setSystem();
}

function valueRecord(value: PlatformProxyState['value']): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function confirmsBuiltInMode(state: PlatformProxyState, mode: BuiltInProxyMode): boolean {
  if (state.controlLevel !== 'controlled-by-this-extension') return false;
  const value = valueRecord(state.value);
  if (!value) return false;
  if (state.family === 'chromium') return value.mode === mode;
  return value.proxyType === (mode === 'direct' ? 'none' : 'system');
}

async function rollbackToPrevious(
  repository: SnapshotActivationRepository,
  driver: BrowserProxyDriver,
  previousState: SnapshotActivationState,
  platformBefore: Awaited<ReturnType<BrowserProxyDriver['readState']>>,
): Promise<boolean> {
  try {
    if (previousState.activeSnapshotId !== undefined) {
      const previousSnapshot = await repository.getSnapshot(previousState.activeSnapshotId);
      if (!previousSnapshot) {
        throw new Error(`previous snapshot ${previousState.activeSnapshotId} is unavailable`);
      }
      await driver.installPac(previousSnapshot);
      await confirmOrThrow(driver, previousSnapshot);
    } else if (previousState.activeBuiltInMode !== undefined) {
      await setBuiltInMode(driver, previousState.activeBuiltInMode);
      const restored = await driver.readState();
      if (!confirmsBuiltInMode(restored, previousState.activeBuiltInMode)) {
        throw new Error(`browser did not confirm restored ${previousState.activeBuiltInMode} mode`);
      }
    } else {
      await driver.restoreState(platformBefore);
    }
    return true;
  } catch {
    return false;
  }
}

export async function activatePacSnapshot(
  repository: SnapshotActivationRepository,
  driver: BrowserProxyDriver,
  snapshot: PacRuntimeSnapshot,
  context: ActivationContext,
): Promise<SnapshotActivationResult> {
  await repository.putSnapshot(snapshot);
  const previousState = await repository.getState();
  const failedAt = context.failedAt ?? context.startedAt;
  let capabilities: BrowserProxyCapabilities;

  try {
    capabilities = await driver.getCapabilities();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'proxy capability discovery failed';
    await repository.setState({
      ...previousState,
      lastFailure: failureRecord(snapshot.snapshotId, 'preflight', message, failedAt, true),
    });
    return { ok: false, stage: 'preflight', message, rollbackSucceeded: true };
  }

  if (!canControl(capabilities)) {
    const message = controlFailureMessage(capabilities);
    await repository.setState({
      ...previousState,
      lastFailure: failureRecord(snapshot.snapshotId, 'preflight', message, failedAt, true),
    });
    return {
      ok: false,
      stage: 'preflight',
      message,
      rollbackSucceeded: true,
      controlLevel: capabilities.controlLevel,
    };
  }

  let platformBefore: Awaited<ReturnType<BrowserProxyDriver['readState']>>;
  try {
    platformBefore = await driver.readState();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'current proxy state could not be read';
    await repository.setState({
      ...previousState,
      lastFailure: failureRecord(snapshot.snapshotId, 'preflight', message, failedAt, true),
    });
    return {
      ok: false,
      stage: 'preflight',
      message,
      rollbackSucceeded: true,
      controlLevel: capabilities.controlLevel,
    };
  }

  await repository.setState({
    ...previousState,
    pending: {
      snapshotId: snapshot.snapshotId,
      ...(previousState.activeSnapshotId === undefined
        ? {}
        : { previousActiveSnapshotId: previousState.activeSnapshotId }),
      ...(previousState.activeBuiltInMode === undefined
        ? {}
        : { previousActiveBuiltInMode: previousState.activeBuiltInMode }),
      platformBefore,
      startedAt: context.startedAt,
    },
  });

  try {
    await driver.installPac(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PAC installation failed';
    const rollbackSucceeded = await rollbackToPrevious(
      repository,
      driver,
      previousState,
      platformBefore,
    );
    await repository.setState({
      ...previousState,
      lastFailure: failureRecord(
        snapshot.snapshotId,
        rollbackSucceeded ? 'install' : 'rollback',
        message,
        failedAt,
        rollbackSucceeded,
      ),
    });
    return {
      ok: false,
      stage: rollbackSucceeded ? 'install' : 'rollback',
      message,
      rollbackSucceeded,
      controlLevel: capabilities.controlLevel,
    };
  }

  let confirmation: PacInstallConfirmation;
  try {
    confirmation = await confirmOrThrow(driver, snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PAC confirmation failed';
    const rollbackSucceeded = await rollbackToPrevious(
      repository,
      driver,
      previousState,
      platformBefore,
    );
    await repository.setState({
      ...previousState,
      lastFailure: failureRecord(
        snapshot.snapshotId,
        rollbackSucceeded ? 'confirm' : 'rollback',
        message,
        failedAt,
        rollbackSucceeded,
      ),
    });
    return {
      ok: false,
      stage: rollbackSucceeded ? 'confirm' : 'rollback',
      message,
      rollbackSucceeded,
      controlLevel: capabilities.controlLevel,
    };
  }

  await repository.setState({
    activeSnapshotId: snapshot.snapshotId,
    lastKnownGoodSnapshotId: snapshot.snapshotId,
  });
  return {
    ok: true,
    activeSnapshotId: snapshot.snapshotId,
    ...(previousState.activeSnapshotId === undefined
      ? {}
      : { previousActiveSnapshotId: previousState.activeSnapshotId }),
    confirmation,
  };
}

export async function activateBuiltInMode(
  repository: SnapshotActivationRepository,
  driver: BrowserProxyDriver,
  mode: BuiltInProxyMode,
  context: ActivationContext,
): Promise<BuiltInModeActivationResult> {
  const previousState = await repository.getState();
  const operationId = `built-in-${mode}`;
  const failedAt = context.failedAt ?? context.startedAt;
  let capabilities: BrowserProxyCapabilities;

  try {
    capabilities = await driver.getCapabilities();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'proxy capability discovery failed';
    await repository.setState({
      ...previousState,
      lastFailure: failureRecord(operationId, 'preflight', message, failedAt, true),
    });
    return { ok: false, stage: 'preflight', message, rollbackSucceeded: true };
  }

  if (!canControl(capabilities)) {
    const message = controlFailureMessage(capabilities);
    await repository.setState({
      ...previousState,
      lastFailure: failureRecord(operationId, 'preflight', message, failedAt, true),
    });
    return {
      ok: false,
      stage: 'preflight',
      message,
      rollbackSucceeded: true,
      controlLevel: capabilities.controlLevel,
    };
  }

  let platformBefore: PlatformProxyState;
  try {
    platformBefore = await driver.readState();
    await setBuiltInMode(driver, mode);
    const installed = await driver.readState();
    if (!confirmsBuiltInMode(installed, mode)) {
      throw new Error(`browser did not confirm ${mode} mode`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : `${mode} mode activation failed`;
    const rollbackSucceeded =
      platformBefore === undefined
        ? true
        : await rollbackToPrevious(repository, driver, previousState, platformBefore);
    await repository.setState({
      ...previousState,
      lastFailure: failureRecord(
        operationId,
        rollbackSucceeded ? 'confirm' : 'rollback',
        message,
        failedAt,
        rollbackSucceeded,
      ),
    });
    return {
      ok: false,
      stage: rollbackSucceeded ? 'confirm' : 'rollback',
      message,
      rollbackSucceeded,
      controlLevel: capabilities.controlLevel,
    };
  }

  await repository.setState({
    activeBuiltInMode: mode,
    lastKnownGoodBuiltInMode: mode,
  });
  return { ok: true, activeBuiltInMode: mode };
}

export async function recoverPendingActivation(
  repository: SnapshotActivationRepository,
  driver: BrowserProxyDriver,
  failedAt: string,
): Promise<SnapshotRecoveryResult> {
  const state = await repository.getState();
  if (!state.pending) return { status: 'nothing-pending' };

  const { pending } = state;
  try {
    if (pending.previousActiveSnapshotId !== undefined) {
      const previous = await repository.getSnapshot(pending.previousActiveSnapshotId);
      if (!previous) {
        throw new Error(`previous snapshot ${pending.previousActiveSnapshotId} is unavailable`);
      }
      await driver.installPac(previous);
      await confirmOrThrow(driver, previous);
      await repository.setState({
        activeSnapshotId: previous.snapshotId,
        lastKnownGoodSnapshotId: previous.snapshotId,
        lastFailure: failureRecord(
          pending.snapshotId,
          'recovery',
          'interrupted activation was rolled back on restart',
          failedAt,
          true,
        ),
      });
      return {
        status: 'recovered',
        activeSnapshotId: previous.snapshotId,
        restoredPlatformBaseline: false,
      };
    }

    if (pending.previousActiveBuiltInMode !== undefined) {
      await setBuiltInMode(driver, pending.previousActiveBuiltInMode);
      const restored = await driver.readState();
      if (!confirmsBuiltInMode(restored, pending.previousActiveBuiltInMode)) {
        throw new Error(
          `browser did not confirm restored ${pending.previousActiveBuiltInMode} mode`,
        );
      }
      await repository.setState({
        activeBuiltInMode: pending.previousActiveBuiltInMode,
        lastKnownGoodBuiltInMode: pending.previousActiveBuiltInMode,
        lastFailure: failureRecord(
          pending.snapshotId,
          'recovery',
          'interrupted activation restored the previous built-in proxy mode',
          failedAt,
          true,
        ),
      });
      return {
        status: 'recovered',
        activeBuiltInMode: pending.previousActiveBuiltInMode,
        restoredPlatformBaseline: false,
      };
    }

    await driver.restoreState(pending.platformBefore);
    await repository.setState({
      lastFailure: failureRecord(
        pending.snapshotId,
        'recovery',
        'interrupted first activation restored the previous platform proxy state',
        failedAt,
        true,
      ),
    });
    return { status: 'recovered', restoredPlatformBaseline: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'activation recovery failed';
    await repository.setState({
      ...state,
      lastFailure: failureRecord(pending.snapshotId, 'recovery', message, failedAt, false),
    });
    return {
      status: 'failed',
      message,
      ...(state.activeSnapshotId === undefined ? {} : { activeSnapshotId: state.activeSnapshotId }),
      ...(state.activeBuiltInMode === undefined
        ? {}
        : { activeBuiltInMode: state.activeBuiltInMode }),
    };
  }
}

export async function restoreActiveSnapshot(
  repository: SnapshotActivationRepository,
  driver: BrowserProxyDriver,
): Promise<ActiveSnapshotRestoreResult> {
  const state = await repository.getState();
  if (state.activeBuiltInMode !== undefined) {
    try {
      await setBuiltInMode(driver, state.activeBuiltInMode);
      const restored = await driver.readState();
      if (!confirmsBuiltInMode(restored, state.activeBuiltInMode)) {
        throw new Error(`browser did not confirm ${state.activeBuiltInMode} mode`);
      }
      return { status: 'restored-built-in', mode: state.activeBuiltInMode };
    } catch (error) {
      return {
        status: 'failed',
        snapshotId: `built-in-${state.activeBuiltInMode}`,
        message: error instanceof Error ? error.message : 'active built-in mode restore failed',
      };
    }
  }
  if (state.activeSnapshotId === undefined) return { status: 'no-active-snapshot' };
  const snapshot = await repository.getSnapshot(state.activeSnapshotId);
  if (!snapshot) {
    return {
      status: 'failed',
      snapshotId: state.activeSnapshotId,
      message: 'active snapshot record is unavailable',
    };
  }

  try {
    const confirmation = await driver.confirmPac(snapshot);
    if (confirmation.confirmed && confirmation.installedScriptSha256 === snapshot.scriptSha256) {
      return { status: 'already-confirmed', snapshotId: snapshot.snapshotId };
    }
    await driver.installPac(snapshot);
    await confirmOrThrow(driver, snapshot);
    return { status: 'restored', snapshotId: snapshot.snapshotId };
  } catch (error) {
    return {
      status: 'failed',
      snapshotId: snapshot.snapshotId,
      message: error instanceof Error ? error.message : 'active snapshot restore failed',
    };
  }
}
