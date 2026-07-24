import type {
  LegacyDecodedBackup,
  LegacyDecodeIssue,
  LegacyDecodeResult,
  LegacyInputEncoding,
} from './contracts.js';

export interface LegacyDecodeLimits {
  readonly maxInputBytes: number;
  readonly maxNodes: number;
  readonly maxDepth: number;
  readonly maxProfiles: number;
  readonly maxRules: number;
}

export const DEFAULT_LEGACY_DECODE_LIMITS: LegacyDecodeLimits = Object.freeze({
  maxInputBytes: 16 * 1024 * 1024,
  maxNodes: 500_000,
  maxDepth: 64,
  maxProfiles: 10_000,
  maxRules: 200_000,
});

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function failure(code: string, message: string, path = '/'): LegacyDecodeResult {
  const issue: LegacyDecodeIssue = { code, path, message };
  return { ok: false, issues: [issue] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function decodeBase64(value: string, limits: LegacyDecodeLimits): string | undefined {
  const normalized = value.replace(/\s+/g, '');
  if (
    normalized.length === 0 ||
    normalized.length > Math.ceil((limits.maxInputBytes * 4) / 3) + 4 ||
    normalized.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)
  ) {
    return undefined;
  }

  try {
    const binary = atob(normalized);
    if (binary.length > limits.maxInputBytes) {
      return undefined;
    }
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return utf8Decoder.decode(bytes);
  } catch {
    return undefined;
  }
}

function parseText(
  input: string,
  limits: LegacyDecodeLimits,
): { encoding: LegacyInputEncoding; parsed: unknown; byteLength: number } | LegacyDecodeResult {
  const byteLength = utf8Encoder.encode(input).byteLength;
  if (byteLength > limits.maxInputBytes) {
    return failure(
      'decode.input-too-large',
      `input exceeds the ${limits.maxInputBytes}-byte import limit`,
    );
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return failure('decode.empty-input', 'backup input is empty');
  }

  if (trimmed.startsWith('{')) {
    try {
      return { encoding: 'json', parsed: JSON.parse(trimmed), byteLength };
    } catch {
      return failure('decode.invalid-json', 'backup is not valid JSON');
    }
  }

  const decoded = decodeBase64(trimmed, limits);
  if (decoded === undefined) {
    return failure('decode.invalid-base64', 'backup is neither a JSON object nor valid base64 JSON');
  }

  try {
    return {
      encoding: 'base64-json',
      parsed: JSON.parse(decoded),
      byteLength: utf8Encoder.encode(decoded).byteLength,
    };
  } catch {
    return failure('decode.invalid-base64-json', 'base64 payload does not decode to valid JSON');
  }
}

interface ResourceStats {
  nodeCount: number;
  maxDepth: number;
  stringBytes: number;
}

function inspectResources(
  root: Record<string, unknown>,
  limits: LegacyDecodeLimits,
): ResourceStats | LegacyDecodeResult {
  const stack: Array<{ value: unknown; depth: number; path: string }> = [
    { value: root, depth: 1, path: '/' },
  ];
  const visited = new WeakSet<object>();
  const stats: ResourceStats = { nodeCount: 0, maxDepth: 0, stringBytes: 0 };

  while (stack.length > 0) {
    const current = stack.pop()!;
    stats.nodeCount += 1;
    stats.maxDepth = Math.max(stats.maxDepth, current.depth);

    if (stats.nodeCount > limits.maxNodes) {
      return failure('decode.too-many-nodes', `backup exceeds ${limits.maxNodes} JSON nodes`);
    }
    if (current.depth > limits.maxDepth) {
      return failure(
        'decode.too-deep',
        `backup exceeds maximum nesting depth ${limits.maxDepth}`,
        current.path,
      );
    }

    if (typeof current.value === 'string') {
      stats.stringBytes += utf8Encoder.encode(current.value).byteLength;
      if (stats.stringBytes > limits.maxInputBytes) {
        return failure(
          'decode.string-data-too-large',
          `backup string data exceeds ${limits.maxInputBytes} bytes`,
          current.path,
        );
      }
      continue;
    }

    if (current.value === null || typeof current.value !== 'object') {
      continue;
    }

    if (visited.has(current.value)) {
      return failure('decode.cyclic-object', 'object input contains a cycle', current.path);
    }
    visited.add(current.value);

    if (Array.isArray(current.value)) {
      current.value.forEach((value, index) => {
        stack.push({ value, depth: current.depth + 1, path: `${current.path}/${index}` });
      });
      continue;
    }

    for (const [key, value] of Object.entries(current.value)) {
      stats.stringBytes += utf8Encoder.encode(key).byteLength;
      stack.push({ value, depth: current.depth + 1, path: `${current.path}/${key}` });
    }
  }

  return stats;
}

function countProfilesAndRules(
  root: Record<string, unknown>,
  limits: LegacyDecodeLimits,
): { profileCount: number; ruleCount: number } | LegacyDecodeResult {
  let profileCount = 0;
  let ruleCount = 0;

  for (const [key, value] of Object.entries(root)) {
    if (!key.startsWith('+')) {
      continue;
    }
    profileCount += 1;
    if (profileCount > limits.maxProfiles) {
      return failure('decode.too-many-profiles', `backup exceeds ${limits.maxProfiles} profiles`);
    }
    if (isRecord(value) && Array.isArray(value.rules)) {
      ruleCount += value.rules.length;
      if (ruleCount > limits.maxRules) {
        return failure('decode.too-many-rules', `backup exceeds ${limits.maxRules} switch rules`);
      }
    }
  }

  return { profileCount, ruleCount };
}

export function decodeZeroOmegaBackup(
  input: string | unknown,
  limits: LegacyDecodeLimits = DEFAULT_LEGACY_DECODE_LIMITS,
): LegacyDecodeResult {
  let encoding: LegacyInputEncoding;
  let parsed: unknown;
  let byteLength: number;

  if (typeof input === 'string') {
    const textResult = parseText(input, limits);
    if ('ok' in textResult) {
      return textResult;
    }
    ({ encoding, parsed, byteLength } = textResult);
  } else {
    encoding = 'object';
    parsed = input;
    byteLength = 0;
  }

  if (!isRecord(parsed)) {
    return failure('decode.root-not-object', 'ZeroOmega backup root must be a JSON object');
  }
  if (parsed.schemaVersion !== 2) {
    return failure('decode.unsupported-schema', 'expected ZeroOmega schemaVersion 2', '/schemaVersion');
  }

  const resources = inspectResources(parsed, limits);
  if ('ok' in resources) {
    return resources;
  }
  const counts = countProfilesAndRules(parsed, limits);
  if ('ok' in counts) {
    return counts;
  }

  const value: LegacyDecodedBackup = {
    encoding,
    options: parsed,
    stats: {
      byteLength: byteLength || resources.stringBytes,
      nodeCount: resources.nodeCount,
      maxDepth: resources.maxDepth,
      profileCount: counts.profileCount,
      ruleCount: counts.ruleCount,
    },
  };

  return { ok: true, value };
}
