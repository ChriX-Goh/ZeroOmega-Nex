export interface ParsedIpLiteral {
  readonly family: 4 | 6;
  readonly value: bigint;
}

function normalizeIpText(input: string): string {
  const trimmed = input.trim();
  const unbracketed =
    trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1) : trimmed;
  const zoneIndex = unbracketed.indexOf('%');
  return zoneIndex === -1 ? unbracketed : unbracketed.slice(0, zoneIndex);
}

function parseIpv4Parts(input: string): readonly number[] | undefined {
  const parts = input.split('.');
  if (parts.length !== 4) return undefined;

  const values: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return undefined;
    const value = Number(part);
    if (!Number.isInteger(value) || value < 0 || value > 255) return undefined;
    values.push(value);
  }
  return values;
}

function parseIpv4(input: string): ParsedIpLiteral | undefined {
  const parts = parseIpv4Parts(input);
  if (!parts) return undefined;

  let value = 0n;
  for (const part of parts) value = (value << 8n) | BigInt(part);
  return { family: 4, value };
}

function parseIpv6Segment(segment: string): readonly number[] | undefined {
  if (segment.includes('.')) {
    const ipv4 = parseIpv4Parts(segment);
    if (!ipv4) return undefined;
    return [(ipv4[0]! << 8) | ipv4[1]!, (ipv4[2]! << 8) | ipv4[3]!];
  }

  if (!/^[0-9a-f]{1,4}$/i.test(segment)) return undefined;
  return [Number.parseInt(segment, 16)];
}

function parseIpv6Side(input: string): readonly number[] | undefined {
  if (!input) return [];
  const values: number[] = [];
  for (const segment of input.split(':')) {
    if (!segment) return undefined;
    const parsed = parseIpv6Segment(segment);
    if (!parsed) return undefined;
    values.push(...parsed);
  }
  return values;
}

function parseIpv6(input: string): ParsedIpLiteral | undefined {
  const pieces = input.split('::');
  if (pieces.length > 2) return undefined;

  const left = parseIpv6Side(pieces[0] ?? '');
  const right = parseIpv6Side(pieces[1] ?? '');
  if (!left || !right) return undefined;

  let groups: readonly number[];
  if (pieces.length === 1) {
    if (left.length !== 8) return undefined;
    groups = left;
  } else {
    const omitted = 8 - left.length - right.length;
    if (omitted < 1) return undefined;
    groups = [...left, ...Array<number>(omitted).fill(0), ...right];
  }

  if (groups.length !== 8) return undefined;
  let value = 0n;
  for (const group of groups) value = (value << 16n) | BigInt(group);
  return { family: 6, value };
}

export function parseIpLiteral(input: string): ParsedIpLiteral | undefined {
  const normalized = normalizeIpText(input);
  if (!normalized) return undefined;
  return normalized.includes(':') ? parseIpv6(normalized) : parseIpv4(normalized);
}

export function isIpLiteral(input: string): boolean {
  return parseIpLiteral(input) !== undefined;
}

export function ipMatchesPrefix(candidate: string, network: string, prefixLength: number): boolean {
  const candidateIp = parseIpLiteral(candidate);
  const networkIp = parseIpLiteral(network);
  if (!candidateIp || !networkIp || candidateIp.family !== networkIp.family) return false;

  const bits = candidateIp.family === 4 ? 32 : 128;
  if (!Number.isInteger(prefixLength) || prefixLength < 0 || prefixLength > bits) return false;
  if (prefixLength === 0) return true;

  const shift = BigInt(bits - prefixLength);
  return candidateIp.value >> shift === networkIp.value >> shift;
}
