import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import type { JsonValue } from '@zeroomega-nex/profile-spec';

export type BrowserFamily = 'chromium' | 'firefox';
export type BuiltInProxyMode = 'direct' | 'system';

export type ProxyControlLevel =
  | 'not-controllable'
  | 'controlled-by-other-extension'
  | 'controllable-by-this-extension'
  | 'controlled-by-this-extension';

export interface BrowserProxyCapabilities {
  readonly family: BrowserFamily;
  readonly canSetProxy: boolean;
  readonly controlLevel: ProxyControlLevel;
  readonly supportsInlinePac: boolean;
  readonly requiresPrivateBrowsingAccess: boolean;
  readonly privateBrowsingAllowed: boolean;
  readonly supportsPersistentRegularScope: boolean;
  readonly notes: readonly string[];
}

export interface PlatformProxyState {
  readonly family: BrowserFamily;
  readonly controlLevel: ProxyControlLevel;
  readonly value: JsonValue;
}

export interface PacInstallConfirmation {
  readonly confirmed: boolean;
  readonly controlLevel: ProxyControlLevel;
  readonly installedScriptSha256?: string;
  readonly reason?: string;
}

export interface BrowserProxyDriver {
  readonly family: BrowserFamily;
  getCapabilities(): Promise<BrowserProxyCapabilities>;
  readState(): Promise<PlatformProxyState>;
  installPac(snapshot: PacRuntimeSnapshot): Promise<void>;
  confirmPac(snapshot: PacRuntimeSnapshot): Promise<PacInstallConfirmation>;
  setDirect(): Promise<void>;
  setSystem(): Promise<void>;
  restoreState(state: PlatformProxyState): Promise<void>;
  clearControl(): Promise<void>;
}

export interface PendingActivation {
  readonly snapshotId: string;
  readonly previousActiveSnapshotId?: string;
  readonly previousActiveBuiltInMode?: BuiltInProxyMode;
  readonly platformBefore: PlatformProxyState;
  readonly startedAt: string;
}

export interface ActivationFailureRecord {
  readonly snapshotId: string;
  readonly stage: 'preflight' | 'install' | 'confirm' | 'rollback' | 'recovery';
  readonly message: string;
  readonly occurredAt: string;
  readonly rollbackSucceeded?: boolean;
}

export interface SnapshotActivationState {
  readonly activeSnapshotId?: string;
  readonly lastKnownGoodSnapshotId?: string;
  readonly activeBuiltInMode?: BuiltInProxyMode;
  readonly lastKnownGoodBuiltInMode?: BuiltInProxyMode;
  readonly pending?: PendingActivation;
  readonly lastFailure?: ActivationFailureRecord;
}

export interface SnapshotActivationRepository {
  getState(): Promise<SnapshotActivationState>;
  setState(state: SnapshotActivationState): Promise<void>;
  putSnapshot(snapshot: PacRuntimeSnapshot): Promise<void>;
  getSnapshot(snapshotId: string): Promise<PacRuntimeSnapshot | undefined>;
}

export interface ActivationContext {
  readonly startedAt: string;
  readonly failedAt?: string;
}

export type SnapshotActivationResult =
  | {
      readonly ok: true;
      readonly activeSnapshotId: string;
      readonly previousActiveSnapshotId?: string;
      readonly confirmation: PacInstallConfirmation;
    }
  | {
      readonly ok: false;
      readonly stage: ActivationFailureRecord['stage'];
      readonly message: string;
      readonly rollbackSucceeded: boolean;
      readonly controlLevel?: ProxyControlLevel;
    };

export type BuiltInModeActivationResult =
  | {
      readonly ok: true;
      readonly activeBuiltInMode: BuiltInProxyMode;
    }
  | {
      readonly ok: false;
      readonly stage: ActivationFailureRecord['stage'];
      readonly message: string;
      readonly rollbackSucceeded: boolean;
      readonly controlLevel?: ProxyControlLevel;
    };

export type SnapshotRecoveryResult =
  | { readonly status: 'nothing-pending' }
  | {
      readonly status: 'recovered';
      readonly activeSnapshotId?: string;
      readonly activeBuiltInMode?: BuiltInProxyMode;
      readonly restoredPlatformBaseline: boolean;
    }
  | {
      readonly status: 'failed';
      readonly message: string;
      readonly activeSnapshotId?: string;
      readonly activeBuiltInMode?: BuiltInProxyMode;
    };

export type ActiveSnapshotRestoreResult =
  | { readonly status: 'no-active-snapshot' }
  | { readonly status: 'already-confirmed'; readonly snapshotId: string }
  | { readonly status: 'restored'; readonly snapshotId: string }
  | { readonly status: 'restored-built-in'; readonly mode: BuiltInProxyMode }
  | { readonly status: 'failed'; readonly snapshotId: string; readonly message: string };
