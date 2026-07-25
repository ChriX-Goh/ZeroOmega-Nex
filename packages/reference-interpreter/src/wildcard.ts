function escapeRegexCharacter(character: string): string {
  return /[\\^$.*+?()[\]{}|]/.test(character) ? `\\${character}` : character;
}

function wildcardExpression(pattern: string): RegExp {
  let source = '^';
  for (const character of pattern) {
    if (character === '*') source += '.*';
    else if (character === '?') source += '.';
    else source += escapeRegexCharacter(character);
  }
  return new RegExp(`${source}$`, 'i');
}

export function normalizeHost(input: string): string {
  const trimmed = input.trim();
  const unbracketed =
    trimmed.startsWith('[') && trimmed.endsWith(']') ? trimmed.slice(1, -1) : trimmed;
  return unbracketed.endsWith('.')
    ? unbracketed.slice(0, -1).toLowerCase()
    : unbracketed.toLowerCase();
}

export function containsNonAscii(input: string): boolean {
  for (const character of input) {
    if (character.codePointAt(0)! > 0x7f) return true;
  }
  return false;
}

export function splitWildcardAlternatives(pattern: string): readonly string[] {
  return pattern
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function matchesHostPattern(pattern: string, host: string): boolean {
  const normalizedHost = normalizeHost(host);
  for (const alternative of splitWildcardAlternatives(pattern)) {
    const normalizedPattern = normalizeHost(alternative);
    if (normalizedPattern === '*') return true;

    const suffixPrefix = normalizedPattern.startsWith('**.')
      ? '**.'
      : normalizedPattern.startsWith('*.')
        ? '*.'
        : normalizedPattern.startsWith('.')
          ? '.'
          : undefined;

    if (suffixPrefix) {
      const suffix = normalizedPattern.slice(suffixPrefix.length);
      if (normalizedHost === suffix || normalizedHost.endsWith(`.${suffix}`)) return true;
      continue;
    }

    if (normalizedPattern.includes('*') || normalizedPattern.includes('?')) {
      if (wildcardExpression(normalizedPattern).test(normalizedHost)) return true;
      continue;
    }

    if (normalizedHost === normalizedPattern) return true;
  }
  return false;
}

export function matchesUrlWildcard(pattern: string, url: string): boolean {
  return splitWildcardAlternatives(pattern).some((alternative) =>
    wildcardExpression(alternative).test(url),
  );
}
