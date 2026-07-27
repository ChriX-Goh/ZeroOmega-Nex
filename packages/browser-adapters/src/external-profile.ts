import type { JsonValue } from '@zeroomega-nex/profile-spec';

import type { PlatformProxyState } from './contracts.js';
import { recordValue, stringProperty } from './platform-utils.js';

export type ExternalProxyProtocol = 'http' | 'https' | 'socks4' | 'socks5';
export type ExternalProxyScheme = 'fallback' | 'http' | 'https' | 'ftp';

export interface ExternalProxyServer {
  readonly protocol: ExternalProxyProtocol;
  readonly host: string;
  readonly port: number;
}

export type ExternalProfileCandidate =
  | {
      readonly kind: 'fixed';
      readonly proxyByScheme: Readonly<Partial<Record<ExternalProxyScheme, ExternalProxyServer>>>;
      readonly bypass: readonly string[];
    }
  | {
      readonly kind: 'pac';
      readonly source:
        | { readonly kind: 'url'; readonly url: string }
        | { readonly kind: 'inline'; readonly script: string };
    };

const LOCAL_HOST_EQUIVALENTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function integerProperty(
  value: Record<string, JsonValue> | undefined,
  key: string,
): number | undefined {
  const candidate = value?.[key];
  return typeof candidate === 'number' && Number.isInteger(candidate) ? candidate : undefined;
}

function parseProxyServer(value: JsonValue | undefined): ExternalProxyServer | undefined {
  if (value === undefined) return undefined;
  const server = recordValue(value);
  const host = stringProperty(server, 'host')?.trim();
  const port = integerProperty(server, 'port');
  const scheme = stringProperty(server, 'scheme') ?? 'http';
  if (!host || port === undefined || port < 1 || port > 65_535) return undefined;
  if (scheme !== 'http' && scheme !== 'https' && scheme !== 'socks4' && scheme !== 'socks5') {
    return undefined;
  }
  return { protocol: scheme, host, port };
}

function parseBypassList(rules: Record<string, JsonValue>): readonly string[] {
  const source = rules.bypassList;
  if (!Array.isArray(source)) return [];
  const seen = new Set<string>();
  const values: string[] = [];
  for (const entry of source) {
    if (typeof entry !== 'string') continue;
    const pattern = entry.trim();
    if (!pattern || seen.has(pattern)) continue;
    seen.add(pattern);
    values.push(pattern);
  }
  if (seen.has('<local>')) {
    return values.filter(
      (pattern) => pattern === '<local>' || !LOCAL_HOST_EQUIVALENTS.has(pattern),
    );
  }
  return values;
}

function parseFixed(value: Record<string, JsonValue>): ExternalProfileCandidate | undefined {
  const rawRules = value.rules;
  if (rawRules === undefined) return undefined;
  const rules = recordValue(rawRules);
  if (!rules) return undefined;
  const mappings: readonly [ExternalProxyScheme, string][] = [
    ['http', 'proxyForHttp'],
    ['https', 'proxyForHttps'],
    ['ftp', 'proxyForFtp'],
    ['fallback', 'fallbackProxy'],
  ];
  const proxyByScheme: Partial<Record<ExternalProxyScheme, ExternalProxyServer>> = {};
  for (const [scheme, property] of mappings) {
    if (rules[property] === undefined) continue;
    const parsed = parseProxyServer(rules[property]);
    if (!parsed) return undefined;
    proxyByScheme[scheme] = parsed;
  }
  if (rules.singleProxy !== undefined) {
    const parsed = parseProxyServer(rules.singleProxy);
    if (!parsed) return undefined;
    proxyByScheme.fallback = parsed;
  }
  if (Object.keys(proxyByScheme).length === 0) return undefined;
  return { kind: 'fixed', proxyByScheme, bypass: parseBypassList(rules) };
}

function parsePac(value: Record<string, JsonValue>): ExternalProfileCandidate | undefined {
  const rawPac = value.pacScript;
  if (rawPac === undefined) return undefined;
  const pac = recordValue(rawPac);
  if (!pac) return undefined;
  const url = stringProperty(pac, 'url')?.trim();
  if (url) return { kind: 'pac', source: { kind: 'url', url } };
  const script = stringProperty(pac, 'data')?.trim();
  return script ? { kind: 'pac', source: { kind: 'inline', script } } : undefined;
}

export function parseExternalProfileCandidate(
  state: PlatformProxyState,
): ExternalProfileCandidate | undefined {
  if (state.family !== 'chromium') return undefined;
  const value = recordValue(state.value);
  const mode = stringProperty(value, 'mode');
  switch (mode) {
    case 'direct':
    case 'system':
      return undefined;
    case 'auto_detect':
      return { kind: 'pac', source: { kind: 'url', url: 'http://wpad/wpad.dat' } };
    case 'pac_script':
      return value ? parsePac(value) : undefined;
    case 'fixed_servers':
      return value ? parseFixed(value) : undefined;
    default:
      return undefined;
  }
}
