export {
  DEFAULT_LEGACY_DECODE_LIMITS,
  decodeZeroOmegaBackup,
  type LegacyDecodeLimits,
} from './decode.js';
export { legacySecretRef, legacyStableId } from './ids.js';
export { importZeroOmegaBackup } from './import.js';
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
  LegacySecretKind,
  LegacySecretMaterial,
} from './contracts.js';
