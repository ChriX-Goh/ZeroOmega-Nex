import { describe, expect, it } from 'vitest';

import { parseExternalProfileCandidate } from './external-profile.js';

function chromium(value: unknown) {
  return {
    family: 'chromium' as const,
    controlLevel: 'controlled-by-this-extension' as const,
    value: value as never,
  };
}

describe('external Chromium proxy profile conversion', () => {
  it('maps auto detect and PAC URL/inline configurations', () => {
    expect(parseExternalProfileCandidate(chromium({ mode: 'auto_detect' }))).toEqual({
      kind: 'pac',
      source: { kind: 'url', url: 'http://wpad/wpad.dat' },
    });
    expect(
      parseExternalProfileCandidate(
        chromium({ mode: 'pac_script', pacScript: { url: 'https://pac.example/p.pac' } }),
      ),
    ).toEqual({ kind: 'pac', source: { kind: 'url', url: 'https://pac.example/p.pac' } });
    expect(
      parseExternalProfileCandidate(
        chromium({
          mode: 'pac_script',
          pacScript: { data: '  function FindProxyForURL(){return "DIRECT";}  ' },
        }),
      ),
    ).toEqual({
      kind: 'pac',
      source: { kind: 'inline', script: 'function FindProxyForURL(){return "DIRECT";}' },
    });
  });

  it('maps single and per-scheme fixed servers with bypass normalization', () => {
    expect(
      parseExternalProfileCandidate(
        chromium({
          mode: 'fixed_servers',
          rules: {
            proxyForHttp: { scheme: 'http', host: 'http.example', port: 8080 },
            proxyForHttps: { scheme: 'https', host: 'secure.example', port: 8443 },
            proxyForFtp: { scheme: 'socks4', host: 'ftp.example', port: 1080 },
            fallbackProxy: { scheme: 'http', host: 'ignored.example', port: 3128 },
            singleProxy: { scheme: 'socks5', host: 'fallback.example', port: 1081 },
            bypassList: ['<local>', 'localhost', '127.0.0.1', '*.internal', '*.internal'],
          },
        }),
      ),
    ).toEqual({
      kind: 'fixed',
      proxyByScheme: {
        http: { protocol: 'http', host: 'http.example', port: 8080 },
        https: { protocol: 'https', host: 'secure.example', port: 8443 },
        ftp: { protocol: 'socks4', host: 'ftp.example', port: 1080 },
        fallback: { protocol: 'socks5', host: 'fallback.example', port: 1081 },
      },
      bypass: ['<local>', '*.internal'],
    });
  });

  it('rejects built-in, Firefox, malformed, and unsupported QUIC configurations', () => {
    expect(parseExternalProfileCandidate(chromium({ mode: 'direct' }))).toBeUndefined();
    expect(parseExternalProfileCandidate(chromium({ mode: 'system' }))).toBeUndefined();
    expect(
      parseExternalProfileCandidate({
        family: 'firefox',
        controlLevel: 'controlled-by-this-extension',
        value: { proxyType: 'manual' },
      }),
    ).toBeUndefined();
    expect(
      parseExternalProfileCandidate(
        chromium({
          mode: 'fixed_servers',
          rules: { singleProxy: { scheme: 'quic', host: 'proxy.example', port: 443 } },
        }),
      ),
    ).toBeUndefined();
  });
});
