from pathlib import Path
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


Path('apps/extension/src/lib/profile-export.ts').write_text(r'''import {
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
  return left.kind === right.kind &&
    (left.kind !== 'profile' || (right.kind === 'profile' && left.profileId === right.profileId));
}

function effectiveSwitchDefaultRoute(spec: ProfileSpec, profile: SwitchProfile): ProfileRouteTarget {
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
      result += `\\u${high.toString(16).padStart(4, '0')}\\u${low
        .toString(16)
        .padStart(4, '0')}`;
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
''')

Path('apps/extension/src/lib/profile-export.test.ts').write_text(r'''import { createDefaultProfileSpec } from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import {
  createProfilePacExport,
  createSwitchRuleListExport,
  inspectSwitchRuleListExport,
  PROFILE_TEXT_EXPORT_MIME,
  sanitizeProfileExportName,
} from './profile-export';

function baseSpec() {
  return createDefaultProfileSpec({
    documentId: 'document-profile-export',
    revisionId: 'revision-profile-export',
    createdAt: '2026-07-28T00:00:00.000Z',
  });
}

function switchSpec() {
  const spec = baseSpec();
  spec.profiles.push({
    id: 'profile-route-matrix',
    name: 'Route Matrix',
    kind: 'switch',
    defaultRoute: { kind: 'direct' },
    rules: [
      {
        id: 'rule-host',
        condition: { kind: 'host-wildcard', pattern: '*.legacy.invalid' },
        route: { kind: 'direct' },
      },
      {
        id: 'rule-url',
        condition: { kind: 'url-wildcard', pattern: 'http://export.invalid/*' },
        route: { kind: 'profile', profileId: 'profile-default-proxy' },
      },
      {
        id: 'rule-regex',
        condition: { kind: 'url-regex', pattern: '^https://secure\\.invalid/' },
        route: { kind: 'direct' },
      },
      {
        id: 'rule-false',
        condition: { kind: 'false', annotation: 'disabled' },
        route: { kind: 'direct' },
      },
    ],
  });
  return spec;
}

const createdAt = new Date('2026-07-28T00:00:00.000Z');

describe('original-compatible profile exports', () => {
  it('uses the original non-word filename sanitization and UTF-8 text MIME', () => {
    expect(sanitizeProfileExportName('My 测试/Profile')).toBe('My_Profile');
    expect(PROFILE_TEXT_EXPORT_MIME).toBe('text/plain;charset=utf-8');
  });

  it('exports modern result-enabled SwitchyOmega rules with original metadata', () => {
    const result = createSwitchRuleListExport(switchSpec(), 'profile-route-matrix', {
      createdAt,
      locale: 'en-US',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.exported).toMatchObject({
      filename: 'OmegaRules_Route_Matrix.sorl',
      mimeType: PROFILE_TEXT_EXPORT_MIME,
      format: 'sorl',
      warnings: [],
    });
    expect(result.exported.content).toContain('[SwitchyOmega Conditions]\r\n');
    expect(result.exported.content).toContain('; Require: ZeroOmega >= 2.3.2');
    expect(result.exported.content).toContain('; Date: 7/28/2026');
    expect(result.exported.content).toContain(
      '; Usage: https://github.com/FelisCatus/SwitchyOmega/wiki/RuleListUsage',
    );
    expect(result.exported.content).toContain('*.legacy.invalid +direct');
    expect(result.exported.content).toContain('* +direct');
  });

  it('exports legacy Proxy Switchy rules only when requested and basic', () => {
    const spec = switchSpec();
    spec.settings.interface.exportLegacyRuleList = true;
    const inspection = inspectSwitchRuleListExport(spec, 'profile-route-matrix');
    expect(inspection).toEqual({ legacyRequested: true, legacyEligible: true });

    const result = createSwitchRuleListExport(spec, 'profile-route-matrix', {
      createdAt,
      locale: 'en-US',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.exported).toMatchObject({
      filename: 'SwitchyRules_Route_Matrix.ssrl',
      format: 'ssrl',
      warnings: [],
    });
    expect(result.exported.content).toContain('; Summary: Proxy Switchy! Exported Rule List');
    expect(result.exported.content).toContain('!@*://*.legacy.invalid/*');
    expect(result.exported.content).toContain('@http://export.invalid/*');
    expect(result.exported.content).toContain('!^https://secure\\.invalid/');
    expect(result.exported.content).not.toContain('disabled');
  });

  it('falls back to modern .sorl with a warning for advanced conditions', () => {
    const spec = switchSpec();
    spec.settings.interface.exportLegacyRuleList = true;
    spec.settings.interface.showAdvancedConditions = true;
    const inspection = inspectSwitchRuleListExport(spec, 'profile-route-matrix');
    expect(inspection.legacyEligible).toBe(false);
    expect(inspection.warning).toContain('advanced conditions');

    const result = createSwitchRuleListExport(spec, 'profile-route-matrix', { createdAt });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.exported.filename).toBe('OmegaRules_Route_Matrix.sorl');
    expect(result.exported.format).toBe('sorl');
    expect(result.exported.warnings[0]).toContain('advanced conditions');
  });

  it('exports generated PAC for a typed Fixed profile without secrets', async () => {
    const result = await createProfilePacExport(baseSpec(), 'profile-default-proxy', { createdAt });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.exported).toMatchObject({
      filename: 'OmegaProfile_Proxy.pac',
      mimeType: PROFILE_TEXT_EXPORT_MIME,
      format: 'pac',
    });
    expect(result.exported.content).toContain('function FindProxyForURL');
    expect(result.exported.content).toContain('PROXY 127.0.0.1:7890');
    expect(result.exported.content).not.toMatch(/password|secretRef/u);
  });

  it('exports a top-level raw PAC script after structural validation', async () => {
    const spec = baseSpec();
    spec.profiles.push({
      id: 'profile-raw-pac',
      name: 'PAC / Raw',
      kind: 'pac',
      source: {
        kind: 'inline',
        script: "\uFEFFfunction FindProxyForURL(url, host) { return 'DIRECT'; }\n",
      },
    });
    const result = await createProfilePacExport(spec, 'profile-raw-pac', { createdAt });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.exported.filename).toBe('OmegaProfile_PAC_Raw.pac');
    expect(result.exported.content).toBe(
      "function FindProxyForURL(url, host) { return 'DIRECT'; }\n",
    );
    expect(result.exported.warnings).toContain(
      'Arbitrary PAC code is installed only as a top-level browser policy and cannot be differentially verified against the typed profile graph.',
    );
  });

  it('rejects Auto Detect and uncached remote PAC exports', async () => {
    const spec = baseSpec();
    spec.profiles.push(
      {
        id: 'profile-auto',
        name: 'Auto',
        kind: 'auto-detect',
      },
      {
        id: 'profile-remote-pac',
        name: 'Remote PAC',
        kind: 'pac',
        source: { kind: 'url', url: 'https://pac.invalid/proxy.pac' },
      },
    );
    await expect(createProfilePacExport(spec, 'profile-auto')).resolves.toEqual({
      ok: false,
      issues: ['Auto Detect profiles cannot be exported as a standalone PAC file.'],
    });
    await expect(createProfilePacExport(spec, 'profile-remote-pac')).resolves.toEqual({
      ok: false,
      issues: ['Download and verify the PAC URL before exporting this profile.'],
    });
  });
});
''')

