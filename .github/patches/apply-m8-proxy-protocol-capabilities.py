from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new))


# Durable protocol/target and slot capability matrix.
proxy_capabilities = Path('packages/pac-compiler/src/proxy-capabilities.ts')
proxy_capabilities.write_text(
    """import type { ProxyEndpoint } from '@zeroomega-nex/profile-spec';

import type { PacCapability, PacTarget } from './contracts.js';

export type ProxyProtocol = ProxyEndpoint['protocol'];
export type FixedProxySlot = 'fallback' | 'http' | 'https' | 'ftp';
export type ProxyAuthenticationCapability = 'web-request-407' | 'unsupported';
export type ProxyDnsCapability =
  | 'proxy-protocol-default'
  | 'client-ipv4-only'
  | 'proxy-side'
  | 'browser-target-default'
  | 'target-dependent';
export type FixedSlotRequestCapability = 'active' | 'browser-request-removed';

export interface ProxyProtocolCapability {
  readonly protocol: ProxyProtocol;
  readonly pacDirective: 'PROXY' | 'HTTPS' | 'SOCKS4' | 'SOCKS5';
  readonly transport: 'supported';
  readonly authentication: ProxyAuthenticationCapability;
  readonly dns: ProxyDnsCapability;
  readonly semantics: Exclude<PacCapability, 'unsupported'>;
}

export interface FixedProxySlotCapability {
  readonly slot: FixedProxySlot;
  readonly request: FixedSlotRequestCapability;
  readonly semantics: PacCapability;
}

const DIRECTIVES: Readonly<Record<ProxyProtocol, ProxyProtocolCapability['pacDirective']>> = {
  http: 'PROXY',
  https: 'HTTPS',
  socks4: 'SOCKS4',
  socks5: 'SOCKS5',
};

export const PROXY_PROTOCOLS: readonly ProxyProtocol[] = ['http', 'https', 'socks4', 'socks5'];
export const FIXED_PROXY_SLOTS: readonly FixedProxySlot[] = [
  'fallback',
  'http',
  'https',
  'ftp',
];

export function proxyProtocolCapability(
  protocol: ProxyProtocol,
  target: PacTarget,
): ProxyProtocolCapability {
  const authentication: ProxyAuthenticationCapability =
    protocol === 'http' || protocol === 'https' ? 'web-request-407' : 'unsupported';
  let dns: ProxyDnsCapability = 'proxy-protocol-default';
  let semantics: ProxyProtocolCapability['semantics'] = 'exact';

  if (protocol === 'socks4') {
    dns =
      target === 'chromium'
        ? 'client-ipv4-only'
        : target === 'firefox'
          ? 'browser-target-default'
          : 'target-dependent';
    semantics = target === 'cross-browser' ? 'target-dependent' : 'exact';
  } else if (protocol === 'socks5') {
    dns =
      target === 'chromium'
        ? 'proxy-side'
        : target === 'firefox'
          ? 'browser-target-default'
          : 'target-dependent';
    semantics = target === 'cross-browser' ? 'target-dependent' : 'exact';
  }

  return {
    protocol,
    pacDirective: DIRECTIVES[protocol],
    transport: 'supported',
    authentication,
    dns,
    semantics,
  };
}

export function fixedProxySlotCapability(
  slot: FixedProxySlot,
  _target: PacTarget,
): FixedProxySlotCapability {
  return slot === 'ftp'
    ? { slot, request: 'browser-request-removed', semantics: 'unsupported' }
    : { slot, request: 'active', semantics: 'exact' };
}
"""
)

proxy_capability_tests = Path('packages/pac-compiler/src/proxy-capabilities.test.ts')
proxy_capability_tests.write_text(
    """import { describe, expect, it } from 'vitest';

import {
  FIXED_PROXY_SLOTS,
  PROXY_PROTOCOLS,
  fixedProxySlotCapability,
  proxyProtocolCapability,
} from './proxy-capabilities.js';

describe('proxy protocol and browser-target capability matrix', () => {
  it('keeps all four original protocols available on both browser targets', () => {
    for (const target of ['chromium', 'firefox'] as const) {
      expect(
        PROXY_PROTOCOLS.map((protocol) => proxyProtocolCapability(protocol, target).transport),
      ).toEqual(['supported', 'supported', 'supported', 'supported']);
      expect(PROXY_PROTOCOLS.map((protocol) => proxyProtocolCapability(protocol, target).pacDirective))
        .toEqual(['PROXY', 'HTTPS', 'SOCKS4', 'SOCKS5']);
    }
  });

  it('limits browser-only authentication to HTTP and HTTPS 407 challenges', () => {
    for (const target of ['chromium', 'firefox', 'cross-browser'] as const) {
      expect(proxyProtocolCapability('http', target).authentication).toBe('web-request-407');
      expect(proxyProtocolCapability('https', target).authentication).toBe('web-request-407');
      expect(proxyProtocolCapability('socks4', target).authentication).toBe('unsupported');
      expect(proxyProtocolCapability('socks5', target).authentication).toBe('unsupported');
    }
  });

  it('makes SOCKS DNS differences explicit instead of pretending cross-browser identity', () => {
    expect(proxyProtocolCapability('socks4', 'chromium')).toMatchObject({
      dns: 'client-ipv4-only',
      semantics: 'exact',
    });
    expect(proxyProtocolCapability('socks5', 'chromium')).toMatchObject({
      dns: 'proxy-side',
      semantics: 'exact',
    });
    expect(proxyProtocolCapability('socks4', 'firefox')).toMatchObject({
      dns: 'browser-target-default',
      semantics: 'exact',
    });
    expect(proxyProtocolCapability('socks5', 'firefox')).toMatchObject({
      dns: 'browser-target-default',
      semantics: 'exact',
    });
    expect(proxyProtocolCapability('socks4', 'cross-browser').semantics).toBe('target-dependent');
    expect(proxyProtocolCapability('socks5', 'cross-browser').semantics).toBe('target-dependent');
  });

  it('preserves the original FTP slot while resolving modern browser request support as removed', () => {
    expect(FIXED_PROXY_SLOTS).toEqual(['fallback', 'http', 'https', 'ftp']);
    for (const target of ['chromium', 'firefox', 'cross-browser'] as const) {
      expect(fixedProxySlotCapability('ftp', target)).toEqual({
        slot: 'ftp',
        request: 'browser-request-removed',
        semantics: 'unsupported',
      });
      expect(fixedProxySlotCapability('http', target).request).toBe('active');
      expect(fixedProxySlotCapability('https', target).request).toBe('active');
      expect(fixedProxySlotCapability('fallback', target).request).toBe('active');
    }
  });
});
"""
)

