import { describe, expect, it } from 'vitest';

import { deriveOriginalToolbarBadgeText } from './original-toolbar-badge';

describe('original toolbar result badge', () => {
  it('does not expose Badge text when the original preference is disabled', () => {
    expect(
      deriveOriginalToolbarBadgeText({
        enabled: false,
        resultProfileName: 'Proxy',
        resultProfileBuiltin: false,
      }),
    ).toBeUndefined();
  });

  it('uses the result profile name and truncates it to four code units', () => {
    expect(
      deriveOriginalToolbarBadgeText({
        enabled: true,
        resultProfileName: 'Proxy-US',
        resultProfileBuiltin: false,
      }),
    ).toBe('Prox');
  });

  it('uses the localized built-in Badge label before truncation', () => {
    expect(
      deriveOriginalToolbarBadgeText({
        enabled: true,
        resultProfileName: 'direct',
        resultProfileBuiltin: true,
        builtinBadgeText: '直接连接',
      }),
    ).toBe('直接连接');
  });

  it('preserves the original empty Badge result when no name exists', () => {
    expect(
      deriveOriginalToolbarBadgeText({
        enabled: true,
        resultProfileBuiltin: false,
      }),
    ).toBe('');
  });
});
