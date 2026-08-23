import {
  compilePac,
  createRawPacSnapshot,
  type PacCapabilityIssue,
  type PacTarget,
} from '@zeroomega-nex/pac-compiler';
import type {
  Condition,
  PacProfile,
  ProfileRouteTarget,
  ProfileSpec,
  SwitchProfile,
  UserProfile,
} from '@zeroomega-nex/profile-spec';
import { composeSwitchProfileSource } from '@zeroomega-nex/profile-workflow';

export const PROFILE_TEXT_EXPORT_MIME = 'text/plain;charset=utf-8' as const;
const RULE_LIST_USAGE_URL =
  'https://github.com/FelisCatus/SwitchyOmega/wiki/RuleListUsage' as const;
const BASIC_LEGACY_CONDITIONS = new Set<Condition['kind']>([
  'host-wildcard',
  'url-wildcard',
  'url-regex',
  'false',
  'true',
]);

export interface ProfileTextExport {
  readonly content: string;
  readonly filename: string;
  readonly mimeType: typeof PROFILE_TEXT_EXPORT_MIME;
  readonly format: 'pac' | 'sorl' | 'ssrl';
  readonly warnings: readonly string[];
}

export type ProfileTextExportResult =
  | { readonly ok: true; readonly exported: ProfileTextExport }
  | { readonly ok: false; readonly issues: readonly string[] };

export interface ProfileExportOptions {
  readonly createdAt?: Date;
  readonly locale?: string;
  readonly target?: PacTarget;
}

export interface SwitchRuleListExportInspection {
  readonly legacyRequested: boolean;
  readonly legacyEligible: boolean;
  readonly warning?: string;
}

function failure(...issues: string[]): ProfileTextExportResult {
  return { ok: false, issues };
}

function profileById(spec: ProfileSpec, profileId: string): UserProfile | undefined {
  return spec.profiles.find((profile) => profile.id === profileId);
}

function pacIssueMessages(issues: readonly PacCapabilityIssue[]): readonly string[] {
  return issues.map((issue) => `${issue.message} (${issue.path})`);
}

function dateLabel(options: ProfileExportOptions): string {
  return (options.createdAt ?? new Date()).toLocaleDateString(options.locale);
}

function routeEquals(left: ProfileRouteTarget, right: ProfileRouteTarget): boolean {
  return (
    left.kind === right.kind &&
    (left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId))
  );
}

function effectiveSwitchDefaultRoute(
  spec: ProfileSpec,
  profile: SwitchProfile,
): ProfileRouteTarget {
  const attachedId = profile.attachedRuleListProfileId;
  if (
    attachedId === undefined ||
    profile.defaultRoute.kind !== 'profile' ||
    profile.defaultRoute.profileId !== attachedId
  ) {
    return profile.defaultRoute;
  }
  const attached = spec.profiles.find(
    (candidate) => candidate.id === attachedId && candidate.kind === 'rule-list',
  );
  return attached?.kind === 'rule-list' ? attached.defaultRoute : profile.defaultRoute;
}

function asciiPac(source: string): string {
  let result = '';
  for (const character of source) {
    const codePoint = character.codePointAt(0)!;
    if (codePoint <= 0x7f) {
      result += character;
    } else if (codePoint <= 0xffff) {
      result += `\\u${codePoint.toString(16).padStart(4, '0')}`;
    } else {
      const adjusted = codePoint - 0x10000;
      const high = 0xd800 + (adjusted >> 10);
      const low = 0xdc00 + (adjusted & 0x3ff);
      result += `\\u${high.toString(16).padStart(4, '0')}\\u${low.toString(16).padStart(4, '0')}`;
    }
  }
  return result;
}

export function sanitizeProfileExportName(profileName: string): string {
  return profileName.replace(/\W+/g, '_');
}

export function inspectSwitchRuleListExport(
  spec: ProfileSpec,
  profileId: string,
): SwitchRuleListExportInspection {
  const profile = profileById(spec, profileId);
  if (!profile || profile.kind !== 'switch') {
    return { legacyRequested: false, legacyEligible: false };
  }
  const legacyRequested = spec.settings.interface.exportLegacyRuleList;
  const legacyEligible =
    !spec.settings.interface.showAdvancedConditions &&
    profile.rules.every((rule) => BASIC_LEGACY_CONDITIONS.has(rule.condition.kind));
  return {
    legacyRequested,
    legacyEligible,
    ...(legacyRequested && !legacyEligible
      ? {
          warning:
            'Legacy rule-list export was requested, but advanced conditions require the SwitchyOmega .sorl format.',
        }
      : {}),
  };
}