# i18n labels for original page-header actions.
replace_once(
    'apps/extension/src/lib/i18n.ts',
    "  'Replace target profile': { 'zh-CN': '替换目标情景模式', 'zh-TW': '取代目標情景模式' },\n",
    "  'Replace target profile': { 'zh-CN': '替换目标情景模式', 'zh-TW': '取代目標情景模式' },\n  'Publish rule list': { 'zh-CN': '发布规则列表', 'zh-TW': '釋出規則清單' },\n  'Export PAC': { 'zh-CN': '导出PAC', 'zh-TW': '匯出 PAC' },\n",
)

# App imports, state, download functions, settings hooks, and header actions.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "  import { productIdentity } from '@zeroomega-nex/core-contracts';\n",
    "  import { productIdentity } from '@zeroomega-nex/core-contracts';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    "  import { translate } from '../../lib/i18n';\n",
    "  import { translate } from '../../lib/i18n';\n  import {\n    createProfilePacExport,\n    createSwitchRuleListExport,\n    inspectSwitchRuleListExport,\n    type ProfileTextExport,\n  } from '../../lib/profile-export';\n",
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  let pendingProfileReplacement: PendingProfileReplacement | undefined;

  let allProfiles: readonly UserProfile[] = [];
''',
    '''  let pendingProfileReplacement: PendingProfileReplacement | undefined;
  let profileExporting = false;
  let profileExportMessage = '';
  let ruleListExportWarning = '';

  let allProfiles: readonly UserProfile[] = [];
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  $: virtualProfile = selectedProfile?.kind === 'virtual' ? selectedProfile : undefined;
  $: hasUnappliedChanges = Boolean(view?.dirty || profileEditorDirty);
