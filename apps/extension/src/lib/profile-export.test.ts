import { createDefaultProfileSpec } from '@zeroomega-nex/profile-workflow';
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
