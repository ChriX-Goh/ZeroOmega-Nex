import { describe, expect, it } from 'vitest';

import { loadToolchainManifest } from './firefox-toolchain.mjs';

describe('Firefox M1 toolchain manifest', () => {
  it('pins official win64 assets and non-floating hashes', async () => {
    const manifest = await loadToolchainManifest();

    expect(manifest.platform).toBe('win64');
    expect(manifest.firefox.version).toBe('152.0.6');
    expect(manifest.geckodriver.version).toBe('0.37.1');
    expect(manifest.firefox.url).toContain('/releases/152.0.6/win64/en-US/');
    expect(manifest.geckodriver.url).toContain('/download/v0.37.1/');
    expect(manifest.firefox.url).not.toMatch(/latest/u);
    expect(manifest.geckodriver.url).not.toMatch(/latest/u);
    expect(manifest.firefox.sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(manifest.geckodriver.sha256).toMatch(/^[0-9a-f]{64}$/u);
  });
});