index = Path('packages/pac-compiler/src/index.ts')
replace_once(
    index,
    """export { normalizePacProxyHost, pacDirective, pacStringLiteral } from './escape.js';
""",
    """export { normalizePacProxyHost, pacDirective, pacStringLiteral } from './escape.js';
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
""",
    'proxy capability exports',
)

# Capability analyzer: target-aware warnings and SOCKS credential hard stop.
capabilities = Path('packages/pac-compiler/src/capabilities.ts')
replace_once(
    capabilities,
    """import { PAC_COMPILER_VERSION } from './contracts.js';
""",
    """import { PAC_COMPILER_VERSION } from './contracts.js';
import {
  fixedProxySlotCapability,
  proxyProtocolCapability,
  type FixedProxySlot,
} from './proxy-capabilities.js';
""",
    'capability matrix imports',
)
text = capabilities.read_text()
start = text.index('function endpointCapability(')
end = text.index('\nexport function analyzePacCompatibility', start)
replacement = """function endpointCapability(
  endpoint: ProxyEndpoint,
  path: string,
  target: PacTarget,
  slot: FixedProxySlot,
  addIssue: (issue: PacCapabilityIssue) => void,
): void {
  const slotCapability = fixedProxySlotCapability(slot, target);
  if (slotCapability.request === 'browser-request-removed') {
    addIssue(
      issue(
        'fixed-slot.ftp-browser-request-removed',
        path,
        'unsupported',
        'info',
        false,
        'The FTP slot is preserved for original backup round-trip, but modern Chromium and Firefox no longer issue browser FTP requests.',
      ),
    );
  }

  const protocolCapability = proxyProtocolCapability(endpoint.protocol, target);
  if (protocolCapability.semantics === 'target-dependent') {
    addIssue(
      issue(
        `endpoint.${endpoint.protocol}-dns-target-dependent`,
        path,
        'target-dependent',
        'warning',
        false,
        `${endpoint.protocol.toUpperCase()} DNS behavior differs between Chromium and Firefox targets.`,
      ),
    );
  }

  if (/[\u0080-\uFFFF]/u.test(endpoint.host)) {
    addIssue(
      issue(
        'endpoint.non-ascii-host',
        `${path}/host`,
        'unsupported',
        'error',
        true,
        'PAC proxy directives require an ASCII host after normalization.',
      ),
    );
  }
  if (!endpoint.credential) return;
  if (protocolCapability.authentication === 'unsupported') {
    addIssue(
      issue(
        'endpoint.socks-authentication-unsupported',
        `${path}/credential`,
        'unsupported',
        'error',
        true,
        'Browser-only PAC activation does not support SOCKS credentials.',
      ),
    );
    return;
  }
  addIssue(
    issue(
      'endpoint.authentication-external',
      `${path}/credential`,
      'exact',
      'info',
      false,
      'HTTP/HTTPS proxy credentials are handled by the bounded browser 407 challenge adapter and are never embedded in PAC output.',
    ),
  );
}
"""
capabilities.write_text(text[:start] + replacement + text[end:])
replace_once(
    capabilities,
    """        endpointCapability(endpoint, `${path}/proxyByScheme/${slot}`, addIssue);
""",
    """        endpointCapability(
          endpoint,
          `${path}/proxyByScheme/${slot}`,
          target,
          slot as FixedProxySlot,
          addIssue,
        );
""",
    'target-aware endpoint analysis call',
)

compiler_tests = Path('packages/pac-compiler/src/compiler.test.ts')
anchor = """  it('never serializes proxy credentials or secret references into PAC output', async () => {
"""
tests = """  it('emits the complete protocol directive matrix and reports the inactive FTP slot', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const result = compilePac(spec, profileRoute(spec, 'fixed'), { target: 'chromium' });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.issues, null, 2));

    expect(result.artifact.script).toContain('PROXY proxy.example.invalid:8080');
    expect(result.artifact.script).toContain('HTTPS proxy.example.invalid:8443');
    expect(result.artifact.script).toContain('SOCKS4 127.0.0.1:1081');
    expect(result.artifact.script).toContain('SOCKS5 127.0.0.1:1080');
    expect(
      evaluatePacScript(result.artifact.script, {
        url: 'ftp://legacy.example.invalid/file',
        host: 'legacy.example.invalid',
      }),
    ).toBe('SOCKS4 127.0.0.1:1081');
    expect(
      evaluatePacScript(result.artifact.script, {
        url: 'custom://fallback.example.invalid/',
        host: 'fallback.example.invalid',
      }),
    ).toBe('SOCKS5 127.0.0.1:1080');
    expect(result.analysis.issues.map((entry) => entry.code)).toContain(
      'fixed-slot.ftp-browser-request-removed',
    );
  });

  it('blocks SOCKS credentials before browser mutation', async () => {
    const spec = await importedFixture('minimal-profile-types.json');
    const fixed = spec.profiles.find((profile) => profile.name === 'fixed');
    if (!fixed || fixed.kind !== 'fixed') throw new Error('fixed fixture missing');
    const fallback = spec.proxyEndpoints.find(
      (endpoint) => endpoint.id === fixed.proxyByScheme.fallback,
    );
    if (!fallback) throw new Error('fallback endpoint missing');
    fallback.credential = {
      username: 'unsupported-socks-user',
      passwordSecretRef: 'secret-socks-unsupported',
    };

    const result = compilePac(spec, profileRoute(spec, 'fixed'), { target: 'firefox' });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected SOCKS credential rejection');
    expect(result.issues.map((entry) => entry.code)).toContain(
      'endpoint.socks-authentication-unsupported',
    );
  });

"""
if compiler_tests.read_text().count(anchor) != 1:
    raise SystemExit('compiler protocol tests anchor mismatch')
