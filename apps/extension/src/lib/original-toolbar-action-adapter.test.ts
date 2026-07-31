import { describe, expect, it } from 'vitest';

import {
  OriginalToolbarActionAdapter,
  type OriginalToolbarActionApi,
  type OriginalToolbarActionIconPaths,
  type OriginalToolbarActionImageDataSet,
} from './original-toolbar-action-adapter';

interface RecordedCall {
  readonly method: 'setIcon' | 'setTitle' | 'setBadgeText' | 'setBadgeBackgroundColor' | 'setPopup';
  readonly details: unknown;
}

class RecordingActionApi implements OriginalToolbarActionApi {
  readonly calls: RecordedCall[] = [];
  failDynamicIcon = false;

  setIcon(details: Parameters<OriginalToolbarActionApi['setIcon']>[0]): Promise<void> | void {
    this.calls.push({ method: 'setIcon', details });
    if (this.failDynamicIcon && details.imageData !== undefined) {
      return Promise.reject(new Error('dynamic icon blocked'));
    }
  }

  setTitle(details: Parameters<OriginalToolbarActionApi['setTitle']>[0]): void {
    this.calls.push({ method: 'setTitle', details });
  }

  setBadgeText(details: Parameters<OriginalToolbarActionApi['setBadgeText']>[0]): void {
    this.calls.push({ method: 'setBadgeText', details });
  }

  setBadgeBackgroundColor(
    details: Parameters<OriginalToolbarActionApi['setBadgeBackgroundColor']>[0],
  ): void {
    this.calls.push({ method: 'setBadgeBackgroundColor', details });
  }

  setPopup(details: Parameters<OriginalToolbarActionApi['setPopup']>[0]): void {
    this.calls.push({ method: 'setPopup', details });
  }
}

const fallbackIconPaths: OriginalToolbarActionIconPaths = {
  16: 'icon/original-action-16.png',
  19: 'icon/original-action-19.png',
  24: 'icon/original-action-24.png',
  32: 'icon/original-action-32.png',
};

const dynamicImageData: OriginalToolbarActionImageDataSet = {
  16: { width: 16, height: 16, data: new Uint8ClampedArray(16 * 16 * 4) },
  19: { width: 19, height: 19, data: new Uint8ClampedArray(19 * 19 * 4) },
};

describe('original toolbar Action adapter', () => {
  it('writes every tab-visible Action field through one boundary', async () => {
    const action = new RecordingActionApi();
    const adapter = new OriginalToolbarActionAdapter(action);

    await adapter.apply({
      tabId: 7,
      title: 'ZeroOmega:: [Direct]\n(not using any proxy)',
      badgeText: 'DIR',
      badgeBackgroundColor: '#d90000',
      popup: 'popup-iframe.html',
      imageData: dynamicImageData,
      fallbackIconPaths,
    });

    expect(action.calls).toEqual([
      {
        method: 'setIcon',
        details: { tabId: 7, imageData: dynamicImageData },
      },
      {
        method: 'setTitle',
        details: { tabId: 7, title: 'ZeroOmega:: [Direct]\n(not using any proxy)' },
      },
      {
        method: 'setBadgeBackgroundColor',
        details: { tabId: 7, color: '#d90000' },
      },
      {
        method: 'setBadgeText',
        details: { tabId: 7, text: 'DIR' },
      },
      {
        method: 'setPopup',
        details: { tabId: 7, popup: 'popup-iframe.html' },
      },
    ]);
  });

  it('omits tabId when writing the global Action baseline', async () => {
    const action = new RecordingActionApi();
    const adapter = new OriginalToolbarActionAdapter(action);

    await adapter.apply({
      title: 'ZeroOmega:: [System Proxy]',
      badgeBackgroundColor: '#d90000',
      popup: 'popup-iframe.html',
      fallbackIconPaths,
    });

    expect(action.calls).toEqual([
      { method: 'setIcon', details: { path: fallbackIconPaths } },
      { method: 'setTitle', details: { title: 'ZeroOmega:: [System Proxy]' } },
      { method: 'setBadgeBackgroundColor', details: { color: '#d90000' } },
      { method: 'setBadgeText', details: { text: '' } },
      { method: 'setPopup', details: { popup: 'popup-iframe.html' } },
    ]);
  });

  it('clears stale Badge text when the derived state has no Badge', async () => {
    const action = new RecordingActionApi();
    const adapter = new OriginalToolbarActionAdapter(action);

    await adapter.apply({
      tabId: 11,
      title: 'ZeroOmega:: [System Proxy]',
      badgeBackgroundColor: '#d90000',
      popup: 'popup-iframe.html',
      fallbackIconPaths,
    });

    expect(action.calls).toContainEqual({
      method: 'setBadgeText',
      details: { tabId: 11, text: '' },
    });
    expect(action.calls[0]).toEqual({
      method: 'setIcon',
      details: { tabId: 11, path: fallbackIconPaths },
    });
  });

  it('falls back to the original static icon paths when dynamic drawing is rejected', async () => {
    const action = new RecordingActionApi();
    action.failDynamicIcon = true;
    const adapter = new OriginalToolbarActionAdapter(action);

    await adapter.apply({
      tabId: 19,
      title: 'ZeroOmega:: [Auto Switch]',
      badgeBackgroundColor: '#d90000',
      popup: 'popup-iframe.html',
      imageData: dynamicImageData,
      fallbackIconPaths,
    });

    expect(action.calls.slice(0, 2)).toEqual([
      {
        method: 'setIcon',
        details: { tabId: 19, imageData: dynamicImageData },
      },
      {
        method: 'setIcon',
        details: { tabId: 19, path: fallbackIconPaths },
      },
    ]);
    expect(action.calls).toContainEqual({
      method: 'setTitle',
      details: { tabId: 19, title: 'ZeroOmega:: [Auto Switch]' },
    });
  });
});
