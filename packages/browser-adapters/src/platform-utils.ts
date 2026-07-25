import type { JsonValue } from '@zeroomega-nex/profile-spec';

import type { ProxyControlLevel } from './contracts.js';

export function mapProxyControlLevel(level: string): ProxyControlLevel {
  switch (level) {
    case 'not_controllable':
      return 'not-controllable';
    case 'controlled_by_other_extensions':
      return 'controlled-by-other-extension';
    case 'controllable_by_this_extension':
      return 'controllable-by-this-extension';
    case 'controlled_by_this_extension':
      return 'controlled-by-this-extension';
    default:
      return 'not-controllable';
  }
}

export function jsonValue(value: unknown, path = 'value'): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError(`${path} contains a non-finite number`);
    return value;
  }
  if (Array.isArray(value)) return value.map((entry, index) => jsonValue(entry, `${path}/${index}`));
  if (typeof value !== 'object') throw new TypeError(`${path} is not JSON-compatible`);

  const result: Record<string, JsonValue> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) result[key] = jsonValue(entry, `${path}/${key}`);
  }
  return result;
}

export function recordValue(value: JsonValue): Record<string, JsonValue> | undefined {
  return value !== null && !Array.isArray(value) && typeof value === 'object' ? value : undefined;
}

export function stringProperty(
  value: Record<string, JsonValue> | undefined,
  key: string,
): string | undefined {
  const candidate = value?.[key];
  return typeof candidate === 'string' ? candidate : undefined;
}