compiler_tests.write_text(compiler_tests.read_text().replace(anchor, tests + anchor))

# Browser family is an explicit extension capability.
browser_capabilities = Path('apps/extension/src/lib/browser-target-capabilities.ts')
replace_once(
    browser_capabilities,
    """export interface BrowserTargetCapabilities {
  readonly pacProfiles: PacProfileCapability;
}
""",
    """export interface BrowserTargetCapabilities {
  readonly target: 'chromium' | 'firefox';
  readonly pacProfiles: PacProfileCapability;
}
""",
    'browser family capability field',
)
replace_once(
    browser_capabilities,
    """export function inspectBrowserTargetCapabilities(
  proxyApi: BrowserProxyApiProbe | undefined,
): BrowserTargetCapabilities {
""",
    """export function inspectBrowserTargetCapabilities(
  proxyApi: BrowserProxyApiProbe | undefined,
  target: BrowserTargetCapabilities['target'] = 'chromium',
): BrowserTargetCapabilities {
""",
    'browser family probe argument',
)
browser_capabilities.write_text(
    browser_capabilities.read_text().replace(
        "return {\n      pacProfiles:",
        "return {\n      target,\n      pacProfiles:",
    )
)
replace_once(
    browser_capabilities,
    """  return {
    pacProfiles: {
""",
    """  return {
    target,
    pacProfiles: {
""",
    'supported browser family result',
)
replace_once(
    browser_capabilities,
    """export function currentBrowserTargetCapabilities(): BrowserTargetCapabilities {
  const proxyApi =
    typeof browser === 'undefined'
      ? undefined
      : (browser.proxy as unknown as BrowserProxyApiProbe | undefined);
  return inspectBrowserTargetCapabilities(proxyApi);
}
""",
    """export function currentBrowserTargetCapabilities(): BrowserTargetCapabilities {
  const proxyApi =
    typeof browser === 'undefined'
      ? undefined
      : (browser.proxy as unknown as BrowserProxyApiProbe | undefined);
  const manifest =
    typeof browser === 'undefined'
      ? undefined
      : (browser.runtime.getManifest() as { browser_specific_settings?: { gecko?: unknown } });
  const target: BrowserTargetCapabilities['target'] = manifest?.browser_specific_settings?.gecko
    ? 'firefox'
    : 'chromium';
  return inspectBrowserTargetCapabilities(proxyApi, target);
}
""",
    'current browser family resolution',
)

browser_capability_tests = Path('apps/extension/src/lib/browser-target-capabilities.test.ts')
anchor = """  it('supports PAC profiles through writable proxy.settings', () => {
"""
test = """  it('records the independently selected Chromium or Firefox target', () => {
    expect(inspectBrowserTargetCapabilities({ settings: proxySettings }, 'chromium').target).toBe(
      'chromium',
    );
    expect(inspectBrowserTargetCapabilities({ settings: proxySettings }, 'firefox').target).toBe(
      'firefox',
    );
  });

"""
if browser_capability_tests.read_text().count(anchor) != 1:
    raise SystemExit('browser family test anchor mismatch')
browser_capability_tests.write_text(browser_capability_tests.read_text().replace(anchor, test + anchor))

# Surface the complete matrix in the Fixed editor.
fixed_editor = Path('apps/extension/src/entrypoints/options/FixedProfileEditor.svelte')
replace_once(
    fixed_editor,
    """  import type {
    ProfileWorkflowIdFactory,
    ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';
""",
    """  import {
    fixedProxySlotCapability,
    proxyProtocolCapability,
    type PacTarget,
    type ProxyDnsCapability,
    type ProxyProtocolCapability,
  } from '@zeroomega-nex/pac-compiler';
  import type {
    ProfileWorkflowIdFactory,
    ProfileWorkflowSecretMaterial,
  } from '@zeroomega-nex/profile-workflow';
""",
    'Fixed editor capability imports',
)
replace_once(
    fixed_editor,
    """  export let locale: AppLocale = currentAppLocale();
  export let generation: number;
""",
    """  export let locale: AppLocale = currentAppLocale();
  export let browserTarget: Exclude<PacTarget, 'cross-browser'> = 'chromium';
  export let generation: number;
""",
    'Fixed editor browser target prop',
)
function_anchor = """  function rowDisplayLabel(row: SchemeRow): string {
"""
functions = """  function protocolCapability(protocol: ProxyProtocol): ProxyProtocolCapability {
    return proxyProtocolCapability(protocol, browserTarget);
  }

  function authenticationCapabilityText(
    capability: ProxyProtocolCapability['authentication'],
  ): string {
    return capability === 'web-request-407'
      ? uiText('fixed.capability.authentication407', locale)
      : uiText('fixed.capability.authenticationUnsupported', locale);
  }

  function dnsCapabilityText(capability: ProxyDnsCapability): string {
    switch (capability) {
      case 'proxy-protocol-default':
        return uiText('fixed.capability.dnsProtocolDefault', locale);
      case 'client-ipv4-only':
        return uiText('fixed.capability.dnsClientIpv4', locale);
      case 'proxy-side':
        return uiText('fixed.capability.dnsProxySide', locale);
      case 'browser-target-default':
        return uiText('fixed.capability.dnsBrowserDefault', locale);
      case 'target-dependent':
        return uiText('fixed.capability.dnsTargetDependent', locale);
    }
  }

"""
if fixed_editor.read_text().count(function_anchor) != 1:
    raise SystemExit('Fixed capability helper anchor mismatch')
