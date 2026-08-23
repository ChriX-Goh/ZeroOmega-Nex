import { describe, expect, it } from 'vitest';

import { normalizeExtensionDeviceId } from './extension-device-id';

describe('extension device ID normalization', () => {
  it('preserves Chromium extension IDs', () => {
    expect(normalizeExtensionDeviceId('onighefgikcfdgbbbgoaofeembplipbe')).toBe(
      'onighefgikcfdgbbbgoaofeembplipbe',
    );
  });

  it('normalizes Firefox add-on IDs into ProfileSpec identifiers', () => {
    expect(normalizeExtensionDeviceId('zeroomega-nex@chrix-goh.github')).toBe(
      'zeroomega-nex-chrix-goh.github',
    );
  });

  it('uses a stable fallback when no valid identifier characters remain', () => {
    expect(normalizeExtensionDeviceId('@@@')).toBe('zeroomega-nex-extension');
  });

  it('truncates device metadata to the ProfileSpec identifier limit', () => {
    expect(normalizeExtensionDeviceId(`device-${'a'.repeat(200)}`)).toHaveLength(128);
  });
});
