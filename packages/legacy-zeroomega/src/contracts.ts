import type { ProfileSpec } from '@zeroomega-nex/profile-spec';

export type LegacyInputEncoding = 'json' | 'base64-json' | 'object';

export type LegacyImportStatus =
  | 'exact'
  | 'target-dependent'
  | 'downgraded'
  | 'preserved'
  | 'ignored-generated'
  | 'ignored-runtime'
  | 'rejected';

export interface LegacyImportItem {
  readonly status: LegacyImportStatus;
  readonly code: string;
  readonly sourcePath: string;
  readonly targetPath?: string;
  readonly message: string;
}

export interface LegacyImportSummary {
  readonly exact: number;
  readonly targetDependent: number;
  readonly downgraded: number;
  readonly preserved: number;
  readonly ignoredGenerated: number;
  readonly ignoredRuntime: number;
  readonly rejected: number;
}

export type LegacySecretKind =
  | 'proxy-password'
  | 'request-header'
  | 'sync-token'
  | 'sync-password';

export interface LegacySecretMaterial {
  readonly ref: string;
  readonly kind: LegacySecretKind;
  readonly sourcePath: string;
  readonly value: string;
  readonly username?: string;
  readonly headerName?: string;
}

export interface LegacyImportReport {
  readonly source: 'zeroomega-v3.5.0-schema-v2';
  readonly encoding: LegacyInputEncoding;
  readonly containsSecrets: boolean;
  readonly items: readonly LegacyImportItem[];
  readonly summary: LegacyImportSummary;
  readonly profileCount: number;
  readonly endpointCount: number;
  readonly ruleSourceCount: number;
}

export interface LegacyImportContext {
  readonly createdAt: string;
  readonly documentId?: string;
  readonly revisionId?: string;
  readonly deviceId?: string;
}

export interface LegacyImportSuccess {
  readonly ok: true;
  readonly activation: 'inactive-candidate';
  readonly candidate: ProfileSpec;
  readonly secretMaterials: readonly LegacySecretMaterial[];
  readonly report: LegacyImportReport;
}

export interface LegacyImportFailure {
  readonly ok: false;
  readonly report: LegacyImportReport;
}

export type LegacyImportResult = LegacyImportSuccess | LegacyImportFailure;

export interface LegacyDecodeIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface LegacyDecodeStats {
  readonly byteLength: number;
  readonly nodeCount: number;
  readonly maxDepth: number;
  readonly profileCount: number;
  readonly ruleCount: number;
}

export interface LegacyDecodedBackup {
  readonly encoding: LegacyInputEncoding;
  readonly options: Readonly<Record<string, unknown>>;
  readonly stats: LegacyDecodeStats;
}

export type LegacyDecodeResult =
  | { readonly ok: true; readonly value: LegacyDecodedBackup }
  | { readonly ok: false; readonly issues: readonly LegacyDecodeIssue[] };
