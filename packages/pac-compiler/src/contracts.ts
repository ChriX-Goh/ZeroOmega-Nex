import type { ProfileRouteTarget } from '@zeroomega-nex/profile-spec';

export const PAC_COMPILER_VERSION = '0.1.0' as const;

export type PacTarget = 'cross-browser' | 'chromium' | 'firefox';
export type PacCapability = 'exact' | 'target-dependent' | 'unsupported';
export type PacIssueSeverity = 'info' | 'warning' | 'error';

export interface PacCapabilityIssue {
  readonly code: string;
  readonly path: string;
  readonly capability: PacCapability;
  readonly severity: PacIssueSeverity;
  readonly blocking: boolean;
  readonly message: string;
}

export interface PacCapabilitySummary {
  readonly exact: number;
  readonly targetDependent: number;
  readonly unsupported: number;
  readonly blocking: number;
}

export interface PacCapabilityAnalysis {
  readonly compilerVersion: typeof PAC_COMPILER_VERSION;
  readonly target: PacTarget;
  readonly startRoute: ProfileRouteTarget;
  readonly capability: PacCapability;
  readonly canCompileExact: boolean;
  readonly canCompileWithTargetDependentSemantics: boolean;
  readonly reachableProfileIds: readonly string[];
  readonly reachableEndpointIds: readonly string[];
  readonly issues: readonly PacCapabilityIssue[];
  readonly summary: PacCapabilitySummary;
}

export interface PacCompilerBudgets {
  readonly maxScriptBytes: number;
  readonly maxProfiles: number;
  readonly maxRules: number;
}

export interface PacCompileOptions {
  readonly target?: PacTarget;
  readonly allowTargetDependent?: boolean;
  readonly budgets?: Partial<PacCompilerBudgets>;
}

export interface PacCompilationStats {
  readonly scriptBytes: number;
  readonly profileCount: number;
  readonly endpointCount: number;
  readonly conditionCount: number;
  readonly ruleListRuleCount: number;
}

export interface CompiledPacArtifact {
  readonly artifactSchemaVersion: 1;
  readonly compilerVersion: typeof PAC_COMPILER_VERSION;
  readonly target: PacTarget;
  readonly capability: Exclude<PacCapability, 'unsupported'>;
  readonly functionName: 'FindProxyForURL';
  readonly script: string;
  readonly stats: PacCompilationStats;
  readonly warnings: readonly PacCapabilityIssue[];
}

export type PacCompilationResult =
  | {
      readonly ok: true;
      readonly artifact: CompiledPacArtifact;
      readonly analysis: PacCapabilityAnalysis;
    }
  | {
      readonly ok: false;
      readonly analysis: PacCapabilityAnalysis;
      readonly issues: readonly PacCapabilityIssue[];
    };

export const DEFAULT_PAC_COMPILER_BUDGETS: PacCompilerBudgets = {
  maxScriptBytes: 1_000_000,
  maxProfiles: 10_000,
  maxRules: 100_000,
};
