export {
  DEFAULT_LEGACY_DECODE_LIMITS,
  decodeZeroOmegaBackup,
  type LegacyDecodeLimits,
} from './decode.js';
export { legacySecretRef, legacyStableId } from './ids.js';
export {
  exportZeroOmegaBackup,
  zeroOmegaBackupFilename,
  ZEROOMEGA_BACKUP_MIME_TYPE,
  ZEROOMEGA_BACKUP_SCHEMA_VERSION,
} from './export.js';
export type { LegacyExportContext, LegacyExportIssue, LegacyExportResult } from './export.js';
export { importZeroOmegaBackup } from './import-normalized.js';
export { LegacyImportReportBuilder } from './report.js';
export type {
  LegacyDecodedBackup,
  LegacyDecodeIssue,
  LegacyDecodeResult,
  LegacyDecodeStats,
  LegacyImportContext,
  LegacyImportFailure,
  LegacyImportItem,
  LegacyImportReport,
  LegacyImportResult,
  LegacyImportStatus,
  LegacyImportSuccess,
  LegacyImportSummary,
  LegacyInputEncoding,
  LegacyUpgradeNotice,
  LegacySecretKind,
  LegacySecretMaterial,
} from './contracts.js';
