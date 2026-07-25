import type { ProxyEndpoint } from '@zeroomega-nex/profile-spec';

function isAscii(value: string): boolean {
  for (const character of value) {
    if (character.codePointAt(0)! > 0x7f) return false;
  }
  return true;
}

export function pacStringLiteral(value: string): string {
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new TypeError('PAC string value cannot be encoded');
  return encoded.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function normalizePacProxyHost(host: string): string {
  const trimmed = host.trim();
  if (!trimmed || /[\s;"'\\]/.test(trimmed)) {
    throw new TypeError(`invalid PAC proxy host ${JSON.stringify(host)}`);
  }

  const unbracketed =
    trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1) : trimmed;
  if (unbracketed.includes(':')) return `[${unbracketed}]`;

  const normalized = new URL(`http://${unbracketed}/`).hostname;
  if (!normalized || !isAscii(normalized)) {
    throw new TypeError(`PAC proxy host is not ASCII ${JSON.stringify(host)}`);
  }
  return normalized;
}

export function pacDirective(endpoint: ProxyEndpoint): string {
  const host = normalizePacProxyHost(endpoint.host);
  const prefix =
    endpoint.protocol === 'http'
      ? 'PROXY'
      : endpoint.protocol === 'https'
        ? 'HTTPS'
        : endpoint.protocol === 'socks4'
          ? 'SOCKS4'
          : 'SOCKS5';
  return `${prefix} ${host}:${endpoint.port}`;
}