fixed_editor.write_text(fixed_editor.read_text().replace(function_anchor, functions + function_anchor))
section_anchor = """  </section>

  <section class="settings-section">
    <h2>{uiText('fixed.bypassList', locale)}</h2>
"""
section = """  </section>

  <section
    class="settings-section protocol-capabilities-section"
    data-fixed-protocol-capabilities
    data-browser-target={browserTarget}
  >
    <h2>{uiText('fixed.capability.title', locale)}</h2>
    <p class="section-help">
      {uiText('fixed.capability.help', locale)}
    </p>
    <p class="target-summary" data-fixed-protocol-target>
      {uiText('fixed.capability.target', locale)}:
      <strong>{browserTarget === 'firefox'
          ? uiText('fixed.capability.targetFirefox', locale)
          : uiText('fixed.capability.targetChromium', locale)}</strong
      >
    </p>
    <div class="table-scroller">
      <table class="protocol-capabilities-table">
        <thead>
          <tr>
            <th>{uiText('fixed.protocol', locale)}</th>
            <th>{uiText('fixed.capability.pacDirective', locale)}</th>
            <th>{uiText('fixed.capability.transport', locale)}</th>
            <th>{uiText('fixed.authentication', locale)}</th>
            <th>{uiText('fixed.capability.dns', locale)}</th>
          </tr>
        </thead>
        <tbody>
          {#each protocols as protocol (protocol)}
            {@const capability = protocolCapability(protocol)}
            <tr data-proxy-protocol-capability={protocol}>
              <th scope="row">{protocolLabel(protocol)}</th>
              <td><code>{capability.pacDirective}</code></td>
              <td>{uiText('fixed.capability.transportSupported', locale)}</td>
              <td>{authenticationCapabilityText(capability.authentication)}</td>
              <td>{dnsCapabilityText(capability.dns)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="ftp-capability-note" role="note" data-fixed-ftp-capability>
      {fixedProxySlotCapability('ftp', browserTarget).request === 'browser-request-removed'
        ? uiText('fixed.capability.ftpRemoved', locale)
        : ''}
    </p>
  </section>

  <section class="settings-section">
    <h2>{uiText('fixed.bypassList', locale)}</h2>
"""
if fixed_editor.read_text().count(section_anchor) != 1:
    raise SystemExit('Fixed capability section anchor mismatch')
fixed_editor.write_text(fixed_editor.read_text().replace(section_anchor, section))
style_anchor = """  .table-scroller {
"""
styles = """  .protocol-capabilities-section {
    margin-top: 18px;
  }

  .target-summary,
  .ftp-capability-note {
    margin: 8px 0;
  }

  .protocol-capabilities-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .protocol-capabilities-table th,
  .protocol-capabilities-table td {
    padding: 7px 8px;
    border: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
  }

  .ftp-capability-note {
    color: var(--muted);
  }

"""
if fixed_editor.read_text().count(style_anchor) != 1:
    raise SystemExit('Fixed capability style anchor mismatch')
fixed_editor.write_text(fixed_editor.read_text().replace(style_anchor, styles + style_anchor))

app = Path('apps/extension/src/entrypoints/options/App.svelte')
replace_once(
    app,
    """          {locale}
          spec={state.draft}
""",
    """          {locale}
          browserTarget={browserTargetCapabilities.target}
          spec={state.draft}
""",
    'Fixed editor browser target wiring',
)

# Typed direct strings.
messages = Path('apps/extension/src/lib/ui-messages.ts')
anchor = """  'fixed.authUnsupported': {
"""
strings = """  'fixed.capability.title': {
    en: 'Protocol capabilities',
    'zh-CN': '协议能力',
    'zh-TW': '通訊協定能力',
  },
  'fixed.capability.help': {
    en: 'ZeroOmega keeps every original protocol choice in every proxy row. The table below states the real browser-target transport, authentication, and DNS boundaries.',
    'zh-CN': 'ZeroOmega 在每个代理行中保留原版全部协议选项。下表明确当前浏览器目标的传输、认证与 DNS 边界。',
    'zh-TW': 'ZeroOmega 在每個代理列中保留原版全部通訊協定選項。下表明確目前瀏覽器目標的傳輸、驗證與 DNS 邊界。',
  },
  'fixed.capability.target': { en: 'Browser target', 'zh-CN': '浏览器目标', 'zh-TW': '瀏覽器目標' },
  'fixed.capability.targetChromium': { en: 'Chromium', 'zh-CN': 'Chromium', 'zh-TW': 'Chromium' },
  'fixed.capability.targetFirefox': { en: 'Firefox', 'zh-CN': 'Firefox', 'zh-TW': 'Firefox' },
  'fixed.capability.pacDirective': {
    en: 'PAC directive',
    'zh-CN': 'PAC 指令',
    'zh-TW': 'PAC 指令',
  },
  'fixed.capability.transport': { en: 'Transport', 'zh-CN': '传输', 'zh-TW': '傳輸' },
  'fixed.capability.transportSupported': {
    en: 'Supported',
    'zh-CN': '支持',
    'zh-TW': '支援',
  },
  'fixed.capability.authentication407': {
    en: 'HTTP 407 challenge',
    'zh-CN': 'HTTP 407 挑战认证',
    'zh-TW': 'HTTP 407 挑戰驗證',
  },
  'fixed.capability.authenticationUnsupported': {
    en: 'Not supported in browser-only PAC mode',
    'zh-CN': '浏览器纯 PAC 模式不支持',
    'zh-TW': '瀏覽器純 PAC 模式不支援',
  },
  'fixed.capability.dns': { en: 'DNS behavior', 'zh-CN': 'DNS 行为', 'zh-TW': 'DNS 行為' },
  'fixed.capability.dnsProtocolDefault': {
    en: 'Proxy protocol default',
    'zh-CN': '遵循代理协议默认行为',
    'zh-TW': '遵循代理通訊協定預設行為',
  },
  'fixed.capability.dnsClientIpv4': {
    en: 'Client-side IPv4 resolution',
    'zh-CN': '客户端解析，仅 IPv4',
    'zh-TW': '用戶端解析，僅 IPv4',
  },
  'fixed.capability.dnsProxySide': {
    en: 'Proxy-side resolution',
    'zh-CN': '代理端解析',
    'zh-TW': '代理端解析',
  },
  'fixed.capability.dnsBrowserDefault': {
    en: 'Firefox target default',
    'zh-CN': 'Firefox 目标默认行为',
    'zh-TW': 'Firefox 目標預設行為',
  },
  'fixed.capability.dnsTargetDependent': {
    en: 'Differs by browser target',
    'zh-CN': '因浏览器目标而异',
    'zh-TW': '依瀏覽器目標而異',
  },
  'fixed.capability.ftpRemoved': {
    en: 'The ftp:// row is preserved for original backup round-trip. Modern Chromium and Firefox no longer issue browser FTP requests, so this row does not route normal browser traffic.',
    'zh-CN': 'ftp:// 行仅为原版备份往返兼容而保留。现代 Chromium 与 Firefox 已不再发起浏览器 FTP 请求，因此此行不会路由普通浏览流量。',
    'zh-TW': 'ftp:// 列僅為原版備份往返相容而保留。現代 Chromium 與 Firefox 已不再發出瀏覽器 FTP 請求，因此此列不會路由一般瀏覽流量。',
  },
"""
if messages.read_text().count(anchor) != 1:
    raise SystemExit('Fixed capability strings anchor mismatch')
