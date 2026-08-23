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

  it('rejects internal URLs and resolves an explicit loading tab from pendingUrl', async () => {
    expect(inspectCurrentSiteUrl('chrome://settings/')).toBeUndefined();
    expect(inspectCurrentSiteUrl('about:blank')).toBeUndefined();
    let getCount = 0;
    await expect(
      inspectActiveCurrentSite(42, {
        tabs: {
          query: async () => [],
          get: async (tabId) => {
            getCount += 1;
            return {
              id: tabId,
              url: 'about:blank',
              pendingUrl: 'https://sub.example.com/',
              status: 'loading',
            };
          },
        },
      }),
    ).resolves.toMatchObject({ tabId: 42, domain: 'example.com', subdomain: 'sub' });
    expect(getCount).toBe(1);
  });

  it('rechecks a loading tab until a supported URL becomes available', async () => {
    let getCount = 0;
    await expect(
      inspectActiveCurrentSite(7, {
        tabs: {
          query: async () => [],
          get: async (tabId) => {
            getCount += 1;
            return getCount === 1
              ? { id: tabId, url: 'about:blank', status: 'loading' }
              : {
                  id: tabId,
                  url: 'https://www.dev.example.co.uk/current-site',
                  status: 'complete',
                };
          },
        },
      }),
    ).resolves.toMatchObject({
      tabId: 7,
      domain: 'example.co.uk',
      subdomain: 'www.dev',
    });
    expect(getCount).toBe(2);
  });
});