''',
    '''  $: virtualProfile = selectedProfile?.kind === 'virtual' ? selectedProfile : undefined;
  $: hasUnappliedChanges = Boolean(view?.dirty || profileEditorDirty);
  $: ruleListExportWarning =
    state && switchProfile
      ? (inspectSwitchRuleListExport(state.draft, switchProfile.id).warning ?? '')
      : '';
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''  async function deleteSelectedProfile(): Promise<void> {
''',
    '''  function downloadProfileText(exported: ProfileTextExport): void {
    const blob = new Blob([exported.content], { type: exported.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exported.filename;
    anchor.style.display = 'none';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function prepareSelectedProfileExport(): Promise<
    { readonly spec: ProfileSpec; readonly profileId: string } | undefined
  > {
    if (!state || !selectedProfile || saving || profileExporting || view?.busy) return undefined;
    const profileId = selectedProfile.id;
    if (!(await commitActiveProfileEditor()) || !state) return undefined;
    if (!state.draft.profiles.some((profile) => profile.id === profileId)) return undefined;
    return { spec: structuredClone(state.draft), profileId };
  }

  async function exportSelectedPac(): Promise<void> {
    const prepared = await prepareSelectedProfileExport();
    if (!prepared) return;
    profileExporting = true;
    profileExportMessage = '';
    try {
      const result = await createProfilePacExport(prepared.spec, prepared.profileId, {
        createdAt: new Date(),
      });
      if (!result.ok) throw new Error(result.issues.join(' '));
      downloadProfileText(result.exported);
      profileExportMessage =
        result.exported.warnings.length === 0
          ? `Exported ${result.exported.filename}.`
          : `Exported ${result.exported.filename} with ${result.exported.warnings.length} warning(s).`;
    } catch (error) {
      errorMessage = messageFrom(error);
    } finally {
      profileExporting = false;
    }
  }

  async function exportSelectedRuleList(): Promise<void> {
    const prepared = await prepareSelectedProfileExport();
    if (!prepared) return;
    profileExporting = true;
    profileExportMessage = '';
    try {
      const result = createSwitchRuleListExport(prepared.spec, prepared.profileId, {
        createdAt: new Date(),
      });
      if (!result.ok) throw new Error(result.issues.join(' '));
      downloadProfileText(result.exported);
      profileExportMessage =
        result.exported.warnings.length === 0
          ? `Exported ${result.exported.filename}.`
          : `Exported ${result.exported.filename} with ${result.exported.warnings.length} warning(s).`;
    } catch (error) {
      errorMessage = messageFrom(error);
    } finally {
      profileExporting = false;
    }
  }

  async function deleteSelectedProfile(): Promise<void> {
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''        <button
          class:active={activeSection === 'interface'}
          type="button"
''',
    '''        <button
          class:active={activeSection === 'interface'}
          data-interface-action
          type="button"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''            type="checkbox"
            checked={state.draft.settings.interface.showAdvancedConditions}
''',
    '''            type="checkbox"
            data-show-advanced-conditions-setting
            checked={state.draft.settings.interface.showAdvancedConditions}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''            type="checkbox"
            checked={state.draft.settings.interface.exportLegacyRuleList}
''',
    '''            type="checkbox"
            data-export-legacy-rule-list-setting
            checked={state.draft.settings.interface.exportLegacyRuleList}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''        <div class="profile-actions">
          <button type="button" disabled={view?.busy || saving} onclick={duplicateSelectedProfile}
            >Duplicate</button
          ><button
''',
    '''        <div class="profile-actions">
          {#if switchProfile}
            <button
              type="button"
              class:warning={ruleListExportWarning.length > 0}
              data-profile-export-rule-list
              data-profile-export-rule-list-warning={ruleListExportWarning.length > 0}
              title={ruleListExportWarning || 'Export this Switch Profile as a rule-list file.'}
              disabled={view?.busy || saving || profileExporting}
              onclick={() => void exportSelectedRuleList()}
            >
              {translate('Publish rule list')}
            </button>
          {/if}
          {#if selectedProfile.kind !== 'auto-detect'}
            <button
              type="button"
              data-profile-export-pac
              title="Export the current profile as a PAC file for another browser."
              disabled={view?.busy || saving || profileExporting}
              onclick={() => void exportSelectedPac()}
            >
              {translate('Export PAC')}
            </button>
          {/if}
          <button type="button" disabled={view?.busy || saving || profileExporting} onclick={duplicateSelectedProfile}
            >Duplicate</button
          ><button
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''      </header>
      <section class="settings-section profile-identity-editor">
''',
    '''      </header>
      {#if profileExportMessage}
        <p class="profile-export-status" role="status" data-profile-export-status>
          {profileExportMessage}
        </p>
      {/if}
      <section class="settings-section profile-identity-editor">
''',
)

replace_once(
    'apps/extension/src/entrypoints/options/style.css',
    '''.profile-actions .danger {
  border-color: var(--danger);
  color: var(--danger);
}
''',
    '''.profile-actions .danger {
  border-color: var(--danger);
  color: var(--danger);
}
.profile-actions .warning {
  border-color: #b77800;
  color: #9a6500;
}
.profile-export-status {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 12px;
}
''',
)

# Chromium real downloads in the imported cross-profile context.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await virtualOptions
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).click();
''',
    '''  await virtualOptions
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  await virtualOptions.getByRole('button', { name: 'Route Matrix', exact: true }).click();
  const [modernRuleDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    virtualOptions.locator('[data-profile-export-rule-list]').click(),
  ]);
  assert.equal(modernRuleDownload.suggestedFilename(), 'OmegaRules_Route_Matrix.sorl');
  const modernRulePath = await modernRuleDownload.path();
  assert.ok(modernRulePath, 'Modern Rule List download path was not available');
  const modernRuleExport = await readFile(modernRulePath, 'utf8');
  assert.match(modernRuleExport, /\[SwitchyOmega Conditions\]/u);
  assert.match(modernRuleExport, /; Require: ZeroOmega >= 2\.3\.2/u);
  assert.match(modernRuleExport, /\*\.virtual-migration\.invalid \+Target Proxy/u);

  await virtualOptions.locator('[data-interface-action]').click();
  await virtualOptions.locator('[data-export-legacy-rule-list-setting]').check();
  await virtualOptions.getByRole('button', { name: 'Route Matrix', exact: true }).click();
  const [legacyRuleDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    virtualOptions.locator('[data-profile-export-rule-list]').click(),
  ]);
  assert.equal(legacyRuleDownload.suggestedFilename(), 'SwitchyRules_Route_Matrix.ssrl');
  const legacyRulePath = await legacyRuleDownload.path();
  assert.ok(legacyRulePath, 'Legacy Rule List download path was not available');
  const legacyRuleExport = await readFile(legacyRulePath, 'utf8');
  assert.match(legacyRuleExport, /; Summary: Proxy Switchy! Exported Rule List/u);
  assert.match(legacyRuleExport, /@\*:\/\/\*\.virtual-migration\.invalid\/\*/u);

  await virtualOptions.locator('[data-interface-action]').click();
  await virtualOptions.locator('[data-show-advanced-conditions-setting]').check();
  await virtualOptions.getByRole('button', { name: 'Route Matrix', exact: true }).click();
  const warnedRuleExport = virtualOptions.locator('[data-profile-export-rule-list]');
  assert.equal(await warnedRuleExport.getAttribute('data-profile-export-rule-list-warning'), 'true');
  const [fallbackRuleDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    warnedRuleExport.click(),
  ]);
  assert.equal(fallbackRuleDownload.suggestedFilename(), 'OmegaRules_Route_Matrix.sorl');

  await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).click();
  const [generatedPacDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    virtualOptions.locator('[data-profile-export-pac]').click(),
  ]);
  assert.equal(generatedPacDownload.suggestedFilename(), 'OmegaProfile_Target_Proxy.pac');
  const generatedPacPath = await generatedPacDownload.path();
  assert.ok(generatedPacPath, 'Generated PAC download path was not available');
  const generatedPacExport = await readFile(generatedPacPath, 'utf8');
  assert.match(generatedPacExport, /function FindProxyForURL/u);
  assert.match(generatedPacExport, /PROXY target\.proxy\.invalid:8080/u);

  await virtualOptions.getByRole('button', { name: 'PAC Matrix', exact: true }).click();
  const [rawPacDownload] = await Promise.all([
    virtualOptions.waitForEvent('download'),
    virtualOptions.locator('[data-profile-export-pac]').click(),
  ]);
  assert.equal(rawPacDownload.suggestedFilename(), 'OmegaProfile_PAC_Matrix.pac');
  const rawPacPath = await rawPacDownload.path();
  assert.ok(rawPacPath, 'Raw PAC download path was not available');
  assert.equal(
    await readFile(rawPacPath, 'utf8'),
    "function FindProxyForURL(url, host) { return 'DIRECT'; }\n",
  );

  await virtualOptions.getByRole('button', { name: 'Auto Matrix', exact: true }).click();
  assert.equal(await virtualOptions.locator('[data-profile-export-pac]').count(), 0);

  await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).click();
''',
)

# Permanent guard loads and checks the export core.
validator = Path('scripts/validate-ui-compatibility.mjs')
lines = validator.read_text().splitlines()
for index, line in enumerate(lines):
    if line.strip() == "const profileIconPath = 'apps/extension/src/components/ProfileIcon.svelte';":
        lines[index:index] = ["const profileExportPath = 'apps/extension/src/lib/profile-export.ts';"]
        break
else:
    raise SystemExit('profile export path anchor missing')
for index, line in enumerate(lines):
    if line.strip() == 'profileIcon,':
        lines.insert(index, '  profileExport,')
        break
else:
    raise SystemExit('profile export destructuring anchor missing')
for index, line in enumerate(lines):
    if line.strip() == "readFile(profileIconPath, 'utf8'),":
        lines.insert(index, "  readFile(profileExportPath, 'utf8'),")
        break
else:
    raise SystemExit('profile export read anchor missing')
validator.write_text('\n'.join(lines) + '\n')

replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''    'Virtual replacement must open the original general two-selector dialog after the dirty-Draft Apply boundary, preview both endpoints, and produce one typed replacement Draft without changing either profile.',
  ],
''',
    '''    'Virtual replacement must open the original general two-selector dialog after the dirty-Draft Apply boundary, preview both endpoints, and produce one typed replacement Draft without changing either profile.',
  ],
  [
    profileExport.includes("PROFILE_TEXT_EXPORT_MIME = 'text/plain;charset=utf-8'") &&
      profileExport.includes("replace(/\\W+/g, '_')") &&
      profileExport.includes('OmegaProfile_') &&
      profileExport.includes('OmegaRules_') &&
      profileExport.includes('SwitchyRules_') &&
      profileExport.includes('; Require: ZeroOmega >= 2.3.2') &&
      profileExport.includes('; Summary: Proxy Switchy! Exported Rule List') &&
      profileExport.includes('createRawPacSnapshot') &&
      profileExport.includes('compilePac') &&
      profileExport.includes('advanced conditions require the SwitchyOmega .sorl format') &&
      optionsApp.includes('data-profile-export-rule-list') &&
      optionsApp.includes('data-profile-export-pac') &&
      optionsApp.includes('commitActiveProfileEditor') &&
      optionsApp.includes('downloadProfileText') &&
      chromiumE2e.includes('OmegaRules_Route_Matrix.sorl') &&
      chromiumE2e.includes('SwitchyRules_Route_Matrix.ssrl') &&
      chromiumE2e.includes('OmegaProfile_Target_Proxy.pac') &&
      chromiumE2e.includes('OmegaProfile_PAC_Matrix.pac'),
    'Profile headers must export current-Draft PAC and Switch rule-list files with original filenames, UTF-8 MIME, legacy fallback warning, raw PAC validation, and real Chromium downloads.',
  ],
''',
)

# Durable docs, including stale B-06 correction.
kg = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg.write_text(
    kg.read_text()
    + '''
- 原版 `profile.jade` 在普通 Profile 页头显示 PAC 导出；Switch 另外注册 Rule List 导出。`MasterCtrl.exportScript` 使用当前内存 Options（不先 Apply）、`text/plain;charset=utf-8`、`OmegaProfile_<name.replace(/\\W+/g, '_')>.pac`。Nex 同样只先提交当前 Switch 源码到 Draft，不改变 Applied 或当前流量。
- Typed Fixed/Switch/Rule List/Virtual 通过 cross-browser PAC compiler 导出；PAC Profile 通过与激活相同的顶层 raw-PAC 结构验证导出 inline/已下载缓存；Auto Detect 不显示 PAC 导出，未下载的远程 PAC 明确失败。导出文件不访问 secret store，凭据不会进入 PAC。
- Switch modern 导出为 `OmegaRules_*.sorl`，保留 result-enabled SwitchyOmega Conditions，并插入 Require/Date/Usage 元数据。legacy 选项仅在基础条件且高级条件界面关闭时导出 `SwitchyRules_*.ssrl`；否则按钮显示警告并回退 `.sorl`，避免静默丢失高级语义。
- legacy `.ssrl` 只表示 default 与 non-default 两类：与有效 default route 相同的规则加 `!`；Host wildcard、URL wildcard、URL regex 分别按原版写入 wildcard/regexp 区，False 忽略。附属 Rule List 启用时使用其 default route。
'''
)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
audit = audit_path.read_text()
audit = audit.replace(
    '| B-06 | 替换情景模式引用  | `replace_profile.jade`、`options.coffee`       | 批量把 from 引用替换为 to        | MUST_MATCH | PARTIAL  | PARTIAL | Virtual shortcut 已有完整 typed replace-ref transaction 与 Chromium 全链；通用页头 Replace 入口仍缺                        | 增加通用 Replace 对话框    |',
    '| B-06 | 替换情景模式引用  | `replace_profile.jade`、`master.coffee`        | Virtual 入口打开双选择器通用对话框；批量把 from 引用替换为 to | MUST_MATCH | DONE | PARTIAL | Apply-before-dialog、双端选择/预览、完整 typed transaction、端点保留及 Chromium 全链均已验证 | 补完整 locale |',
)
audit = audit.replace(
    '| B-07 | 导出 PAC          | `profile.jade`                                 | scriptable 类型页头导出          | MUST_MATCH | MISSING  | MISSING | 无入口                                                                                                                     | 实现并验证文件             |',
    '| B-07 | 导出 PAC          | `profile.jade`、`master.coffee`                 | scriptable 类型页头导出；原版文件名与 UTF-8 MIME | MUST_MATCH | DONE | COMPLETE | typed Profile 生成 PAC；PAC Profile raw 结构验证；Auto Detect 隐藏；Chromium 验证 generated/raw 下载 | 保持双浏览器回归 |',
)
audit = audit.replace(
    '| B-08 | 导出规则列表      | `profile.jade`                                 | 支持类型页头导出，含 legacy 警告 | MUST_MATCH | MISSING  | MISSING | 无入口                                                                                                                     | 实现格式选择与下载         |',
    '| B-08 | 导出规则列表      | `profile.jade`、`switch_profile.coffee`         | Switch 页头导出 `.sorl`；可选 `.ssrl`，高级条件时警告回退 | MUST_MATCH | DONE | COMPLETE | result-enabled `.sorl`、legacy `.ssrl`、warning fallback、原版文件名/MIME 与 Chromium 下载均验证 | 保持回归 |',
)
audit_path.write_text(audit)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
run_id = os.environ.get('PROFILE_EXPORT_RUN_ID', 'PENDING')
insert_before = '### General Replace Profile dialog\n'
section = f'''### Profile-level PAC and Rule List exports\n\n- Original profile-header exports operate on the current in-memory Options state rather than forcing Apply. Nex commits only an active Switch source editor into Draft, then exports without changing Applied state or browser traffic.\n- Fixed, Switch, Rule List, and Virtual profiles compile to cross-browser PAC; PAC Profiles export structurally validated top-level inline/downloaded scripts; Auto Detect is excluded and uncached remote PAC fails explicitly.\n- Switch exports modern result-enabled `OmegaRules_*.sorl` with Require/Date/Usage metadata. When legacy export is requested and all conditions remain basic, `SwitchyRules_*.ssrl` is produced; advanced conditions show a warning and safely fall back to `.sorl`.\n- All files use original `/\\W+/g` filename sanitization and `text/plain;charset=utf-8`. Chromium verifies modern, legacy, warning fallback, generated PAC, raw PAC, and Auto Detect exclusion through real downloads.\n- Integration run `{run_id}`; product commit containing this document.\n\n'''
if insert_before not in status:
    raise SystemExit('profile export status insertion anchor missing')
status = status.replace(insert_before, section + insert_before, 1)
status = status.replace(
    'Continue profile-level PAC/Rule List export actions and typed locale coverage; keep file PAC activation under an explicit target capability decision.',
    'Continue typed locale coverage and remaining accessibility warnings; keep file PAC activation under an explicit target capability decision.',
)
status_path.write_text(status)