messages.write_text(messages.read_text().replace(anchor, strings + anchor))

# Component rendering matrix.
components = Path('apps/extension/src/component-rendering.component.spec.ts')
replace_once(
    components,
    """        generation: 0,
        disabled: false,
""",
    """        generation: 0,
        browserTarget: 'firefox',
        disabled: false,
""",
    'Fixed component browser target prop',
)
anchor = """    expect(body).toContain('Bypass List');
"""
assertions = """    expect(body).toContain('data-fixed-protocol-capabilities');
    expect(body).toContain('data-browser-target="firefox"');
    expect(body).toContain('data-proxy-protocol-capability="http"');
    expect(body).toContain('data-proxy-protocol-capability="https"');
    expect(body).toContain('data-proxy-protocol-capability="socks4"');
    expect(body).toContain('data-proxy-protocol-capability="socks5"');
    expect(body).toContain('data-fixed-ftp-capability');
    expect(body).toContain('Modern Chromium and Firefox no longer issue browser FTP requests');
"""
if components.read_text().count(anchor) != 1:
    raise SystemExit('Fixed component matrix assertions anchor mismatch')
components.write_text(components.read_text().replace(anchor, assertions + anchor))

# Chromium target and real Draft protocol matrix.
chromium = Path('scripts/e2e-chromium.mjs')
text = chromium.read_text()
anchor = """  const fixedTable = options.locator('[data-fixed-proxy-table]');
  await fixedTable.waitFor({ state: 'visible' });
"""
assertions = """  const fixedTable = options.locator('[data-fixed-proxy-table]');
  await fixedTable.waitFor({ state: 'visible' });
  const chromiumProtocolCapabilities = options.locator(
    '[data-fixed-protocol-capabilities][data-browser-target="chromium"]',
  );
  await chromiumProtocolCapabilities.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await chromiumProtocolCapabilities.locator('[data-proxy-protocol-capability]').count(),
    4,
  );
  assert.match(
    await chromiumProtocolCapabilities.locator('[data-fixed-ftp-capability]').innerText(),
    /不再发起浏览器 FTP 请求/u,
  );
"""
if text.count(anchor) != 1:
    raise SystemExit('Chromium capability table anchor mismatch')
text = text.replace(anchor, assertions)
creation_anchor = """  await creationOptions
    .getByLabel('虚拟情景模式目标', { exact: true })
    .selectOption({ label: 'Created Fixed' });

  const createdProfileIds = await assertEventuallyValue(async () => {
"""
creation_matrix = """  await creationOptions
    .getByLabel('虚拟情景模式目标', { exact: true })
    .selectOption({ label: 'Created Fixed' });

  await creationOptions.getByRole('button', { name: 'Created Fixed', exact: true }).click();
  const createdFixedTable = creationOptions.locator('[data-fixed-proxy-table]');
  await createdFixedTable.waitFor({ state: 'visible', timeout: 20_000 });
  await createdFixedTable.locator('[data-proxy-action="show-advanced"]').click();
  const createdProtocolMatrix = [
    ['fallback', 'http', 'matrix-http.invalid', '8080'],
    ['http', 'https', 'matrix-https.invalid', '8443'],
    ['https', 'socks4', 'matrix-socks4.invalid', '1080'],
    ['ftp', 'socks5', 'matrix-socks5.invalid', '1081'],
  ];
  for (const [scheme, protocol, host, port] of createdProtocolMatrix) {
    const row = createdFixedTable.locator(`[data-proxy-scheme="${scheme}"]`);
    await row.locator('[data-proxy-field="protocol"]').selectOption(protocol);
    await row.locator('[data-proxy-field="server"]').fill(host);
    await row.locator('[data-proxy-field="server"]').press('Tab');
    await row.locator('[data-proxy-field="port"]').fill(port);
    await row.locator('[data-proxy-field="port"]').press('Tab');
  }

  const createdProfileIds = await assertEventuallyValue(async () => {
"""
if text.count(creation_anchor) != 1:
    raise SystemExit('Chromium created protocol matrix anchor mismatch')
