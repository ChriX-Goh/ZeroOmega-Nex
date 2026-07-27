export {
  activateBuiltInMode,
  activatePacSnapshot,
  recoverPendingActivation,
  restoreActiveSnapshot,
} from './activation.js';
export {
  PROXY_AUTH_URL_FILTERS,
  registerProxyAuthenticationListener,
  type ProxyAuthenticationEvents,
  type ProxyAuthenticationListenerRegistration,
  type ProxyAuthenticationPermissionApi,
  type ProxyAuthenticationRequiredEvent,
} from './authentication-listener.js';
export {
  createProxyAuthenticationPlan,
  type ProxyAuthenticationPlan,
  type UnsupportedProxyAuthenticationEndpoint,
} from './authentication-plan.js';
export {
  BrowserStorageProxyAuthenticationRepository,
  type ProxyAuthenticationStorageOptions,
} from './authentication-storage.js';
export {
  ProxyAuthenticationHandler,
  type ProxyAuthenticationBinding,
  type ProxyAuthenticationBindingProvider,
  type ProxyAuthenticationChallenge,
  type ProxyAuthenticationChallenger,
  type ProxyAuthenticationCredentials,
  type ProxyAuthenticationHandlerOptions,
  type ProxyAuthenticationProxyInfo,
  type ProxyAuthenticationResponse,
  type ProxyAuthenticationSecretProvider,
} from './authentication.js';
export {
  createChromiumProxyDriver,
  type ChromiumProxySettingResult,
  type ChromiumProxySettingsApi,
} from './chromium.js';
export type {
  ActivationContext,
  ActivationFailureRecord,
  ActiveSnapshotRestoreResult,
  BrowserFamily,
  BrowserProxyCapabilities,
  BrowserProxyDriver,
  BuiltInModeActivationResult,
  BuiltInProxyMode,
  PacInstallConfirmation,
  PendingActivation,
  PlatformProxyState,
  ProxyControlLevel,
  SnapshotActivationRepository,
  SnapshotActivationResult,
  SnapshotActivationState,
  SnapshotRecoveryResult,
} from './contracts.js';
export {
  createFirefoxProxyDriver,
  firefoxPacDataUrl,
  type FirefoxExtensionApi,
  type FirefoxProxyDriver,
  type FirefoxProxyErrorEvent,
  type FirefoxProxySettingResult,
  type FirefoxProxySettingsApi,
} from './firefox.js';
export { MemorySnapshotActivationRepository } from './memory-repository.js';
export {
  inspectProxyOwnership,
  proxyOwnershipFromCapabilities,
  type ProxyOwnershipBlockReason,
  type ProxyOwnershipView,
} from './ownership.js';
export {
  listPacSnapshotHistory,
  type PacSnapshotHistoryEntry,
  type SnapshotHistoryRepository,
} from './snapshot-history.js';
export {
  BrowserStorageSnapshotActivationRepository,
  type BrowserStorageArea,
  type BrowserStorageRepositoryOptions,
} from './storage-repository.js';
