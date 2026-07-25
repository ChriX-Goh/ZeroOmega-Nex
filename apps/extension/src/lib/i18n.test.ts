import { describe, expect, it } from 'vitest';

import { resolveAppLocale, translate } from './i18n';

describe('extension localization', () => {
  it.each([
    [['zh-CN'], 'zh-CN'],
    [['zh-Hans-CN'], 'zh-CN'],
    [['zh-SG'], 'zh-CN'],
    [['zh-TW'], 'zh-TW'],
    [['zh-Hant'], 'zh-TW'],
    [['zh-HK'], 'zh-TW'],
    [['en-US'], 'en'],
    [['ja-JP'], 'en'],
    [['fr-FR'], 'en'],
  ] as const)('maps %j to %s', (languages, expected) => {
    expect(resolveAppLocale(languages)).toBe(expected);
  });

  it('prefers the first supported language in browser order', () => {
    expect(resolveAppLocale(['ja-JP', 'zh-TW', 'zh-CN'])).toBe('zh-TW');
  });

  it('uses original-compatible Chinese terminology', () => {
    expect(translate('Direct', 'zh-CN')).toBe('直接连接');
    expect(translate('System Proxy', 'zh-TW')).toBe('系統代理');
    expect(translate('Switch Profile', 'zh-CN')).toBe('自动切换情景模式');
    expect(translate('Options', 'zh-TW')).toBe('選項');
  });

  it('falls back to English for untranslated or unsupported content', () => {
    expect(translate('Untranslated diagnostic', 'zh-CN')).toBe('Untranslated diagnostic');
    expect(translate('Options', 'en')).toBe('Options');
  });
});