text = text.replace(creation_anchor, creation_matrix)
old_condition = """        profiles['Created Virtual'].targetRoute.profileId !== profiles['Created Fixed'].id
      ) {
"""
new_condition = """        profiles['Created Virtual'].targetRoute.profileId !== profiles['Created Fixed'].id ||
        profiles['Created Fixed'].proxyByScheme === undefined
      ) {
"""
if text.count(old_condition) != 1:
    raise SystemExit('Chromium created Fixed protocol validation anchor mismatch')
text = text.replace(old_condition, new_condition)
old_return = """      return Object.fromEntries(
        Object.entries(profiles).map(([name, profile]) => [name, profile.id]),
      );
"""
new_return = """      const fixed = profiles['Created Fixed'];
      const protocols = Object.fromEntries(
        Object.entries(fixed.proxyByScheme).map(([scheme, endpointId]) => [
          scheme,
          workflow.draft.proxyEndpoints.find((endpoint) => endpoint.id === endpointId)?.protocol,
        ]),
      );
      if (
        protocols.fallback !== 'http' ||
        protocols.http !== 'https' ||
        protocols.https !== 'socks4' ||
        protocols.ftp !== 'socks5'
      ) {
        return undefined;
      }
      return Object.fromEntries(
        Object.entries(profiles).map(([name, profile]) => [name, profile.id]),
      );
"""
if text.count(old_return) != 1:
    raise SystemExit('Chromium created protocol return anchor mismatch')
text = text.replace(old_return, new_return)
chromium.write_text(text)

# Firefox target matrix evidence.
firefox = Path('scripts/e2e-firefox.mjs')
anchor = """    await driver.wait(until.elementIsVisible(profileHeading), 15_000);
"""
assertions = """    await driver.wait(until.elementIsVisible(profileHeading), 15_000);
    const firefoxProtocolCapabilities = await driver.wait(
      until.elementLocated(
        By.css('[data-fixed-protocol-capabilities][data-browser-target="firefox"]'),
      ),
      15_000,
    );
    assert.equal(
      (await firefoxProtocolCapabilities.findElements(
        By.css('[data-proxy-protocol-capability]'),
      )).length,
      4,
    );
    assert.match(
      await firefoxProtocolCapabilities
        .findElement(By.css('[data-fixed-ftp-capability]'))
        .getText(),
      /不再發出瀏覽器 FTP 請求/u,
    );
    const protocolValues = await driver.executeScript(`
      return [...document.querySelector('[data-proxy-scheme="fallback"] [data-proxy-field="protocol"]').options]
        .map((option) => option.value)
        .filter(Boolean);
    `);
    assert.deepEqual(protocolValues, ['http', 'https', 'socks4', 'socks5']);
"""
if firefox.read_text().count(anchor) != 1:
    raise SystemExit('Firefox target capability anchor mismatch')
firefox.write_text(firefox.read_text().replace(anchor, assertions))

# Architecture decision for the resolved FTP and SOCKS boundary.
decisions = Path('docs/DECISIONS.md')
insert = """
## ADR-019 — Preserve original protocol choices while exposing modern browser limits

**Status:** Accepted

**Decision:** Fixed Profiles retain the original four URL slots (`fallback`, `http`, `https`, and `ftp`) and all four proxy protocol choices (HTTP, HTTPS, SOCKS4, and SOCKS5) in every row. Browser-target capability is reported separately. HTTP and HTTPS authentication uses the bounded 407 adapter; SOCKS credentials remain unsupported in PAC-first browser-only mode. The `ftp` slot is preserved for import/export and deterministic PAC round-trip, but modern Chromium and Firefox no longer issue browser FTP requests.

**Reason:** Original ZeroOmega deliberately allowed any proxy protocol in any URL row. Restricting the editor by an invented slot/protocol pairing would break compatibility. Conversely, showing all choices without the real authentication, DNS, and browser-request boundaries would imply capabilities the browser cannot deliver. Chromium SOCKS4 uses client-side IPv4 resolution, Chromium SOCKS5 uses proxy-side resolution, and Firefox retains target-specific behavior; these differences must remain visible rather than being hidden behind a false cross-browser abstraction.

**Alternatives considered:** Removing the FTP row was rejected because it would lose original backup information and change round-trip exports. Pretending FTP remains a live browser request scheme was rejected because both target browsers removed it. Adding a global Firefox `proxy.onRequest` listener solely to recover optional SOCKS credentials or DNS flags was rejected under ADR-005 because it would reintroduce request-time proxy decisions. Restricting HTTP rows to HTTP proxies and HTTPS rows to HTTPS proxies was rejected because it contradicts the original controller and browser proxy model.

**Consequences:** The PAC compiler owns a typed protocol/target matrix and emits stable warnings for cross-target SOCKS DNS differences and legacy-inactive FTP slots. The Fixed editor displays the exact target, PAC directive, transport, authentication, and DNS behavior. SOCKS credentials fail before browser mutation. C-05 is resolved as a modern-browser capability decision, and C-09 is accepted only with unit, compiler, component, Chromium, and Firefox evidence.
"""
marker = '\n## ADR template\n'
if decisions.read_text().count(marker) != 1:
    raise SystemExit('ADR-019 insertion anchor mismatch')
decisions.write_text(decisions.read_text().replace(marker, insert + marker))

