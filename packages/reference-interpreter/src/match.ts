import type { Condition, Weekday } from '@zeroomega-nex/profile-spec';

import { ipMatchesPrefix, isIpLiteral } from './ip.js';
import type { ConditionMatchResult, ReferenceRequest, ReferenceSupport } from './types.js';
import {
  containsNonAscii,
  matchesHostPattern,
  matchesUrlWildcard,
  normalizeHost,
  splitWildcardAlternatives,
} from './wildcard.js';

const WEEKDAYS: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DEFAULT_PORTS: Readonly<Record<string, number>> = {
  http: 80,
  https: 443,
  ftp: 21,
  ws: 80,
  wss: 443,
};

function result(
  matched: boolean,
  support: ReferenceSupport,
  reason?: string,
  determinate = true,
): ConditionMatchResult {
  return {
    matched,
    determinate,
    support,
    ...(reason === undefined ? {} : { reason }),
  };
}

function targetSupport(condition: Condition, request: ReferenceRequest): ReferenceSupport {
  if (
    (condition.kind === 'url-regex' || condition.kind === 'url-wildcard') &&
    ['https', 'wss'].includes(request.scheme.toLowerCase())
  ) {
    return 'target-dependent';
  }

  const pattern =
    condition.kind === 'host-regex' ||
    condition.kind === 'host-wildcard' ||
    condition.kind === 'bypass'
      ? condition.pattern
      : undefined;
  if (pattern && (containsNonAscii(pattern) || containsNonAscii(request.host))) {
    return 'target-dependent';
  }
  return 'exact';
}

function requestPort(request: ReferenceRequest): number | undefined {
  if (request.port !== undefined) return request.port;
  try {
    const parsed = new URL(request.url);
    if (parsed.port) return Number(parsed.port);
  } catch {
    return DEFAULT_PORTS[request.scheme.toLowerCase()];
  }
  return DEFAULT_PORTS[request.scheme.toLowerCase()];
}

interface BypassTarget {
  readonly scheme?: string;
  readonly hostPattern: string;
  readonly port?: number;
}

function parseHostPort(input: string): Pick<BypassTarget, 'hostPattern' | 'port'> {
  if (input.startsWith('[')) {
    const close = input.indexOf(']');
    if (close !== -1) {
      const remainder = input.slice(close + 1);
      const port = /^:\d+$/.test(remainder) ? Number(remainder.slice(1)) : undefined;
      return {
        hostPattern: input.slice(0, close + 1),
        ...(port === undefined ? {} : { port }),
      };
    }
  }

  if (isIpLiteral(input)) return { hostPattern: input };

  const colon = input.lastIndexOf(':');
  if (colon > -1) {
    const portText = input.slice(colon + 1);
    if (/^\d+$/.test(portText)) {
      return { hostPattern: input.slice(0, colon), port: Number(portText) };
    }
  }
  return { hostPattern: input };
}

function parseBypassTarget(pattern: string): BypassTarget {
  const schemeMatch = /^([a-z][a-z0-9+.-]*):\/\/(.*)$/i.exec(pattern);
  if (!schemeMatch) return parseHostPort(pattern);
  const parsed = parseHostPort(schemeMatch[2]!);
  return { scheme: schemeMatch[1]!.toLowerCase(), ...parsed };
}

function matchesCidr(pattern: string, host: string): boolean | undefined {
  const slash = pattern.lastIndexOf('/');
  if (slash <= 0) return undefined;
  const prefixText = pattern.slice(slash + 1);
  if (!/^\d{1,3}$/.test(prefixText)) return false;
  const network = pattern.slice(0, slash);
  if (!isIpLiteral(network)) return undefined;
  return ipMatchesPrefix(host, network, Number(prefixText));
}

function matchesBypassPattern(pattern: string, request: ReferenceRequest): boolean {
  const normalizedHost = normalizeHost(request.host);
  if (pattern.trim().toLowerCase() === '<local>') {
    return (
      !normalizedHost.includes('.') && !normalizedHost.includes(':') && !isIpLiteral(normalizedHost)
    );
  }

  const target = parseBypassTarget(pattern.trim());
  if (target.scheme && target.scheme !== request.scheme.toLowerCase()) return false;
  if (target.port !== undefined && target.port !== requestPort(request)) return false;

  const hostPattern = normalizeHost(target.hostPattern);
  const cidr = matchesCidr(hostPattern, normalizedHost);
  if (cidr !== undefined) return cidr;
  if (isIpLiteral(hostPattern)) return normalizeHost(hostPattern) === normalizedHost;
  return matchesHostPattern(hostPattern, normalizedHost);
}

function matchRegularExpression(
  pattern: string,
  flags: string | undefined,
  input: string,
  support: ReferenceSupport,
): ConditionMatchResult {
  try {
    return result(new RegExp(pattern, flags).test(input), support);
  } catch {
    return result(false, support, 'condition contains an invalid regular expression', false);
  }
}

export function matchCondition(
  condition: Condition,
  request: ReferenceRequest,
): ConditionMatchResult {
  const support = targetSupport(condition, request);

  switch (condition.kind) {
    case 'true':
      return result(true, support);
    case 'false':
      return result(false, support);
    case 'url-regex':
      return matchRegularExpression(condition.pattern, condition.flags, request.url, support);
    case 'url-wildcard':
      return result(matchesUrlWildcard(condition.pattern, request.url), support);
    case 'host-regex':
      return matchRegularExpression(condition.pattern, condition.flags, request.host, support);
    case 'host-wildcard':
      return result(matchesHostPattern(condition.pattern, request.host), support);
    case 'bypass':
      return result(
        splitWildcardAlternatives(condition.pattern).some((entry) =>
          matchesBypassPattern(entry, request),
        ),
        support,
      );
    case 'keyword':
      return result(
        (!condition.httpOnly || request.scheme.toLowerCase() === 'http') &&
          request.url.includes(condition.pattern),
        support,
      );
    case 'ip':
      return result(
        ipMatchesPrefix(request.host, condition.address, condition.prefixLength),
        support,
      );
    case 'host-levels': {
      const levels = normalizeHost(request.host).split('.').length - 1;
      return result(levels >= condition.min && levels <= condition.max, support);
    }
    case 'weekday': {
      if (
        request.localWeekday === undefined ||
        !Number.isInteger(request.localWeekday) ||
        request.localWeekday < 0 ||
        request.localWeekday > 6
      ) {
        return result(false, support, 'request.localWeekday is required for weekday rules', false);
      }
      return result(condition.days.includes(WEEKDAYS[request.localWeekday]!), support);
    }
    case 'time': {
      if (
        request.localHour === undefined ||
        !Number.isInteger(request.localHour) ||
        request.localHour < 0 ||
        request.localHour > 23
      ) {
        return result(false, support, 'request.localHour is required for time rules', false);
      }
      const matched =
        condition.startHour <= condition.endHour
          ? request.localHour >= condition.startHour && request.localHour <= condition.endHour
          : request.localHour >= condition.startHour || request.localHour <= condition.endHour;
      return result(matched, support);
    }
  }
}
