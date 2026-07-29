export {
  createBrowserSafePacSnapshot,
  type BrowserSafePacSnapshotResult,
} from './browser-snapshot.js';
export { analyzePacCompatibility } from './capabilities.js';
export { compilePac } from './compiler.js';
export {
  DEFAULT_PAC_COMPILER_BUDGETS,
  PAC_COMPILER_VERSION,
  type CompiledPacArtifact,
  type PacCapability,
  type PacCapabilityAnalysis,
  type PacCapabilityIssue,
  type PacCapabilitySummary,
  type PacCompilationResult,
  type PacCompilationStats,
  type PacCompileOptions,
  type PacCompilerBudgets,
  type PacIssueSeverity,
  type PacTarget,
} from './contracts.js';
export { normalizePacProxyHost, pacDirective, pacStringLiteral } from './escape.js';
export {
  FIXED_PROXY_SLOTS,
  PROXY_PROTOCOLS,
  fixedProxySlotCapability,
  proxyProtocolCapability,
  type FixedProxySlot,
  type FixedProxySlotCapability,
  type FixedSlotRequestCapability,
  type ProxyAuthenticationCapability,
  type ProxyDnsCapability,
  type ProxyProtocol,
  type ProxyProtocolCapability,
} from './proxy-capabilities.js';
export {
  createPacEvaluator,
  evaluatePacScript,
  type PacEvaluationRequest,
  type PacEvaluator,
} from './harness.js';
export { sha256Hex } from './hash.js';
export { verifyPacReferenceSafety } from './reference-safety.js';
export {
  createRawPacSnapshot,
  RAW_PAC_SNAPSHOT_VERSION,
  type RawPacSnapshotResult,
} from './raw-snapshot.js';
export {
  createVerifiedPacSnapshot,
  type PacRuntimeSnapshot,
  type PacSnapshotContext,
  type PacSnapshotResult,
  type PacSnapshotVerification,
} from './snapshot.js';
export {
  verifyPacArtifact,
  type PacVerificationMismatch,
  type PacVerificationResult,
  type PacVerificationVector,
} from './verify.js';