# Canonical matrix and stable records.
audit = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith('| C-05 |'):
        lines[index] = '| C-05 | FTP scheme              | `proxy_scheme.jade`                   | 有该行                                                       | UNCERTAIN  | DONE     | N/A      | ADR-019：保留 ftp:// 行及导入/导出/PAC 往返；现代 Chromium/Firefox 已移除浏览器 FTP 请求，故明确标记为 legacy-inactive，不宣称真实浏览流量；双浏览器 UI 与编译器能力矩阵固定该边界 | 保持 ADR 与目标回归 |'
    if line.startswith('| C-09 |'):
        lines[index] = '| C-09 | 协议能力限制说明       | 原版行为 + 浏览器目标证据              | 不假设所有协议/认证/DNS 在目标间完全等价                       | MUST_MATCH | DONE     | COMPLETE | typed 协议×目标×槽位矩阵覆盖 PROXY/HTTPS/SOCKS4/SOCKS5、HTTP(S) 407、SOCKS 认证拒绝、Chromium/Firefox DNS 差异及 FTP 请求移除；Fixed UI、编译器、单测与双浏览器 E2E 已闭环 | 保持矩阵与双浏览器回归 |'
for index, line in enumerate(lines):
    if line.startswith('- **仍开放的 MUST_MATCH：3 项。**'):
        lines[index] = '- **仍开放的 MUST_MATCH：2 项。** D-04 条件类型矩阵、D-05 条件字段矩阵。'
    if line.startswith('- **UNCERTAIN：1 项。**'):
        lines[index] = '- **UNCERTAIN 开放项：0。** C-05 已通过 ADR-019 解析为“保留兼容数据，但现代浏览器请求能力已移除”。'
record_index = next(
    (
        index
        for index, line in enumerate(lines)
        if line.startswith('| 2026-07-29 | 恢复原版 Profile 页头 Rename')
    ),
    -1,
)
if record_index == -1:
    raise SystemExit('matrix protocol update-record anchor missing')
lines.insert(
    record_index + 1,
    '| 2026-07-29 | 完成代理协议×浏览器目标×URL 槽位能力矩阵、SOCKS DNS/认证边界及现代 FTP 请求移除决定；C-05/C-09 关闭，开放 MUST_MATCH 降至 2 项 |',
)
audit.write_text('\n'.join(lines) + '\n')

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
text = text.replace(
    '- Fixed fallback/HTTP/HTTPS/FTP table, advanced protocols, bypass, inherited placeholders, and background-owned credentials.\n',
    '- Fixed fallback/HTTP/HTTPS/FTP table, all original protocol choices, target-specific transport/authentication/DNS capability matrix, legacy-inactive FTP request explanation, bypass, inherited placeholders, and background-owned credentials.\n',
)
text = text.replace(
    'The canonical matrix contains 126 rows: `DONE=120`, `PARTIAL=6`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.',
    'The canonical matrix contains 126 rows: `DONE=122`, `PARTIAL=4`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.',
)
text = text.replace(
    """Three release-blocking `MUST_MATCH` rows remain:

1. C-09 — protocol/target capability matrix.
2. D-04 — Switch condition-type matrix acceptance.
3. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
    """Two release-blocking `MUST_MATCH` rows remain:

1. D-04 — Switch condition-type matrix acceptance.
2. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
)
text = text.replace(
    """Additional open rows:

- C-05 remains `UNCERTAIN` for modern Chromium/Firefox FTP behavior.
- A-14 and I-11 remain non-blocking visual `REFERENCE` rows.
""",
    """Additional open rows:

- A-14 and I-11 remain non-blocking visual `REFERENCE` rows.
""",
)
text = text.replace(
    'Proceed to C-09 protocol/target capability acceptance.',
    'Proceed to D-04 and D-05 Switch condition matrix acceptance.',
)
status.write_text(text)

checkpoint = Path('docs/MILESTONE_8_SESSION_7_CHECKPOINT.md')
text = checkpoint.read_text()
text = text.replace(
    'The canonical matrix now honestly reports `DONE=120`, `PARTIAL=6`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.',
    'The canonical matrix now honestly reports `DONE=122`, `PARTIAL=4`, `MISSING=0`, `BROKEN=0`, `UNVERIFIED=0`.',
)
section_anchor = '## Direction and scope assessment\n'
section = """### Proxy protocol and browser-target capability acceptance

- A typed PAC-compiler matrix covers every original protocol across Chromium, Firefox, and cross-browser analysis.
- HTTP and HTTPS map to `PROXY` and `HTTPS` and use the bounded 407 authentication adapter.
- SOCKS4 and SOCKS5 map to their native PAC directives, reject credentials before browser mutation, and expose target-specific DNS behavior rather than claiming false cross-browser identity.
- All original protocol choices remain available in every Fixed row; the URL slot and proxy transport remain separate concepts as in original ZeroOmega.
- The original `ftp` slot is preserved for import/export and deterministic PAC round-trip, while ADR-019 records that modern Chromium and Firefox no longer issue browser FTP requests.
- Unit, compiler, component, Chromium, Firefox, and permanent parity guards cover the matrix.
- C-05 and C-09 are `DONE`; release-blocking `MUST_MATCH` rows fall from three to two.

"""
if text.count(section_anchor) != 1:
    raise SystemExit('checkpoint protocol section anchor mismatch')
text = text.replace(section_anchor, section + section_anchor)
text = text.replace('Three release-blocking `MUST_MATCH` rows remain:', 'Two release-blocking `MUST_MATCH` rows remain:')
text = text.replace(
    """1. C-09 — protocol/target capability matrix.
2. D-04 — Switch condition-type matrix acceptance.
3. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
    """1. D-04 — Switch condition-type matrix acceptance.
2. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
)
text = text.replace(
    'C-05 remains `UNCERTAIN` for modern FTP behavior. A-14 and I-11 remain non-blocking visual `REFERENCE` rows.',
    'A-14 and I-11 remain non-blocking visual `REFERENCE` rows.',
)
checkpoint.write_text(text)

