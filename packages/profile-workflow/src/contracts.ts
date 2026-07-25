import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

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
  activate(candidate: ProfileSpec): Promise<ProfileWorkflowActivationResult>;
  rollback(previousApplied: ProfileSpec): Promise<void>;
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
