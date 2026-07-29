import { describe, expect, it } from 'vitest';

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
      expect(
        PROXY_PROTOCOLS.map((protocol) => proxyProtocolCapability(protocol, target).pacDirective),
      ).toEqual(['PROXY', 'HTTPS', 'SOCKS4', 'SOCKS5']);
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
