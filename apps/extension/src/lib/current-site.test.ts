import { describe, expect, it } from 'vitest';

import {
  currentSiteDomainForLevel,
  inspectActiveCurrentSite,
  inspectCurrentSiteUrl,
  suggestCurrentSiteCondition,
} from './current-site';

describe('Popup current-site inspection', () => {
  it('uses the public suffix list for base domains and cycles subdomain scope', () => {
    const site = inspectCurrentSiteUrl('https://www.dev.example.co.uk/path');
    expect(site).toMatchObject({
      hostname: 'www.dev.example.co.uk',
      domain: 'example.co.uk',
      subdomain: 'www.dev',
      isIp: false,
    });
    if (!site) throw new Error('missing current site');
    expect(currentSiteDomainForLevel(site, 0)).toBe('example.co.uk');
    expect(currentSiteDomainForLevel(site, 1)).toBe('www.dev.example.co.uk');
    expect(currentSiteDomainForLevel(site, 2)).toBe('dev.example.co.uk');
    expect(currentSiteDomainForLevel(site, 3)).toBe('example.co.uk');
    expect(suggestCurrentSiteCondition(site, 'host-wildcard')).toEqual({
      kind: 'host-wildcard',
      pattern: '*.example.co.uk',
    });
    expect(suggestCurrentSiteCondition(site, 'url-regex')).toEqual({
      kind: 'url-regex',
      pattern: '://([^/.]+\\.)*example\\.co\\.uk(:\\d+)?/',
    });
  });

  it('uses exact host suggestions for IPv4 and bracketed IPv6', () => {
    const ipv4 = inspectCurrentSiteUrl('http://127.0.0.1:8080/');
    const ipv6 = inspectCurrentSiteUrl('http://[2001:db8::1]/');
    if (!ipv4 || !ipv6) throw new Error('missing IP site');
    expect(suggestCurrentSiteCondition(ipv4, 'host-wildcard')).toEqual({
      kind: 'host-wildcard',
      pattern: '127.0.0.1',
    });
    expect(suggestCurrentSiteCondition(ipv6, 'url-wildcard')).toEqual({
      kind: 'url-wildcard',
      pattern: '*://[2001:db8::1]/*',
    });
  });

  it('rejects extension/internal URLs and supports an explicit active tab ID', async () => {
    expect(inspectCurrentSiteUrl('chrome://settings/')).toBeUndefined();
    expect(inspectCurrentSiteUrl('about:blank')).toBeUndefined();
    await expect(
      inspectActiveCurrentSite(42, {
        tabs: {
          query: async () => [],
          get: async (tabId) => ({ id: tabId, url: 'https://sub.example.com/' }),
        },
      }),
    ).resolves.toMatchObject({ tabId: 42, domain: 'example.com', subdomain: 'sub' });
  });
});
