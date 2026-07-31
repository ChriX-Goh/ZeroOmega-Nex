import { describe, expect, it } from 'vitest';

import {
  localizeOriginalToolbarDefaultTitle,
  localizeOriginalToolbarDetail,
  localizeOriginalToolbarResultTitle,
  ORIGINAL_TOOLBAR_DEFAULT_TITLE_KEY,
  ORIGINAL_TOOLBAR_DETAIL_KEYS,
  ORIGINAL_TOOLBAR_RESULT_TITLE_KEY,
  type OriginalToolbarI18nApi,
} from './original-toolbar-i18n';

interface RecordedMessageCall {
  readonly messageName: string;
  readonly substitutions?: string | readonly string[];
}

class RecordingI18nApi implements OriginalToolbarI18nApi {
  readonly calls: RecordedMessageCall[] = [];
  readonly messages = new Map<string, string>();

  getMessage(messageName: string, substitutions?: string | readonly string[]): string {
    this.calls.push({ messageName, substitutions });
    return this.messages.get(messageName) ?? '';
  }
}

describe('original toolbar localization adapter', () => {
  it('requests the original default loading title key without substitutions', () => {
    const api = new RecordingI18nApi();
    api.messages.set(ORIGINAL_TOOLBAR_DEFAULT_TITLE_KEY, 'Loading…');

    expect(localizeOriginalToolbarDefaultTitle(api)).toBe('Loading…');
    expect(api.calls).toEqual([{ messageName: 'manifest_icon_default_title' }]);
  });

  it('preserves the original three-argument result-title placeholder order', () => {
    const api = new RecordingI18nApi();
    api.messages.set(
      ORIGINAL_TOOLBAR_RESULT_TITLE_KEY,
      'ZeroOmega:: [Auto Switch] → [Direct]\n(default)',
    );

    expect(
      localizeOriginalToolbarResultTitle(api, {
        currentProfileName: '[Auto Switch]',
        resultProfileName: '[Direct]',
        details: '(default)',
      }),
    ).toBe('ZeroOmega:: [Auto Switch] → [Direct]\n(default)');
    expect(api.calls).toEqual([
      {
        messageName: 'browserAction_titleWithResult',
        substitutions: ['[Auto Switch]', '[Direct]', '(default)'],
      },
    ]);
  });

  it('uses the source-captured original detail keys and forwards substitutions', () => {
    const api = new RecordingI18nApi();
    api.messages.set(ORIGINAL_TOOLBAR_DETAIL_KEYS.inspect, '[检查] https://example.test/');

    expect(
      localizeOriginalToolbarDetail(api, ORIGINAL_TOOLBAR_DETAIL_KEYS.inspect, [
        'https://example.test/',
      ]),
    ).toBe('[检查] https://example.test/');
    expect(api.calls).toEqual([
      {
        messageName: 'browserAction_titleInspect',
        substitutions: ['https://example.test/'],
      },
    ]);
  });

  it('fails closed when an original toolbar message is missing', () => {
    const api = new RecordingI18nApi();

    expect(() =>
      localizeOriginalToolbarDetail(api, ORIGINAL_TOOLBAR_DETAIL_KEYS.directResult),
    ).toThrowError(
      'Missing original toolbar locale message: browserAction_directResult',
    );
  });
});
