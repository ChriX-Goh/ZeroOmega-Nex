import { describe, expect, it } from 'vitest';

import { profileKindText, typedUiTextCatalog, uiMessage, uiText } from './ui-messages';

describe('typed UI messages', () => {
  it('contains complete English, Simplified Chinese, and Traditional Chinese values', () => {
    for (const localized of Object.values(typedUiTextCatalog)) {
      expect(localized.en.length).toBeGreaterThan(0);
      expect(localized['zh-CN'].length).toBeGreaterThan(0);
      expect(localized['zh-TW'].length).toBeGreaterThan(0);
    }
  });

  it('uses source-backed New Profile and Fixed terminology', () => {
    expect(uiText('newProfile.title', 'zh-CN')).toBe('新建情景模式');
    expect(uiText('newProfile.title', 'zh-TW')).toBe('建立情境模式');
    expect(uiText('newProfile.fixed.title', 'zh-CN')).toBe('代理服务器');
    expect(uiText('fixed.authTitle', 'zh-TW')).toBe('代理認證');
    expect(profileKindText('virtual', 'zh-TW')).toBe('虛擬情境模式');
  });

  it('formats Switch and Rule List dynamic messages in all three locales', () => {
    expect(uiMessage('switch.ruleFieldAria', { index: 2, field: 'resultProfile' }, 'zh-CN')).toBe(
      '规则 2 的结果情景模式',
    );
    expect(
      uiMessage('switch.sourceError', { code: 'switch-source.no-default-rule', line: 4 }, 'zh-TW'),
    ).toBe('第 4 行：必須以「* +profile」預設規則結尾。');
    expect(
      uiMessage('ruleList.headerAria', { scope: 'attached', index: 1, field: 'name' }, 'en'),
    ).toBe('Attached header 1 name');
    expect(
      uiMessage(
        'ruleList.lastUpdated',
        { timestamp: '2026/7/28 14:00', bytes: 128, stale: true },
        'zh-CN',
      ),
    ).toContain('规则列表最后更新于 2026/7/28 14:00');
  });

  it('localizes stable source-update failure codes without backend prose', () => {
    expect(
      uiMessage(
        'ruleList.updateFailed',
        {
          timestamp: '2026/7/29 12:00',
          code: 'response-http-error',
          httpStatus: 503,
        },
        'zh-CN',
      ),
    ).toContain('服务器返回 HTTP 错误（503）');
    expect(
      uiMessage(
        'pac.updateFailed',
        {
          timestamp: '2026/7/29 12:00',
          code: 'response-too-large',
          limitBytes: 4096,
        },
        'zh-TW',
      ),
    ).toContain('下載內容超過大小上限（4096 位元組）');
  });

  it('formats source-backed PAC text and dynamic status in all three locales', () => {
    expect(uiText('pac.url', 'zh-CN')).toBe('PAC 网址');
    expect(uiText('pac.script', 'zh-TW')).toBe('PAC 指令碼');
    expect(
      uiMessage(
        'pac.lastUpdated',
        { timestamp: '2026/7/28 14:00', bytes: 256, stale: true },
        'zh-CN',
      ),
    ).toContain('PAC 脚本下载时间 2026/7/28 14:00');
    expect(uiMessage('pac.authConfiguredFor', { username: '使用者' }, 'zh-TW')).toBe(
      '已為 使用者 設定。',
    );
  });

  it('formats dynamic deletion and accessibility messages without English fallback', () => {
    expect(uiMessage('profile.delete.confirmDescription', { profileName: '工作' }, 'zh-CN')).toBe(
      '删除情景模式“工作”？此操作只会修改尚未应用的设置。',
    );
    expect(uiMessage('fixed.fieldAria', { scheme: '(預設)', field: 'port' }, 'zh-TW')).toBe(
      '(預設) 連接埠',
    );
    expect(uiMessage('fixed.authUnsupported', { protocol: 'SOCKS5' }, 'zh-TW')).toBe(
      '您的瀏覽器不支援 SOCKS5 代理認證。',
    );
  });
});
