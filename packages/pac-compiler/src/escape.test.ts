import type { ProxyEndpoint } from '@zeroomega-nex/profile-spec';
import { describe, expect, it } from 'vitest';

import { normalizePacProxyHost, pacDirective, pacStringLiteral } from './escape.js';

describe('PAC output escaping', () => {
  it('encodes quotes, slashes, newlines, and line separators as one JavaScript string literal', () => {
    const source = `quote" slash\\ newline\nseparator\u2028paragraph\u2029`;
    const literal = pacStringLiteral(source);
    const decoded = new Function(`return ${literal};`)() as unknown;
    expect(decoded).toBe(source);
    expect(literal).not.toContain('\u2028');
    expect(literal).not.toContain('\u2029');
  });

  it('normalizes IDN proxy hosts to ASCII and brackets IPv6 endpoints', () => {
    expect(normalizePacProxyHost('例子.测试')).toBe('xn--fsqu00a.xn--0zwm56d');
    expect(normalizePacProxyHost('[2001:db8::1]')).toBe('[2001:db8::1]');
    expect(normalizePacProxyHost('2001:db8::1')).toBe('[2001:db8::1]');
  });

  it('rejects hosts that could inject another PAC directive', () => {
    for (const host of ['proxy.invalid; DIRECT', 'proxy.invalid\nDIRECT', 'proxy invalid']) {
      expect(() => normalizePacProxyHost(host), host).toThrow(TypeError);
    }
  });

  it.each([
    ['http', 'PROXY proxy.example.invalid:8080'],
    ['https', 'HTTPS proxy.example.invalid:8443'],
    ['socks4', 'SOCKS4 proxy.example.invalid:1080'],
    ['socks5', 'SOCKS5 proxy.example.invalid:1080'],
  ] as const)('encodes %s endpoints as %s', (protocol, expected) => {
    const endpoint: ProxyEndpoint = {
      id: `endpoint-${protocol}`,
      name: protocol,
      protocol,
      host: 'proxy.example.invalid',
      port: protocol === 'https' ? 8443 : protocol === 'http' ? 8080 : 1080,
    };
    expect(pacDirective(endpoint)).toBe(expected);
  });
});