candidate = Path('docs/MILESTONE_8_RELEASE_CANDIDATE.md')
text = candidate.read_text()
text = text.replace(
    '- original profile-header Rename action, independent validation dialog, and attached Rule List/source rename transaction;\n',
    '- original profile-header Rename action, independent validation dialog, and attached Rule List/source rename transaction;\n- typed proxy protocol/browser-target/slot capability matrix, SOCKS authentication and DNS boundaries, and legacy-inactive FTP request decision;\n',
)
text = text.replace(
    """Three release-blocking `MUST_MATCH` rows remain:

1. C-09 — protocol/target capability matrix.
2. D-04 — Switch condition-type matrix acceptance.
3. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
    """Two release-blocking `MUST_MATCH` rows remain:

1. D-04 — Switch condition-type matrix acceptance.
2. D-05 — condition-specific fields and Draft/Apply browser acceptance.
""",
)
text = text.replace(
    'C-05 remains `UNCERTAIN` for modern Chromium/Firefox FTP behavior. A-14 and I-11 remain non-blocking visual `REFERENCE` rows.',
    'A-14 and I-11 remain non-blocking visual `REFERENCE` rows.',
)
candidate.write_text(text)

graph = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
graph.write_text(
    graph.read_text()
    + """
### Fixed proxy protocol and browser-target capability matrix

- Original Fixed Profile rows are URL routing slots, not restrictions on proxy transport. Every slot retains HTTP, HTTPS, SOCKS4, and SOCKS5 choices.
- PAC directives are stable: HTTP → `PROXY`, HTTPS → `HTTPS`, SOCKS4 → `SOCKS4`, SOCKS5 → `SOCKS5`.
- HTTP/HTTPS credentials are external to PAC and handled only by the bounded real-407 adapter. SOCKS credentials are rejected before browser proxy mutation.
- SOCKS DNS semantics remain target-specific: Chromium SOCKS4 resolves client-side and is IPv4-only; Chromium SOCKS5 resolves through the proxy; Firefox keeps its browser-target default. Cross-browser analysis labels these semantics target-dependent.
- The `ftp` slot is preserved as legacy configuration data and deterministic PAC output. Modern Chromium and Firefox do not produce ordinary browser FTP requests, so the slot is explicitly legacy-inactive rather than removed or falsely advertised as live.
- ADR-019, compiler warnings, the Fixed capability table, unit tests, compiler evaluation, and Chromium/Firefox E2E jointly own C-05 and C-09 acceptance.
"""
)

# Permanent guards.
validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
read_anchor = 'const failures = [];\n'
reads = """const [proxyCapabilities, pacCapabilities, fixedEditor, browserTargetCapabilities, componentRendering] =
  await Promise.all([
    readFile('packages/pac-compiler/src/proxy-capabilities.ts', 'utf8'),
    readFile('packages/pac-compiler/src/capabilities.ts', 'utf8'),
    readFile('apps/extension/src/entrypoints/options/FixedProfileEditor.svelte', 'utf8'),
    readFile('apps/extension/src/lib/browser-target-capabilities.ts', 'utf8'),
    readFile('apps/extension/src/component-rendering.component.spec.ts', 'utf8'),
  ]);

"""
if text.count(read_anchor) != 1:
    raise SystemExit('protocol validator read anchor mismatch')
text = text.replace(read_anchor, reads + read_anchor)
guard_anchor = "requireAll('Profile Rename workflow operation', profileOperations, [\n"
guards = r"""requireAll('proxy protocol target matrix', proxyCapabilities, [
  "PROXY_PROTOCOLS",
  "FIXED_PROXY_SLOTS",
  "'web-request-407'",
  "'client-ipv4-only'",
  "'proxy-side'",
  "'browser-target-default'",
  "'browser-request-removed'",
]);
requireAll('PAC protocol capability enforcement', pacCapabilities, [
  'fixed-slot.ftp-browser-request-removed',
  'endpoint.socks-authentication-unsupported',
  'dns-target-dependent',
]);
requireAll('Fixed protocol capability UI', fixedEditor, [
  'data-fixed-protocol-capabilities',
  'data-browser-target',
  'data-proxy-protocol-capability',
  'data-fixed-ftp-capability',
  'fixedProxySlotCapability',
  'proxyProtocolCapability',
]);
requireAll('browser family capability', browserTargetCapabilities, [
  "target: 'chromium' | 'firefox'",
  'browser_specific_settings',
]);
requireAll('protocol capability component rendering', componentRendering, [
  'data-fixed-protocol-capabilities',
  'data-browser-target="firefox"',
  'browser FTP requests',
]);
requireAll('protocol capability Chromium acceptance', chromiumE2e, [
  'data-fixed-protocol-capabilities',
  'matrix-socks4.invalid',
  'matrix-socks5.invalid',
  "protocols.ftp !== 'socks5'",
]);
requireAll('protocol capability Firefox acceptance', firefoxE2e, [
  'data-fixed-protocol-capabilities',
  'data-browser-target="firefox"',
  "['http', 'https', 'socks4', 'socks5']",
]);
requireAll('FTP and protocol decision', decisions, [
  'ADR-019',
  'browser FTP requests',
  'SOCKS credentials remain unsupported',
]);

const ftpRow = audit.split('\n').find((line) => line.startsWith('| C-05 '));
const protocolRow = audit.split('\n').find((line) => line.startsWith('| C-09 '));
if (!ftpRow || !ftpRow.includes('| DONE') || !ftpRow.includes('ADR-019')) {
  failures.push('C-05 must remain DONE with ADR-019 modern FTP resolution');
}
if (!protocolRow || !protocolRow.includes('| DONE') || !protocolRow.includes('Chromium/Firefox')) {
  failures.push('C-09 must remain DONE with dual-browser protocol matrix evidence');
}

"""
if text.count(guard_anchor) != 1:
    raise SystemExit('protocol validator guard anchor mismatch')
validator.write_text(text.replace(guard_anchor, guards + guard_anchor))
