import { parse } from 'tldts';
import { browser } from 'wxt/browser';

import type { PopupSiteCondition } from '@zeroomega-nex/profile-workflow';

export type PopupConditionKind = PopupSiteCondition['kind'];

export interface CurrentSiteInfo {
  readonly tabId?: number;
  readonly url: string;
  readonly hostname: string;
  readonly domain: string;
  readonly subdomain: string;
  readonly isIp: boolean;
}

interface CurrentSiteTab {
  readonly id?: number;
  readonly url?: string;
}

interface CurrentSiteBrowserApi {
  readonly tabs: {
    query(queryInfo: {
      readonly active: boolean;
      readonly currentWindow: boolean;
    }): Promise<readonly CurrentSiteTab[]>;
    get(tabId: number): Promise<CurrentSiteTab>;
  };
}

const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:', 'ftp:']);

function unbracket(hostname: string): string {
  return hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, hostname.length - 1)
    : hostname;
}

export function inspectCurrentSiteUrl(url: string, tabId?: number): CurrentSiteInfo | undefined {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return undefined;
  }
  if (!SUPPORTED_PROTOCOLS.has(parsedUrl.protocol) || !parsedUrl.hostname) return undefined;
  const hostname = unbracket(parsedUrl.hostname.toLowerCase());
  const parsedDomain = parse(hostname, {
    extractHostname: false,
    allowPrivateDomains: true,
  });
  const isIp = parsedDomain.isIp === true;
  const domain = isIp ? hostname : (parsedDomain.domain ?? hostname);
  const subdomain = isIp || domain === hostname ? '' : (parsedDomain.subdomain ?? '');
  return {
    ...(tabId === undefined ? {} : { tabId }),
    url: parsedUrl.href,
    hostname,
    domain,
    subdomain,
    isIp,
  };
}

export async function inspectActiveCurrentSite(
  explicitTabId?: number,
  api: CurrentSiteBrowserApi = browser as unknown as CurrentSiteBrowserApi,
): Promise<CurrentSiteInfo | undefined> {
  const tab =
    explicitTabId === undefined
      ? (await api.tabs.query({ active: true, currentWindow: true }))[0]
      : await api.tabs.get(explicitTabId);
  return tab?.url ? inspectCurrentSiteUrl(tab.url, tab.id) : undefined;
}

export function currentSiteDomainForLevel(site: CurrentSiteInfo, level: number): string {
  if (site.isIp || !site.subdomain) return site.domain;
  const labels = site.subdomain.split('.').filter(Boolean);
  const normalized = ((level % (labels.length + 1)) + labels.length + 1) % (labels.length + 1);
  return normalized === 0 ? site.domain : [...labels.slice(normalized - 1), site.domain].join('.');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function suggestCurrentSiteCondition(
  site: CurrentSiteInfo,
  kind: PopupConditionKind,
  subdomainLevel = 0,
): PopupSiteCondition {
  const scopedDomain = currentSiteDomainForLevel(site, subdomainLevel);
  const displayHost = site.isIp && scopedDomain.includes(':') ? `[${scopedDomain}]` : scopedDomain;
  const escaped = escapeRegex(displayHost);
  switch (kind) {
    case 'host-wildcard':
      return { kind, pattern: site.isIp ? displayHost : `*.${scopedDomain}` };
    case 'host-regex':
      return { kind, pattern: site.isIp ? `^${escaped}$` : `(^|\\.)${escapeRegex(scopedDomain)}$` };
    case 'url-wildcard':
      return { kind, pattern: site.isIp ? `*://${displayHost}/*` : `*://*.${scopedDomain}/*` };
    case 'url-regex':
      return {
        kind,
        pattern: site.isIp
          ? `://${escaped}(:\\d+)?/`
          : `://([^/.]+\\.)*${escapeRegex(scopedDomain)}(:\\d+)?/`,
      };
    case 'keyword':
      return { kind, pattern: scopedDomain, httpOnly: true };
  }
}
