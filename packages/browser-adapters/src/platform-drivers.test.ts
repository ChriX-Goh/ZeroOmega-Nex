import type { PacRuntimeSnapshot } from '@zeroomega-nex/pac-compiler';
import { describe, expect, it } from 'vitest';

import {
  createChromiumProxyDriver,
  type ChromiumProxySettingsApi,
} from './chromium.js';
import {
  createFirefoxProxyDriver,
  firefoxPacDataUrl,
  type FirefoxExtensionApi,
  type FirefoxProxyErrorEvent,
  type FirefoxProxySettingsApi,
} from './firefox.js';

const snapshot: PacRuntimeSnapshot = {
  snapshotSchemaVersion: 1,
  snapshotId: 'pac-test-snapshot',
  createdAt: '2026-07-25T06:00:00.000Z',
  sourceDocumentId: 'document-test',
  sourceRevisionId: 'revision-test',
  sourceProfileSpecSha256: '1'.repeat(64),
  startRoute: { kind: 'direct' },
  target: 'cross-browser',
  compilerVersion: '0.1.0',
  scriptSha256: '2'.repeat(64),
  capability: 'exact',
  script: 'function FindProxyForURL(){return "DIRECT";}',
  stats: {
    scriptBytes: 48,
    profileCount: 0,
    endpointCount: 0,
    conditionCount: 0,
    ruleListRuleCount: 0,
  },
  warnings: [],
  verification: { passed: true, vectorCount: 1, matchedCount: 1 },
};

class FakeChromiumSettings implements ChromiumProxySettingsApi {
  value: unknown = { mode: 'system' };
  levelOfControl = 'controllable_by_this_extension';
  clearCount = 0;

  async get(): Promise<{ value: unknown; levelOfControl: string }> {
    return { value: this.value, levelOfControl: this.levelOfControl };
  }

  async set(details: { readonly value: unknown }): Promise<void> {
    this.value = details.value;
    this.levelOfControl = 'controlled_by_this_extension';
  }

  async clear(): Promise<void> {
    this.clearCount += 1;
    this.value = { mode: 'system' };
    this.levelOfControl = 'controllable_by_this_extension';
  }
}

class FakeFirefoxSettings implements FirefoxProxySettingsApi {
  value: unknown = { proxyType: 'system' };
  levelOfControl = 'controllable_by_this_extension';
  clearCount = 0;

  async get(): Promise<{ value: unknown; levelOfControl: string }> {
    return { value: this.value, levelOfControl: this.levelOfControl };
  }

  async set(details: { readonly value: unknown }): Promise<void> {
    this.value = details.value;
    this.levelOfControl = 'controlled_by_this_extension';
  }

  async clear(): Promise<void> {
    this.clearCount += 1;
    this.value = { proxyType: 'system' };
    this.levelOfControl = 'controllable_by_this_extension';
  }
}

class FakeFirefoxExtension implements FirefoxExtensionApi {
  constructor(public allowed: boolean) {}

  async isAllowedIncognitoAccess(): Promise<boolean> {
    return this.allowed;
  }
}

class FakeFirefoxErrorEvent implements FirefoxProxyErrorEvent {
  listeners = new Set<(error: unknown) => void>();

  addListener(listener: (error: unknown) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (error: unknown) => void): void {
    this.listeners.delete(listener);
  }

  emit(error: unknown): void {
    for (const listener of this.listeners) listener(error);
  }
}

describe('Chromium proxy settings driver', () => {
  it('maps levelOfControl and refuses a conflicting controller', async () => {
    const settings = new FakeChromiumSettings();
    settings.levelOfControl = 'controlled_by_other_extensions';
    const driver = createChromiumProxyDriver(settings);
    await expect(driver.getCapabilities()).resolves.toMatchObject({
      canSetProxy: false,
      controlLevel: 'controlled-by-other-extension',
    });
  });

  it('installs mandatory inline PAC and confirms the exact script', async () => {
    const settings = new FakeChromiumSettings();
    const driver = createChromiumProxyDriver(settings);
    await driver.installPac(snapshot);
    expect(settings.value).toEqual({
      mode: 'pac_script',
      pacScript: { data: snapshot.script, mandatory: true },
    });
    await expect(driver.confirmPac(snapshot)).resolves.toEqual({
      confirmed: true,
      controlLevel: 'controlled-by-this-extension',
      installedScriptSha256: snapshot.scriptSha256,
    });
  });

  it('clears extension control when restoring a baseline it did not own', async () => {
    const settings = new FakeChromiumSettings();
    const driver = createChromiumProxyDriver(settings);
    await driver.restoreState({
      family: 'chromium',
      controlLevel: 'controllable-by-this-extension',
      value: { mode: 'system' },
    });
    expect(settings.clearCount).toBe(1);
  });

  it('rejects a Firefox-only snapshot', async () => {
    const settings = new FakeChromiumSettings();
    const driver = createChromiumProxyDriver(settings);
    await expect(driver.installPac({ ...snapshot, target: 'firefox' })).rejects.toThrow(
      'cannot be installed on Chromium',
    );
  });
});

describe('Firefox proxy settings driver', () => {
  it('exposes private browsing access as a hard preflight requirement', async () => {
    const settings = new FakeFirefoxSettings();
    const extension = new FakeFirefoxExtension(false);
    const driver = createFirefoxProxyDriver(settings, extension);
    await expect(driver.getCapabilities()).resolves.toMatchObject({
      canSetProxy: false,
      requiresPrivateBrowsingAccess: true,
      privateBrowsingAllowed: false,
    });
    await expect(driver.installPac(snapshot)).rejects.toThrow('private browsing access is required');
  });

  it('installs an autoConfig data URL and confirms it without PAC errors', async () => {
    const settings = new FakeFirefoxSettings();
    const extension = new FakeFirefoxExtension(true);
    const errors = new FakeFirefoxErrorEvent();
    const driver = createFirefoxProxyDriver(settings, extension, errors);
    await driver.installPac(snapshot);
    expect(settings.value).toEqual({
      proxyType: 'autoConfig',
      autoConfigUrl: firefoxPacDataUrl(snapshot.script),
    });
    await expect(driver.confirmPac(snapshot)).resolves.toEqual({
      confirmed: true,
      controlLevel: 'controlled-by-this-extension',
      installedScriptSha256: snapshot.scriptSha256,
    });
    driver.dispose();
    expect(errors.listeners.size).toBe(0);
  });

  it('fails confirmation after Firefox reports a PAC runtime error', async () => {
    const settings = new FakeFirefoxSettings();
    const extension = new FakeFirefoxExtension(true);
    const errors = new FakeFirefoxErrorEvent();
    const driver = createFirefoxProxyDriver(settings, extension, errors);
    await driver.installPac(snapshot);
    errors.emit({ message: 'FindProxyForURL failed' });
    await expect(driver.confirmPac(snapshot)).resolves.toMatchObject({
      confirmed: false,
      reason: 'Firefox PAC runtime error: FindProxyForURL failed',
    });
  });

  it('clears extension control when restoring a baseline it did not own', async () => {
    const settings = new FakeFirefoxSettings();
    const driver = createFirefoxProxyDriver(settings, new FakeFirefoxExtension(true));
    await driver.restoreState({
      family: 'firefox',
      controlLevel: 'controllable-by-this-extension',
      value: { proxyType: 'system' },
    });
    expect(settings.clearCount).toBe(1);
  });
});
