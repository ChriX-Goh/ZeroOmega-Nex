import type { ProxyEndpoint } from '@zeroomega-nex/profile-spec';

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
export const FIXED_PROXY_SLOTS: readonly FixedProxySlot[] = ['fallback', 'http', 'https', 'ftp'];

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
  target: PacTarget,
): FixedProxySlotCapability {
  void target;
  return slot === 'ftp'
    ? { slot, request: 'browser-request-removed', semantics: 'unsupported' }
    : { slot, request: 'active', semantics: 'exact' };
}
