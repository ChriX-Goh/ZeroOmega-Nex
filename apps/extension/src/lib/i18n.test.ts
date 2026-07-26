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

  it('uses the original Fixed Profile terminology in both Chinese locales', () => {
    expect(translate('Scheme', 'zh-CN')).toBe('网址协议');
    expect(translate('Authentication', 'zh-CN')).toBe('代理登录');
    expect(translate('Show Advanced', 'zh-CN')).toBe('显示高级设置');
    expect(translate('Bypass List', 'zh-CN')).toBe('不代理的地址列表');
    expect(translate('Scheme', 'zh-TW')).toBe('網址協定');
    expect(translate('Authentication', 'zh-TW')).toBe('代理認證');
    expect(translate('Show Advanced', 'zh-TW')).toBe('顯示進階設定');
    expect(translate('Bypass List', 'zh-TW')).toBe('不代理的位址清單');
    expect(translate('(use default)', 'zh-TW')).toBe('(同預設)');
  });

  it('translates Fixed Profile dynamic accessibility labels', () => {
    expect(translate('http:// proxy protocol', 'zh-CN')).toBe('http:// 代理协议');
    expect(translate('https:// proxy server', 'zh-TW')).toBe('https:// 代理伺服器');
    expect(translate('(default) proxy port', 'zh-TW')).toBe('(預設) 代理連接埠');
    expect(translate('Your browser does not support SOCKS5 proxy authentication.', 'zh-TW')).toBe(
      '您的瀏覽器不支持 SOCKS5 代理認證。',
    );
  });

  it('falls back to English for untranslated or unsupported content', () => {
    expect(translate('Untranslated diagnostic', 'zh-CN')).toBe('Untranslated diagnostic');
    expect(translate('Options', 'en')).toBe('Options');
  });
});
