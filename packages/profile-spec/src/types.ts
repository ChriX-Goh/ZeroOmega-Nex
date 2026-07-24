export const PROFILE_SPEC_SCHEMA_VERSION = '1.0' as const;

export type ProfileSpecSchemaVersion = typeof PROFILE_SPEC_SCHEMA_VERSION;
export type Identifier = string;
export type IsoTimestamp = string;
export type SecretReference = string;

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export interface RevisionMetadata {
  id: Identifier;
  parentId?: Identifier;
  createdAt: IsoTimestamp;
  deviceId?: Identifier;
}

export interface DisplayIdentity {
  name: string;
  color?: string;
}

export interface LegacyMetadata {
  source: 'zeroomega-v3.5.0' | 'switchyomega' | string;
  profileType?: string;
  revision?: number | string;
  fields?: Record<string, JsonValue>;
}

export type BuiltInRouteTarget = { kind: 'direct' } | { kind: 'system' };

export type ProfileRouteTarget = BuiltInRouteTarget | { kind: 'profile'; profileId: Identifier };

export interface ProxyCredentialReference {
  username?: string;
  passwordSecretRef: SecretReference;
}

export interface ProxyEndpoint extends DisplayIdentity {
  id: Identifier;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  credential?: ProxyCredentialReference;
  extensions?: Record<string, JsonValue>;
}

export interface BypassEntry {
  id: Identifier;
  pattern: string;
  note?: string;
  enabled?: boolean;
}

export interface ProfileBase extends DisplayIdentity {
  id: Identifier;
  enabled?: boolean;
  legacy?: LegacyMetadata;
  extensions?: Record<string, JsonValue>;
}

export interface FixedProfile extends ProfileBase {
  kind: 'fixed';
  proxyByScheme: {
    fallback?: Identifier;
    http?: Identifier;
    https?: Identifier;
    ftp?: Identifier;
  };
  bypass: BypassEntry[];
}

export interface SwitchRule {
  id: Identifier;
  condition: Condition;
  route: ProfileRouteTarget;
  note?: string;
  enabled?: boolean;
  legacy?: LegacyMetadata;
}

export interface SwitchProfile extends ProfileBase {
  kind: 'switch';
  rules: SwitchRule[];
  defaultRoute: ProfileRouteTarget;
}

export type RuleListFormat = 'autoproxy' | 'switchy';

export interface LiteralHeaderValue {
  kind: 'literal';
  value: string;
}

export interface SecretHeaderValue {
  kind: 'secret';
  secretRef: SecretReference;
}

export interface RuleSourceHeader {
  name: string;
  value: LiteralHeaderValue | SecretHeaderValue;
}

export type RuleSourceLocation = { kind: 'inline'; content: string } | { kind: 'url'; url: string };

export interface RuleSource {
  id: Identifier;
  name: string;
  format: RuleListFormat;
  location: RuleSourceLocation;
  headers?: RuleSourceHeader[];
  updateIntervalMinutes?: number;
  extensions?: Record<string, JsonValue>;
}

export interface RuleListProfile extends ProfileBase {
  kind: 'rule-list';
  sourceId: Identifier;
  matchRoute: ProfileRouteTarget;
  defaultRoute: ProfileRouteTarget;
}

export type PacSource = { kind: 'inline'; script: string } | { kind: 'url'; url: string };

export interface PacProfile extends ProfileBase {
  kind: 'pac';
  source: PacSource;
  fallbackRoute?: ProfileRouteTarget;
}

export interface AutoDetectProfile extends ProfileBase {
  kind: 'auto-detect';
  fallbackRoute?: ProfileRouteTarget;
}

export type UserProfile =
  | FixedProfile
  | SwitchProfile
  | RuleListProfile
  | PacProfile
  | AutoDetectProfile;

export interface TrueCondition {
  kind: 'true';
}

export interface FalseCondition {
  kind: 'false';
  annotation?: string;
}

export interface UrlRegexCondition {
  kind: 'url-regex';
  pattern: string;
  flags?: string;
}

export interface UrlWildcardCondition {
  kind: 'url-wildcard';
  pattern: string;
}

export interface HostRegexCondition {
  kind: 'host-regex';
  pattern: string;
  flags?: string;
}

export interface HostWildcardCondition {
  kind: 'host-wildcard';
  pattern: string;
}

export interface BypassCondition {
  kind: 'bypass';
  pattern: string;
}

export interface KeywordCondition {
  kind: 'keyword';
  pattern: string;
  httpOnly: true;
}

export interface IpCondition {
  kind: 'ip';
  address: string;
  prefixLength: number;
}

export interface HostLevelsCondition {
  kind: 'host-levels';
  min: number;
  max: number;
}

export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface WeekdayCondition {
  kind: 'weekday';
  days: Weekday[];
  timezone: 'local';
}

export interface TimeCondition {
  kind: 'time';
  startHour: number;
  endHour: number;
  timezone: 'local';
}

export type Condition =
  | TrueCondition
  | FalseCondition
  | UrlRegexCondition
  | UrlWildcardCondition
  | HostRegexCondition
  | HostWildcardCondition
  | BypassCondition
  | KeywordCondition
  | IpCondition
  | HostLevelsCondition
  | WeekdayCondition
  | TimeCondition;

export interface BuiltInProfileAppearance {
  direct?: { color?: string };
  system?: { color?: string };
}

export interface StartupSettings {
  route?: ProfileRouteTarget;
  revertProxyChanges: boolean;
}

export interface QuickSwitchSettings {
  enabled: boolean;
  profileIds: Identifier[];
  refreshOnChange: boolean;
}

export interface InterfaceSettings {
  confirmDeletion: boolean;
  showInspectMenu: boolean;
  addConditionsToBottom: boolean;
  showResultProfileOnActionBadgeText: boolean;
  showExternalProfile: boolean;
  showAdvancedConditions: boolean;
  exportLegacyRuleList: boolean;
  builtInProfiles?: BuiltInProfileAppearance;
}

export interface SyncSettings {
  backend: 'none' | 'browser' | 'gist' | 'webdav';
  remoteUri?: string;
  username?: string;
  secretRef?: SecretReference;
}

export interface ProfileSpecSettings {
  startup: StartupSettings;
  quickSwitch: QuickSwitchSettings;
  interface: InterfaceSettings;
  ruleSourceUpdateIntervalMinutes: number;
  sync?: SyncSettings;
}

export interface ProfileSpec {
  schemaVersion: ProfileSpecSchemaVersion;
  documentId: Identifier;
  revision: RevisionMetadata;
  profiles: UserProfile[];
  proxyEndpoints: ProxyEndpoint[];
  ruleSources: RuleSource[];
  settings: ProfileSpecSettings;
  extensions?: Record<string, JsonValue>;
}