function modernRuleList(
  spec: ProfileSpec,
  profile: SwitchProfile,
  options: ProfileExportOptions,
  warnings: readonly string[],
): ProfileTextExportResult {
  const composed = composeSwitchProfileSource(spec, profile.id);
  if (!composed.ok) return failure(composed.error.message);
  const normalized = composed.source.replace(/\r?\n/g, '\r\n');
  const lines = normalized.split('\r\n');
  const header = lines.shift() ?? '[SwitchyOmega Conditions]';
  const content = [
    header,
    '; Require: ZeroOmega >= 2.3.2',
    `; Date: ${dateLabel(options)}`,
    `; Usage: ${RULE_LIST_USAGE_URL}`,
    ...lines,
  ].join('\r\n');
  return {
    ok: true,
    exported: {
      content,
      filename: `OmegaRules_${sanitizeProfileExportName(profile.name)}.sorl`,
      mimeType: PROFILE_TEXT_EXPORT_MIME,
      format: 'sorl',
      warnings,
    },
  };
}

function legacyRuleCondition(
  condition: Condition,
): { readonly section: 'wildcard' | 'regexp'; readonly value: string } | undefined {
  switch (condition.kind) {
    case 'host-wildcard':
      return { section: 'wildcard', value: `@*://${condition.pattern}/*` };
    case 'true':
      return { section: 'wildcard', value: '@*://*/*' };
    case 'url-wildcard':
      return { section: 'wildcard', value: `@${condition.pattern}` };
    case 'url-regex':
      return { section: 'regexp', value: condition.pattern };
    case 'false':
      return undefined;
    default:
      return undefined;
  }
}

function legacyRuleList(
  spec: ProfileSpec,
  profile: SwitchProfile,
  options: ProfileExportOptions,
): ProfileTextExportResult {
  const defaultRoute = effectiveSwitchDefaultRoute(spec, profile);
  const wildcard: string[] = [];
  const regexp: string[] = [];
  for (const rule of profile.rules) {
    const exported = legacyRuleCondition(rule.condition);
    if (!exported) continue;
    const prefix = routeEquals(rule.route, defaultRoute) ? '!' : '';
    (exported.section === 'wildcard' ? wildcard : regexp).push(`${prefix}${exported.value}`);
  }
  const content = [
    '; Summary: Proxy Switchy! Exported Rule List',
    `; Date: ${dateLabel(options)}`,
    `; Website: ${RULE_LIST_USAGE_URL}`,
    '',
    '#BEGIN',
    '',
    '[wildcard]',
    ...wildcard,
    '[regexp]',
    ...regexp,
    '#END',
    '',
  ].join('\r\n');
  return {
    ok: true,
    exported: {
      content,
      filename: `SwitchyRules_${sanitizeProfileExportName(profile.name)}.ssrl`,
      mimeType: PROFILE_TEXT_EXPORT_MIME,
      format: 'ssrl',
      warnings: [],
    },
  };
}

export function createSwitchRuleListExport(
  spec: ProfileSpec,
  profileId: string,
  options: ProfileExportOptions = {},
): ProfileTextExportResult {
  const profile = profileById(spec, profileId);
  if (!profile || profile.kind !== 'switch') {
    return failure(`Switch profile ${profileId} does not exist.`);
  }
  const inspection = inspectSwitchRuleListExport(spec, profileId);
  if (inspection.legacyRequested && inspection.legacyEligible) {
    return legacyRuleList(spec, profile, options);
  }
  return modernRuleList(
    spec,
    profile,
    options,
    inspection.warning === undefined ? [] : [inspection.warning],
  );
}

function pacScript(profile: PacProfile): string | undefined {
  return profile.source.kind === 'inline' ? profile.source.script : profile.source.script;
}

export async function createProfilePacExport(
  spec: ProfileSpec,
  profileId: string,
  options: ProfileExportOptions = {},
): Promise<ProfileTextExportResult> {
  const profile = profileById(spec, profileId);
  if (!profile) return failure(`Profile ${profileId} does not exist.`);
  if (profile.kind === 'auto-detect') {
    return failure('Auto Detect profiles cannot be exported as a standalone PAC file.');
  }

  const route = { kind: 'profile', profileId } as const;
  const target = options.target ?? 'cross-browser';
  let script: string;
  let warnings: readonly string[];
  if (profile.kind === 'pac') {
    const source = pacScript(profile);
    if (source === undefined) {
      return failure('Download and verify the PAC URL before exporting this profile.');
    }
    const raw = await createRawPacSnapshot(
      spec,
      route,
      source,
      { createdAt: (options.createdAt ?? new Date()).toISOString() },
      target,
    );
    if (!raw.ok) return failure(...pacIssueMessages(raw.issues));
    script = raw.snapshot.script;
    warnings = raw.snapshot.warnings.map((warning) => warning.message);
  } else {
    const compiled = compilePac(spec, route, {
      target,
      allowTargetDependent: true,
    });
    if (!compiled.ok) return failure(...pacIssueMessages(compiled.issues));
    script = compiled.artifact.script;
    warnings = compiled.artifact.warnings.map((warning) => warning.message);
  }

  return {
    ok: true,
    exported: {
      content: asciiPac(script.replace(/^\uFEFF/u, '')),
      filename: `OmegaProfile_${sanitizeProfileExportName(profile.name)}.pac`,
      mimeType: PROFILE_TEXT_EXPORT_MIME,
      format: 'pac',
      warnings,
    },
  };
}
