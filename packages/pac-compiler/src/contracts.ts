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
