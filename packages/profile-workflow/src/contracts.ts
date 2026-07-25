import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';

export const PROFILE_WORKFLOW_SCHEMA_VERSION = 1 as const;

export interface ProfileWorkflowPendingApply {
  readonly applyId: string;
  readonly candidate: ProfileSpec;
  readonly previousAppliedRevisionId: string;
  readonly startedAt: string;
  readonly phase: 'activating' | 'committing' | 'rollback-required';
}

export type ProfileWorkflowApplyRecord =
  | {
      readonly status: 'succeeded';
      readonly applyId: string;
      readonly revisionId: string;
      readonly snapshotId: string;
      readonly completedAt: string;
    }
  | {
      readonly status: 'failed';
      readonly applyId: string;
      readonly stage: 'prepare' | 'activate' | 'commit' | 'rollback';
      readonly message: string;
      readonly occurredAt: string;
      readonly rollbackSucceeded?: boolean;
    };

export interface ProfileWorkflowRuntimeFailure {
  readonly stage: 'preflight' | 'install' | 'confirm' | 'rollback' | 'recovery';
  readonly message: string;
  readonly occurredAt: string;
  readonly rollbackSucceeded?: boolean;
}

export interface ProfileWorkflowRuntimeView {
  readonly activeSnapshotId?: string;
  readonly lastKnownGoodSnapshotId?: string;
  readonly activeRoute?: ProfileRouteTarget;
  readonly lastFailure?: ProfileWorkflowRuntimeFailure;
}

export interface ProfileWorkflowSnapshotWarning {
  readonly code: string;
  readonly path: string;
  readonly capability: 'exact' | 'target-dependent' | 'unsupported';
  readonly severity: 'info' | 'warning' | 'error';
  readonly blocking: boolean;
  readonly message: string;
}

export interface ProfileWorkflowSnapshotHistoryEntry {
  readonly snapshotId: string;
  readonly createdAt: string;
  readonly sourceDocumentId: string;
  readonly sourceRevisionId: string;
  readonly startRoute: ProfileRouteTarget;
  readonly target: 'cross-browser' | 'chromium' | 'firefox';
  readonly compilerVersion: string;
  readonly capability: 'exact' | 'target-dependent';
  readonly scriptSha256Prefix: string;
  readonly sourceProfileSpecSha256Prefix: string;
  readonly verification: {
    readonly passed: true;
    readonly vectorCount: number;
    readonly matchedCount: number;
  };
  readonly stats: {
    readonly scriptBytes: number;
    readonly profileCount: number;
    readonly endpointCount: number;
    readonly conditionCount: number;
    readonly ruleListRuleCount: number;
  };
  readonly warnings: readonly ProfileWorkflowSnapshotWarning[];
  readonly active: boolean;
  readonly lastKnownGood: boolean;
}

export interface ProfileWorkflowState {
  readonly workflowSchemaVersion: typeof PROFILE_WORKFLOW_SCHEMA_VERSION;
  readonly generation: number;
  readonly applied: ProfileSpec;
  readonly draft: ProfileSpec;
  readonly selectedProfileId?: string;
  readonly pendingApply?: ProfileWorkflowPendingApply;
  readonly lastApply?: ProfileWorkflowApplyRecord;
}

export interface ProfileWorkflowRepository {
  read(): Promise<ProfileWorkflowState | undefined>;
  compareAndSwap(
    expectedGeneration: number | undefined,
    next: ProfileWorkflowState,
  ): Promise<boolean>;
}

export interface ProfileWorkflowActivationResult {
  readonly snapshotId: string;
}

export interface ProfileWorkflowActivationDriver {
  activate(
    candidate: ProfileSpec,
    startRoute?: ProfileRouteTarget,
  ): Promise<ProfileWorkflowActivationResult>;
  rollback(previousApplied: ProfileSpec): Promise<void>;
  inspectRuntime?(): Promise<ProfileWorkflowRuntimeView>;
}

export interface ProfileWorkflowApplyContext {
  readonly applyId: string;
  readonly revisionId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly deviceId?: string;
}

export type ProfileWorkflowApplyResult =
  | {
      readonly status: 'applied';
      readonly state: ProfileWorkflowState;
      readonly snapshotId: string;
    }
  | {
      readonly status: 'clean' | 'busy' | 'conflict' | 'invalid';
      readonly state?: ProfileWorkflowState;
      readonly message: string;
    }
  | {
      readonly status: 'failed';
      readonly state?: ProfileWorkflowState;
      readonly stage: 'prepare' | 'activate' | 'commit' | 'rollback';
      readonly message: string;
      readonly rollbackSucceeded?: boolean;
    };

export interface ProfileWorkflowView {
  readonly dirty: boolean;
  readonly busy: boolean;
  readonly appliedRevisionId: string;
  readonly draftRevisionId: string;
  readonly selectedProfileId?: string;
  readonly selectedProfileExists: boolean;
}
