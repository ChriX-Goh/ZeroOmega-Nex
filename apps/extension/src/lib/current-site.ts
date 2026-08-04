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
  readonly pendingUrl?: string;
  readonly status?: 'loading' | 'complete';
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
const LOADING_TAB_RETRY_COUNT = 20;
const LOADING_TAB_RETRY_DELAY_MS = 50;

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

function inspectCurrentSiteTab(tab: CurrentSiteTab | undefined): CurrentSiteInfo | undefined {
  if (!tab) return undefined;
  for (const url of [tab.pendingUrl, tab.url]) {
    if (!url) continue;
    const site = inspectCurrentSiteUrl(url, tab.id);
    if (site) return site;
  }
  return undefined;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

export async function inspectActiveCurrentSite(
  explicitTabId?: number,
  api: CurrentSiteBrowserApi = browser as unknown as CurrentSiteBrowserApi,
): Promise<CurrentSiteInfo | undefined> {
  let tab =
    explicitTabId === undefined
      ? (await api.tabs.query({ active: true, currentWindow: true }))[0]
      : await api.tabs.get(explicitTabId);
  let site = inspectCurrentSiteTab(tab);
  if (site || tab?.status !== 'loading' || tab.id === undefined) return site;

  const tabId = tab.id;
  for (let attempt = 0; attempt < LOADING_TAB_RETRY_COUNT; attempt += 1) {
    await delay(LOADING_TAB_RETRY_DELAY_MS);
    tab = await api.tabs.get(tabId);
    site = inspectCurrentSiteTab(tab);
    if (site || tab.status !== 'loading') return site;
  }
  return undefined;
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
